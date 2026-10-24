import { Preferences } from "@capacitor/preferences";
import type { PromoApiResult, PromoCodeItem } from "@/app/types/promo";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const LIST_PROMO = process.env.NEXT_PUBLIC_LIST_PROMO_CODES;
const ADD_PROMO = process.env.NEXT_PUBLIC_ADD_PROMO_CODE;
const SET_PROMO_STATUS = process.env.NEXT_PUBLIC_SET_PROMO_STATUS;

async function tokenHeader(): Promise<Record<string, string>> {
  const { value: token } = await Preferences.get({ key: "token" });
  return { Authorization: `Bearer ${token}` };
}

async function readBody<T>(res: Response): Promise<PromoApiResult<T>> {
  const data = (await res.json()) as PromoApiResult<T>;
  return data;
}

export async function listPromoCodes(): Promise<PromoApiResult<PromoCodeItem[]>> {
  const res = await fetch(`${API_URL}${LIST_PROMO}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(await tokenHeader()),
    },
  });
  return readBody<PromoCodeItem[]>(res);
}

export async function addPromoCode(
  fields: Record<string, string>,
  image: File | null,
): Promise<PromoApiResult<PromoCodeItem>> {
  const headers = await tokenHeader();

  if (image) {
    const form = new FormData();
    Object.entries(fields).forEach(([key, value]) => form.append(key, value));
    form.append("imagePromo", image);
    const res = await fetch(`${API_URL}${ADD_PROMO}`, {
      method: "POST",
      headers,
      body: form,
    });
    return readBody<PromoCodeItem>(res);
  }

  const res = await fetch(`${API_URL}${ADD_PROMO}`, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(fields),
  });
  return readBody<PromoCodeItem>(res);
}

export async function setPromoStatus(
  id: string,
  isActive: boolean,
): Promise<PromoApiResult<PromoCodeItem>> {
  const res = await fetch(`${API_URL}${SET_PROMO_STATUS}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await tokenHeader()),
    },
    body: JSON.stringify({ id, isActive }),
  });
  return readBody<PromoCodeItem>(res);
}
