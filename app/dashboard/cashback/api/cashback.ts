import { Preferences } from "@capacitor/preferences";

/** إعدادات الكاش باك (super_admin) — web_backend /dash/getCashbackConfig و /dash/saveCashbackConfig */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
const GET = process.env.NEXT_PUBLIC_GET_CASHBACK_CONFIG ?? "/dash/getCashbackConfig";
const SAVE = process.env.NEXT_PUBLIC_SAVE_CASHBACK_CONFIG ?? "/dash/saveCashbackConfig";

const REPORT = process.env.NEXT_PUBLIC_STORE_CASHBACK_FUNDING ?? "/dash/storeCashbackFunding";

export type RuleType = "percentage" | "fixed";
export type ScopeMode = "ALL_STORES" | "SELECTED_STORES" | "EXCLUDED_STORES";
export type FundingMode = "APP_ONLY" | "STORE_ONLY" | "BOTH";

export type OverrideMode = FundingMode | "DISABLED";

/** تخصيص محل: كل قيمة null = تأخذ القيمة العامة */
export interface StoreOverride {
  storeId: string;
  mode: OverrideMode;
  appType?: RuleType | null;
  appValue?: number | null;
  storeType?: RuleType | null;
  storeValue?: number | null;
  maxEarnPerOrder?: number | null;
  // الشكل القديم (قبل mode) — يُحوَّل عند التحميل
  type?: RuleType | null;
  value?: number | null;
}

export interface CashbackStoreInfo {
  _id: string;
  nameEtabliss: string;
  image?: string;
}

export interface CashbackConfig {
  enabled: boolean;
  type: RuleType; // حصة التطبيق
  value: number; // حصة التطبيق
  minOrderAmount: number;
  maxEarnPerOrder: number;
  maxUsePerOrder: number;
  maxWalletBalance: number;
  expiryDays: number;
  scopeMode: ScopeMode;
  includedStoreIds: string[];
  excludedStoreIds: string[];
  allowRedeemOutsideScope: boolean;
  fundingMode: FundingMode;
  storeCashbackType: RuleType;
  storeCashbackValue: number;
  storeOverrides: StoreOverride[];
  // محفظة مستحقات السائق (0 = بلا حد)
  driverCashoutMin: number;
  driverCashoutMax: number;
  driverAutoCoverEnabled: boolean;
  driverAutoCoverMin: number;
  stores?: CashbackStoreInfo[]; // أسماء المحلات المذكورة (قراءة فقط)
}

export interface StoreFundingRow {
  storeId: string;
  nameEtabliss?: string;
  amount: number;
  orders: number;
}

type Result<T> = { status: boolean; message?: string; code?: string; storeId?: string; result?: T };

async function post<T>(path: string, body: unknown): Promise<Result<T>> {
  if (!API_URL) return { status: false, message: "API endpoint is not configured" };
  const { value: token } = await Preferences.get({ key: "token" });
  try {
    const res = await fetch(API_URL + path, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body ?? {}),
    });
    return (await res.json()) as Result<T>;
  } catch {
    return { status: false, message: "Erreur de connexion" };
  }
}

export const getCashbackConfig = () => post<CashbackConfig>(GET, {});
export const saveCashbackConfig = (cfg: CashbackConfig) => post<CashbackConfig>(SAVE, cfg);
export const getStoreCashbackFunding = (from?: string, to?: string) =>
  post<{ from: string; to: string; total: number; rows: StoreFundingRow[] }>(REPORT, { from, to });
