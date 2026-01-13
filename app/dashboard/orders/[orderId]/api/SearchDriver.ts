import { Order } from "@/app/types/Orders";

const API_URL = process.env.NEXT_PUBLIC_API_URL_BACKEND; 
const SEARCH_DRIVER = process.env.NEXT_PUBLIC_SEARCH_DRIVER


export async function SearchDriver(detailesOrders: Order) {
    try {

      const orderDetailes = {
      orderId: detailesOrders.id,
      restaurantId: detailesOrders.restaurant._id,
      postionsClient: detailesOrders.postionsClient,
      translocation: detailesOrders.translocation,
      timeOrder: detailesOrders.timeOrder,
      positionsEtabliss: detailesOrders.restaurant.postionsEtabliss,
      balanceOrder: detailesOrders.isMonthly?detailesOrders.feedriver:detailesOrders.totalFeePlatform,
     // requestId:DateTime.now().millisecondsSinceEpoch.toString()
      
    };
        //console.log(detailesOrders.restaurant.postionsEtabliss,);
        const url = `${API_URL}${SEARCH_DRIVER}`
        //console.log(url);
        

        const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" ,"Authorization": `Bearer ${detailesOrders.tmpToken || ""}` },
        //credentials: "include",
        body: JSON.stringify(orderDetailes),
        });
        //console.log(res);
        
        if (res.ok) {
           // const data = await res.json()
            //console.log(data);
            
        }
        
        return null
        
    } catch (error) {
        //console.log(error);
        return null
    }
}