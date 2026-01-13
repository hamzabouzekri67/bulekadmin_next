export type Order = {
  id: string;
  _id:string
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
  assistedBy?: string;

  feeDeliveryPrcent: number;
  feeApplications: number;
  platformFeeStore: number;
  orderTax: number;
  totalFeePlatform: number;
  totalOrderPrice:number;
  restaurantNetAmount:number;
  taxAmount:number

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

  restaurant: Restaurant;
  send: Send;
  driver?: Driver;
  driverPositions?: DriverPositions;

  promoCodes?: PromoCodes;
  coupon?: Coupon;
  orderCompleted:number

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
  listSuplement?:  SuplementChoice[];
};

// export type Suplement =  {
//   _id: string; // أو ObjectId
//   choix: SuplementChoice[];
//   requird?: string[];
// }
export type SuplementChoice ={
  id: string;
  _id: string;
  title: string;
  price: string; 
  qty: number;
  status: string;
}

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
  clientId:string
  typeEtabliss: string;
  nameEtabliss: string;
  timeP: string;
  phoneNumber: string;
  image: string;
  currency?: string;
  amountValue: number;
  isOpen: boolean;
  course: boolean;
  notificationsToken?: string;
  postionsEtabliss: Positions;
  category: Category[]
  
};
export type Category = {
  _id: string;
  clientId: string;
  category: string;
  status: "public" | "hidden";
  indexing: number;
  discount: number;
  offer: boolean;
  createdAt: string;
  updatedAt: string;
  products: Product[];
}

export type  Product ={
  _id: string;
  id?: string;
  title: string;
  price: string;
  totla: number;
  image: string;
  status: "public" | "hidden";
  currency: string;
  categoryId: string;
  clientId: string;
  createdAt: string;
  updatedAt: string;
  ratings: unknown[];
  supplements: Supplement[];
  supIds: string[];
  
}

export type  Supplement = {
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
}

export type SupplementItem ={
  _id: string;
  id: string;
  name: string;
  plusPrice: string;
}


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
  orderId:string
  ville:string
  pay:string
  createdAt:Date
  document:[]
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