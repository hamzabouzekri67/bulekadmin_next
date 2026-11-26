import { User } from "@/app/context/UserContext";
import { Preferences } from "@capacitor/preferences";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const STORE_OWNER_DRIVERS = process.env.NEXT_PUBLIC_STORE_OWNER_DRIVERS;
const STORE_OWNER_RECHARGE = process.env.NEXT_PUBLIC_STORE_OWNER_RECHARGE;

export type StoreOwnerDriver = {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  balance?: number;
  /** محفظة المستحقات (كاش باك استعمله الزبائن) — يُسحب نقداً من نقطة الشحن */
  reimbursementBalance?: number;
};

export type RechargeResponse = {
  success: boolean;
  message?: string;
  unknown?: boolean;
};

export async function GetStoreOwnerDrivers(
  search?: string,
): Promise<StoreOwnerDriver[] | null> {
  try {
    const url = `${API_URL}${STORE_OWNER_DRIVERS}`;
    const { value: token } = await Preferences.get({ key: "token" });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        search: search ?? "",
      }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.result?.drivers ?? [];
    }
    return null;
  } catch (error) {
    return null;
  }
}

export async function RechargeDriver(
  driverId: string,
  amount: number,
  requestId: string,
): Promise<RechargeResponse> {
  try {
    const url = `${API_URL}${STORE_OWNER_RECHARGE}`;
    const { value: token } = await Preferences.get({ key: "token" });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        driverId: driverId,
        amount: amount,
        requestId: requestId,
      }),
    });

    const data = await res.json().catch(() => ({}));
    // الخادم قد يرد بكود 200 مع status:false، فلا نكتفي بـ res.ok
    if (res.ok && data?.status !== false) {
      return { success: true, message: data?.message };
    }
    return {
      success: false,
      message: data?.message || "Une erreur est survenue",
    };
  } catch (error) {
    return { success: false, message: "Erreur de connexion", unknown: true };
  }
}

const STORE_OWNER_HISTORY = process.env.NEXT_PUBLIC_STORE_OWNER_HISTORY;

export type HistoryPeriod = "today" | "7d" | "30d" | "all";

export type HistoryItem = {
  id: string;
  // recharge: شحن سائق، topup: السوبر أدمن شحن رصيدك، cashout: سلّمت سائقاً نقداً من مستحقاته
  kind: "recharge" | "topup" | "cashout";
  /** company = الشركة شحنتك (دين عليك) — driver = عملية مع سائق */
  source?: "company" | "driver";
  driverName?: string;
  driverPhone?: string;
  amount: number;
  /** عمولتك على شحن السائق (%) */
  commission?: number;
  createdAt: string;
};

export type HistoryResponse = {
  items: HistoryItem[];
  page: number;
  totalPages: number;
  total: number;
  totalRecharged: number;
  totalCredited: number;
  totalCashout?: number;
  totalCommission?: number;
  /** دينك الحالي للشركة؛ سالب = الشركة مدينة لك */
  debt?: number;
  balance?: number;
};

export async function GetStoreOwnerHistory(
  page: number,
  period: HistoryPeriod,
): Promise<HistoryResponse | null> {
  try {
    const url = `${API_URL}${STORE_OWNER_HISTORY}`;
    const { value: token } = await Preferences.get({ key: "token" });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ page, period }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.status === false) return null;
      return data.result ?? null;
    }
    return null;
  } catch (error) {
    return null;
  }
}

const STORE_OWNER_CASHOUT = process.env.NEXT_PUBLIC_STORE_OWNER_CASHOUT ?? "/dash/storeOwnerCashout";

export type CashoutResponse = {
  success: boolean;
  message?: string;
  unknown?: boolean;
  reimbursementBalance?: number;
  ownerBalance?: number;
};

/**
 * سحب نقدي: يُخصم [amount] من محفظة المستحقات للسائق ويُضاف لرصيدك.
 * [code] = الرمز ذو 6 أرقام الذي يظهر في تطبيق السائق (صالح 10 دقائق).
 */
export async function CashoutDriver(
  driverId: string,
  amount: number,
  code: string,
  requestId: string,
): Promise<CashoutResponse> {
  try {
    const { value: token } = await Preferences.get({ key: "token" });
    const res = await fetch(`${API_URL}${STORE_OWNER_CASHOUT}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ driverId, amount, code, requestId }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.status !== false) {
      return {
        success: true,
        message: data?.message,
        reimbursementBalance: data?.result?.reimbursementBalance,
        ownerBalance: data?.result?.ownerBalance,
      };
    }
    return { success: false, message: data?.message || "Une erreur est survenue" };
  } catch {
    return { success: false, message: "Erreur de connexion", unknown: true };
  }
}

// ───────────── دين نقطة الشحن تجاه الشركة ─────────────

export type StoreOwnerRates = { rechargeCommissionPercent: number };

export type LedgerType = "TOPUP" | "RECHARGE_COMMISSION" | "PAYMENT" | "ADJUSTMENT";

export type LedgerItem = {
  id: string;
  type: LedgerType;
  /** + يزيد الدين، − ينقصه */
  debtChange: number;
  debtAfter: number;
  baseAmount: number;
  rate?: number | null;
  driverName?: string;
  /** رمز إثبات الدفع (PAYMENT) */
  receiptCode?: string | null;
  note?: string;
  createdAt: string;
};

export type LedgerResponse = {
  owner: { userName: string; debt: number; balance: number } | null;
  items: LedgerItem[];
  page: number;
  totalPages: number;
};

export type StoreOwnerDebtRow = {
  id: string;
  userName: string;
  ville?: string;
  balance: number;
  debt: number;
  isActive: boolean;
};

/** POST إلى /dash/<path> ويرجع result أو رسالة الخطأ */
async function dashPost<T>(path: string, body: unknown): Promise<{ ok: true; result: T } | { ok: false; message: string }> {
  try {
    const { value: token } = await Preferences.get({ key: "token" });
    const res = await fetch(`${API_URL}/dash/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body ?? {}),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.status !== false) return { ok: true, result: data.result as T };
    return { ok: false, message: data?.message || "Une erreur est survenue" };
  } catch {
    return { ok: false, message: "Erreur de connexion" };
  }
}

// نقطة الشحن
export const GetStoreOwnerSummary = () =>
  dashPost<{ balance: number; debt: number; rates: StoreOwnerRates }>("storeOwnerSummary", {});
export const GetStoreOwnerLedger = (page: number) => dashPost<LedgerResponse>("storeOwnerLedger", { page });

// super_admin
export const GetStoreOwnersDebts = () =>
  dashPost<{ owners: StoreOwnerDebtRow[]; totalDebt: number; rates: StoreOwnerRates }>("storeOwnersDebts", {});
export const SaveStoreOwnerRates = (rates: StoreOwnerRates) => dashPost<StoreOwnerRates>("saveStoreOwnerRates", rates);
export const RecordStoreOwnerDebtOperation = (p: {
  ownerId: string;
  amount: number;
  kind: "PAYMENT" | "ADJUSTMENT";
  note?: string;
  requestId: string;
}) => dashPost<{ receiptCode: string | null; debtAfter: number; duplicate?: boolean }>("storeOwnerDebtOperation", p);
export const GetStoreOwnerLedgerAdmin = (ownerId: string, page: number) =>
  dashPost<LedgerResponse>("storeOwnerLedgerAdmin", { ownerId, page });
