import { Preferences } from "@capacitor/preferences";

/** طلب POST للوحة (web_backend /dash) مع التوكن. null = فشل الاتصال */
export type DashRes<T> = { status: boolean; code?: string; message?: string; result?: T };

export async function dashPost<T>(path: string, body?: unknown): Promise<DashRes<T> | null> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "";
  if (!base) return null;
  const { value: token } = await Preferences.get({ key: "token" });
  try {
    const res = await fetch(base + path, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body ?? {}),
    });
    return (await res.json()) as DashRes<T>;
  } catch {
    return null;
  }
}

/** رسائل أخطاء الحساب (عربي · فرنسي) */
export const ACCOUNT_ERRORS: Record<string, string> = {
  INVALID_EMAIL: "Adresse e-mail invalide · بريد غير صالح",
  WRONG_PASSWORD: "Mot de passe incorrect · كلمة السر غير صحيحة",
  SAME_EMAIL: "C'est déjà votre e-mail · هذا بريدك الحالي",
  EMAIL_TAKEN: "E-mail déjà utilisé · البريد مستعمل في حساب آخر",
  WAIT_BEFORE_RESEND: "Patientez une minute avant de renvoyer · انتظر دقيقة قبل إعادة الإرسال",
  MAIL_NOT_CONFIGURED: "Envoi d'e-mail non configuré sur le serveur · البريد غير مُعدّ في الخادم",
  MAIL_FAILED: "Échec de l'envoi de l'e-mail · فشل إرسال البريد",
  CODE_EXPIRED: "Code expiré, demandez-en un nouveau · انتهت صلاحية الكود",
  INVALID_CODE: "Code incorrect · الكود غير صحيح",
  TOO_MANY_ATTEMPTS: "Trop d'essais, demandez un nouveau code · محاولات كثيرة، اطلب كوداً جديداً",
  WEAK_PASSWORD: "8 caractères minimum, avec lettres et chiffres · 8 أحرف على الأقل مع أرقام وحروف",
  INVALID_USERNAME: "Nom d'utilisateur invalide (3–50) · اسم مستخدم غير صالح",
  USERNAME_TAKEN: "Nom d'utilisateur déjà pris · اسم المستخدم موجود",
  INVALID_ROLE: "Rôle invalide · دور غير صالح",
  INVALID_COUNTRY: "Pays invalide · دولة غير صالحة",
  INVALID_VILLE: "Ville invalide · مدينة غير صالحة",
  CANNOT_CHANGE_SELF: "Impossible sur votre propre compte · لا يمكن على حسابك",
  NOT_FOUND: "Compte introuvable · الحساب غير موجود",
  FORBIDDEN: "Réservé au super administrateur · للمسؤول الأعلى فقط",
  NOTHING_TO_SAVE: "Rien à enregistrer",
};

export const errText = (r: DashRes<unknown> | null) =>
  (r?.code && ACCOUNT_ERRORS[r.code]) || (r ? "Erreur" : "Erreur de connexion · فشل الاتصال");
