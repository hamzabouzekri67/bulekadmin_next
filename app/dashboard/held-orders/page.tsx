"use client";

import { useCallback, useEffect, useState } from "react";
import { Preferences } from "@capacitor/preferences";
import { Ban, Clock, MapPin, Phone, Send, ShieldAlert, Smartphone, Wallet, Settings } from "lucide-react";
import { useUser } from "@/app/context/UserContext";
import { useSocket } from "@/app/context/SocketProvider";

/*
 * الطلبيات المشكوك فيها (web_backend /heldOrders):
 * طلبية ثانية من نفس الزبون في نفس المطعم، أو حساب آخر بنفس السعر + نفس الجهاز/العنوان/الهاتف.
 * لا يراها المطعم ولا السائقون حتى تقرر هنا. بلا قرار خلال المهلة → تُلغى تلقائياً.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

interface OrderView {
  _id: string;
  TrackingId?: string;
  status: string;
  createdAt?: string;
  grandTotal?: number;
  currency?: string;
  client: { _id: string; name: string; phone: string };
  driver: string | null;
  items: { name: string; qty: number; total: number }[];
}
interface HeldOrder extends OrderView {
  ville: string;
  store: string;
  reason: "SAME_CLIENT" | "OTHER_CLIENT";
  signals: string[];
  heldAt?: string;
  heldExpiresAt?: string;
  match: OrderView | null;
}
interface Config {
  enabled: boolean;
  windowMin: number;
  timeoutMin: number;
  otherClient: { enabled: boolean; device: boolean; location: boolean; phone: boolean; radiusM: number };
}

const ERRORS: Record<string, string> = {
  FORBIDDEN: "Accès refusé",
  NOT_HELD: "Commande déjà traitée",
  ORDER_NOT_FOUND: "Commande introuvable",
  INVALID_ORDER: "Commande invalide",
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

function beep() {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new Ctx();
    [0, 0.25].forEach((t) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.25, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.2);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 0.2);
    });
  } catch {
    /* navigateur sans audio */
  }
}

const SIGNALS: Record<string, { label: string; icon: React.ReactNode }> = {
  TOTAL: { label: "Même total", icon: <Wallet size={12} /> },
  DEVICE: { label: "Même téléphone (appareil)", icon: <Smartphone size={12} /> },
  LOCATION: { label: "Même adresse", icon: <MapPin size={12} /> },
  PHONE: { label: "Même numéro", icon: <Phone size={12} /> },
};

const money = (v?: number, cur?: string) => `${Math.round(v ?? 0).toLocaleString("fr-FR")} ${cur ?? "DA"}`;
const hhmm = (d?: string) => (d ? new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "—");
const STATUS: Record<string, string> = {
  pending: "En attente",
  prepare: "En préparation",
  delivery: "En livraison",
  completed: "Livrée",
  rejected: "Annulée",
  held: "Suspecte",
};

function Countdown({ until, now }: { until?: string; now: number }) {
  if (!until) return null;
  const left = Math.max(0, new Date(until).getTime() - now);
  const m = Math.floor(left / 60000);
  const s = Math.floor((left % 60000) / 1000);
  const urgent = left < 60_000;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
        urgent ? "animate-pulse bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"
      }`}
    >
      <Clock size={12} /> {left === 0 ? "Annulation…" : `${m}:${String(s).padStart(2, "0")}`}
    </span>
  );
}

function OrderBox({ title, o, highlight }: { title: string; o: OrderView | null; highlight?: boolean }) {
  if (!o) return <div className="rounded-xl border border-dashed border-gray-200 p-3 text-xs text-gray-400">Commande introuvable</div>;
  return (
    <div className={`space-y-2 rounded-xl border p-3 ${highlight ? "border-[#e91818]/40 bg-red-50/40" : "border-gray-200 bg-gray-50/60"}`}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-gray-700">{title}</span>
        <span className="rounded-full bg-white px-2 py-0.5 text-gray-500 shadow-sm">
          {STATUS[o.status] ?? o.status} · {hhmm(o.createdAt)}
        </span>
      </div>
      <div className="text-sm">
        <div className="font-semibold text-gray-900">{o.client.name || "Client"}</div>
        <div className="text-xs text-gray-500" dir="ltr">
          {o.client.phone}
        </div>
      </div>
      <ul className="space-y-0.5 text-xs text-gray-700">
        {o.items.map((it, i) => (
          <li key={i} className="flex justify-between gap-2">
            <span className="truncate">
              {it.qty} × {it.name}
            </span>
            <span className="shrink-0 text-gray-500">{money(it.total, o.currency)}</span>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between border-t border-gray-200 pt-2 text-sm">
        <span className="text-gray-500">#{o.TrackingId}</span>
        <span className="font-black text-gray-900">{money(o.grandTotal, o.currency)}</span>
      </div>
      {o.driver && <div className="text-xs text-gray-500">🛵 {o.driver}</div>}
    </div>
  );
}

function HeldCard({ h, now, onDone }: { h: HeldOrder; now: number; onDone: (id: string) => void }) {
  const [busy, setBusy] = useState<"send" | "cancel" | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function act(action: "send" | "cancel") {
    if (action === "cancel" && !confirm("Annuler cette commande ? Le client sera notifié et remboursé (portefeuille).")) return;
    setBusy(action);
    setErr(null);
    const r = await post<Res<unknown>>("/dash/resolveHeldOrder", { orderId: h._id, action });
    setBusy(null);
    if (r?.status) onDone(h._id);
    else setErr((r?.code && ERRORS[r.code]) || "Erreur de connexion");
  }

  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-base font-bold text-gray-900">
            <ShieldAlert size={18} className="text-[#e91818]" /> {h.store}
            <span className="text-xs font-normal text-gray-400">· {h.ville}</span>
          </div>
          <div className="mt-1 text-sm font-semibold text-[#e91818]">
            {h.reason === "SAME_CLIENT"
              ? "Même client · même restaurant (نفس الزبون)"
              : "Autre compte · même commande (حساب آخر)"}
          </div>
        </div>
        <Countdown until={h.heldExpiresAt} now={now} />
      </div>

      {h.signals.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {h.signals.map((s) => (
            <span key={s} className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-[#b00000]">
              {SIGNALS[s]?.icon} {SIGNALS[s]?.label ?? s}
            </span>
          ))}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <OrderBox title="1ère commande (active)" o={h.match} />
        <OrderBox title="Nouvelle commande (bloquée)" o={h} highlight />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => act("send")}
          disabled={!!busy}
          className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-40"
        >
          <Send size={16} /> {busy === "send" ? "..." : "Envoyer (إرسال)"}
        </button>
        <button
          onClick={() => act("cancel")}
          disabled={!!busy}
          className="inline-flex items-center gap-2 rounded-xl bg-[#e91818] px-5 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-40"
        >
          <Ban size={16} /> {busy === "cancel" ? "..." : "Annuler (إلغاء)"}
        </button>
        {err && <span className="text-sm text-red-600">{err}</span>}
      </div>
    </div>
  );
}

function Toggle({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-2 text-sm text-gray-800">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 accent-[#e91818]" />
      <span>
        {label}
        {hint && <span className="block text-xs text-gray-500">{hint}</span>}
      </span>
    </label>
  );
}

function SettingsPanel() {
  const [cfg, setCfg] = useState<Config | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    post<Res<Config>>("/dash/suspiciousConfig", {}).then((r) => r?.status && r.result && setCfg(r.result));
  }, []);
  if (!cfg) return null;
  const oc = cfg.otherClient;
  const set = (p: Partial<Config>) => setCfg({ ...cfg, ...p });
  const setOc = (p: Partial<Config["otherClient"]>) => setCfg({ ...cfg, otherClient: { ...oc, ...p } });

  async function save() {
    setSaving(true);
    setMsg(null);
    const r = await post<Res<Config>>("/dash/saveSuspiciousConfig", cfg);
    setSaving(false);
    if (r?.status && r.result) {
      setCfg(r.result);
      setMsg({ ok: true, text: "Enregistré ✓ (actif en ~30 s)" });
    } else setMsg({ ok: false, text: (r?.code && ERRORS[r.code]) || "Erreur de connexion" });
  }

  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 font-bold text-gray-900">
        <Settings size={18} className="text-[#e91818]" /> Réglages
      </div>
      <Toggle label="Activer la détection des commandes suspectes" checked={cfg.enabled} onChange={(v) => set({ enabled: v })} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-gray-700">
          Fenêtre (minutes) — 1ère commande créée depuis moins de
          <input
            type="number"
            min={5}
            max={180}
            value={cfg.windowMin}
            onChange={(e) => set({ windowMin: Number(e.target.value) })}
            className="mt-1 block w-28 rounded-lg border border-gray-200 px-2 py-1.5"
          />
        </label>
        <label className="text-sm text-gray-700">
          Délai de décision (minutes) — sinon annulation automatique
          <input
            type="number"
            min={1}
            max={60}
            value={cfg.timeoutMin}
            onChange={(e) => set({ timeoutMin: Number(e.target.value) })}
            className="mt-1 block w-28 rounded-lg border border-gray-200 px-2 py-1.5"
          />
        </label>
      </div>
      <div className="space-y-2 rounded-xl bg-gray-50 p-4">
        <Toggle
          label="Autre compte, même commande"
          hint="Même total + au moins une preuve ci-dessous. Le total seul ne suffit jamais."
          checked={oc.enabled}
          onChange={(v) => setOc({ enabled: v })}
        />
        <div className={`space-y-2 ps-6 ${oc.enabled ? "" : "pointer-events-none opacity-40"}`}>
          <Toggle label="Même téléphone (appareil)" checked={oc.device} onChange={(v) => setOc({ device: v })} />
          <Toggle label="Même numéro de téléphone" checked={oc.phone} onChange={(v) => setOc({ phone: v })} />
          <div className="flex flex-wrap items-center gap-2">
            <Toggle label="Même adresse, à moins de" checked={oc.location} onChange={(v) => setOc({ location: v })} />
            <input
              type="number"
              min={10}
              max={500}
              value={oc.radiusM}
              onChange={(e) => setOc({ radiusM: Number(e.target.value) })}
              className="w-20 rounded-lg border border-gray-200 px-2 py-1 text-sm"
            />
            <span className="text-sm text-gray-600">m</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-xl bg-[#e91818] px-5 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-40"
        >
          {saving ? "..." : "Enregistrer"}
        </button>
        {msg && <span className={`text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</span>}
      </div>
    </div>
  );
}

export default function HeldOrdersPage() {
  const { user } = useUser();
  const { socket, ready } = useSocket();
  const [orders, setOrders] = useState<HeldOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    const r = await post<Res<{ orders: HeldOrder[] }>>("/dash/heldOrders", {});
    setLoading(false);
    if (r?.status && r.result) {
      setOrders(r.result.orders);
      setErr(null);
    } else setErr((r?.code && ERRORS[r.code]) || "Erreur de connexion");
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000); // filet de sécurité si le socket est coupé
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // expirées → recharger (le worker les annule)
  useEffect(() => {
    if (orders.some((o) => o.heldExpiresAt && new Date(o.heldExpiresAt).getTime() + 3000 < now)) load();
  }, [now, orders, load]);

  useEffect(() => {
    if (!ready || !socket) return;
    // «الصوت في لوحة التحكم» من حسابي (notificationPrefs.sound)
    const soundOn = (user as { notificationPrefs?: Record<string, boolean> } | null)?.notificationPrefs?.sound !== false;
    const onNew = () => {
      if (soundOn) beep();
      load();
    };
    const onResolved = (e: { orderId?: string }) => setOrders((l) => l.filter((o) => o._id !== e?.orderId));
    socket.on("held_order", onNew);
    socket.on("held_order_resolved", onResolved);
    return () => {
      socket.off("held_order", onNew);
      socket.off("held_order_resolved", onResolved);
    };
  }, [ready, socket, load, user]);

  if (user && user.role !== "super_admin" && user.role !== "admin") {
    return <p className="p-6 text-sm text-gray-500">Accès refusé.</p>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <ShieldAlert className="text-[#e91818]" /> Commandes suspectes · طلبيات مشكوك فيها
          {orders.length > 0 && (
            <span className="rounded-full bg-[#e91818] px-2.5 py-0.5 text-sm font-bold text-white">{orders.length}</span>
          )}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Ni le restaurant ni les livreurs ne voient ces commandes tant que vous n&apos;avez pas décidé. Sans décision
          avant la fin du délai, la commande est annulée et le client remboursé (portefeuille).
        </p>
      </div>

      {err && <p className="text-sm text-red-600">{err}</p>}
      {loading ? (
        <p className="text-sm text-gray-400">Chargement…</p>
      ) : !orders.length ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-400">
          Aucune commande suspecte en attente ✓
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((h) => (
            <HeldCard key={h._id} h={h} now={now} onDone={(id) => setOrders((l) => l.filter((o) => o._id !== id))} />
          ))}
        </div>
      )}

      {user?.role === "super_admin" && <SettingsPanel />}
    </div>
  );
}
