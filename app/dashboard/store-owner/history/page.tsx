"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, Wallet } from "lucide-react";
import {
  GetStoreOwnerHistory,
  type HistoryPeriod,
  type HistoryResponse,
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

export default function HistoryPage() {
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

  const changePeriod = (p: HistoryPeriod) => {
    setPeriod(p);
    setPage(1);
  };

  const items = data?.items ?? [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-black text-gray-800">
          Mon historique
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Les recharges que vous avez effectuées pour les livreurs.
        </p>
      </div>

      {/* الفترة */}
      <div className="flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => changePeriod(p.value)}
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

      {/* الملخص */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
          <p className="text-[11px] text-gray-500">Total rechargé</p>
          <p className="text-lg md:text-xl font-black text-gray-800">
            {Number(data?.totalAmount ?? 0).toLocaleString("fr-FR")} DZD
          </p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
          <p className="text-[11px] text-gray-500">Opérations</p>
          <p className="text-lg md:text-xl font-black text-gray-800">
            {Number(data?.total ?? 0).toLocaleString("fr-FR")}
          </p>
        </div>
      </div>

      {/* القائمة */}
      <section className="bg-white border border-gray-100 rounded-2xl shadow-sm p-2 md:p-4">
        {loading && !data ? (
          <p className="text-sm text-gray-500 py-12 text-center">Chargement...</p>
        ) : error ? (
          <div className="py-12 text-center space-y-3">
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={load}
              className="inline-flex items-center gap-2 text-sm font-bold text-[#e91818]"
            >
              <RefreshCw size={14} /> Réessayer
            </button>
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-500 py-12 text-center">
            Aucune recharge sur cette période.
          </p>
        ) : (
          <ul
            className={`divide-y divide-gray-100 transition-opacity ${
              loading ? "opacity-50" : ""
            }`}
          >
            {items.map((it) => (
              <li
                key={it.id}
                className="flex items-center justify-between gap-3 px-3 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#e91818]/10 text-[#e91818] flex items-center justify-center shrink-0">
                    <Wallet size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">
                      {it.driverName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(it.createdAt)}
                      {it.driverPhone ? ` · ${it.driverPhone}` : ""}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-black text-green-700 shrink-0">
                  +{Number(it.amount).toLocaleString("fr-FR")} DZD
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* الصفحات */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            aria-label="Page précédente"
            className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-700 disabled:opacity-40 active:scale-95"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-bold text-gray-700">
            {data.page} / {data.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
            disabled={page >= data.totalPages || loading}
            aria-label="Page suivante"
            className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-700 disabled:opacity-40 active:scale-95"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}