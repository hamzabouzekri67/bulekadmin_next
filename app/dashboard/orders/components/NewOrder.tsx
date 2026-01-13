import { Order } from "@/app/types/Orders";
import Link from "next/link";

interface NewOrdersProps {
  newOrders: Order[];
}

export default function newOrders({newOrders}:NewOrdersProps){
    
  return (
  <div>
    <h1 className="text-xl font-bold pl-2">
      Nouvelle commande({newOrders.length})
    </h1>  
    <br/>

    {newOrders.length === 0 ? (
      <h1 className="px-2 text-gray-500">Aucune nouvelle demande</h1>
    ) : (
      <div className="flex justify-between px-2 pt-2">
        
        <Link href='orders/Detailes'>

          <p className="mb-2 font-semibold text-gray-700">
          Vous avez {newOrders.length} nouvelle{newOrders.length > 1 ? "s" : ""} commande{newOrders.length > 1 ? "s" : ""}
          </p>

        </Link>
       

        <span className="flex items-center justify-center w-6 h-6 bg-red-500 text-white font-bold text-sm rounded-full">
        {newOrders.length || 0}
      </span>
      </div>
    )}
  </div> 
);

}

// Nouvelle commande (0)