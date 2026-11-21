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
  driverName: string;
  driverPhone?: string;
  amount: number;
  createdAt: string;
};

export type HistoryResponse = {
  items: HistoryItem[];
  page: number;
  totalPages: number;
  total: number;
  totalAmount: number;
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
