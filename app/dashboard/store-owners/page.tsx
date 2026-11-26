"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Copy, History, Landmark, Loader2, X } from "lucide-react";
import { useUser } from "@/app/context/UserContext";
import {
  GetStoreOwnerLedgerAdmin,
  GetStoreOwnersDebts,
  RecordStoreOwnerDebtOperation,
  SaveStoreOwnerRates,
  type LedgerResponse,
  type LedgerType,
  type StoreOwnerDebtRow,
  type StoreOwnerRates,
} from "../store-owner/service/storeOwner";

/*
 * super_admin: dette des points de recharge envers Bulek.
 *  - taux : commission % sur chaque recharge livreur (les retraits espèces sont sans commission)
 *  - liste des points + dette ; enregistrer un paiement (partiel ou total) → code de preuve
 *  - ajustement manuel (ex. dette d'avant ce système), historique par point
 */

const newKey = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;

const dzd = (v: number | undefined | null) => `${Number(v ?? 0).toLocaleString("fr-FR")} DZD`;
const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(
    new Date(iso),
  );

const LEDGER_LABEL: Record<LedgerType, string> = {
  TOPUP: "Recharge par Bulek",
  RECHARGE_COMMISSION: "Commission recharge livreur",
  PAYMENT: "Paiement reçu",
  ADJUSTMENT: "Ajustement",
};

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm outline-none focus:border-[#e91818] focus:ring-2 focus:ring-[#e91818]/10";

type Op = { owner: StoreOwnerDebtRow; kind: "PAYMENT" | "ADJUSTMENT" };

export default function StoreOwnersDebtsPage() {
  const { user } = useUser();
  const router = useRouter();
  const [owners, setOwners] = useState<StoreOwnerDebtRow[]>([]);
  const [totalDebt, setTotalDebt] = useState(0);
  const [rates, setRates] = useState<StoreOwnerRates>({ rechargeCommissionPercent: 1 });
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [savingRates, setSavingRates] = useState(false);
  const [op, setOp] = useState<Op | null>(null);
  const [ledgerOf, setLedgerOf] = useState<StoreOwnerDebtRow | null>(null);

  useEffect(() => {
    if (user && user.role !== "super_admin") router.replace("/dashboard");
  }, [user, router]);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await GetStoreOwnersDebts();
    if (r.ok) {
      setOwners(r.result.owners);
      setTotalDebt(r.result.totalDebt);
      setRates(r.result.rates);
    } else setNotice({ ok: false, text: r.message });
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveRates = async () => {
    setSavingRates(true);
    setNotice(null);
    const r = await SaveStoreOwnerRates(rates);
    setSavingRates(false);
    if (r.ok) {
      setRates(r.result);
      setNotice({ ok: true, text: "Taux enregistrés." });
    } else setNotice({ ok: false, text: r.message });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-black text-gray-800 flex items-center gap-2">
          <Landmark size={22} /> Dettes des points de recharge
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Chaque recharge Bulek d&apos;un point devient une dette. Ses commissions sur les recharges livreurs la diminuent. Enregistrez
          ici les paiements reçus : un code de preuve est généré.
        </p>
      </div>

      {notice && (
        <div
          className={`text-sm rounded-xl p-3 border ${
            notice.ok ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* Taux */}
      <section className="bg-white border border-gray-100 rounded-2xl p-4 space-y-4">
        <h3 className="font-bold text-gray-800">Rémunération des points</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-gray-700">Commission sur recharge livreur (%)</span>
            <input
              type="number"
              min={0}
              max={20}
              step={0.1}
              className={inputClass}
              value={rates.rechargeCommissionPercent}
              onChange={(e) => setRates((r) => ({ ...r, rechargeCommissionPercent: Number(e.target.value) || 0 }))}
            />
            <span className="block text-[11px] text-gray-500">Payée par Bulek, déduite de la dette du point.</span>
          </label>
        </div>
        <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
          Exemple : Bulek recharge le point de 5000 DZD → dette 5000. Il recharge des livreurs pour 3000 DZD → commission{" "}
          {dzd(Math.round(3000 * rates.rechargeCommissionPercent) / 100)}
          {" "}→ dette {dzd(5000 - Math.round(3000 * rates.rechargeCommissionPercent) / 100)}. Les retraits espèces des
          livreurs sont sans commission et sans effet sur la dette.
        </p>
        <button
          onClick={saveRates}
          disabled={savingRates}
          className="px-5 py-2.5 rounded-xl bg-[#e91818] text-white text-sm font-bold disabled:opacity-50"
        >
          {savingRates ? "..." : "Enregistrer"}
        </button>
      </section>

      {/* Liste */}
      <section className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-800">Points de recharge</h3>
          <p className="text-sm">
            Dette totale : <b className="text-[#e91818]">{dzd(totalDebt)}</b>
          </p>
        </div>
        {loading ? (
          <Loader2 className="animate-spin text-gray-400 mx-auto my-8" size={22} />
        ) : owners.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center">Aucun point de recharge.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500">
                  <th className="py-2 text-start">Point</th>
                  <th className="py-2 text-start">Solde</th>
                  <th className="py-2 text-start">Dette</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {owners.map((o) => (
                  <tr key={o.id}>
                    <td className="py-2">
                      <p className="font-bold text-gray-800">{o.userName}</p>
                      <p className="text-xs text-gray-500">{o.ville}</p>
                    </td>
                    <td className="py-2">{dzd(o.balance)}</td>
                    <td className={`py-2 font-black ${o.debt > 0 ? "text-[#e91818]" : o.debt < 0 ? "text-green-700" : "text-gray-500"}`}>
                      {o.debt < 0 ? `Bulek doit ${dzd(-o.debt)}` : dzd(o.debt)}
                    </td>
                    <td className="py-2">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          disabled={o.debt <= 0}
                          onClick={() => setOp({ owner: o, kind: "PAYMENT" })}
                          className="px-3 py-1.5 rounded-lg bg-green-700 text-white text-xs font-bold disabled:opacity-40"
                        >
                          Paiement reçu
                        </button>
                        <button
                          onClick={() => setOp({ owner: o, kind: "ADJUSTMENT" })}
                          className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-700"
                        >
                          Ajuster
                        </button>
                        <button
                          onClick={() => setLedgerOf(o)}
                          aria-label="Historique"
                          className="px-2 py-1.5 rounded-lg border border-gray-200 text-gray-700"
                        >
                          <History size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {op && (
        <OperationModal
          op={op}
          onClose={() => setOp(null)}
          onDone={() => {
            load();
          }}
        />
      )}
      {ledgerOf && <LedgerModal owner={ledgerOf} onClose={() => setLedgerOf(null)} />}
    </div>
  );
}

function OperationModal({ op, onClose, onDone }: { op: Op; onClose: () => void; onDone: () => void }) {
  const payment = op.kind === "PAYMENT";
  const [amount, setAmount] = useState(payment ? String(op.owner.debt) : "");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<{ code: string | null; debtAfter: number } | null>(null);
  const [copied, setCopied] = useState(false);
  // نفس المفتاح عند إعادة المحاولة (انقطاع الشبكة) → لا تُسجَّل الدفعة مرتين
  const [requestId] = useState(newKey);

  const n = Number(amount.replace(",", "."));
  const valid = Number.isFinite(n) && n !== 0 && (!payment || (n > 0 && n <= op.owner.debt)) && (payment || note.trim().length > 0);

  const submit = async () => {
    setBusy(true);
    setError("");
    const r = await RecordStoreOwnerDebtOperation({
      ownerId: op.owner.id,
      amount: n,
      kind: op.kind,
      note: note.trim() || undefined,
      requestId,
    });
    setBusy(false);
    if (r.ok) {
      setReceipt({ code: r.result.receiptCode, debtAfter: r.result.debtAfter });
      onDone();
    } else setError(r.message);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-5 space-y-4">
        <div className="flex items-start justify-between">
          <h3 className="text-base font-black text-gray-800">
            {payment ? "Paiement reçu" : "Ajuster la dette"} · {op.owner.userName}
          </h3>
          <button onClick={onClose} aria-label="Fermer" className="text-gray-400 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        {receipt ? (
          <div className="space-y-3 text-center">
            <Check className="mx-auto text-green-700" size={32} />
            {receipt.code ? (
              <>
                <p className="text-sm text-gray-600">Code de preuve du paiement (visible aussi par le point) :</p>
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(receipt.code!);
                      setCopied(true);
                    } catch {
                      /* */
                    }
                  }}
                  className="inline-flex items-center gap-2 font-mono text-xl font-black tracking-widest bg-green-50 text-green-800 border border-green-200 rounded-xl px-4 py-2"
                >
                  {receipt.code} <Copy size={16} />
                </button>
                {copied && <p className="text-xs text-green-700">Copié ✓</p>}
              </>
            ) : (
              <p className="text-sm text-gray-600">Ajustement enregistré.</p>
            )}
            <p className="text-sm">
              Nouvelle dette : <b>{dzd(receipt.debtAfter)}</b>
            </p>
            <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold">
              Fermer
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600">
              Dette actuelle : <b className="text-[#e91818]">{dzd(op.owner.debt)}</b>
            </p>
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-gray-700">
                {payment ? "Montant reçu (DZD) — partiel ou total" : "Montant (+ augmente la dette, − la diminue)"}
              </span>
              <input inputMode="decimal" className={inputClass} value={amount} onChange={(e) => setAmount(e.target.value)} />
            </label>
            {payment && Number.isFinite(n) && n > op.owner.debt && (
              <p className="text-xs text-red-600">Le paiement dépasse la dette.</p>
            )}
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-gray-700">
                Note {payment ? "(optionnelle)" : "(obligatoire)"}
              </span>
              <input
                className={inputClass}
                value={note}
                maxLength={200}
                placeholder={payment ? "Ex. versement espèces agence" : "Ex. dette antérieure au 26/11"}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>
            {error && <p className="text-sm text-red-700">{error}</p>}
            <button
              onClick={submit}
              disabled={!valid || busy}
              className="w-full py-2.5 rounded-xl bg-green-700 text-white text-sm font-bold disabled:opacity-40"
            >
              {busy ? "Envoi..." : payment ? "Enregistrer et générer le code" : "Enregistrer l'ajustement"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function LedgerModal({ owner, onClose }: { owner: StoreOwnerDebtRow; onClose: () => void }) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<LedgerResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    GetStoreOwnerLedgerAdmin(owner.id, page).then((r) => {
      if (!alive) return;
      if (r.ok) setData(r.result);
      else setError(r.message);
    });
    return () => {
      alive = false;
    };
  }, [owner.id, page]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" className="w-full max-w-lg max-h-[85vh] flex flex-col bg-white rounded-2xl shadow-2xl p-5 gap-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-black text-gray-800">Historique de la dette · {owner.userName}</h3>
            <p className="text-xs text-gray-500">Dette actuelle : {dzd(data?.owner?.debt ?? owner.debt)}</p>
          </div>
          <button onClick={onClose} aria-label="Fermer" className="text-gray-400 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto -mx-1 px-1">
          {error ? (
            <p className="text-sm text-red-700">{error}</p>
          ) : !data ? (
            <Loader2 className="animate-spin text-gray-400 mx-auto my-8" size={22} />
          ) : data.items.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">Aucun mouvement.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {data.items.map((it) => (
                <li key={it.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-800">
                      {LEDGER_LABEL[it.type] ?? it.type}
                      {it.driverName ? ` · ${it.driverName}` : ""}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(it.createdAt)}
                      {it.type === "RECHARGE_COMMISSION" && it.rate != null ? ` · ${it.rate}% de ${dzd(it.baseAmount)}` : ""}
                      {it.note ? ` · ${it.note}` : ""}
                    </p>
                    {it.receiptCode && (
                      <span className="inline-block mt-1 font-mono text-xs font-black tracking-wider bg-green-50 text-green-800 border border-green-200 rounded-lg px-2 py-0.5">
                        {it.receiptCode}
                      </span>
                    )}
                  </div>
                  <div className="text-end shrink-0">
                    <p className={`text-sm font-black ${it.debtChange > 0 ? "text-[#e91818]" : "text-green-700"}`}>
                      {it.debtChange > 0 ? "+" : "−"}
                      {dzd(Math.abs(it.debtChange))}
                    </p>
                    <p className="text-[11px] text-gray-500">→ {dzd(it.debtAfter)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold">
              {data.page} / {data.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page >= data.totalPages}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
