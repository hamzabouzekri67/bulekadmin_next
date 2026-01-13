'use client'
import NewOrders from  "./components/NewOrder";
import OrderEncours from  "./components/OrderEncours"
import OrderEnRoute from  "./components/OrderEnRoute"
import { useOrderDetails } from "./controller/useOrderController";



export default function Home() {
  const {newOrders,orderEnCours,orderEnRoute} = useOrderDetails()
  
  return (
   <>
     {/* <div className="flex gap-2 overflow-x-auto px-2 scrollbar scrollbar-thumb-red-500 scrollbar-track-gray-200">
          {items.map((item, index) => (
            <div key={index} className="flex flex-col items-center text-sm font-medium">
              <div className="w-18 h-18 rounded-full overflow-hidden mb-2 relative">
                <Image
                  src={item.image}
                  alt="User avatar"
                  fill
                  className="object-cover"
                />
              </div>
              <div>{item.name}</div>
            </div>
          ))}
      </div>
       */}
      <br/>
       <NewOrders newOrders={newOrders}/>
      <br/>
       <OrderEncours orderEncours={orderEnCours}/>
      <br/>
       <OrderEnRoute orderEnRoute={orderEnRoute}/>
      
   </>
   
  );
}
