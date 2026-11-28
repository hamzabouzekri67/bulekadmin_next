"use client";

import { useEffect, useState } from "react";
import { Preferences } from "@capacitor/preferences";
import { Bell, CheckCircle2, KeyRound, Languages, Loader2, Mail, ShieldAlert, UserCircle2 } from "lucide-react";
import { dashPost, errText } from "@/lib/dashApi";
import { useI18n } from "@/app/context/I18nContext";
import { useUser } from "@/app/context/UserContext";

/*
 * حسابي (كل أدمين): البريد (بكود تحقق)، كلمة السر، الإشعارات، لغة اللوحة.
 * web_backend: /dash/account/*
 */

type Prefs = Record<string, boolean>;
interface Account {
  userName: string;
  email: string | null;
  emailVerified: boolean;
  role: string;
  ville: string;
  notificationPrefs: Prefs;
  uiLang: "ar" | "fr";
}

const NOTIF_TYPES: { key: string; fr: string; ar: string }[] = [
  { key: "new_order", fr: "Nouvelle commande et rappels", ar: "طلبية جديدة والتذكيرات" },
  { key: "held_order", fr: "Commande suspecte", ar: "طلبية مشكوك فيها" },
  { key: "order_cancelled", fr: "Commande annulée (délai dépassé)", ar: "إلغاء طلبية (انتهاء المهلة)" },
  { key: "driver_accepted", fr: "Un livreur a accepté une commande", ar: "سائق قبل طلبية" },
  { key: "wallet", fr: "Solde rechargé", ar: "شحن الرصيد" },
];

const card = "space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm";
const input = "w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#e91818]";
const btn = "inline-flex items-center gap-2 rounded-xl bg-[#e91818] px-5 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-40";

function Msg({ m }: { m: { ok: boolean; text: string } | null }) {
  if (!m) return null;
  return <p className={`text-sm ${m.ok ? "text-green-700" : "text-red-600"}`}>{m.text}</p>;
}

function EmailSection({ acc, onChange }: { acc: Account; onChange: (a: Partial<Account>) => void }) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(!acc.email || !acc.emailVerified);
  const [email, setEmail] = useState(acc.email ?? "");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function send() {
    setBusy(true);
    setMsg(null);
    const r = await dashPost<{ sentTo: string }>("/dash/account/requestEmailChange", { email: email.trim(), password });
    setBusy(false);
    if (r?.status) {
      setSentTo(r.result?.sentTo ?? email);
      setMsg({ ok: true, text: t("account.codeSent") });
    } else setMsg({ ok: false, text: errText(r) });
  }
  async function confirm() {
    setBusy(true);
    setMsg(null);
    const r = await dashPost<{ email: string }>("/dash/account/confirmEmailChange", { code });
    setBusy(false);
    if (r?.status && r.result) {
      onChange({ email: r.result.email, emailVerified: true });
      setEditing(false);
      setSentTo(null);
      setCode("");
      setPassword("");
      setMsg({ ok: true, text: t("account.emailVerified") });
    } else setMsg({ ok: false, text: errText(r) });
  }

  return (
    <div className={card}>
      <div className="flex items-center gap-2 font-bold text-gray-900">
        <Mail size={18} className="text-[#e91818]" /> {t("account.email")}
      </div>
      {acc.email && acc.emailVerified ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-semibold">{acc.email}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
            <CheckCircle2 size={12} /> {t("account.verified")}
          </span>
        </div>
      ) : (
        <p className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          <ShieldAlert size={16} className="mt-0.5 shrink-0" /> {t("account.noEmailWarning")}
        </p>
      )}

      {!editing ? (
        <button className="text-sm font-semibold text-[#e91818] hover:underline" onClick={() => setEditing(true)}>
          {t("account.changeEmail")}
        </button>
      ) : !sentTo ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <input className={input} type="email" placeholder={t("account.newEmail")} value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className={input} type="password" placeholder={t("account.currentPassword")} value={password} onChange={(e) => setPassword(e.target.value)} />
          <div className="sm:col-span-2">
            <button className={btn} disabled={busy || !email || !password} onClick={send}>
              {busy && <Loader2 size={16} className="animate-spin" />} {t("account.sendCode")}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            {t("account.enterCode")} <b dir="ltr">{sentTo}</b>
          </p>
          <div className="flex flex-wrap gap-3">
            <input
              className={`${input} w-40 text-center text-xl font-black tracking-[0.4em]`}
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
            />
            <button className={btn} disabled={busy || code.length !== 6} onClick={confirm}>
              {busy && <Loader2 size={16} className="animate-spin" />} {t("account.confirm")}
            </button>
            <button className="text-sm text-gray-500 hover:underline" onClick={() => setSentTo(null)}>
              {t("account.resend")}
            </button>
          </div>
        </div>
      )}
      <Msg m={msg} />
    </div>
  );
}

function PasswordSection() {
  const { t } = useI18n();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save() {
    if (next !== confirm) return setMsg({ ok: false, text: t("account.mismatch") });
    setBusy(true);
    setMsg(null);
    const r = await dashPost<{ token: string }>("/dash/account/changePassword", { current, next });
    setBusy(false);
    if (r?.status && r.result?.token) {
      // الجلسات الأخرى سقطت؛ هذه الجلسة تأخذ توكناً جديداً
      await Preferences.set({ key: "token", value: r.result.token });
      setCurrent("");
      setNext("");
      setConfirm("");
      setMsg({ ok: true, text: t("account.passwordChanged") });
    } else setMsg({ ok: false, text: errText(r) });
  }

  return (
    <div className={card}>
      <div className="flex items-center gap-2 font-bold text-gray-900">
        <KeyRound size={18} className="text-[#e91818]" /> {t("account.password")}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <input className={input} type="password" placeholder={t("account.currentPassword")} value={current} onChange={(e) => setCurrent(e.target.value)} />
        <input className={input} type="password" placeholder={t("account.newPassword")} value={next} onChange={(e) => setNext(e.target.value)} />
        <input className={input} type="password" placeholder={t("account.confirmPassword")} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </div>
      <p className="text-xs text-gray-400">{t("account.passwordRule")}</p>
      <button className={btn} disabled={busy || !current || !next} onClick={save}>
        {busy && <Loader2 size={16} className="animate-spin" />} {t("common.save")}
      </button>
      <Msg m={msg} />
    </div>
  );
}

function PreferencesSection({ acc, onChange }: { acc: Account; onChange: (a: Partial<Account>) => void }) {
  const { t, lang, setLang } = useI18n();
  const { refreshUser } = useUser();
  const [prefs, setPrefs] = useState<Prefs>(acc.notificationPrefs);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save() {
    setBusy(true);
    setMsg(null);
    const r = await dashPost("/dash/account/preferences", { notificationPrefs: prefs });
    setBusy(false);
    if (r?.status) {
      onChange({ notificationPrefs: prefs });
      refreshUser(true); // الصوت يُطبَّق فوراً في الصفحات المفتوحة
      setMsg({ ok: true, text: t("common.saved") });
    } else setMsg({ ok: false, text: errText(r) });
  }

  async function changeLang(l: "ar" | "fr") {
    setLang(l);
    onChange({ uiLang: l });
    await dashPost("/dash/account/preferences", { uiLang: l });
    refreshUser(true);
  }

  return (
    <>
      <div className={card}>
        <div className="flex items-center gap-2 font-bold text-gray-900">
          <Bell size={18} className="text-[#e91818]" /> {t("account.notifications")}
        </div>
        <p className="text-sm text-gray-500">{t("account.notificationsHint")}</p>
        <div className="space-y-2">
          {NOTIF_TYPES.map((n) => (
            <label key={n.key} className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-gray-100 px-3 py-2.5 text-sm hover:bg-gray-50">
              <span>{lang === "ar" ? n.ar : n.fr}</span>
              <input
                type="checkbox"
                className="h-4 w-4 accent-[#e91818]"
                checked={prefs[n.key] !== false}
                onChange={(e) => setPrefs({ ...prefs, [n.key]: e.target.checked })}
              />
            </label>
          ))}
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-gray-100 px-3 py-2.5 text-sm hover:bg-gray-50">
            <span>{t("account.sound")}</span>
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#e91818]"
              checked={prefs.sound !== false}
              onChange={(e) => setPrefs({ ...prefs, sound: e.target.checked })}
            />
          </label>
        </div>
        <button className={btn} disabled={busy} onClick={save}>
          {busy && <Loader2 size={16} className="animate-spin" />} {t("common.save")}
        </button>
        <Msg m={msg} />
      </div>

      <div className={card}>
        <div className="flex items-center gap-2 font-bold text-gray-900">
          <Languages size={18} className="text-[#e91818]" /> {t("account.language")}
        </div>
        <div className="flex gap-2">
          {(["fr", "ar"] as const).map((l) => (
            <button
              key={l}
              onClick={() => changeLang(l)}
              className={`rounded-xl border px-5 py-2 text-sm font-bold ${
                acc.uiLang === l ? "border-[#e91818] bg-red-50 text-[#e91818]" : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {l === "fr" ? "Français" : "العربية"}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

export default function AccountPage() {
  const { t } = useI18n();
  const [acc, setAcc] = useState<Account | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    dashPost<Account>("/dash/account/me").then((r) => (r?.status && r.result ? setAcc(r.result) : setErr(errText(r))));
  }, []);
  const patch = (p: Partial<Account>) => setAcc((a) => (a ? { ...a, ...p } : a));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <UserCircle2 className="text-[#e91818]" /> {t("account.title")}
        </h1>
        {acc && (
          <p className="mt-1 text-sm text-gray-500">
            {acc.userName} · {acc.role} · {acc.ville}
          </p>
        )}
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      {!acc ? (
        !err && <p className="text-sm text-gray-400">{t("common.loading")}</p>
      ) : (
        <>
          <EmailSection acc={acc} onChange={patch} />
          <PasswordSection />
          <PreferencesSection acc={acc} onChange={patch} />
        </>
      )}
    </div>
  );
}
