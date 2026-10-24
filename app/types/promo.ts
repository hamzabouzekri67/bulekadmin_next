export type DeliveryBearer = "store" | "app" | "both";

export interface PromoCodeItem {
  id?: string;
  _id?: string;
  promoCode: string;
  content: string;
  storePercent: number;
  defaultPercent: number;
  totalPercent: number;
  expiringDate: number;
  dateFinish: string;
  minOrderAmount: number;
  maxDiscountAmount: number;
  deliveryDiscount: number;
  isFirstOrderOnly: boolean;
  deliveryBearer: DeliveryBearer;
  imagePromo: string | null;
  radius: number;
  isActive: boolean;
  usageLimitPerUser: number;
  cities: string[];
  restaurantId?: string | null;
  center?: {
    type?: string;
    coordinates?: [number, number];
  };
  timeSlot?: {
    from?: number;
    to?: number;
    timezone?: string;
    daysOfWeek?: number[];
  };
}

export interface PromoApiResult<T> {
  status?: boolean;
  message?: string;
  result?: T;
}
