"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, HandCoins, Check, AlertCircle, Search, X, Store, SlidersHorizontal } from "lucide-react";
import type { StoreData } from "@/app/types/store";
import { searchandFindStore } from "../featured/api/api_featured";
import {
  getCashbackConfig,
  getStoreCashbackFunding,
  saveCashbackConfig,
  type CashbackConfig,
  type FundingMode,
  type OverrideMode,
  type RuleType,
  type ScopeMode,
  type StoreFundingRow,
  type StoreOverride,
} from "./api/cashback";
import { LANGS, loadLang, saveLang, translator, type Lang, type TKey } from "./i18n";

/*
 * إعدادات الكاش باك (super_admin):
 * - الإعداد العام: النطاق + من يموّل + القيم + الحدود.
 * - تخصيص لكل محل (storeOverrides): وضع تمويل خاص (أو تعطيل) وقيم خاصة، والفارغ يأخذ العام.
 * - نفس القواعد في bulek_backend/service/wallet/cashback.config.ts (resolveStoreCashbackRule).
 */

const EMPTY: CashbackConfig = {
  enabled: false,
  type: "percentage",
  value: 0,
  minOrderAmount: 0,
  maxEarnPerOrder: 0,
  maxUsePerOrder: 0,
  maxWalletBalance: 0,
  expiryDays: 30,
  scopeMode: "ALL_STORES",
  includedStoreIds: [],
  excludedStoreIds: [],
  allowRedeemOutsideScope: true,
  fundingMode: "APP_ONLY",
  storeCashbackType: "percentage",
  storeCashbackValue: 0,
  storeOverrides: [],
  driverCashoutMin: 0,
  driverCashoutMax: 0,
  driverAutoCoverEnabled: false,
  driverAutoCoverMin: 100,
};

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm outline-none focus:border-[#e91818] focus:ring-2 focus:ring-[#e91818]/10 disabled:bg-gray-50 disabled:text-gray-400";

type T = (key: TKey, ...args: (string | number)[]) => string;

/** المحل ضمن النطاق العام؟ (نفس isStoreInScope في الخادم) */
function inScope(cfg: CashbackConfig, id: string) {
  if (cfg.scopeMode === "SELECTED_STORES") return cfg.includedStoreIds.includes(id);
  if (cfg.scopeMode === "EXCLUDED_STORES") return !cfg.excludedStoreIds.includes(id);
  return true;
}

/**
 * الشكل القديم {type, value} بلا mode = قيمة محل فقط تحترم النطاق:
 * خارج النطاق → DISABLED (نفس أثره الفعلي)، وإلا وضع التمويل العام بقيمته.
 */
function normalizeOverrides(cfg: CashbackConfig): StoreOverride[] {
  return (cfg.storeOverrides ?? []).map((o) =>
    o.mode
      ? o
      : {
          storeId: o.storeId,
          mode: inScope(cfg, o.storeId) ? cfg.fundingMode : "DISABLED",
          storeType: o.storeType ?? o.type ?? null,
          storeValue: o.storeValue ?? o.value ?? null,
        },
  );
}

const ruleAmount = (base: number, t: RuleType, v: number) =>
  t === "percentage" ? Math.round((base * (v || 0)) / 100) : Math.round(v || 0);

/** نفس حساب الخادم: السقف يُنقص حصة التطبيق أولاً */
function splitFor(base: number, mode: OverrideMode, cfg: CashbackConfig, o?: StoreOverride) {
  if (mode === "DISABLED" || base < cfg.minOrderAmount) return { app: 0, store: 0 };
  let app =
    mode === "STORE_ONLY" ? 0 : ruleAmount(base, o?.appType ?? cfg.type, o?.appValue ?? cfg.value);
  let store =
    mode === "APP_ONLY"
      ? 0
      : ruleAmount(base, o?.storeType ?? cfg.storeCashbackType, o?.storeValue ?? cfg.storeCashbackValue);
  const cap = o?.maxEarnPerOrder ?? cfg.maxEarnPerOrder;
  if (cap > 0 && app + store > cap) {
    const over = app + store - cap;
    const fromApp = Math.min(app, over);
    app -= fromApp;
    store -= over - fromApp;
  }
  return { app, store };
}

function NumberField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-semibold text-gray-700">{label}</span>
      <input
        type="number"
        min={0}
        className={inputClass}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint && <span className="block text-[11px] text-gray-500">{hint}</span>}
    </label>
  );
}

/** نوع + قيمة (نسبة أو مبلغ ثابت) */
function RuleFields({
  t,
  title,
  type,
  value,
  onType,
  onValue,
}: {
  t: T;
  title: string;
  type: RuleType;
  value: number;
  onType: (t: RuleType) => void;
  onValue: (v: number) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <label className="block space-y-1">
        <span className="text-xs font-semibold text-gray-700">
          {title} — {t("typeLabel")}
        </span>
        <select
          className={inputClass}
          value={type}
          onChange={(e) => onType(e.target.value === "fixed" ? "fixed" : "percentage")}
        >
          <option value="percentage">{t("typePercent")}</option>
          <option value="fixed">{t("typeFixed")}</option>
        </select>
      </label>
      <NumberField
        label={type === "percentage" ? t("percentLabel") : t("amountLabel")}
        hint={type === "percentage" ? t("percentHint") : undefined}
        value={value}
        onChange={onValue}
      />
    </div>
  );
}

/** بحث عن محل (نفس بحث صفحة الإعلانات) */
function StoreSearch({
  t,
  onPick,
  exclude,
  placeholder,
}: {
  t: T;
  onPick: (s: StoreData) => void;
  exclude: string[];
  placeholder?: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<StoreData[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!q.trim()) {
      setRows([]);
      return;
    }
    const timer = setTimeout(async () => {
      setBusy(true);
      try {
        const data = await searchandFindStore(q.trim(), router);
        setRows(Array.isArray(data) ? data : []);
      } catch {
        setRows([]);
      } finally {
        setBusy(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [q, router]);

  const visible = rows.filter((r) => !exclude.includes(r._id)).slice(0, 8);
  return (
    <div className="space-y-2">
      <div className="relative">
        <Search size={16} className="absolute start-3 top-2.5 text-gray-400" />
        <input
          className={`${inputClass} ps-9`}
          placeholder={placeholder ?? t("searchStore")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      {busy && <Loader2 className="animate-spin text-gray-400" size={16} />}
      {visible.length > 0 && (
        <div className="border border-gray-100 rounded-lg divide-y max-h-56 overflow-auto">
          {visible.map((s) => (
            <button
              key={s._id}
              type="button"
              onClick={() => {
                onPick(s);
                setQ("");
                setRows([]);
              }}
              className="w-full text-start px-3 py-2 text-sm hover:bg-red-50"
            >
              {s.nameEtabliss}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** حقل قيمة اختيارية: فارغ = يأخذ القيمة العامة (placeholder) */
function OptionalNumber({
  value,
  placeholder,
  disabled,
  onChange,
}: {
  value: number | null | undefined;
  placeholder: string;
  disabled?: boolean;
  onChange: (v: number | null) => void;
}) {
  return (
    <input
      type="number"
      min={0}
      disabled={disabled}
      className={`${inputClass} w-24`}
      placeholder={placeholder}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
    />
  );
}

/** نوع اختياري: "" = يأخذ النوع العام */
function OptionalType({
  t,
  value,
  fallback,
  disabled,
  onChange,
}: {
  t: T;
  value: RuleType | null | undefined;
  fallback: RuleType;
  disabled?: boolean;
  onChange: (v: RuleType | null) => void;
}) {
  const sign = (r: RuleType) => (r === "percentage" ? "%" : t("dzd"));
  return (
    <select
      disabled={disabled}
      className={`${inputClass} w-24`}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value === "" ? null : (e.target.value as RuleType))}
    >
      <option value="">{t("defaultPh", sign(fallback))}</option>
      <option value="percentage">%</option>
      <option value="fixed">{t("dzd")}</option>
    </select>
  );
}

export default function CashbackSettingsPage() {
  const [lang, setLang] = useState<Lang>("ar");
  const t = useMemo(() => translator(lang), [lang]);
  const [cfg, setCfg] = useState<CashbackConfig>(EMPTY);
  // أسماء المحلات (من الخادم + ما يُختار الآن)
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [report, setReport] = useState<{ total: number; rows: StoreFundingRow[] } | null>(null);

  useEffect(() => setLang(loadLang()), []);
  const changeLang = (l: Lang) => {
    setLang(l);
    saveLang(l);
  };

  const loadReport = () =>
    getStoreCashbackFunding().then((r) => {
      if (r.status && r.result) setReport({ total: r.result.total, rows: r.result.rows });
    });

  const apply = (r: CashbackConfig) => {
    const merged = { ...EMPTY, ...r };
    setCfg({ ...merged, storeOverrides: normalizeOverrides(merged) });
    const n: Record<string, string> = {};
    (r.stores ?? []).forEach((s) => (n[s._id] = s.nameEtabliss));
    setNames((old) => ({ ...old, ...n }));
  };

  useEffect(() => {
    getCashbackConfig().then((r) => {
      if (r.status && r.result) apply(r.result);
      else setNotice({ ok: false, text: r.message || translator(loadLang())("loadError") });
      setLoading(false);
    });
    loadReport();
  }, []);

  const set = <K extends keyof CashbackConfig>(k: K, v: CashbackConfig[K]) => setCfg((c) => ({ ...c, [k]: v }));
  const remember = (s: StoreData) => setNames((n) => ({ ...n, [s._id]: s.nameEtabliss }));
  const storeName = (id: string) => names[id] || id.slice(-6);

  const setOverride = (i: number, patch: Partial<StoreOverride>) =>
    setCfg((c) => {
      const next = [...c.storeOverrides];
      next[i] = { ...next[i], ...patch };
      return { ...c, storeOverrides: next };
    });

  const listKey: "includedStoreIds" | "excludedStoreIds" =
    cfg.scopeMode === "EXCLUDED_STORES" ? "excludedStoreIds" : "includedStoreIds";
  const scopeList = cfg[listKey];

  const save = async () => {
    setSaving(true);
    setNotice(null);
    const r = await saveCashbackConfig(cfg);
    setSaving(false);
    if (r.status && r.result) {
      apply(r.result);
      setNotice({ ok: true, text: t("saved") });
    } else {
      // رسالة مترجمة حسب code الخادم مع اسم المحل
      const key = `err_${r.code}` as TKey;
      const known = r.code && t(key) !== key;
      setNotice({ ok: false, text: known ? t(key, storeName(r.storeId ?? "")) : r.message || t("saveFailed") });
    }
  };

  const example = useMemo(() => ({ base: 2000, ...splitFor(2000, cfg.fundingMode, cfg) }), [cfg]);
  const fmtRule = (type: RuleType, v: number) => (type === "percentage" ? `${v}%` : `${v} ${t("dzd")}`);

  if (loading) return <Loader2 className="animate-spin text-gray-400 mx-auto mt-10" size={24} />;

  const scopeOptions: { v: ScopeMode; label: string }[] = [
    { v: "ALL_STORES", label: t("scopeAll") },
    { v: "SELECTED_STORES", label: t("scopeSelected") },
    { v: "EXCLUDED_STORES", label: t("scopeExcluded") },
  ];
  const fundingOptions: { v: FundingMode; label: string; hint: string }[] = [
    { v: "APP_ONLY", label: t("modeApp"), hint: t("modeAppHint") },
    { v: "STORE_ONLY", label: t("modeStore"), hint: t("modeStoreHint") },
    { v: "BOTH", label: t("modeBoth"), hint: t("modeBothHint") },
  ];
  const overrideModes: { v: OverrideMode; label: string }[] = [
    { v: "APP_ONLY", label: t("modeApp") },
    { v: "STORE_ONLY", label: t("modeStore") },
    { v: "BOTH", label: t("modeBoth") },
    { v: "DISABLED", label: t("modeDisabled") },
  ];
  const usesStoreShare =
    cfg.fundingMode !== "APP_ONLY" || cfg.storeOverrides.some((o) => o.mode === "STORE_ONLY" || o.mode === "BOTH");

  return (
    <div className="max-w-4xl mx-auto space-y-5" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="flex items-center gap-3">
        <HandCoins className="text-[#e91818]" />
        <div className="flex-1">
          <h2 className="text-xl font-black text-gray-800">{t("title")}</h2>
          <p className="text-sm text-gray-500">{t("subtitle")}</p>
        </div>
        <div className="flex gap-1">
          {LANGS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => changeLang(l)}
              className={`px-2 py-1 rounded-md text-xs font-bold uppercase border ${
                lang === l ? "bg-[#e91818] text-white border-[#e91818]" : "bg-white text-gray-600 border-gray-200"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {notice && (
        <div
          className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm border ${
            notice.ok ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {notice.ok ? <Check size={18} /> : <AlertCircle size={18} />}
          <span>{notice.text}</span>
        </div>
      )}

      {/* التفعيل */}
      <section className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3">
        <label className="flex items-center gap-2 text-sm font-bold text-gray-800">
          <input type="checkbox" checked={cfg.enabled} onChange={(e) => set("enabled", e.target.checked)} />
          {t("enable")}
        </label>
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">{t("driverWarning")}</p>
      </section>

      {/* النطاق */}
      <section className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <Store size={16} /> {t("scopeTitle")}
        </h3>
        <div className="flex flex-wrap gap-2">
          {scopeOptions.map((o) => (
            <button
              key={o.v}
              type="button"
              onClick={() => set("scopeMode", o.v)}
              className={`px-3 py-1.5 rounded-full text-sm border ${
                cfg.scopeMode === o.v ? "bg-[#e91818] text-white border-[#e91818]" : "bg-white text-gray-700 border-gray-200"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        {cfg.scopeMode !== "ALL_STORES" && (
          <div className="space-y-2">
            <p className="text-xs text-gray-600">
              {cfg.scopeMode === "SELECTED_STORES" ? t("scopeSelectedHint") : t("scopeExcludedHint")}
            </p>
            <div className="flex flex-wrap gap-2">
              {scopeList.length === 0 && <span className="text-xs text-gray-400">{t("noStoreYet")}</span>}
              {scopeList.map((id) => (
                <span key={id} className="inline-flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1 text-xs">
                  {storeName(id)}
                  <button type="button" onClick={() => set(listKey, scopeList.filter((x) => x !== id))}>
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <StoreSearch
              t={t}
              exclude={scopeList}
              onPick={(s) => {
                remember(s);
                set(listKey, [...scopeList, s._id]);
              }}
            />
            <label className="flex items-center gap-2 text-xs text-gray-700">
              <input
                type="checkbox"
                checked={cfg.allowRedeemOutsideScope}
                onChange={(e) => set("allowRedeemOutsideScope", e.target.checked)}
              />
              {t("allowRedeem")}
            </label>
          </div>
        )}
      </section>

      {/* التمويل العام */}
      <section className="bg-white border border-gray-100 rounded-2xl p-4 space-y-4">
        <h3 className="font-bold text-gray-800">{t("fundingTitle")}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {fundingOptions.map((o) => (
            <button
              key={o.v}
              type="button"
              onClick={() => set("fundingMode", o.v)}
              className={`text-start rounded-xl border p-3 ${
                cfg.fundingMode === o.v ? "border-[#e91818] bg-red-50" : "border-gray-200 bg-white"
              }`}
            >
              <span className="block text-sm font-bold text-gray-800">{o.label}</span>
              <span className="block text-[11px] text-gray-500">{o.hint}</span>
            </button>
          ))}
        </div>

        {cfg.fundingMode !== "STORE_ONLY" && (
          <RuleFields
            t={t}
            title={t("appShare")}
            type={cfg.type}
            value={cfg.value}
            onType={(v) => set("type", v)}
            onValue={(v) => set("value", v)}
          />
        )}

        {cfg.fundingMode !== "APP_ONLY" && (
          <div className="border-t border-gray-100 pt-3">
            <RuleFields
              t={t}
              title={t("storeShareDefault")}
              type={cfg.storeCashbackType}
              value={cfg.storeCashbackValue}
              onType={(v) => set("storeCashbackType", v)}
              onValue={(v) => set("storeCashbackValue", v)}
            />
          </div>
        )}

        {usesStoreShare && (
          <div className="space-y-2">
            <p className="text-[11px] text-gray-500">{t("storeShareHint")}</p>
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
              {t("storeAppsWarning")}
            </p>
          </div>
        )}
      </section>

      {/* التخصيص حسب المحل */}
      <section className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <SlidersHorizontal size={16} /> {t("overridesTitle")}
        </h3>
        <p className="text-xs text-gray-500">{t("overridesHint")}</p>

        {cfg.storeOverrides.length === 0 ? (
          <p className="text-xs text-gray-400">{t("overridesEmpty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 text-start">
                  <th className="py-1 text-start">{t("colStore")}</th>
                  <th className="py-1 text-start">{t("colMode")}</th>
                  <th className="py-1 text-start">{t("colApp")}</th>
                  <th className="py-1 text-start">{t("colStore2")}</th>
                  <th className="py-1 text-start">{t("colMax")}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {cfg.storeOverrides.map((o, i) => {
                  const appOn = o.mode === "APP_ONLY" || o.mode === "BOTH";
                  const storeOn = o.mode === "STORE_ONLY" || o.mode === "BOTH";
                  // الاستثناء الصريح في النطاق يغلب التخصيص (نفس الخادم)
                  const excluded =
                    cfg.scopeMode === "EXCLUDED_STORES" && cfg.excludedStoreIds.includes(o.storeId);
                  const ex = splitFor(2000, excluded ? "DISABLED" : o.mode, cfg, o);
                  return (
                    <tr key={o.storeId} className="border-t border-gray-50 align-top">
                      <td className="py-2 pe-2">
                        <span className="font-semibold text-gray-800">{storeName(o.storeId)}</span>
                        <span className="block text-[11px] text-gray-500">
                          {o.mode === "DISABLED" || excluded ? t("rowDisabled") : t("rowExample", ex.app, ex.store)}
                        </span>
                        {excluded && (
                          <span className="block text-[11px] font-semibold text-amber-700">{t("rowExcludedWarning")}</span>
                        )}
                      </td>
                      <td className="py-2 pe-2">
                        <select
                          className={`${inputClass} min-w-40`}
                          value={o.mode}
                          onChange={(e) => setOverride(i, { mode: e.target.value as OverrideMode })}
                        >
                          {overrideModes.map((m) => (
                            <option key={m.v} value={m.v}>
                              {m.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 pe-2">
                        <div className="flex gap-1">
                          <OptionalType
                            t={t}
                            disabled={!appOn}
                            value={o.appType}
                            fallback={cfg.type}
                            onChange={(v) => setOverride(i, { appType: v })}
                          />
                          <OptionalNumber
                            disabled={!appOn}
                            value={o.appValue}
                            placeholder={t("defaultPh", fmtRule(cfg.type, cfg.value))}
                            onChange={(v) => setOverride(i, { appValue: v })}
                          />
                        </div>
                      </td>
                      <td className="py-2 pe-2">
                        <div className="flex gap-1">
                          <OptionalType
                            t={t}
                            disabled={!storeOn}
                            value={o.storeType}
                            fallback={cfg.storeCashbackType}
                            onChange={(v) => setOverride(i, { storeType: v })}
                          />
                          <OptionalNumber
                            disabled={!storeOn}
                            value={o.storeValue}
                            placeholder={t("defaultPh", fmtRule(cfg.storeCashbackType, cfg.storeCashbackValue))}
                            onChange={(v) => setOverride(i, { storeValue: v })}
                          />
                        </div>
                      </td>
                      <td className="py-2 pe-2">
                        <OptionalNumber
                          disabled={o.mode === "DISABLED"}
                          value={o.maxEarnPerOrder}
                          placeholder={
                            cfg.maxEarnPerOrder > 0 ? t("defaultPh", `${cfg.maxEarnPerOrder} ${t("dzd")}`) : t("noLimit")
                          }
                          onChange={(v) => setOverride(i, { maxEarnPerOrder: v })}
                        />
                      </td>
                      <td className="py-2">
                        <button
                          type="button"
                          title={t("remove")}
                          className="text-gray-400 hover:text-red-600 p-2"
                          onClick={() => set("storeOverrides", cfg.storeOverrides.filter((_, j) => j !== i))}
                        >
                          <X size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <StoreSearch
          t={t}
          placeholder={t("addStore")}
          exclude={cfg.storeOverrides.map((o) => o.storeId)}
          onPick={(s) => {
            remember(s);
            set("storeOverrides", [...cfg.storeOverrides, { storeId: s._id, mode: cfg.fundingMode }]);
          }}
        />
      </section>

      {/* محفظة السائق: حدود السحب + تغطية العمولة من المستحقات */}
      <section className="bg-white border border-gray-100 rounded-2xl p-4 space-y-4">
        <div>
          <h3 className="font-bold text-gray-800">{t("driverTitle")}</h3>
          <p className="text-xs text-gray-500 mt-1">{t("driverHint")}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NumberField
            label={t("driverCashoutMin")}
            hint={t("zeroNoLimit")}
            value={cfg.driverCashoutMin}
            onChange={(v) => set("driverCashoutMin", v)}
          />
          <NumberField
            label={t("driverCashoutMax")}
            hint={t("zeroNoLimit")}
            value={cfg.driverCashoutMax}
            onChange={(v) => set("driverCashoutMax", v)}
          />
        </div>
        {cfg.driverCashoutMax > 0 && cfg.driverCashoutMin > cfg.driverCashoutMax && (
          <p className="text-xs text-[#e91818]">{t("err_CASHOUT_MIN_GT_MAX")}</p>
        )}
        <label className="flex items-start gap-2 text-sm text-gray-800">
          <input
            type="checkbox"
            className="mt-1"
            checked={cfg.driverAutoCoverEnabled}
            onChange={(e) => set("driverAutoCoverEnabled", e.target.checked)}
          />
          <span>
            {t("driverAutoCover")}
            <span className="block text-xs text-gray-500">{t("driverAutoCoverHint")}</span>
          </span>
        </label>
        {cfg.driverAutoCoverEnabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <NumberField
              label={t("driverAutoCoverMin")}
              value={cfg.driverAutoCoverMin}
              onChange={(v) => set("driverAutoCoverMin", Math.max(1, v))}
            />
          </div>
        )}
        {cfg.driverAutoCoverEnabled && (
          <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
            {t("driverAutoCoverExample", cfg.driverAutoCoverMin)}
          </p>
        )}
      </section>

      {/* الحدود */}
      <section className="bg-white border border-gray-100 rounded-2xl p-4 space-y-4">
        <h3 className="font-bold text-gray-800">{t("limitsTitle")}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NumberField label={t("minOrder")} value={cfg.minOrderAmount} onChange={(v) => set("minOrderAmount", v)} />
          <NumberField
            label={t("maxEarn")}
            hint={t("maxEarnHint")}
            value={cfg.maxEarnPerOrder}
            onChange={(v) => set("maxEarnPerOrder", v)}
          />
          <NumberField
            label={t("maxUse")}
            hint={t("maxUseHint")}
            value={cfg.maxUsePerOrder}
            onChange={(v) => set("maxUsePerOrder", v)}
          />
          <NumberField
            label={t("walletCap")}
            hint={t("walletCapHint")}
            value={cfg.maxWalletBalance}
            onChange={(v) => set("maxWalletBalance", v)}
          />
          <NumberField label={t("expiry")} value={cfg.expiryDays} onChange={(v) => set("expiryDays", Math.max(1, v))} />
        </div>

        <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
          {t("example", example.base, example.app + example.store, example.app, example.store, cfg.expiryDays)}
        </p>

        <button
          onClick={save}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-[#e91818] text-white text-sm font-bold disabled:opacity-50"
        >
          {saving ? "..." : t("save")}
        </button>
      </section>

      {/* تقرير حصص المحلات */}
      <section className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-800">{t("reportTitle")}</h3>
          <button type="button" onClick={loadReport} className="text-xs text-[#e91818]">
            {t("refresh")}
          </button>
        </div>
        {!report || report.rows.length === 0 ? (
          <p className="text-xs text-gray-400">{t("reportEmpty")}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500">
                <th className="py-1 text-start">{t("colStore")}</th>
                <th className="py-1 text-start">{t("colOrders")}</th>
                <th className="py-1 text-start">{t("colAmount")}</th>
              </tr>
            </thead>
            <tbody>
              {report.rows.map((r) => (
                <tr key={r.storeId} className="border-t border-gray-50">
                  <td className="py-1.5">{r.nameEtabliss || r.storeId.slice(-6)}</td>
                  <td className="py-1.5">{r.orders}</td>
                  <td className="py-1.5 font-bold">
                    {Math.round(r.amount)} {t("dzd")}
                  </td>
                </tr>
              ))}
              <tr className="border-t border-gray-200 font-black">
                <td className="py-1.5">{t("total")}</td>
                <td />
                <td className="py-1.5">
                  {Math.round(report.total)} {t("dzd")}
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
