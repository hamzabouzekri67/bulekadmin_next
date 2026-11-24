export type Lang = "ar" | "fr" | "en";
export type L10n = Record<Lang, string>;

/**
 * عنصر في صفحة عروض الإعلان:
 * - product: منتج موجود في متجر (productId)
 * - custom: منتج خارجي يدخله الأدمن يدوياً، مربوط بمتجر (الضغط عليه في التطبيق يفتح المتجر)
 */
/** تخفيض حقيقي مؤقت على منتج (طوال فترة الإعلان) */
export interface ItemDiscount {
  /** bogo = "1 acheté = 1 offert" */
  type: "percentage" | "fixed" | "bogo";
  value: number;
  /** نسبة ما يتحمله المطعم 0-100؛ الباقي على التطبيق */
  restaurantShare: number;
  /** bogo: يشتري buyQty ويأخذ freeQty مجاناً، بحد أقصى maxFree مجاناً في الطلب */
  buyQty?: number;
  freeQty?: number;
  maxFree?: number;
}

export type AdTarget = "offers" | "store";

export interface HomeAdItem {
  kind: "product" | "custom";
  productId?: string | null;
  storeId: string;
  title?: string;
  image?: string;
  storeName?: string;
  price?: string;
  description?: string;
  /** product فقط */
  discount?: ItemDiscount | null;
}

/** نفس أشكال مجموعات البقالة في التطبيق */
export type SectionDisplay = "horizontal" | "card" | "grid";

export interface HomeAdSection {
  title: L10n;
  items: HomeAdItem[];
  displayType?: SectionDisplay;
  /** card فقط: بجانب القسم التالي في نفس الصف */
  groupWithNext?: boolean;
  /** تخفيض افتراضي لكل منتجات القسم؛ تخفيض المنتج نفسه له الأولوية */
  discount?: ItemDiscount | null;
}

export interface HomeAd {
  _id: string;
  title: L10n;
  subtitle: L10n;
  buttonText: L10n;
  badgeText: L10n;
  imageUrl: string;
  bgColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  sections?: HomeAdSection[];
  /** قديم (قبل الأقسام) */
  items?: HomeAdItem[];
  target?: AdTarget;
  targetStoreId?: string | null;
  targetStoreName?: string;
  isActive: boolean;
  order: number;
  startAt: string | null;
  endAt: string | null;
  /** تكرار أسبوعي (توقيت الجزائر) — null = بدون تكرار */
  schedule?: AdSchedule | null;
  createdAt?: string;
}

/** daysOfWeek: 0 = الأحد … 6 = السبت (فارغ = كل يوم)؛ from/to دقائق منذ منتصف الليل */
export interface AdSchedule {
  daysOfWeek: number[];
  from: number;
  to: number;
}

/** الحقول المرسلة للحفظ (FormData) */
export interface HomeAdForm {
  id?: string;
  title: L10n;
  subtitle: L10n;
  buttonText: L10n;
  badgeText: L10n;
  bgColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  sections: HomeAdSection[];
  target: AdTarget;
  targetStoreId: string;
  targetStoreName: string;
  order: string;
  startAt: string;
  endAt: string;
  /** تكرار أسبوعي */
  scheduleOn: boolean;
  scheduleDays: number[];
  scheduleFrom: string; // "HH:MM"
  scheduleTo: string; // "HH:MM"
}

/** منتج كما يرجعه /dash/findProductFeatured */
export interface StoreProduct {
  _id: string;
  title: string;
  image?: string;
  price?: string;
  currency?: string;
  /** public | pause | revision | publicrevision ... — الإعلانات تقبل public فقط */
  status?: string;
}

export interface ApiResult<T = unknown> {
  status: boolean;
  message?: string;
  result?: T;
}
