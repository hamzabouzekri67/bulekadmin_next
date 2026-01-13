import { User } from "@/app/context/UserContext";
import { Order, UnavailableProduct } from "@/app/types/Orders";
import { Dispatch, SetStateAction } from "react";


const API_URL = process.env.NEXT_PUBLIC_API_URL_BACKEND;
const ACCEPTED_ORDER_PATH = process.env.NEXT_PUBLIC_ACCEPTED_BACKEND
const REJECT_ORDER_PATH = process.env.NEXT_PUBLIC_REJECT_ORDER

export async function AcceptedOrders(orders: Order, minutes: number, user: User, newOrders: Order[], setNewOrders: (val: Order[]) => void) {
    try {
        const url = `${API_URL}${ACCEPTED_ORDER_PATH}`;
        const detailesOrder = {
        "timePrepare": minutes,
        "orderId": orders.id,
        "restaurantId": orders.restaurant._id,
        "translocation": orders.translocation,
        "timeOrder": orders.timeOrder,
        "positionsEtabliss": orders.restaurant.postionsEtabliss,
        "notificationsToken": orders.send.notificationsToken,
        "data": orders,
        'assistedBy': user.id,
      };

        //console.log(url);
        

       const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" ,"Authorization": `Bearer ${orders.tmpToken || ""}` },
        //credentials: "include",
        body: JSON.stringify({"orderDetailes": detailesOrder,}),
        });

       // //console.log(res);
        
        if (res.ok) {
            //const data =await res.json();   
            const updated = newOrders.filter(o => o.id !== orders.id);
            setNewOrders(updated)
            //console.log(updated);
            
         return 
        }
    //     return null
        
    } catch (error) {
        //console.log(error);
        return null
    }
 
}

type RejetecOrder = {
  order: Order | null;
  unavailableProducts: UnavailableProduct[]
  user:User | null
  indexMessage:number|0
  setNewOrders: Dispatch<SetStateAction<Order[]>>
};

export async function RejectedOrders({order,unavailableProducts,user,indexMessage,setNewOrders}:RejetecOrder) {
    try {
        const url = `${API_URL}${REJECT_ORDER_PATH}`;
      
        //console.log(url);
        

       const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" ,"Authorization": `Bearer ${order?.tmpToken || "" }` },
        body: JSON.stringify({
          "orderId": order?._id,
          "notificationsToken": order?.send.notificationsToken,
          "message": order?.message,
          "itemRejected": unavailableProducts,
          "assistedBy": user?.id,
          "indexMessage":indexMessage
        }),
        });

        
        if (res.ok) {
           
            const data = await res.json()

            if (data && data.rejectedOrder) {
            if (!data.rejectedOrder.status) return   
            
            setNewOrders(prev => prev.filter(e => e._id !== order?._id));

            }
            
          
            
         return 
        }
    //     return null
        
    } catch (error) {
        //console.log(error);
        return null
    }
 
}