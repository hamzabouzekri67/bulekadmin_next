import { Preferences } from '@capacitor/preferences';
import type { AddBannerFields, BannerApiResult, BannerItem } from '@/app/types/banner';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';
const LIST_BANNERS = process.env.NEXT_PUBLIC_LIST_BANNERS;
const ADD_BANNER = process.env.NEXT_PUBLIC_ADD_BANNER;
const SET_BANNER_STATUS = process.env.NEXT_PUBLIC_SET_BANNER_STATUS;
const DELETE_BANNER = process.env.NEXT_PUBLIC_DELETE_BANNER;

async function authHeader(): Promise<Record<string, string>> {
  const { value: token } = await Preferences.get({ key: 'token' });
  console.log(token);
  
  // لا نرسل "Bearer null" عند غياب التوكن
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * طلب موحّد: يتحقق من وجود المسار، ويتعامل مع الردود غير JSON (401/500 HTML مثلًا)
 * بدل أن يرمي خطأ parse غامضًا. أخطاء الشبكة نفسها ترمي كالمعتاد ليلتقطها الـ caller.
 */
async function request<T>(path: string | undefined, init: RequestInit): Promise<BannerApiResult<T>> {
  if (!API_URL || !path) {
    return { status: false, message: 'API endpoint is not configured' };
  }

  const res = await fetch(API_URL + path, init);

  try {
    return (await res.json()) as BannerApiResult<T>;
  } catch {
    return { status: false, message: `Unexpected response (${res.status})` };
  }
}

export async function listBanners() {
  return request<BannerItem[]>(LIST_BANNERS, {
    method: 'GET',
    headers: await authHeader(),
  });
}

export async function addBanner(fields: AddBannerFields, image: File | null) {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => form.append(key, value));
  if (image) form.append('bannerImage', image);

  // لا نضع Content-Type هنا: المتصفح يضيفه مع الـ boundary تلقائيًا
  return request<BannerItem>(ADD_BANNER, {
    method: 'POST',
    headers: await authHeader(),
    body: form,
  });
}

export async function setBannerStatus(id: string, isActive: boolean) {
  return request(SET_BANNER_STATUS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
    body: JSON.stringify({ id, isActive }),
  });
}

export async function deleteBanner(id: string) {
  return request(DELETE_BANNER, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
    body: JSON.stringify({ id }),
  });
}