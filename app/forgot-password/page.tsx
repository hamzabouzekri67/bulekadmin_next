"use client";

import { useState } from "react";
import { ArrowLeft, KeyRound, Loader2, Mail, ShieldCheck } from "lucide-react";
import { dashPost, errText } from "@/lib/dashApi";

/*
 * استرجاع حساب الأدمين: كود 6 أرقام يُرسل للبريد المُتحقَّق منه، ثم كلمة سر جديدة.
 * (web_backend /dash/auth/forgotPassword و /dash/auth/resetPassword — بلا توكن)
 */
export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function sendCode() {
    setBusy(true);
    setErr(null);
    const r = await dashPost("/dash/auth/forgotPassword", { identifier: identifier.trim() });
    setBusy(false);
    if (r?.status) setStep(2);
    else setErr(errText(r));
  }

  async function reset() {
    if (password !== confirm) return setErr("Les mots de passe ne correspondent pas · كلمتا السر غير متطابقتين");
    setBusy(true);
    setErr(null);
    const r = await dashPost("/dash/auth/resetPassword", { identifier: identifier.trim(), code: code.trim(), password });
    setBusy(false);
    if (r?.status) setStep(3);
    else setErr(errText(r));
  }

  const input =
    "w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-slate-100 focus:bg-white outline-none text-sm md:text-base";
  const btn =
    "w-full py-4 rounded-2xl text-white font-black text-sm md:text-base flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] p-4">
      <div className="w-full max-w-lg bg-white rounded-[2.5rem] border border-slate-100 p-8 md:p-10 shadow-[0_30px_60px_rgba(0,0,0,0.04)] space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <KeyRound />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Récupérer le compte</h1>
          <p className="text-sm text-slate-500">استرجاع حساب لوحة التحكم</p>
        </div>

        {step === 1 && (
          <>
            <p className="text-sm text-slate-600">
              Saisissez votre nom d&apos;utilisateur ou votre e-mail. Un code sera envoyé à l&apos;e-mail vérifié du compte.
              <br />
              أدخل اسم المستخدم أو البريد، وسيصلك كود على البريد المُتحقَّق منه.
            </p>
            <input className={input} value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="admin@bulekeats.com" />
            <button className={btn} disabled={busy || identifier.trim().length < 3} onClick={sendCode}>
              {busy ? <Loader2 className="animate-spin" size={18} /> : <Mail size={18} />} Envoyer le code · إرسال الكود
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
              Si ce compte a un e-mail vérifié, un code à 6 chiffres vient d&apos;y être envoyé (valable 10 minutes).
              <br />
              إن كان للحساب بريد مُتحقَّق منه فقد أُرسل إليه كود من 6 أرقام (صالح 10 دقائق). إن لم يصلك شيء، اطلب من المسؤول الأعلى كلمة سر مؤقتة.
            </p>
            <input
              className={`${input} text-center text-2xl font-black tracking-[0.5em]`}
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
            />
            <input className={input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nouveau mot de passe · كلمة السر الجديدة" />
            <input className={input} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirmer · تأكيد" />
            <p className="text-xs text-slate-400">8 caractères minimum, lettres et chiffres · 8 أحرف على الأقل مع أرقام وحروف</p>
            <button className={btn} disabled={busy || code.length !== 6 || !password} onClick={reset}>
              {busy ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />} Changer le mot de passe · تغيير كلمة السر
            </button>
            <button className="w-full text-sm text-slate-500 hover:underline" onClick={() => setStep(1)}>
              Renvoyer un code · إعادة إرسال الكود
            </button>
          </>
        )}

        {step === 3 && (
          <div className="space-y-4 text-center">
            <p className="rounded-2xl bg-green-50 p-4 text-sm font-semibold text-green-700">
              Mot de passe modifié ✓ Toutes les anciennes sessions ont été déconnectées.
              <br />
              تم تغيير كلمة السر ✓ وأُغلقت كل الجلسات القديمة.
            </p>
          </div>
        )}

        {err && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{err}</p>}

        <a href="/login" className="flex items-center justify-center gap-2 text-sm font-semibold text-red-600 hover:underline">
          <ArrowLeft size={16} /> Retour à la connexion · العودة لتسجيل الدخول
        </a>
      </div>
    </div>
  );
}
