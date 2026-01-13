import { Category, Order } from "@/app/types/Orders";

const API_URL = process.env.NEXT_PUBLIC_API_URL
const FETCH_MENU_STORE =process.env.NEXT_PUBLIC_FETCH_MENU_STORE
export async function GetProducts(storeId: string, setCategory: (val: Category[]) => void, orderId: string | null, setOrder: (val: Order | null) => void) {

     try {
      const url = `${API_URL}${FETCH_MENU_STORE}`    
    
      const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({"storeId": storeId ,"orderId":orderId}),
     });
 
     if (res.ok) {
        const data = await res.json()
        //console.log(data.result.order);
        if (data.result.products.category) {
         setCategory(data.result.products.category)
        }
        if (data.result.order) {
         //console.log(data.result.order);
         
         setOrder(data.result.order)
        }
        
        return !!data.result
     }else {
        return false
     }
 
   } catch (error) {
      return false
   }
    
}