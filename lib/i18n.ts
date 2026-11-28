/**
 * ترجمة محتوى صفحات اللوحة (عربي / فرنسي).
 *
 * القاموس lib/i18n/dict.ts: كل نص كما هو في الصفحات → [فرنسي، عربي].
 * - lib/i18n/dom.ts يترجم النصوص المعروضة تلقائياً (كل الصفحات، بلا تعديل في كودها).
 * - tr("...") للنصوص التي تُبنى في الكود (رسائل، قوالب): tr("{n} magasin(s)", { n: 3 }).
 * نص غير موجود في القاموس يبقى كما هو.
 */
import { UI_DICT } from "./i18n/dict";

export type Lang = "fr" | "ar";

let current: Lang = "fr";

export function setCurrentLang(l: Lang) {
  current = l;
}
export function currentLang(): Lang {
  return current;
}

const norm = (s: string) => s.replace(/\s+/g, " ").trim();

/** ترجمة نص كامل حسب اللغة الحالية، أو undefined إن لم يكن في القاموس */
export function lookup(text: string, lang: Lang = current): string | undefined {
  const e = UI_DICT[norm(text)];
  return e ? e[lang === "ar" ? 1 : 0] : undefined;
}

export function tr(text: string, vars?: Record<string, string | number | null | undefined>): string {
  let s = lookup(text) ?? text;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(v == null ? "" : String(v));
  }
  return s;
}
