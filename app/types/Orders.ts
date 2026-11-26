export type Order = {
  id: string;
  _id: string;
  currency: string;
  status: string;
  returned: boolean;
  timePredictable: number;
  timeOrder: number;
  feedelivery: string;
  TrackingId: string;
  message?: unknown;
  walletId?: string;
  tmpToken?: string;
  assistedBy?: {
    userName?: string;
  };
  ville: string;
  promoCode: string;
  discountmodel: string;
  feeDeliveryPrcent: number;
  feeApplications: number;
  platformFeeStore: number;
  orderTax: number;
  totalFeePlatform: number;
  totalOrderPrice: number;
  restaurantNetAmount: number;
  taxAmount: number;
  diffDiscounted: number;
  diffPromoCode: number;
  offerfee: number;
  feedriver: number;

  isMonthly: boolean;
  hasOrders: boolean;
  code?: number;

  listOrder: ListOrder[];
  stepOrder: StepOrder;
  postionsClient: Positions;
  translocation: Positions;

  restaurantId: Restaurant;
  send: Send;
  driver?: Driver;
  driverPositions?: DriverPositions;

  promoCodes?: PromoCodes;
  coupon?: Coupon;
  orderCompleted: number;
  createdAt: Date | string;
  appFoodpromo: number;
  appDeliverypromo: number;
  appTotalpromo: number;
  storeFoodpromo: number;
  storeDeliverypromo: number;
  storTotalpromo: number;
  claimId: string;
  discountSettings: DiscountSettings;
  deliverySettings: DeliverySettings;
  discountAmount: number;
  client: {
    firstName?: string;
    lastName?: string;
    phone:string
  };
  newdriverFees:number,
  distance:number,
  grandTotal:number,
  // حصص التوصيل المجاني وتخفيض الطلب
  storeShareAmount?: number;
  platformShareAmount?: number;
  storeDiscountShareAmount?: number;
  platformDiscountShareAmount?: number;
  deliveryCost?: number; // دعم التوصيل (Boost) الذي تدفعه المنصة للسائق
  // تخفيض إعلانات الرئيسية (Home-ads): totalOrderPrice بعده، originalFoodTotal قبله
  originalFoodTotal?: number;
  campaignDiscount?: number;
  campaignStoreShare?: number;
  campaignPlatformShare?: number;
  // محفظة الكاش باك
  paymentMethod?: "cash" | "cash_wallet" | "card";
  totalAmount?: number;
  walletUsed?: number; // مدفوع من محفظة الزبون
  cashToCollect?: number; // ما قبضه السائق كاشاً
  cashbackEarned?: number; // كسبه الزبون عند التسليم (= app + store)
  appCashbackEarned?: number; // حصة التطبيق
  storeCashbackEarned?: number; // حصة المحل
  storeCashbackShareAmount?: number; // حصة المحل المثبّتة عند الإنشاء: تُقتطع من دفع المطعم وتُسترجع من رصيد السائق
  cashbackSourceMode?: "APP_ONLY" | "STORE_ONLY" | "BOTH" | null;
};

export type DiscountSponsoredBy = {
  _id?: string;
  restaurantShare?: number;
  platformShare?: number;
};

export type DiscountSettings = {
  discountType: "percentage" | "fixed" | string;
  discountValue: number;
  hasOrderDiscount: boolean;
  minAmountForDiscount: number;
  sponsoredBy?: DiscountSponsoredBy;
};

export type DeliverySponsoredBy = {
  restaurantShare: number;
  platformShare: number;
};

export type DeliverySettings = {
  freeDeliveryMinAmount: number;
  hasFreeDeliveryThreshold: boolean;
  maxFreeDeliveryDistance: number;
  sponsoredBy: DeliverySponsoredBy;
};
export type ListOrder = {
  idproducts: string;
  title: string;
  currency: string;
  totalprice: number;
  originalPrice: number;
  qentity: number;
  category?: string;
  messageOrder?: string;
  offer?: boolean;
  discount?: number;
  listSuplement?: SuplementChoice[];
  // تخفيض إعلان الرئيسية على هذا السطر (للوحدة)
  campaignUnitDiscount?: number;
  campaignRestaurantShare?: number; // نسبة المطعم %
  campaignAdId?: string;
  // عرض "1 acheté = 1 offert": totalQuantity يحضّرها المتجر = paidQuantity + freeQuantity
  campaignType?: "percentage" | "fixed" | "bogo" | null;
  totalQuantity?: number;
  paidQuantity?: number;
  freeQuantity?: number;
  originalLineTotal?: number;
  finalLineTotal?: number;
};

// export type Suplement =  {
//   _id: string; // أو ObjectId
//   choix: SuplementChoice[];
//   requird?: string[];
// }
export type SuplementChoice = {
  id: string;
  _id: string;
  title: string;
  price: string;
  qty: number;
  status: string;
};

export type StepOrder = {
  stepId: string;
  placeOrder: boolean;
  prepareOrder: boolean;
  deliveryDriver: boolean;
  customerDelivery: boolean;
};

export type Positions = {
  type: string;
  coordinates: number[];
};

export type Restaurant = {
  _id: string;
  clientId: string;
  typeEtabliss: string;
  nameEtabliss: string;
  ville?: string;
  timeP: string;
  phoneNumber: string;
  image: string;
  currency?: string;
  amountValue: number;
  isOpen: boolean;
  course: boolean;
  notificationsToken?: string;
  postionsEtabliss: Positions;
  category: Category[];
  secondaryPhones:string[]
};
export type Category = {
  _id: string;
  clientId: string;
  category: string;
  status: "public" | "pause";
  indexing: number;
  discount: number;
  offer: boolean;
  createdAt: string;
  updatedAt: string;
  products: Product[];
};

export type Product = {
  _id: string;
  id?: string;
  title: string;
  desc: string;
  price: string;
  total: number;
  image: string;
  status: "public" | "pause" | "";
  currency: string;
  categoryId: string;
  clientId: string;
  createdAt: string;
  updatedAt: string;
  ratings: unknown[];
  supplements: Supplement[];
  supIds: string[];
  discount: number;
  maxCount?: number;
};

export type Supplement = {
  _id: string;
  supId: string;
  elementId: string;
  categoryId: string;

  title: string;
  chose: string;

  data: SupplementItem[];

  createdAt: string;
  updatedAt: string;
  __v: number;
};

export type SupplementItem = {
  _id: string;
  id: string;
  name: string;
  plusPrice: string;
};

export type Send = {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  notificationsToken?: string;
};

export type Driver = {
  id?: string;
  _id?: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  Model: string;
  notificationsToken?: string;
  color?: { name: string; code: string };
  orderId: string;
  ville: string;
  pay: string;
  createdAt: Date;
  document: [];
};

export type PromoCodes = {
  id: string;
  promoCode: string;
  storePercent: number;
  defaultPercent: number;
  totalPercent: number;
  storeSubs: string[];
  content: string;
  expiringDate: number;
  dateFinish: string;
};

export type Coupon = {
  id: string;
  percent: number;
};

export type DriverPositions = {
  id?: string;
  postionsDriver: number[];
};

export type UnavailableProduct = {
  id: string;
  title: string;
  category: string | null;
};
