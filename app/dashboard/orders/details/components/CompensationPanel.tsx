"use client";

import { useEffect, useState } from "react";
import { Preferences } from "@capacitor/preferences";
import { useUser } from "@/app/context/UserContext";
import { hasActiveRedelivery } from "./RedeliveryPanel";

/*
 * تعويض الزبون في محفظته عن مشكلة في الطلبية (web_backend /compensateOrder).
 * تعويض واحد لكل طلبية. من يتحمّل: التطبيق / المطعم (للتسوية) / السائق (يُخصم من رصيده).
 * النوع: رصيد في المحفظة، أو توصيل مجاني للطلبية القادمة (حتى المبلغ المحدد، على حساب التطبيق).
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

type Bearer = "APP" | "STORE" | "DRIVER";
type Kind = "WALLET" | "FREE_DELIVERY";
type Reason = "MISSING_ITEM" | "WRONG_ORDER" | "LATE" | "QUALITY" | "OTHER";

export interface CompensationInfo {
  kind?: Kind;
  amount: number;
  reason: Reason;
  note?: string;
  bearer: Bearer;
  at?: string;
}

export interface CompensableOrder {
  _id?: string;
  id?: string;
  status?: string;
  grandTotal?: number | string;
  feedelivery?: number | string;
  TrackingId?: string;
  driverId?: unknown;
  /** صفحة التفاصيل تعطي السائق ككائن (driver) بدل driverId */
  driver?: { _id?: string; id?: string } | null;
  compensation?: CompensationInfo | null;
  /** إرسال منتج ناقص (لا يجتمع مع التعويض) */
  redelivery?: { status?: string } | null;
}

const REASONS: Record<Reason, string> = {
  MISSING_ITEM: "Article manquant · منتج ناقص",
  WRONG_ORDER: "Erreur de commande · خطأ في الطلبية",
  LATE: "Retard · تأخير",
  QUALITY: "Qualité · جودة",
  OTHER: "Autre · أخرى",
};
const BEARERS: Record<Bearer, string> = {
  APP: "Bulek (l'application)",
  STORE: "Le restaurant",
  DRIVER: "Le livreur",
};
const ERRORS: Record<string, string> = {
  ALREADY_COMPENSATED: "Cette commande a déjà été compensée",
  AMOUNT_ABOVE_ORDER: "Le montant dépasse le total de la commande",
  INVALID_AMOUNT: "Montant invalide",
  NOTE_REQUIRED: "Ajoutez une note pour « Autre »",
  NO_DRIVER: "Aucun livreur sur cette commande",
  NO_STORE: "Aucun restaurant sur cette commande",
  NO_CLIENT: "Commande sans client",
  FORBIDDEN: "Réservé au super administrateur",
  FREE_DELIVERY_APP_ONLY: "La livraison offerte est à la charge de Bulek uniquement",
  INVALID_KIND: "Type de compensation invalide",
  HAS_REDELIVERY: "L'article manquant a déjà été renvoyé pour cette commande",
};

async function post<T>(path: string, body: unknown): Promise<T | null> {
  if (!API_URL) return null;
  const { value: token } = await Preferences.get({ key: "token" });
  try {
    const res = await fetch(API_URL + path, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body ?? {}),
    });
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

const num = (v: unknown) => Math.floor(Number(v) || 0);
const label = (c: CompensationInfo) =>
  c.kind === "FREE_DELIVERY" ? `🛵 Livraison offerte (≤ ${c.amount} DA)` : `💰 ${c.amount} DA`;

export default function CompensationPanel({
  order,
  onDone,
  compact = false,
}: {
  order: CompensableOrder | null;
  onDone?: (c?: CompensationInfo) => void;
  /** زر صغير (صفوف جدول السجل) */
  compact?: boolean;
}) {
  const { user } = useUser();
  /** التعويض للـ super_admin فقط — الباقون يرون الشارة دون الزر */
  const canAct = user?.role === "super_admin";
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind>("WALLET");
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState<Reason>("MISSING_ITEM");
  const [bearer, setBearer] = useState<Bearer>("APP");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<CompensationInfo | null>(order?.compensation ?? null);
  const [walletSpendable, setWalletSpendable] = useState(true);

  useEffect(() => setDone(order?.compensation ?? null), [order?.compensation]);
  useEffect(() => {
    if (!open) return;
    post<{ status: boolean; result?: { walletSpendable: boolean } }>("/dash/compensationInfo", {}).then((r) => {
      if (r?.status && r.result) setWalletSpendable(r.result.walletSpendable);
    });
  }, [open]);

  if (!order) return null;
  const orderId = order._id ?? order.id;
  const total = num(order.grandTotal);
  const delivery = num(order.feedelivery);

  if (done && compact) {
    return (
      <span
        title={`${REASONS[done.reason] ?? done.reason}${done.note ? ` — ${done.note}` : ""} · ${BEARERS[done.bearer] ?? done.bearer}`}
        className="mt-2 inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700"
      >
        {label(done)}
      </span>
    );
  }
  if (done) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
        <div className="font-bold">
          {done.kind === "FREE_DELIVERY"
            ? `🛵 Client compensé : livraison offerte sur sa prochaine commande (jusqu'à ${done.amount} DA)`
            : `💰 Client compensé : ${done.amount} DA`}
        </div>
        <div className="mt-1 text-xs">
          {REASONS[done.reason] ?? done.reason}
          {done.note ? ` — ${done.note}` : ""} · à la charge de : {BEARERS[done.bearer] ?? done.bearer}
        </div>
      </div>
    );
  }

  // المنتج الناقص أُرسل (أو في الطريق) → لا تعويض مالي فوقه
  if (hasActiveRedelivery(order) || !canAct) return null;

  async function submit() {
    setSaving(true);
    setError(null);
    const r = await post<{ status: boolean; code?: string; result?: CompensationInfo }>("/dash/compensateOrder", {
      orderId,
      kind,
      amount,
      reason,
      bearer,
      note,
    });
    setSaving(false);
    if (r?.status && r.result) {
      setDone(r.result);
      setOpen(false);
      onDone?.(r.result);
    } else {
      setError((r?.code && ERRORS[r.code]) || r?.code || "Erreur de connexion");
    }
  }

  return (
    <>
      <button
        onClick={() => {
          setAmount(delivery > 0 ? Math.min(delivery, total || delivery) : 0);
          setKind("WALLET");
          setOpen(true);
        }}
        className={
          compact
            ? "mt-2 block rounded-lg border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700 hover:bg-green-100"
            : "w-full rounded-xl border border-green-200 bg-green-50 py-2.5 text-sm font-bold text-green-800 transition hover:bg-green-100"
        }
      >
        {compact ? "💰 Compenser" : "💰 Compenser le client (portefeuille) · تعويض الزبون"}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Compenser le client</h3>
              <p className="text-xs text-gray-500">
                Commande #{order.TrackingId} · total {total} DA.
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-gray-700">Type · النوع</span>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ["WALLET", "💰 Solde portefeuille", "رصيد في المحفظة"],
                    ["FREE_DELIVERY", "🛵 Livraison offerte", "توصيل مجاني"],
                  ] as const
                ).map(([k, fr, ar]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      setKind(k);
                      if (k === "FREE_DELIVERY") {
                        setBearer("APP");
                        if (delivery > 0) setAmount(delivery);
                      }
                    }}
                    className={`rounded-lg border px-2 py-2 text-xs font-semibold ${
                      kind === k ? "border-[#e91818] bg-red-50 text-[#e91818]" : "border-gray-200 text-gray-600"
                    }`}
                  >
                    {fr}
                    <span className="block text-[10px] font-normal opacity-70">{ar}</span>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-gray-500">
                {kind === "WALLET"
                  ? "Le montant est ajouté au portefeuille du client (valable 1 an)."
                  : "La livraison de sa prochaine commande est offerte jusqu'à ce montant (valable 90 jours), payée au livreur par Bulek."}
              </p>
            </div>

            {kind === "WALLET" && !walletSpendable && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                ⚠️ Le cashback est désactivé : le client ne pourra utiliser ce solde qu&apos;après son activation.
              </div>
            )}

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-gray-700">
                {kind === "WALLET" ? "Montant (DA)" : "Livraison couverte jusqu'à (DA)"}
              </span>
              <input
                type="number"
                min={1}
                max={total || undefined}
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#e91818]"
              />
              <div className="flex gap-2 pt-1">
                {delivery > 0 && (
                  <button type="button" onClick={() => setAmount(delivery)} className="rounded-full bg-gray-100 px-3 py-1 text-xs">
                    Livraison ({delivery})
                  </button>
                )}
                {kind === "WALLET" && total > 0 && (
                  <button type="button" onClick={() => setAmount(total)} className="rounded-full bg-gray-100 px-3 py-1 text-xs">
                    Total ({total})
                  </button>
                )}
              </div>
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-gray-700">Motif</span>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as Reason)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              >
                {(Object.keys(REASONS) as Reason[]).map((k) => (
                  <option key={k} value={k}>
                    {REASONS[k]}
                  </option>
                ))}
              </select>
            </label>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-gray-700">À la charge de</span>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(BEARERS) as Bearer[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    disabled={(k === "DRIVER" && !(order.driverId ?? order.driver?._id ?? order.driver?.id)) || (kind === "FREE_DELIVERY" && k !== "APP")}
                    onClick={() => setBearer(k)}
                    className={`rounded-lg border px-2 py-2 text-xs font-semibold disabled:opacity-40 ${
                      bearer === k ? "border-[#e91818] bg-red-50 text-[#e91818]" : "border-gray-200 text-gray-600"
                    }`}
                  >
                    {BEARERS[k]}
                  </button>
                ))}
              </div>
              {bearer === "DRIVER" && (
                <p className="text-[11px] text-gray-500">Le montant est déduit du solde principal du livreur.</p>
              )}
              {bearer === "STORE" && (
                <p className="text-[11px] text-gray-500">Enregistré sur le restaurant pour le règlement.</p>
              )}
            </div>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-gray-700">Note {reason === "OTHER" ? "(obligatoire)" : "(optionnel)"}</span>
              <input
                value={note}
                maxLength={300}
                onChange={(e) => setNote(e.target.value)}
                placeholder="ex : jus oublié"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#e91818]"
              />
            </label>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 rounded-xl bg-gray-100 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-200"
              >
                Annuler
              </button>
              <button
                onClick={submit}
                disabled={saving || amount < 1 || (total > 0 && amount > total)}
                className="flex-1 rounded-xl bg-green-700 py-2.5 text-sm font-bold text-white hover:bg-green-800 disabled:opacity-50"
              >
                {saving ? "..." : kind === "FREE_DELIVERY" ? "Offrir la livraison" : `Ajouter ${amount || 0} DA`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
