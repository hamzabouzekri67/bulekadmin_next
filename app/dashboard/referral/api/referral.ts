import { Preferences } from "@capacitor/preferences";

/** إعدادات الدعوة (super_admin) — web_backend /dash/getReferralConfig و /dash/saveReferralConfig */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
const GET = process.env.NEXT_PUBLIC_GET_REFERRAL_CONFIG ?? "/dash/getReferralConfig";
const SAVE = process.env.NEXT_PUBLIC_SAVE_REFERRAL_CONFIG ?? "/dash/saveReferralConfig";

export type InviterReward = "FREE_DELIVERY" | "WALLET";

export interface ReferralStats {
  pending: number;
  rewarded: number;
  paidAmount: number;
}

export interface ReferralConfig {
  enabled: boolean;
  inviterRewardType: InviterReward;
  inviterWalletAmount: number;
  inviterFreeDeliveries: number;
  inviteeFreeDelivery: boolean;
  freeDeliveryMaxAmount: number;
  voucherExpiryDays: number;
  minOrderAmount: number;
  driverEnabled: boolean;
  driverRewardAmount: number;
  driverRequiredOrders: number;
  driverInviteClientsEnabled: boolean;
  driverClientRewardAmount: number;
  applyWindowDays: number;
  maxReferralsPerUser: number;
  stats?: { client: ReferralStats; driver: ReferralStats; driverClients?: ReferralStats };
}

type Result<T> = { status: boolean; message?: string; code?: string; result?: T };

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

export const getReferralConfig = () => post<ReferralConfig>(GET, {});
export const saveReferralConfig = (cfg: ReferralConfig) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { stats, ...body } = cfg;
  return post<ReferralConfig>(SAVE, body);
};
