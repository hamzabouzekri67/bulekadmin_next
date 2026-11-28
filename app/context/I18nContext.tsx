"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { useUser } from "./UserContext";
import { DICT, type Lang } from "./i18n.dict";
import { setCurrentLang, tr } from "@/lib/i18n";
import { startDomTranslation } from "@/lib/i18n/dom";

/*
 * لغة واجهة اللوحة (عربي / فرنسي) — يحفظها كل أدمين في حسابه (admin.uiLang) + localStorage.
 * t("account.title") ← DICT؛ مفتاح ناقص → الفرنسية ثم المفتاح نفسه.
 * التخطيط يبقى LTR (القائمة الجانبية ثابتة يساراً)؛ النصوص تُعرض بالعربية.
 */
type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (key: string) => string; tr: typeof tr };
const I18nContext = createContext<Ctx>({ lang: "fr", setLang: () => undefined, t: (k) => k, tr });

const STORAGE_KEY = "bulek_admin_lang";

export function I18nProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [lang, setLangState] = useState<Lang>("fr");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "ar" || saved === "fr") setLangState(saved);
    } catch {
      /* stockage indisponible */
    }
  }, []);

  // لغة الحساب (من /dash/me) تغلب
  const accountLang = (user as { uiLang?: string } | null)?.uiLang;
  useEffect(() => {
    if (accountLang === "ar" || accountLang === "fr") setLangState(accountLang);
  }, [accountLang]);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* stockage indisponible */
    }
  }, [lang]);

  // ترجمة محتوى كل الصفحات تلقائياً (lib/i18n/dom.ts)
  useEffect(() => startDomTranslation(lang), [lang]);

  const t = useCallback((key: string) => DICT[lang][key] ?? DICT.fr[key] ?? key, [lang]);
  // tr() يقرأ اللغة من lib/i18n — تُضبط قبل رسم الأبناء
  setCurrentLang(lang);

  // key={lang}: تغيير اللغة يعيد رسم كل الصفحات (حتى التي لا تستعمل السياق)
  return (
    <I18nContext.Provider value={{ lang, setLang: setLangState, t, tr }}>
      <div key={lang} className="contents">
        {children}
      </div>
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);
