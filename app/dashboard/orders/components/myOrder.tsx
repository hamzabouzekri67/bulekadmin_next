import { Order } from "@/app/types/Orders";
import Link from "next/link";

interface NewOrdersProps {
  myOrders: Order[];
}

export default function MyOrders({ myOrders }: NewOrdersProps) {
  return (
    <div>
      {/* تغيير العنوان من Nouvelle commande إلى Mes Commandes */}
      <h1 className="text-xl font-bold pl-2">
        Mes commandes ({myOrders.length})
      </h1>
      <br />

      {myOrders.length === 0 ? (
        <h1 className="px-2 text-gray-500">
          Vous n&apos;avez aucune commande en charge
        </h1>
      ) : (
        <div className="flex justify-between px-2 pt-2">
          <Link href="/dashboard/orders/handlerOrders">
            <p className="mb-2 font-semibold text-gray-700">
              Vous gérez {myOrders.length} commande
              {myOrders.length > 1 ? "s" : ""}
            </p>
          </Link>

          <span className="flex items-center justify-center w-6 h-6 bg-red-500 text-white font-bold text-sm rounded-full">
            {myOrders.length || 0}
          </span>
        </div>
      )}
    </div>
  );
}
