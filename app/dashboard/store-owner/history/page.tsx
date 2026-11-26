"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Copy,
  RefreshCw,
  Wallet,
} from "lucide-react";
import {
  GetStoreOwnerHistory,
  GetStoreOwnerLedger,
  type HistoryPeriod,
  type HistoryResponse,
  type LedgerResponse,
  type LedgerType,
} from "../service/storeOwner";

const PERIODS: { value: HistoryPeriod; label: string }[] = [
  { value: "today", label: "Aujourd'hui" },
  { value: "7d", label: "7 jours" },
  { value: "30d", label: "30 jours" },
  { value: "all", label: "Tout" },
];

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

const dzd = (v: number | undefined | null) => `${Number(v ?? 0).toLocaleString("fr-FR")} DZD`;

const LEDGER_LABEL: Record<LedgerType, string> = {
  TOPUP: "Recharge par Bulek",
  RECHARGE_COMMISSION: "Commission recharge livreur",
  PAYMENT: "Paiement à Bulek",
  ADJUSTMENT: "Ajustement",
};

type Tab = "ops" | "debt";

export default function HistoryPage() {
  const [tab, setTab] = useState<Tab>("ops");

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-black text-gray-800">Mon historique</h2>
        <p className="text-sm text-gray-500 mt-1">
          Vos opérations avec les livreurs, les recharges de Bulek et votre dette.
        </p>
      </div>

      <div className="inline-flex bg-gray-100 rounded-xl p-1">
        {(
          [
            { v: "ops", label: "Opérations" },
            { v: "debt", label: "Dette & paiements" },
          ] as { v: Tab; label: string }[]
        ).map((t) => (
          <button
            key={t.v}
            onClick={() => setTab(t.v)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
              tab === t.v ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "ops" ? <OperationsTab /> : <DebtTab />}
    </div>
  );
}

function Pager({
  page,
  totalPages,
  loading,
  onPage,
}: {
  page: number;
  totalPages: number;
  loading: boolean;
  onPage: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={() => onPage(Math.max(1, page - 1))}
        disabled={page <= 1 || loading}
        aria-label="Page précédente"
        className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-700 disabled:opacity-40 active:scale-95"
      >
        <ChevronLeft size={18} />
      </button>
      <span className="text-sm font-bold text-gray-700">
        {page} / {totalPages}
      </span>
      <button
        onClick={() => onPage(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages || loading}
        aria-label="Page suivante"
        className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-700 disabled:opacity-40 active:scale-95"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}

function Card({ label, value, tone = "gray" }: { label: string; value: string; tone?: "gray" | "green" | "red" }) {
  const color = tone === "green" ? "text-green-700" : tone === "red" ? "text-[#e91818]" : "text-gray-800";
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
      <p className="text-[11px] text-gray-500">{label}</p>
      <p className={`text-lg md:text-xl font-black ${color}`}>{value}</p>
    </div>
  );
}

/** الدين: موجب = عليك للشركة، سالب = الشركة مدينة لك */
function DebtCard({ debt }: { debt: number }) {
  return debt >= 0 ? (
    <Card label="Ma dette envers Bulek" value={dzd(debt)} tone={debt > 0 ? "red" : "gray"} />
  ) : (
    <Card label="Bulek vous doit" value={dzd(-debt)} tone="green" />
  );
}

function ErrorBox({ text, onRetry }: { text: string; onRetry: () => void }) {
  return (
    <div className="py-12 text-center space-y-3">
      <p className="text-sm text-red-700">{text}</p>
      <button onClick={onRetry} className="inline-flex items-center gap-2 text-sm font-bold text-[#e91818]">
        <RefreshCw size={14} /> Réessayer
      </button>
    </div>
  );
}

function OperationsTab() {
  const [period, setPeriod] = useState<HistoryPeriod>("7d");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // رقم آخر طلب: نتجاهل أي رد قديم وصل بعد تغيير الفترة أو الصفحة
  const lastReq = useRef(0);

  const load = useCallback(async () => {
    const reqId = ++lastReq.current;
    setLoading(true);
    setError("");
    const res = await GetStoreOwnerHistory(page, period);
    if (reqId !== lastReq.current) return;
    if (res) setData(res);
    else setError("Impossible de charger l'historique.");
    setLoading(false);
  }, [page, period]);

  useEffect(() => {
    load();
  }, [load]);

  const items = data?.items ?? [];
  const earned = data?.totalCommission ?? 0;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => {
              setPeriod(p.value);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-sm font-bold border transition active:scale-95 ${
              period === p.value
                ? "bg-[#e91818] text-white border-[#e91818]"
                : "bg-white text-gray-700 border-gray-100 hover:bg-gray-50"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card label="Rechargé aux livreurs" value={dzd(data?.totalRecharged)} />
        <Card label="Rechargé par Bulek" value={dzd(data?.totalCredited)} />
        <Card label="Mes commissions" value={dzd(earned)} tone="green" />
        <DebtCard debt={data?.debt ?? 0} />
      </div>

      <section className="bg-white border border-gray-100 rounded-2xl shadow-sm p-2 md:p-4">
        {loading && !data ? (
          <p className="text-sm text-gray-500 py-12 text-center">Chargement...</p>
        ) : error ? (
          <ErrorBox text={error} onRetry={load} />
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-500 py-12 text-center">Aucune opération sur cette période.</p>
        ) : (
          <ul className={`divide-y divide-gray-100 transition-opacity ${loading ? "opacity-50" : ""}`}>
            {items.map((it) => {
              const cashout = it.kind === "cashout";
              const topup = it.kind === "topup";
              // topup / cashout يزيدان رصيدك (+)، شحن سائق يُنقصه (−)
              const credit = topup || cashout;
              return (
                <li key={it.id} className="flex items-center justify-between gap-3 px-3 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        credit ? "bg-green-50 text-green-700" : "bg-[#e91818]/10 text-[#e91818]"
                      }`}
                    >
                      {topup ? <Wallet size={18} /> : <ArrowUpRight size={18} />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full ${
                            topup ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {topup ? "BULEK" : "LIVREUR"}
                        </span>
                        <p className="text-sm font-bold text-gray-800 truncate">
                          {topup
                            ? "Recharge de votre solde (dette)"
                            : cashout
                              ? `Retrait espèces · ${it.driverName ?? ""}`
                              : `Recharge · ${it.driverName ?? ""}`}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500">
                        {formatDate(it.createdAt)}
                        {!topup && it.driverPhone ? ` · ${it.driverPhone}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-end shrink-0">
                    <p className={`text-sm font-black ${credit ? "text-green-700" : "text-gray-800"}`}>
                      {credit ? "+" : "−"}
                      {dzd(it.amount)}
                    </p>
                    {!topup && !cashout && (it.commission ?? 0) > 0 && (
                      <p className="text-[11px] font-bold text-green-700">Commission +{dzd(it.commission)}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {data && <Pager page={data.page} totalPages={data.totalPages} loading={loading} onPage={setPage} />}
    </>
  );
}

function DebtTab() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<LedgerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const lastReq = useRef(0);

  const load = useCallback(async () => {
    const reqId = ++lastReq.current;
    setLoading(true);
    setError("");
    const r = await GetStoreOwnerLedger(page);
    if (reqId !== lastReq.current) return;
    if (r.ok) setData(r.result);
    else setError(r.message);
    setLoading(false);
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* الحافظة غير متاحة */
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DebtCard debt={data?.owner?.debt ?? 0} />
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-xs text-gray-600 leading-relaxed">
          Chaque recharge de Bulek s&apos;ajoute à votre dette. Vos commissions sur les recharges livreurs la diminuent. Quand vous payez
          Bulek, le paiement apparaît ici avec un <b>code de preuve</b>.
        </div>
      </div>

      <section className="bg-white border border-gray-100 rounded-2xl shadow-sm p-2 md:p-4">
        {loading && !data ? (
          <p className="text-sm text-gray-500 py-12 text-center">Chargement...</p>
        ) : error ? (
          <ErrorBox text={error} onRetry={load} />
        ) : !data || data.items.length === 0 ? (
          <p className="text-sm text-gray-500 py-12 text-center">Aucun mouvement de dette.</p>
        ) : (
          <ul className={`divide-y divide-gray-100 transition-opacity ${loading ? "opacity-50" : ""}`}>
            {data.items.map((it) => {
              const up = it.debtChange > 0;
              return (
                <li key={it.id} className="flex items-center justify-between gap-3 px-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-800">
                      {LEDGER_LABEL[it.type] ?? it.type}
                      {it.driverName ? ` · ${it.driverName}` : ""}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(it.createdAt)}
                      {it.type === "RECHARGE_COMMISSION" && it.rate != null
                        ? ` · ${it.rate}% de ${dzd(it.baseAmount)}`
                        : ""}
                      {it.note ? ` · ${it.note}` : ""}
                    </p>
                    {it.receiptCode && (
                      <button
                        onClick={() => copy(it.receiptCode!)}
                        className="mt-1 inline-flex items-center gap-1.5 font-mono text-xs font-black tracking-wider bg-green-50 text-green-800 border border-green-200 rounded-lg px-2 py-1"
                        title="Copier le code"
                      >
                        {it.receiptCode}
                        <Copy size={12} />
                        {copied === it.receiptCode && <span className="font-sans font-bold">✓</span>}
                      </button>
                    )}
                  </div>
                  <div className="text-end shrink-0">
                    <p className={`text-sm font-black ${up ? "text-[#e91818]" : "text-green-700"}`}>
                      {up ? "+" : "−"}
                      {dzd(Math.abs(it.debtChange))}
                    </p>
                    <p className="text-[11px] text-gray-500">Dette : {dzd(it.debtAfter)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {data && <Pager page={data.page} totalPages={data.totalPages} loading={loading} onPage={setPage} />}
    </>
  );
}
