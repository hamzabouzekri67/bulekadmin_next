"use client";

import { useEffect, useState } from "react";
import { Preferences } from "@capacitor/preferences";
import { useUser } from "@/app/context/UserContext";

/*
 * إرسال منتج ناقص (Redelivery) لطلبية مكتملة — بدل التعويض المالي (web_backend /createRedelivery).
 * لا يجتمع مع التعويض: إن عُوّضت الطلبية لا يظهر الزر، وإن أُرسل المنتج يختفي زر التعويض.
 * السائق المُسند يرى المهمة في تطبيقه ويؤكد التسليم → يأخذ الأجرة، ويُخصم ممن يتحمّل.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

type Bearer = "APP" | "STORE" | "DRIVER";
/** OFFERED = عُرضت على سائق (يرن عنده) ولم يقبل بعد */
type Status = "PENDING" | "OFFERED" | "ASSIGNED" | "DELIVERED" | "CANCELLED";

export interface RedeliveryInfo {
  itemsNote: string;
  deliveryFee: number;
  /** Bonus المنصة للعرض الحالي (يزيد مع كل رفض)، والإعداد */
  bonus?: number;
  bonusStep?: number;
  bonusMax?: number;
  bearer: Bearer;
  status: Status;
  driverId?: string | null;
  originalDriverId?: string | null;
  createdAt?: string;
  deliveredAt?: string | null;
  /** السائقون الذين رفضوا (أو انتهت مهلتهم) */
  declines?: { driverId: string; reason?: string; at?: string }[];
}

export interface RedeliverableOrder {
  _id?: string;
  id?: string;
  status?: string;
  feedelivery?: number | string;
  TrackingId?: string;
  driverId?: unknown;
  /** صفحة التفاصيل تعطي السائق ككائن (driver) بدل driverId */
  driver?: { _id?: string; id?: string } | null;
  compensation?: { amount?: number } | null;
  redelivery?: RedeliveryInfo | null;
}

/** سطر من قائمة الطلبية (web_backend orderLines): منتج أو إضافة داخله */
interface OrderLine {
  key: string;
  title: string;
  qty: number;
  parent?: string;
}

interface DriverOption {
  _id: string;
  name: string;
  phoneNumber?: string | null;
  online: boolean;
  original?: boolean;
  distanceKm?: number;
}

const BEARERS: Record<Bearer, string> = {
  APP: "Bulek (l'application)",
  STORE: "Le restaurant",
  DRIVER: "Le livreur d'origine",
};
const STATUS: Record<Status, { label: string; cls: string }> = {
  PENDING: { label: "En attente d'un livreur · في الانتظار", cls: "border-amber-200 bg-amber-50 text-amber-800" },
  OFFERED: { label: "Proposée au livreur, en attente de réponse · بانتظار رد السائق", cls: "border-indigo-200 bg-indigo-50 text-indigo-800" },
  ASSIGNED: { label: "En cours de livraison · قيد التوصيل", cls: "border-blue-200 bg-blue-50 text-blue-800" },
  DELIVERED: { label: "Livré · تم التسليم", cls: "border-green-200 bg-green-50 text-green-800" },
  CANCELLED: { label: "Annulé · ملغاة", cls: "border-gray-200 bg-gray-50 text-gray-600" },
};
const ERRORS: Record<string, string> = {
  NOT_COMPLETED: "La commande n'est pas terminée",
  HAS_COMPENSATION: "Cette commande a déjà été compensée",
  HAS_REDELIVERY: "Un envoi est déjà en cours pour cette commande",
  HAS_REDELIVERY_OR_COMPENSATION: "Déjà compensée ou envoi déjà en cours",
  ITEMS_REQUIRED: "Choisissez l'article manquant",
  INVALID_ITEMS: "Article ou quantité invalide",
  INVALID_FEE: "Frais de livraison invalides (0 – 5000)",
  INVALID_BONUS: "Bonus invalide (0 – 5000)",
  NO_DRIVER: "Aucun livreur d'origine sur cette commande",
  DRIVER_NOT_FOUND: "Livreur introuvable",
  NOT_ASSIGNABLE: "Cet envoi ne peut plus être réassigné",
  NOT_CANCELLABLE: "Cet envoi ne peut plus être annulé",
  FORBIDDEN: "Réservé au super administrateur",
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

type Res<T> = { status: boolean; code?: string; result?: T };
const ACTIVE: Status[] = ["PENDING", "OFFERED", "ASSIGNED", "DELIVERED"];
const num = (v: unknown) => Math.floor(Number(v) || 0);

/** هل على الطلبية إعادة توصيل نشطة؟ (يُستعمل لإخفاء زر التعويض) */
export const hasActiveRedelivery = (o?: { redelivery?: { status?: string } | null } | null) =>
  !!o?.redelivery?.status && (ACTIVE as string[]).includes(o.redelivery.status);

export default function RedeliveryPanel({
  order,
  onDone,
  compact = false,
}: {
  order: RedeliverableOrder | null;
  /** يُستدعى بعد الإنشاء / الإسناد / الإلغاء مع الحالة الجديدة */
  onDone?: (r?: RedeliveryInfo) => void;
  /** زر صغير وشارة (صفوف جدول السجل) */
  compact?: boolean;
}) {
  const { user } = useUser();
  /** الإرسال والإسناد والإلغاء للـ super_admin فقط — الباقون يرون الشارة دون الأزرار */
  const canAct = user?.role === "super_admin";
  const [open, setOpen] = useState<null | "create" | "assign">(null);
  const [itemsNote, setItemsNote] = useState("");
  const [fee, setFee] = useState(0);
  /** Bonus تصاعدي: +step مع كل رفض حتى max (يدفعه Bulek) */
  const [bonusStep, setBonusStep] = useState(50);
  const [bonusMax, setBonusMax] = useState(250);
  const [saveDefault, setSaveDefault] = useState(false);
  const [bearer, setBearer] = useState<Bearer>("APP");
  const [driverId, setDriverId] = useState<string>("");
  /** المنتجات المتاحة في الطلبية والمختار منها: key → الكمية الناقصة */
  const [lines, setLines] = useState<OrderLine[]>([]);
  const [picks, setPicks] = useState<Record<string, number>>({});
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [declinedIds, setDeclinedIds] = useState<string[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<RedeliveryInfo | null>(order?.redelivery ?? null);

  useEffect(() => setInfo(order?.redelivery ?? null), [order?.redelivery]);

  const orderId = order?._id ?? order?.id;
  useEffect(() => {
    if (!open || !orderId) return;
    setLoadingDrivers(true);
    post<Res<{ defaultFee: number; items?: OrderLine[]; declinedIds?: string[]; bonusDefaults?: { bonusStep: number; bonusMax: number }; original: DriverOption | null; nearest: DriverOption[] }>>("/dash/redeliveryDrivers", {
      orderId,
    }).then((r) => {
      setLoadingDrivers(false);
      if (!r?.status || !r.result) return;
      setLines(r.result.items ?? []);
      setDeclinedIds(r.result.declinedIds ?? []);
      if (open === "create" && r.result.bonusDefaults) {
        setBonusStep(r.result.bonusDefaults.bonusStep);
        setBonusMax(r.result.bonusDefaults.bonusMax);
      }
      const list = [...(r.result.original ? [r.result.original] : []), ...r.result.nearest];
      setDrivers(list);
      if (open === "create" && r.result.defaultFee > 0) setFee((f) => f || r.result!.defaultFee);
      setDriverId((cur) => cur || list[0]?._id || "");
    });
  }, [open, orderId]);

  if (!order) return null;
  const active = info && info.status !== "CANCELLED";
  const compensated = num(order.compensation?.amount) > 0;
  const hasDriver = !!(order.driverId ?? order.driver?._id ?? order.driver?.id);
  const isCompleted = (order.status ?? "").toLowerCase() === "completed";

  // ── الشارة ──
  if (info && active) {
    const declined = info.status === "PENDING" && (info.declines?.length ?? 0) > 0;
    const st = declined
      ? { label: "Refusée par le livreur, à réassigner · رفضها السائق", cls: "border-orange-300 bg-orange-50 text-orange-800" }
      : (STATUS[info.status] ?? STATUS.PENDING);
    const lastReason = declined ? info.declines![info.declines!.length - 1]?.reason : "";
    if (compact) {
      return (
        <span
          title={`${info.itemsNote} · ${info.deliveryFee} DA · ${BEARERS[info.bearer] ?? info.bearer}`}
          className={`mt-2 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${st.cls}`}
        >
          {declined ? "⚠️" : "🛵"} {st.label.split(" · ")[0]}
        </span>
      );
    }
    const driver = drivers.find((d) => d._id === String(info.driverId ?? ""));
    return (
      <>
        <div className={`rounded-xl border p-4 text-sm ${st.cls}`}>
          <div className="font-bold">🛵 Renvoi d&apos;article manquant · إعادة توصيل منتج ناقص — {st.label}</div>
          <div className="mt-1 text-xs">
            {info.itemsNote} · {info.deliveryFee} DA au livreur
            {(info.bonus ?? 0) > 0 ? ` + Bonus ${info.bonus} DA` : ""}
            {(info.bonusStep ?? 0) > 0 ? ` (+${info.bonusStep}/refus, max ${info.bonusMax})` : ""} · à la charge de : {BEARERS[info.bearer] ?? info.bearer}
            {driver ? ` · ${driver.name}` : ""}
          </div>
          {declined && lastReason && <div className="mt-1 text-xs italic">« {lastReason} »</div>}
          {canAct && ["PENDING", "OFFERED", "ASSIGNED"].includes(info.status) && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  setError(null);
                  setDriverId("");
                  setOpen("assign");
                }}
                className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold shadow-sm hover:bg-gray-50"
              >
                {info.status === "PENDING" ? "Assigner un livreur" : "Changer de livreur"}
              </button>
              <button
                disabled={saving}
                onClick={async () => {
                  if (!confirm("Annuler cet envoi ?")) return;
                  setSaving(true);
                  const r = await post<Res<RedeliveryInfo>>("/dash/cancelRedelivery", { orderId });
                  setSaving(false);
                  if (r?.status && r.result) {
                    setInfo(r.result);
                    onDone?.(r.result);
                  } else alert((r?.code && ERRORS[r.code]) || r?.code || "Erreur de connexion");
                }}
                className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-red-600 shadow-sm hover:bg-red-50 disabled:opacity-50"
              >
                Annuler l&apos;envoi
              </button>
            </div>
          )}
        </div>
        {open === "assign" && modal()}
      </>
    );
  }

  if (compensated || !isCompleted || !canAct) return null;

  async function submit() {
    setSaving(true);
    setError(null);
    if (open === "create" && saveDefault) {
      const c = await post<Res<unknown>>("/dash/saveRedeliveryConfig", { bonusStep, bonusMax });
      if (!c?.status) {
        setSaving(false);
        setError((c?.code && ERRORS[c.code]) || "Erreur de connexion");
        return;
      }
    }
    const r =
      open === "assign"
        ? await post<Res<RedeliveryInfo>>("/dash/assignRedelivery", { orderId, driverId })
        : await post<Res<RedeliveryInfo>>("/dash/createRedelivery", {
            orderId,
            itemsNote,
            items: Object.entries(picks).map(([key, qty]) => ({ key, qty })),
            deliveryFee: fee,
            bonusStep,
            bonusMax,
            bearer,
            driverId: driverId || null,
          });
    setSaving(false);
    if (r?.status && r.result) {
      setInfo(r.result);
      setOpen(null);
      onDone?.(r.result);
    } else {
      setError((r?.code && ERRORS[r.code]) || r?.code || "Erreur de connexion");
    }
  }

  function driverPicker() {
    return (
      <div className="space-y-1">
        <span className="text-xs font-semibold text-gray-700">Livreur pour la course</span>
        {loadingDrivers ? (
          <p className="text-xs text-gray-400">Chargement…</p>
        ) : (
          <div className="max-h-48 space-y-1.5 overflow-y-auto">
            {drivers.map((d) => (
              <label
                key={d._id}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
                  driverId === d._id ? "border-[#e91818] bg-red-50" : "border-gray-200"
                }`}
              >
                <input type="radio" checked={driverId === d._id} onChange={() => setDriverId(d._id)} />
                <span className={`h-2 w-2 rounded-full ${d.online ? "bg-green-500" : "bg-gray-300"}`} />
                <span className="flex-1 font-semibold text-gray-800">
                  {d.name || d.phoneNumber || d._id}
                  {d.original && <span className="ml-1 font-normal text-gray-500">(livreur d&apos;origine)</span>}
                  {declinedIds.includes(d._id) && <span className="ml-1 font-normal text-orange-600">· a refusé</span>}
                </span>
                {d.distanceKm != null && <span className="text-gray-500">{d.distanceKm} km</span>}
              </label>
            ))}
            {open === "create" && (
              <label
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
                  driverId === "" ? "border-[#e91818] bg-red-50" : "border-gray-200"
                }`}
              >
                <input type="radio" checked={driverId === ""} onChange={() => setDriverId("")} />
                <span className="text-gray-600">Plus tard (en attente) · لاحقاً</span>
              </label>
            )}
            {!drivers.length && <p className="text-xs text-gray-400">Aucun livreur en ligne à proximité.</p>}
          </div>
        )}
      </div>
    );
  }

  function modal() {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="max-h-[90vh] w-full max-w-md space-y-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {open === "assign" ? "Assigner un livreur" : "Envoyer l'article manquant"}
            </h3>
            <p className="text-xs text-gray-500">
              Commande #{order!.TrackingId}. Le livreur reçoit les frais dans son solde à la confirmation de la livraison.
            </p>
          </div>

          {open === "create" && (
            <>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-700">Article manquant · المنتج الناقص</span>
                {loadingDrivers && !lines.length ? (
                  <p className="text-xs text-gray-400">Chargement…</p>
                ) : (
                  <div className="max-h-56 space-y-1.5 overflow-y-auto">
                    {lines.map((l) => {
                      const q = picks[l.key] ?? 0;
                      const on = q > 0;
                      const set = (n: number) =>
                        setPicks((p) => {
                          const next = { ...p };
                          if (n <= 0) delete next[l.key];
                          else next[l.key] = Math.min(n, l.qty);
                          return next;
                        });
                      return (
                        <div
                          key={l.key}
                          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
                            on ? "border-[#e91818] bg-red-50" : "border-gray-200"
                          } ${l.parent ? "ml-5" : ""}`}
                        >
                          <input type="checkbox" checked={on} onChange={() => set(on ? 0 : 1)} />
                          <button type="button" onClick={() => set(on ? 0 : 1)} className="flex-1 text-left">
                            <span className="font-semibold text-gray-800">
                              {l.parent ? "+ " : ""}
                              {l.title}
                            </span>
                            <span className="ml-1 text-gray-500">(x{l.qty})</span>
                          </button>
                          {on && l.qty > 1 && (
                            <div className="flex items-center gap-1">
                              <button type="button" onClick={() => set(q - 1)} className="h-6 w-6 rounded-full bg-white font-bold shadow-sm">
                                −
                              </button>
                              <span className="w-5 text-center font-bold">{q}</span>
                              <button
                                type="button"
                                disabled={q >= l.qty}
                                onClick={() => set(q + 1)}
                                className="h-6 w-6 rounded-full bg-white font-bold shadow-sm disabled:opacity-40"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {!lines.length && <p className="text-xs text-gray-400">Produits de la commande indisponibles — utilisez la note.</p>}
                  </div>
                )}
                <input
                  value={itemsNote}
                  maxLength={200}
                  onChange={(e) => setItemsNote(e.target.value)}
                  placeholder="Autre / précision (optionnel) — ex : sans glaçons"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#e91818]"
                />
              </div>

              <label className="block space-y-1">
                <span className="text-xs font-semibold text-gray-700">Frais de livraison pour le livreur (DA)</span>
                <input
                  type="number"
                  min={0}
                  max={5000}
                  value={fee}
                  onChange={(e) => setFee(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#e91818]"
                />
              </label>

              {/* Bonus تصاعدي: السائق الأول يرى الأجرة، وكل رفض يضيف للتالي (يدفعه Bulek) */}
              <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <span className="text-xs font-semibold text-amber-900">🎁 Bonus si refus · مكافأة تزيد مع كل رفض</span>
                <div className="grid grid-cols-2 gap-2">
                  <label className="space-y-0.5">
                    <span className="text-[11px] text-gray-600">+ par refus (DA)</span>
                    <input
                      type="number"
                      min={0}
                      max={5000}
                      value={bonusStep}
                      onChange={(e) => setBonusStep(Number(e.target.value))}
                      className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm"
                    />
                  </label>
                  <label className="space-y-0.5">
                    <span className="text-[11px] text-gray-600">Maximum (DA)</span>
                    <input
                      type="number"
                      min={0}
                      max={5000}
                      value={bonusMax}
                      onChange={(e) => setBonusMax(Number(e.target.value))}
                      className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm"
                    />
                  </label>
                </div>
                <p className="text-[11px] text-amber-900">
                  {bonusStep > 0
                    ? [0, 1, 2, 3]
                        .map((n) => `${n + 1}ᵉ : ${fee + Math.min(n * bonusStep, Math.max(bonusMax, bonusStep))} DA`)
                        .join(" · ") + " …"
                    : `Sans bonus : ${fee} DA pour chaque livreur`}
                </p>
                <p className="text-[11px] text-gray-500">Le bonus est payé par Bulek, pas par le responsable.</p>
                <label className="flex items-center gap-2 text-[11px] text-gray-700">
                  <input type="checkbox" checked={saveDefault} onChange={(e) => setSaveDefault(e.target.checked)} />
                  Enregistrer comme valeur par défaut
                </label>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-700">À la charge de</span>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(BEARERS) as Bearer[]).map((k) => (
                    <button
                      key={k}
                      type="button"
                      disabled={k === "DRIVER" && !hasDriver}
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
                  <p className="text-[11px] text-gray-500">Les frais sont déduits du solde du livreur d&apos;origine à la livraison.</p>
                )}
                {bearer === "STORE" && (
                  <p className="text-[11px] text-gray-500">Enregistré sur le restaurant pour le règlement.</p>
                )}
              </div>
            </>
          )}

          {driverPicker()}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setOpen(null)}
              className="flex-1 rounded-xl bg-gray-100 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-200"
            >
              Annuler
            </button>
            <button
              onClick={submit}
              disabled={
                saving ||
                (open === "create" &&
                  ((!Object.keys(picks).length && !itemsNote.trim()) ||
                    fee < 0 ||
                    fee > 5000 ||
                    bonusStep < 0 ||
                    bonusMax < 0 ||
                    bonusStep > 5000 ||
                    bonusMax > 5000)) ||
                (open === "assign" && !driverId)
              }
              className="flex-1 rounded-xl bg-[#e91818] py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {saving ? "..." : open === "assign" ? "Assigner" : "Envoyer 🛵"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => {
          setItemsNote("");
          setPicks({});
          setFee(num(order.feedelivery));
          setSaveDefault(false);
          setBearer("APP");
          setDriverId("");
          setError(null);
          setOpen("create");
        }}
        className={
          compact
            ? "mt-2 block rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100"
            : "w-full rounded-xl border border-blue-200 bg-blue-50 py-2.5 text-sm font-bold text-blue-800 transition hover:bg-blue-100"
        }
      >
        {compact ? "🛵 Article manquant" : "🛵 Envoyer l'article manquant · إرسال منتج ناقص"}
      </button>
      {open === "create" && modal()}
    </>
  );
}
