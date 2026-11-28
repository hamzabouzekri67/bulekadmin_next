/**
 * طبقة ترجمة تلقائية لمحتوى الصفحات (lib/i18n/dict.ts).
 *
 * تبدّل قيمة النصوص المعروضة (nodeValue) وخصائص placeholder / title / aria-label / alt
 * فقط — لا تحذف ولا تستبدل عناصر، فلا تتعارض مع React (يعيد كتابة النص عند التحديث ثم نترجمه مجدداً).
 * تشمل أيضاً رسائل alert / confirm / prompt.
 */
import { lookup, type Lang } from "../i18n";

const ATTRS = ["placeholder", "title", "aria-label", "alt"];
const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "TEXTAREA", "CODE", "PRE", "NOSCRIPT"]);

function translateValue(raw: string, lang: Lang): string | null {
  const trimmed = raw.trim();
  if (!trimmed || !/[A-Za-zÀ-ÿ؀-ۿ]/.test(trimmed)) return null;
  const t = lookup(trimmed, lang);
  if (t === undefined || t === trimmed) return null;
  // الإبقاء على المسافات حول النص (مهمة بين المتغيرات في JSX)
  const lead = raw.slice(0, raw.indexOf(trimmed[0]));
  const trail = raw.slice(raw.lastIndexOf(trimmed[trimmed.length - 1]) + 1);
  return lead + t + trail;
}

function skip(el: Element | null): boolean {
  for (let e = el; e; e = e.parentElement) {
    if (SKIP_TAGS.has(e.tagName) || (e as HTMLElement).isContentEditable || e.hasAttribute("data-no-translate")) return true;
  }
  return false;
}

// ما كتبناه نحن (لا نترجمه مرة ثانية — يمنع أي حلقة)
const written = new WeakMap<Node, string>();

function translateText(node: Text, lang: Lang) {
  if (written.get(node) === node.nodeValue) return;
  if (skip(node.parentElement)) return;
  const v = translateValue(node.nodeValue ?? "", lang);
  if (v !== null) {
    written.set(node, v);
    node.nodeValue = v;
  }
}

function translateAttrs(el: Element, lang: Lang) {
  if (skip(el)) return;
  for (const a of ATTRS) {
    const cur = el.getAttribute(a);
    if (cur) {
      const v = translateValue(cur, lang);
      if (v !== null) el.setAttribute(a, v);
    }
  }
}

function walk(root: Node, lang: Lang) {
  if (root.nodeType === Node.TEXT_NODE) return translateText(root as Text, lang);
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  translateAttrs(root as Element, lang);
  const w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    if (n.nodeType === Node.TEXT_NODE) translateText(n as Text, lang);
    else translateAttrs(n as Element, lang);
  }
}

/** يبدأ الترجمة التلقائية؛ يُرجع دالة الإيقاف */
export function startDomTranslation(lang: Lang): () => void {
  if (typeof document === "undefined") return () => undefined;
  walk(document.body, lang);
  const obs = new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === "characterData") translateText(r.target as Text, lang);
      else if (r.type === "attributes") translateAttrs(r.target as Element, lang);
      else r.addedNodes.forEach((n) => walk(n, lang));
    }
  });
  obs.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ATTRS,
  });

  // رسائل المتصفح
  const w = window as Window & typeof globalThis;
  const { alert, confirm, prompt } = w;
  const msg = (m: unknown) => {
    const s = String(m ?? "");
    return lookup(s, lang) ?? s.split("\n").map((l) => lookup(l, lang) ?? l).join("\n");
  };
  w.alert = (m?: unknown) => alert.call(w, msg(m));
  w.confirm = (m?: string) => confirm.call(w, msg(m));
  w.prompt = (m?: string, d?: string) => prompt.call(w, msg(m), d);

  return () => {
    obs.disconnect();
    w.alert = alert;
    w.confirm = confirm;
    w.prompt = prompt;
  };
}
