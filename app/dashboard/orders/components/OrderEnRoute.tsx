import { Order } from "@/app/types/Orders";
import Link from "next/link";

interface NewOrdersProps {
  orderEnRoute: Order[];
}
export default function orderEnRoute({orderEnRoute}:NewOrdersProps){
    return (
         <div>
      <h1 className="text-xl font-bold pl-2">
        Commandes en Route ({orderEnRoute.length})
      </h1>

      {orderEnRoute.length === 0 ? (
        <h1 className="px-2 pt-3 text-gray-600 text-sm">
          Aucune commande n&apos;est en cours
        </h1>
      ) : (
        <div className="pt-3 space-y-2">
          {orderEnRoute.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm hover:shadow transition cursor-pointer"
            >
              <div className="flex flex-col">
                <span className="font-medium text-lg">
                 {order.send.firstName}
                </span>
                
                 <span className="font-medium text-xs">
                 {order.restaurant.nameEtabliss}
                </span>
              </div>
              
            <div>
                <Link
                href={`/dashboard/orders/${order.id}`}
                className="text-blue-600 hover:underline text-md"
               >
                Voir
              </Link>
            </div>

            </div>
          ))}
        </div>
      )}
    </div>
    )
}