import { Preferences } from "@capacitor/preferences";
import type { ApiResult, HomeAd, HomeAdForm } from "@/app/types/home_ad";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
const LIST = process.env.NEXT_PUBLIC_LIST_HOME_ADS ?? "/dash/listHomeAds";
const SAVE = process.env.NEXT_PUBLIC_SAVE_HOME_AD ?? "/dash/saveHomeAd";
const SET_STATUS = process.env.NEXT_PUBLIC_SET_HOME_AD_STATUS ?? "/dash/setHomeAdStatus";
const DELETE = process.env.NEXT_PUBLIC_DELETE_HOME_AD ?? "/dash/deleteHomeAd";
const UPLOAD = process.env.NEXT_PUBLIC_UPLOAD_HOME_AD_IMAGE ?? "/dash/uploadHomeAdImage";

async function authHeader(): Promise<Record<string, string>> {
  const { value: token } = await Preferences.get({ key: "token" });
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, init: RequestInit): Promise<ApiResult<T>> {
  if (!API_URL) return { status: false, message: "API endpoint is not configured" };
  const res = await fetch(API_URL + path, init);
  try {
    return (await res.json()) as ApiResult<T>;
  } catch {
    return { status: false, message: `Unexpected response (${res.status})` };
  }
}

export async function listHomeAds() {
  return request<HomeAd[]>(LIST, { method: "GET", headers: await authHeader() });
}

/** إنشاء أو تعديل (form.id). الصورة مطلوبة عند الإنشاء فقط. */
export async function saveHomeAd(form: HomeAdForm, image: File | null) {
  const data = new FormData();
  if (form.id) data.append("id", form.id);
  // الكائنات تُرسل JSON (FormData يحمل نصوصاً فقط)
  data.append("title", JSON.stringify(form.title));
  data.append("subtitle", JSON.stringify(form.subtitle));
  data.append("buttonText", JSON.stringify(form.buttonText));
  data.append("badgeText", JSON.stringify(form.badgeText));
  data.append("sections", JSON.stringify(form.sections));
  data.append("target", form.target);
  data.append("targetStoreId", form.target === "store" ? form.targetStoreId : "");
  data.append("targetStoreName", form.target === "store" ? form.targetStoreName : "");
  data.append("bgColor", form.bgColor);
  data.append("textColor", form.textColor);
  data.append("buttonColor", form.buttonColor);
  data.append("buttonTextColor", form.buttonTextColor);
  data.append("order", form.order);
  data.append("startAt", form.startAt ? new Date(form.startAt).toISOString() : "");
  data.append("endAt", form.endAt ? new Date(form.endAt).toISOString() : "");
  // تكرار أسبوعي: "" = بدون تكرار (الخادم يحوّل "HH:MM" إلى دقائق)
  data.append(
    "schedule",
    form.scheduleOn
      ? JSON.stringify({ daysOfWeek: form.scheduleDays, from: form.scheduleFrom, to: form.scheduleTo })
      : "",
  );
  if (image) data.append("adImage", image);

  return request<HomeAd>(SAVE, { method: "POST", headers: await authHeader(), body: data });
}

/** رفع صورة منتج خارجي فوراً؛ يرجع الرابط */
export async function uploadHomeAdImage(image: File) {
  const data = new FormData();
  data.append("image", image);
  return request<{ url: string }>(UPLOAD, { method: "POST", headers: await authHeader(), body: data });
}

export async function setHomeAdStatus(id: string, isActive: boolean) {
  return request(SET_STATUS, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
    body: JSON.stringify({ id, isActive }),
  });
}

export async function deleteHomeAd(id: string) {
  return request(DELETE, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
    body: JSON.stringify({ id }),
  });
}
