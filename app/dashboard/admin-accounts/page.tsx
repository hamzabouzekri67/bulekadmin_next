"use client";

import { useCallback, useEffect, useState } from "react";
import { Ban, CheckCircle2, KeyRound, Loader2, Mail, Search, ShieldCheck, UserPlus, Users, X } from "lucide-react";
import { useUser } from "@/app/context/UserContext";
import { useI18n } from "@/app/context/I18nContext";
import { dashPost, errText } from "@/lib/dashApi";

/*
 * حسابات الأدمين (super_admin): إضافة، إيقاف (طرد فوري)، إعادة تفعيل، كلمة سر مؤقتة.
 * web_backend: /dash/adminAccounts /createAdminAccount /setAdminStatus /setAdminPassword /adminRegions
 */
interface AdminRow {
  id: string;
  userName: string;
  role: string;
  ville: string;
  country: string;
  status: "active" | "suspended";
  email: string | null;
  emailVerified: boolean;
  suspendedAt: string | null;
  suspendReason: string | null;
}
interface Regions {
  countries: { country: string; currency: string; villes: string[] }[];
  roles: string[];
}

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super admin",
  admin: "Admin",
  manager: "Manager",
  agent: "Agent",
  store_owner: "Point de recharge",
};
const input = "w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#e91818]";

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { t } = useI18n();
  const [reg, setReg] = useState<Regions | null>(null);
  const [f, setF] = useState({ userName: "", password: "", role: "admin", country: "", ville: "", email: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    dashPost<Regions>("/dash/adminRegions").then((r) => {
      if (r?.status && r.result) {
        setReg(r.result);
        const c = r.result.countries[0];
        if (c) setF((x) => ({ ...x, country: c.country, ville: c.villes[0] ?? "" }));
      }
    });
  }, []);
  const villes = reg?.countries.find((c) => c.country === f.country)?.villes ?? [];

  async function create() {
    setBusy(true);
    setErr(null);
    const r = await dashPost("/dash/createAdminAccount", { ...f, email: f.email.trim() || undefined });
    setBusy(false);
    if (r?.status) onCreated();
    else setErr(errText(r));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <UserPlus size={20} className="text-[#e91818]" /> {t("admins.new")}
          </h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>
        <label className="block text-sm text-gray-700">
          {t("admins.userName")}
          <input className={input} value={f.userName} onChange={(e) => setF({ ...f, userName: e.target.value })} />
        </label>
        <label className="block text-sm text-gray-700">
          {t("admins.password")}
          <input className={input} type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
          <span className="text-xs text-gray-400">{t("account.passwordRule").split(".")[0]}</span>
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block text-sm text-gray-700">
            {t("admins.role")}
            <select className={input} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>
              {(reg?.roles ?? ["admin"]).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r] ?? r}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-gray-700">
            {t("admins.country")}
            <select
              className={input}
              value={f.country}
              onChange={(e) => {
                const c = reg?.countries.find((x) => x.country === e.target.value);
                setF({ ...f, country: e.target.value, ville: c?.villes[0] ?? "" });
              }}
            >
              {reg?.countries.map((c) => (
                <option key={c.country} value={c.country}>
                  {c.country}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-gray-700">
            {t("admins.ville")}
            <select className={input} value={f.ville} onChange={(e) => setF({ ...f, ville: e.target.value })}>
              {villes.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block text-sm text-gray-700">
          {t("admins.emailOptional")}
          <input className={input} type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        </label>
        {f.role === "super_admin" && (
          <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">⚠️ Super admin : accès total au tableau de bord et à l&apos;argent · صلاحيات كاملة</p>
        )}
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button
          onClick={create}
          disabled={busy || !f.userName || !f.password || !f.ville}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#e91818] py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-40"
        >
          {busy && <Loader2 size={16} className="animate-spin" />} {t("admins.create")}
        </button>
      </div>
    </div>
  );
}

function Row({ a, isMe, onChanged }: { a: AdminRow; isMe: boolean; onChanged: () => void }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function setStatus(status: "active" | "suspended") {
    let reason: string | null = "";
    if (status === "suspended") {
      if (!confirm(t("admins.suspendConfirm"))) return;
      reason = prompt(t("admins.suspendReason")) ?? "";
    }
    setBusy(true);
    const r = await dashPost("/dash/setAdminStatus", { id: a.id, status, reason });
    setBusy(false);
    if (r?.status) onChanged();
    else setMsg({ ok: false, text: errText(r) });
  }
  async function tempPassword() {
    const p = prompt(`${t("admins.tempPassword")} — ${a.userName}\n${t("account.passwordRule").split(".")[0]}`);
    if (!p) return;
    setBusy(true);
    const r = await dashPost("/dash/setAdminPassword", { id: a.id, password: p });
    setBusy(false);
    setMsg(r?.status ? { ok: true, text: t("common.saved") } : { ok: false, text: errText(r) });
  }

  return (
    <div className={`flex flex-wrap items-center gap-3 rounded-2xl border bg-white p-4 shadow-sm ${a.status === "suspended" ? "border-red-200 bg-red-50/30" : "border-gray-200"}`}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-bold text-gray-900">{a.userName}</span>
          {isMe && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500">{t("admins.you")}</span>}
          <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-[#b00000]">{ROLE_LABEL[a.role] ?? a.role}</span>
          {a.status === "suspended" && (
            <span className="rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white">{t("admins.suspended")}</span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
          <span>{a.ville}</span>
          {a.email && a.emailVerified ? (
            <span className="inline-flex items-center gap-1 text-green-700">
              <Mail size={12} /> {a.email}
            </span>
          ) : (
            <span className="text-amber-700">{t("admins.noEmail")}</span>
          )}
          {a.status === "suspended" && a.suspendReason && <span className="text-red-600">« {a.suspendReason} »</span>}
        </div>
        {msg && <p className={`mt-1 text-xs ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</p>}
      </div>
      {!isMe && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={tempPassword}
            disabled={busy}
            className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
          >
            <KeyRound size={14} /> {t("admins.tempPassword")}
          </button>
          {a.status === "suspended" ? (
            <button
              onClick={() => setStatus("active")}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-xl bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-40"
            >
              <CheckCircle2 size={14} /> {t("admins.activate")}
            </button>
          ) : (
            <button
              onClick={() => setStatus("suspended")}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-xl bg-[#e91818] px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-40"
            >
              <Ban size={14} /> {t("admins.suspend")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminAccountsPage() {
  const { user } = useUser();
  const { t } = useI18n();
  const [tab, setTab] = useState<"active" | "suspended">("active");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await dashPost<{ admins: AdminRow[] }>("/dash/adminAccounts", { status: tab, q });
    setLoading(false);
    if (r?.status && r.result) {
      setRows(r.result.admins);
      setErr(null);
    } else setErr(errText(r));
  }, [tab, q]);

  useEffect(() => {
    const h = setTimeout(load, 250);
    return () => clearTimeout(h);
  }, [load]);

  if (user && user.role !== "super_admin") return <p className="p-6 text-sm text-gray-500">{errText({ status: false, code: "FORBIDDEN" })}</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <ShieldCheck className="text-[#e91818]" /> {t("admins.title")}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{t("admins.subtitle")}</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#e91818] px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
        >
          <UserPlus size={16} /> {t("admins.new")}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl bg-gray-100 p-1">
          {(["active", "suspended"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setTab(s)}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold ${tab === s ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
            >
              {t(`admins.${s}`)}
            </button>
          ))}
        </div>
        <div className="relative min-w-[200px] flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className={`${input} pl-9`} placeholder={t("common.search")} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {flash && <p className="text-sm text-green-700">{flash}</p>}
      {err && <p className="text-sm text-red-600">{err}</p>}
      {loading ? (
        <p className="text-sm text-gray-400">{t("common.loading")}</p>
      ) : !rows.length ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-sm text-gray-400">
          <Users /> {t("admins.empty")}
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((a) => (
            <Row key={a.id} a={a} isMe={a.id === user?.id} onChanged={load} />
          ))}
        </div>
      )}

      {creating && (
        <CreateModal
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            setFlash(t("admins.created"));
            setTab("active");
            load();
          }}
        />
      )}
    </div>
  );
}
