export interface Promotion {
  _id: string;
  addId: string | null;
  title: string;
  description: string;
  discountValue: number;
  duration: string;       
  startDate: string;   
  endDate: string;        
  isActive: boolean;
  total: number;
  type: ""
}
