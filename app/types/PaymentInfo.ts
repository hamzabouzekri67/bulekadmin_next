// نوع العملية
export type OperationType = "add";

// هيكلة بيانات تعبئة الحساب (Payment Info)
export interface PaymentInfo {
  _id: string;
  driverId: string;
  balance: number;
  typeOperation: string;
  description: string;
  nameEtabliss: string;
  image: string | null;
  orderId: string | null;
  storeId: string | null;
  createdAt: string; 
}

export type AmountItem = {
  id: string;
  amount: number;
  bonus: number;
  notificationsToken?:string
  driverId?:string
};
