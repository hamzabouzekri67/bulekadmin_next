"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Wallet, X, Check, AlertCircle } from "lucide-react";
import { useUser } from "@/app/context/UserContext";
import {
  GetStoreOwnerDrivers,
  GetStoreOwnerSummary,
  RechargeDriver,
  type StoreOwnerDriver as Driver,
} from "../service/storeOwner";

const QUICK_AMOUNTS = [500, 1000, 2000, 5000];
const MIN_AMOUNT = 500;
const MIN_SEARCH_LENGTH = 3;
const DEBOUNCE_MS = 400;

const newKey = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;

export default function RechargePage() {
  const { user } = useUser();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Driver[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  const [selected, setSelected] = useState<Driver | null>(null);
  const [amount, setAmount] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // يمنع الضغط المزدوج قبل أن تتحدّث الحالة، ويحفظ مفتاح الطلب عند انقطاع الشبكة
  const inFlight = useRef(false);
  const pendingKey = useRef<{ driverId: string; amount: number; id: string } | null>(null);

  // عمولتك على كل شحن (% تحددها المنصة) — تُنقص دينك للشركة
  const [commissionPct, setCommissionPct] = useState(0);
  useEffect(() => {
    GetStoreOwnerSummary().then((r) => {
      if (r.ok) setCommissionPct(Number(r.result.rates?.rechargeCommissionPercent ?? 0));
    });
  }, []);

  const trimmed = query.trim();
  const queryTooShort = trimmed.length < MIN_SEARCH_LENGTH;

  // بحث من الخادم مع debounce، ويتجاهل الردود القديمة
  useEffect(() => {
    setSearchError("");
    if (queryTooShort) {
      setResults([]);
      setSearching(false);
      return;
    }

    let cancelled = false;
    setSearching(true);
    const t = setTimeout(async () => {
      const list = await GetStoreOwnerDrivers(trimmed);
      if (cancelled) return;
      if (list) setResults(list);
      else {
        setResults([]);
        setSearchError("La recherche a échoué. Réessayez.");
      }
      setSearching(false);
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [trimmed, queryTooShort]);

  const amountNumber = Number(amount);
  const ownerBalance = Number(user?.balance ?? 0);
  const amountValid =
    Number.isInteger(amountNumber) && amountNumber >= MIN_AMOUNT;
  const insufficient = amountValid && amountNumber > ownerBalance;
  const commission = amountValid ? Math.round(amountNumber * commissionPct) / 100 : 0;

  const openConfirm = () => {
    setError("");
    setSuccess("");
    if (!selected) return setError("Choisissez un livreur.");
    if (!amountValid)
      return setError(`Le montant minimum est de ${MIN_AMOUNT} DZD.`);
    if (insufficient) return setError("Votre solde est insuffisant.");
    setConfirmOpen(true);
  };

  const submit = async () => {
    if (!selected || submitting || inFlight.current) return;
    inFlight.current = true;
    setSubmitting(true);
    setError("");

    // نفس السائق والمبلغ بعد انقطاع شبكة => نعيد المفتاح نفسه، فلا يتكرر الشحن
    const prev = pendingKey.current;
    const key =
      prev && prev.driverId === selected.id && prev.amount === amountNumber
        ? prev.id
        : newKey();
    pendingKey.current = { driverId: selected.id, amount: amountNumber, id: key };

    const res = await RechargeDriver(selected.id, amountNumber, key);
    if (!res.unknown) pendingKey.current = null;
    inFlight.current = false;
    setConfirmOpen(false);
    if (res.success) {
      setSuccess(
        commission > 0
          ? `${amountNumber} DZD ont été ajoutés au compte de ${selected.firstName}. Votre commission : ${commission.toLocaleString("fr-FR")} DZD (déduite de votre dette).`
          : `${amountNumber} DZD ont été ajoutés au compte de ${selected.firstName}.`,
      );
      setAmount("");
      setSelected(null);
      setQuery("");
    } else {
      setError(res.message || "Une erreur est survenue");
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-gray-800">
            Recharger un livreur
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Recherchez un livreur, saisissez un montant, puis confirmez.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm">
          <Wallet size={18} className="text-[#e91818]" />
          <div>
            <p className="text-[11px] text-gray-500">Votre solde</p>
            <p className="text-base font-black text-gray-800">
              {ownerBalance.toLocaleString("fr-FR")} DZD
            </p>
          </div>
        </div>
      </div>

      {success && (
        <div className="flex items-start gap-2 bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-3 text-sm">
          <Check size={18} className="mt-0.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3 text-sm">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        {/* البحث والنتائج */}
        <section className="lg:col-span-3 bg-white border border-gray-100 rounded-2xl shadow-sm p-4 md:p-5">
          <div className="relative mb-4">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nom ou téléphone du livreur"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-sm outline-none focus:border-[#e91818] focus:ring-2 focus:ring-[#e91818]/10"
            />
          </div>

          {queryTooShort ? (
            <p className="text-sm text-gray-500 py-10 text-center">
              Saisissez au moins {MIN_SEARCH_LENGTH} caractères pour chercher un
              livreur.
            </p>
          ) : searching ? (
            <p className="text-sm text-gray-500 py-10 text-center">
              Recherche...
            </p>
          ) : searchError ? (
            <p className="text-sm text-red-700 py-10 text-center">
              {searchError}
            </p>
          ) : results.length === 0 ? (
            <p className="text-sm text-gray-500 py-10 text-center">
              Aucun livreur trouvé.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 max-h-[460px] overflow-y-auto">
              {results.map((d) => {
                const active = selected?.id === d.id;
                return (
                  <li key={d.id}>
                    <button
                      onClick={() => {
                        setSelected(d);
                        setError("");
                        setSuccess("");
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-3 text-left rounded-xl transition-colors ${
                        active ? "bg-[#e91818]/5" : "hover:bg-gray-50"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                          active
                            ? "bg-[#e91818] text-white"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {d.firstName?.charAt(0).toUpperCase() || "L"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate">
                          {d.firstName} {d.lastName}
                        </p>
                        {d.phoneNumber && (
                          <p className="text-xs text-gray-500">{d.phoneNumber}</p>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* نموذج الشحن */}
        <section className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl shadow-sm p-4 md:p-5 h-fit lg:sticky lg:top-20 space-y-4">
          <div>
            <p className="text-[11px] text-gray-500">Livreur sélectionné</p>
            <p className="text-sm font-bold text-gray-800">
              {selected
                ? `${selected.firstName}${selected.phoneNumber ? ` (${selected.phoneNumber})` : ""}`
                : "Aucun"}
            </p>
          </div>

          <div>
            <label
              htmlFor="amount"
              className="text-[11px] text-gray-500 block mb-1"
            >
              Montant (DZD)
            </label>
            <input
              id="amount"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
              placeholder={`Minimum ${MIN_AMOUNT}`}
              className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-base font-bold outline-none focus:border-[#e91818] focus:ring-2 focus:ring-[#e91818]/10"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {QUICK_AMOUNTS.map((a) => (
                <button
                  key={a}
                  onClick={() => setAmount(String(a))}
                  className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 hover:bg-gray-100 active:scale-95"
                >
                  {a.toLocaleString("fr-FR")}
                </button>
              ))}
            </div>
            {insufficient && (
              <p className="text-xs text-red-600 mt-2">
                Le montant dépasse votre solde.
              </p>
            )}
            {commission > 0 && !insufficient && (
              <p className="text-xs text-gray-700 mt-2 bg-gray-50 rounded-lg p-2">
                Votre commission ({commissionPct}%) :{" "}
                <b className="text-green-700">{commission.toLocaleString("fr-FR")} DZD</b>
              </p>
            )}
          </div>

          <button
            onClick={openConfirm}
            disabled={!selected || !amountValid || insufficient}
            className="w-full py-3 rounded-xl bg-[#e91818] text-white font-bold text-sm shadow-sm hover:bg-[#d01414] active:scale-[0.98] transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Recharger
          </button>
        </section>
      </div>

      {/* نافذة التأكيد */}
      {confirmOpen && selected && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-5 space-y-4"
          >
            <div className="flex items-start justify-between">
              <h3 className="text-base font-black text-gray-800">
                Confirmer la recharge
              </h3>
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={submitting}
                aria-label="Fermer"
                className="text-gray-400 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-gray-600">
              Vous allez ajouter{" "}
              <b className="text-gray-800">
                {amountNumber.toLocaleString("fr-FR")} DZD
              </b>{" "}
              au compte de <b className="text-gray-800">{selected.firstName}</b>
              {selected.phoneNumber ? ` (${selected.phoneNumber})` : ""}. Cette somme sera
              déduite de votre solde.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={submit}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-[#e91818] text-white text-sm font-bold hover:bg-[#d01414] disabled:opacity-60"
              >
                {submitting ? "Envoi..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}