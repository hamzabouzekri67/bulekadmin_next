export interface DocumentItem {
  iv: string;
  encryptedData: string;
}

export interface Workday {
  _id: string;
  day: number;      
  time: string;     
  totime: string;   
}

export interface GeoPoint {
  type: "Point";
  coordinates: [number, number];
}

export interface StoreData {
  _id: string;
  clientId: string;
  name: string;
  namefamilly: string;
  nameEtabliss: string;
  pays: string;
  ville: string;
  phoneNumber: string;
  image?: string;
  status: string;
  typeAccount: string;
  typeEtabliss: string;
  isOpen: boolean;
  isAppManagingOrders: boolean;
  feeDeliveryPrcent?: number;
  feedriver?: number;
  limitDelivery?: number;
  location?: GeoPoint;
  postionsEtabliss?: GeoPoint;
  workdays?: Workday[];
  temp_workdays?: Workday[];
  weightedRating?: number;
  avrgRating?: number;
  numRatings?: number;
  compeletedOrderCount?: number;
  document?: DocumentItem[];
  tag?: string[];
  event?: boolean;
  course?: boolean;
  isMonthly?: boolean;
  time?: string;
  timeP?: string | null;
  timeZone?: string;
  amountValue?: number;
  cin?: string | null;
  message?: string | null;
  numberofId?: string;
  createdAt?: string;
  updatedAt?: string;
  notificationsToken?: string;
  __v?: number;
}
