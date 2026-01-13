export type DriverStatus = 'sent' | 'completed' | 'disabled';

export type DriverData =  {
  _id: string;
  firstName: string;
  lastName: string;
  Model: string;
  color: { name: string; code: string };
  phoneNumber: string;
  status: DriverStatus; 
  totalOrders: number;
  ville: string;
  online: boolean;
  createdAt: string;
  document:[];
  pay:string;
  balance:number
  isAccountActive:boolean,
  notificationsToken:string,
  postionsDriver: DriverPosition;
}

export interface DriverPosition {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}