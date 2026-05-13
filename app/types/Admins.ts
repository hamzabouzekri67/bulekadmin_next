// app/types/Admins.ts

export type AdminRole = 'super_admin' | 'admin' | 'manager';

export interface AdminData {
  id: string;
  userName: string;
  lastName: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  phoneNumber?: string;
  lastLogin?: string;
  createdAt: string;
  permissions: string[]; 
  assignedCity?: string;
  ville:string
  balance:number
  currency:number
}

export interface CreateAdminInput {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: AdminRole;
  phoneNumber: string;
  assignedCity?: string;
}