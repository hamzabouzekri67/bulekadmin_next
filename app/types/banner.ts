export interface BannerItem {
  id?: string;
  _id?: string;
  imageUrl: string;
  storeId: string;
  title?: string;
  order?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** رد الـ API الموحّد. `T` هو نوع `result` (مثلًا BannerItem[]). */
export interface BannerApiResult<T = unknown> {
  status: boolean;
  message?: string;
  result?: T;
}

/** حقول إضافة banner (تُرسل كـ FormData، لذلك كلها نصوص). */
export interface AddBannerFields {
  storeId: string;
  title: string;
  order: string;
}