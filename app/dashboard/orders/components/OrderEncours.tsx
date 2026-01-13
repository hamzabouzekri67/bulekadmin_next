"use client";

import { Order } from "@/app/types/Orders";
import Link from "next/link";
import { useEffect, useState } from "react";

interface NewOrdersProps {
  orderEncours: Order[];
}

export default function OrderEncours({ orderEncours }: NewOrdersProps) {
    const dateNow = useDateNowTimer();
    const diffTimer = (orderTime: number) => {
    const duration = orderTime - dateNow;
    const absDuration = Math.abs(duration);
    
    const days = Math.floor(absDuration / (1000 * 60 * 60 * 24));
    const hours = Math.floor(absDuration / (1000 * 60 * 60));
    const minutes = Math.floor(absDuration / (1000 * 60));

   let result = "";
  if (days !== 0) result = `${days} jour`;
  else if (hours !== 0) result = `${hours} h`;
  else if (minutes !== 0) result = `${minutes} min`;
  else result = "0 min";

  // أضف علامة سالب إذا الوقت انتهى
  return duration < 0 ? `-${result}` : result;
  };
  return (
    <div>
      <h1 className="text-xl font-bold pl-2">
        Commandes en cours ({orderEncours.length})
      </h1>

      {orderEncours.length === 0 ? (
        <h1 className="px-2 pt-4 text-gray-500">
          Aucune commande n&apos;est en cours
        </h1>
      ) : (
        <div className="pt-3 space-y-2">
          {orderEncours.map((order) => (
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

             <div
                className={`text-md mr-3 whitespace-nowrap ${
                order.timeOrder && diffTimer(order.timePredictable)!.startsWith("-")
                    ? "text-red-600"
                    : "text-green-700"
                }`}
                >
                {`${diffTimer(order.timePredictable)}`}
            </div>


              <Link
                href={`/dashboard/orders/${order.id}`}
                className="text-blue-600 hover:underline text-md"
              >
                Voir
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function useDateNowTimer() {
  const [dateTime, setDateTime] = useState<number>(Date.now());

  useEffect(() => {
    // تحديث كل دقيقة
    const interval = setInterval(() => {
      setDateTime(prev => prev + 60000); // زيادة دقيقة واحدة
    }, 60000);

    // تنظيف عند الخروج
    return () => clearInterval(interval);
  }, [setDateTime]);

  return dateTime;
}