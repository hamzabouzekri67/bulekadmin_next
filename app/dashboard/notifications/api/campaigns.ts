import { Preferences } from "@capacitor/preferences";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const LIST_NOTIFICATIONS = process.env.NEXT_PUBLIC_LIST_NOTIFICATIONS;
const QUEUE_NOTIFICATION = process.env.NEXT_PUBLIC_QUEUE_NOTIFICATION;
const CANCEL_NOTIFICATION = process.env.NEXT_PUBLIC_CANCEL_NOTIFICATION;
const NOTIFICATION_SETTINGS = process.env.NEXT_PUBLIC_NOTIFICATION_SETTINGS;
const SAVE_NOTIFICATION_SETTINGS = process.env.NEXT_PUBLIC_SAVE_NOTIFICATION_SETTINGS;

export type CampaignKind = "manual" | "automatic" | "promo";
export type CampaignStatus = "queued" | "sent" | "failed" | "cancelled";

export interface NotificationCampaign {
  id: string;
  kind: CampaignKind;
  rule: "announce" | "expiring" | "manual";
  title: string;
  body: string;
  topics: string[];
  status: CampaignStatus;
  sendAt?: string;
  sentAt?: string | null;
  promoCode?: string;
  error?: string;
  createdAt?: string;
  repeat?: "once" | "daily";
  hour?: number;
  minute?: number;
  times?: number[];
  skipDays?: number[];
}

export interface NotificationSettings {
  promoAnnounce: boolean;
  promoExpiryHours: number;
  country: string;
}

interface ApiBody<T> {
  status?: boolean;
  message?: string;
  result?: T;
}

async function tokenHeader(): Promise<Record<string, string>> {
  const { value: token } = await Preferences.get({ key: "token" });
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function readBody<T>(res: Response): Promise<ApiBody<T>> {
  return (await res.json()) as ApiBody<T>;
}

export async function listCampaigns(): Promise<ApiBody<NotificationCampaign[]>> {
  const res = await fetch(`${API_URL}${LIST_NOTIFICATIONS}`, {
    headers: await tokenHeader(),
  });
  return readBody<NotificationCampaign[]>(res);
}

export async function loadSettings(): Promise<ApiBody<NotificationSettings>> {
  const res = await fetch(`${API_URL}${NOTIFICATION_SETTINGS}`, {
    headers: await tokenHeader(),
  });
  return readBody<NotificationSettings>(res);
}

export async function saveNotificationSettings(
  settings: NotificationSettings,
): Promise<ApiBody<NotificationSettings>> {
  const res = await fetch(`${API_URL}${SAVE_NOTIFICATION_SETTINGS}`, {
    method: "POST",
    headers: await tokenHeader(),
    body: JSON.stringify(settings),
  });
  return readBody<NotificationSettings>(res);
}

export async function queueNotification(input: {
  kind: "manual" | "promo";
  title: string;
  body: string;
  topics: string[];
  sendAt?: string;
  promoId?: string;
  promoCode?: string;
  repeat?: "once" | "daily";
  hour?: number;
  minute?: number;
  times?: { hour: number; minute: number }[];
  skipDays?: number[];
}): Promise<ApiBody<NotificationCampaign>> {
  const res = await fetch(`${API_URL}${QUEUE_NOTIFICATION}`, {
    method: "POST",
    headers: await tokenHeader(),
    body: JSON.stringify(input),
  });
  return readBody<NotificationCampaign>(res);
}

export async function cancelNotification(
  id: string,
): Promise<ApiBody<NotificationCampaign>> {
  const res = await fetch(`${API_URL}${CANCEL_NOTIFICATION}`, {
    method: "POST",
    headers: await tokenHeader(),
    body: JSON.stringify({ id }),
  });
  return readBody<NotificationCampaign>(res);
}
