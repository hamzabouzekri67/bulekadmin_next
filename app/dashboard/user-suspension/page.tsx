"use client";

import { useCallback, useEffect, useState } from "react";
import { Ban, Bike, CheckCircle2, Search, Store, UserX, Users } from "lucide-react";
import { useUser } from "@/app/context/UserContext";
import { useI18n } from "@/app/context/I18nContext";
import { dashPost, errText } from "@/lib/dashApi";

/*
 * إيقاف حسابات السائقين / المحلات / الزبائن (super_admin) — web_backend /dash/searchUsers و /dash/setUserStatus.
 * الموقوف: status "disabled" + كل جلساته في التطبيق ترفض فوراً.
 */
type UserType = "driver" | "store" | "client";
interface UserRow {
  id: string;
  type: UserType;
  name: string;
  phone: string;
  email: string | null;
  ville: string | null;
  status: string | null;
  suspended: boolean;
  suspendReason: string | null;
}

const TYPES: { key: UserType; label: string; icon: React.ReactNode }[] = [
  { key: "driver", label: "users.drivers", icon: <Bike size={16} /> },
  { key: "store", label: "users.stores", icon: <Store size={16} /> },
  { key: "client", label: "users.clients", icon: <Users size={16} /> },
];

function Row({ u, onChanged }: { u: UserRow; onChanged: (u: UserRow) => void }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function set(status: "active" | "suspended") {
    let reason = "";
    if (status === "suspended") {
      if (!confirm(t("users.suspendConfirm"))) return;
      reason = prompt(t("admins.suspendReason")) ?? "";
    }
    setBusy(true);
    setErr(null);
    const r = await dashPost<UserRow>("/dash/setUserStatus", { type: u.type, id: u.id, status, reason });
    setBusy(false);
    if (r?.status && r.result) onChanged(r.result);
    else setErr(errText(r));
  }

  return (
    <div className={`flex flex-wrap items-center gap-3 rounded-2xl border bg-white p-4 shadow-sm ${u.suspended ? "border-red-200 bg-red-50/30" : "border-gray-200"}`}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-bold text-gray-900">{u.name || "—"}</span>
          {u.suspended && <span className="rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white">{t("admins.suspended")}</span>}
        </div>
        <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-500">
          <span dir="ltr">{u.phone}</span>
          {u.email && <span>{u.email}</span>}
          {u.ville && <span>{u.ville}</span>}
          {u.suspended && u.suspendReason && <span className="text-red-600">« {u.suspendReason} »</span>}
        </div>
        {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
      </div>
      {u.suspended ? (
        <button
          onClick={() => set("active")}
          disabled={busy}
          className="inline-flex items-center gap-1 rounded-xl bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-40"
        >
          <CheckCircle2 size={14} /> {t("admins.activate")}
        </button>
      ) : (
        <button
          onClick={() => set("suspended")}
          disabled={busy}
          className="inline-flex items-center gap-1 rounded-xl bg-[#e91818] px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-40"
        >
          <Ban size={14} /> {t("admins.suspend")}
        </button>
      )}
    </div>
  );
}

export default function UserSuspensionPage() {
  const { user } = useUser();
  const { t } = useI18n();
  const [type, setType] = useState<UserType>("driver");
  const [q, setQ] = useState("");
  const [suspendedOnly, setSuspendedOnly] = useState(false);
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!q.trim() && !suspendedOnly) {
      setRows([]);
      return;
    }
    setLoading(true);
    const r = await dashPost<{ users: UserRow[] }>("/dash/searchUsers", { type, q, suspendedOnly });
    setLoading(false);
    if (r?.status && r.result) {
      setRows(r.result.users);
      setErr(null);
    } else setErr(errText(r));
  }, [type, q, suspendedOnly]);

  useEffect(() => {
    const h = setTimeout(load, 300);
    return () => clearTimeout(h);
  }, [load]);

  if (user && user.role !== "super_admin") return <p className="p-6 text-sm text-gray-500">{errText({ status: false, code: "FORBIDDEN" })}</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <UserX className="text-[#e91818]" /> {t("users.title")}
        </h1>
        <p className="mt-1 text-sm text-gray-500">{t("users.subtitle")}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl bg-gray-100 p-1">
          {TYPES.map((x) => (
            <button
              key={x.key}
              onClick={() => setType(x.key)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-semibold ${type === x.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
            >
              {x.icon} {t(x.label)}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" className="accent-[#e91818]" checked={suspendedOnly} onChange={(e) => setSuspendedOnly(e.target.checked)} />
          {t("admins.suspended")}
        </label>
      </div>
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#e91818]"
          placeholder={t("users.searchHint")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {err && <p className="text-sm text-red-600">{err}</p>}
      {loading && <p className="text-sm text-gray-400">{t("common.loading")}</p>}
      <div className="space-y-3">
        {rows.map((u) => (
          <Row key={u.id} u={u} onChanged={(n) => setRows((l) => l.map((x) => (x.id === n.id ? n : x)))} />
        ))}
      </div>
    </div>
  );
}
