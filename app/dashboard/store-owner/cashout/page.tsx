"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Banknote, X, Check, AlertCircle, KeyRound } from "lucide-react";
import { useUser } from "@/app/context/UserContext";
import {
  CashoutDriver,
  GetStoreOwnerDrivers,
  type StoreOwnerDriver as Driver,
} from "../service/storeOwner";

/*
 * سحب نقدي لسائق من "محفظة المستحقات" (ما دفعه الزبائن من محفظة الكاش باك بدل الكاش).
 * 1) ابحث عن السائق  2) أدخل المبلغ والرمز من تطبيق السائق  3) سلّمه المبلغ نقداً.
 * المبلغ يُخصم من محفظة المستحقات للسائق ويُضاف إلى رصيدك.
 */

const MIN_SEARCH_LENGTH = 3;
const DEBOUNCE_MS = 400;

const newKey = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;

export default function CashoutPage() {
  const { user } = useUser();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Driver[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  const [selected, setSelected] = useState<Driver | null>(null);
  const [amount, setAmount] = useState("");
  const [code, setCode] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [ownerBalance, setOwnerBalance] = useState<number>(Number(user?.balance ?? 0));

  // يمنع الضغط المزدوج، ويعيد نفس المفتاح بعد انقطاع الشبكة فلا يتكرر السحب
  const inFlight = useRef(false);
  const pendingKey = useRef<{ driverId: string; amount: number; id: string } | null>(null);

  useEffect(() => {
    setOwnerBalance(Number(user?.balance ?? 0));
  }, [user?.balance]);

  const trimmed = query.trim();
  const queryTooShort = trimmed.length < MIN_SEARCH_LENGTH;

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

  const reimbursement = Number(selected?.reimbursementBalance ?? 0);
  const amountNumber = Number(amount);
  const amountValid = Number.isInteger(amountNumber) && amountNumber >= 1;
  const tooMuch = amountValid && amountNumber > reimbursement;
  const codeValid = /^\d{6}$/.test(code);

  const openConfirm = () => {
    setError("");
    setSuccess("");
    if (!selected) return setError("Choisissez un livreur.");
    if (!amountValid) return setError("Saisissez un montant.");
    if (tooMuch) return setError("Le montant dépasse le solde remboursement du livreur.");
    if (!codeValid) return setError("Saisissez le code à 6 chiffres affiché dans l'application du livreur.");
    setConfirmOpen(true);
  };

  const submit = async () => {
    if (!selected || submitting || inFlight.current) return;
    inFlight.current = true;
    setSubmitting(true);
    setError("");

    const prev = pendingKey.current;
    const key =
      prev && prev.driverId === selected.id && prev.amount === amountNumber ? prev.id : newKey();
    pendingKey.current = { driverId: selected.id, amount: amountNumber, id: key };

    const res = await CashoutDriver(selected.id, amountNumber, code, key);
    if (!res.unknown) pendingKey.current = null;
    inFlight.current = false;
    setConfirmOpen(false);
    if (res.success) {
      // بلا عمولة: السائق يستلم المبلغ كاملاً
      setSuccess(
        `Remettez ${amountNumber.toLocaleString("fr-FR")} DZD en espèces à ${selected.firstName}. Le montant a été ajouté à votre solde.`,
      );
      if (typeof res.ownerBalance === "number") setOwnerBalance(res.ownerBalance);
      setAmount("");
      setCode("");
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
          <h2 className="text-xl md:text-2xl font-black text-gray-800">Retrait espèces livreur</h2>
          <p className="text-sm text-gray-500 mt-1">
            Le livreur retire son solde « remboursement cashback ». Il vous donne un code depuis son application,
            vous lui remettez l&apos;argent en espèces.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm">
          <Banknote size={18} className="text-green-700" />
          <div>
            <p className="text-[11px] text-gray-500">Votre solde</p>
            <p className="text-base font-black text-gray-800">{ownerBalance.toLocaleString("fr-FR")} DZD</p>
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
        <section className="lg:col-span-3 bg-white border border-gray-100 rounded-2xl shadow-sm p-4 md:p-5">
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nom ou téléphone du livreur"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-sm outline-none focus:border-green-700 focus:ring-2 focus:ring-green-700/10"
            />
          </div>

          {queryTooShort ? (
            <p className="text-sm text-gray-500 py-10 text-center">
              Saisissez au moins {MIN_SEARCH_LENGTH} caractères pour chercher un livreur.
            </p>
          ) : searching ? (
            <p className="text-sm text-gray-500 py-10 text-center">Recherche...</p>
          ) : searchError ? (
            <p className="text-sm text-red-700 py-10 text-center">{searchError}</p>
          ) : results.length === 0 ? (
            <p className="text-sm text-gray-500 py-10 text-center">Aucun livreur trouvé.</p>
          ) : (
            <ul className="divide-y divide-gray-100 max-h-[460px] overflow-y-auto">
              {results.map((d) => {
                const active = selected?.id === d.id;
                const r = Number(d.reimbursementBalance ?? 0);
                return (
                  <li key={d.id}>
                    <button
                      onClick={() => {
                        setSelected(d);
                        setError("");
                        setSuccess("");
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-3 text-left rounded-xl transition-colors ${
                        active ? "bg-green-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                          active ? "bg-green-700 text-white" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {d.firstName?.charAt(0).toUpperCase() || "L"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-800 truncate">
                          {d.firstName} {d.lastName}
                        </p>
                        {d.phoneNumber && <p className="text-xs text-gray-500">{d.phoneNumber}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-500">Remboursement</p>
                        <p className={`text-sm font-black ${r > 0 ? "text-green-700" : "text-gray-400"}`}>
                          {r.toLocaleString("fr-FR")} DZD
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl shadow-sm p-4 md:p-5 h-fit lg:sticky lg:top-20 space-y-4">
          <div>
            <p className="text-[11px] text-gray-500">Livreur sélectionné</p>
            <p className="text-sm font-bold text-gray-800">
              {selected ? `${selected.firstName}${selected.phoneNumber ? ` (${selected.phoneNumber})` : ""}` : "Aucun"}
            </p>
            {selected && (
              <p className="text-xs text-gray-600 mt-1">
                Solde remboursement : <b className="text-green-700">{reimbursement.toLocaleString("fr-FR")} DZD</b>
              </p>
            )}
          </div>

          <div>
            <label htmlFor="amount" className="text-[11px] text-gray-500 block mb-1">
              Montant à remettre (DZD)
            </label>
            <input
              id="amount"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
              placeholder="Montant"
              className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-base font-bold outline-none focus:border-green-700 focus:ring-2 focus:ring-green-700/10"
            />
            {selected && reimbursement > 0 && (
              <button
                onClick={() => setAmount(String(reimbursement))}
                className="mt-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 hover:bg-gray-100"
              >
                Tout ({reimbursement.toLocaleString("fr-FR")})
              </button>
            )}
            {tooMuch && <p className="text-xs text-red-600 mt-2">Le montant dépasse le solde remboursement.</p>}
          </div>

          <div>
            <label htmlFor="code" className="text-[11px] text-gray-500 block mb-1">
              Code du livreur (6 chiffres, valable 10 min)
            </label>
            <div className="relative">
              <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="code"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-base font-black tracking-[0.4em] outline-none focus:border-green-700 focus:ring-2 focus:ring-green-700/10"
              />
            </div>
          </div>

          <button
            onClick={openConfirm}
            disabled={!selected || !amountValid || tooMuch || !codeValid}
            className="w-full py-3 rounded-xl bg-green-700 text-white font-bold text-sm shadow-sm hover:bg-green-800 active:scale-[0.98] transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Valider le retrait
          </button>
        </section>
      </div>

      {confirmOpen && selected && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-start justify-between">
              <h3 className="text-base font-black text-gray-800">Confirmer le retrait</h3>
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
              Vous allez remettre <b className="text-gray-800">{amountNumber.toLocaleString("fr-FR")} DZD</b> en espèces
              à <b className="text-gray-800">{selected.firstName}</b>.{" "}
              Ce montant sera retiré de son solde remboursement et ajouté à votre solde.
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
                className="flex-1 py-2.5 rounded-xl bg-green-700 text-white text-sm font-bold hover:bg-green-800 disabled:opacity-60"
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
