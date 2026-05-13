"use client";
import { Order } from "@/app/types/Orders";
import { FetchPendingOrders } from "../Detailes/controller/pendingOrderController";
import { processOrder } from "./api/HandleOrders";
import { useRouter } from "next/navigation"

export default function Detailes() {
  const { newOrders, setNewOrders, user } = FetchPendingOrders();
  const router = useRouter();

  // دالة بدء المعالجة (Prise en charge)
  const handleStartProcessing = async (order: Order) => {
    try {
      // 1. تنفيذ عملية الحجز في السيرفر
      await processOrder({ order, user, setNewOrders , router });

    } catch (error) {
      console.log(error);
      
      alert("Erreur lors de la prise en charge.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-4 sm:p-6 lg:p-10 font-sans">
      <div className="max-w-5xl mx-auto">
        {/* Header: المعلومات الأساسية */}
        <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Nouvelles Commandes
            </h1>
            <p className="text-gray-500 mt-2 font-medium">
              {newOrders.length} commande(s) en attente de traitement
            </p>
          </div>
          <div className="flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-2xl w-fit">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
            </span>
            <span className="font-bold text-sm uppercase">En Direct</span>
          </div>
        </div>

        {/* List of Orders */}
        <div className="grid grid-cols-1 gap-5">
          {newOrders.length === 0 ? (
            <div className="bg-white py-20 rounded-[2rem] shadow-sm border border-gray-100 text-center">
              <p className="text-gray-400 text-lg">
                Aucune nouvelle demande pour le moment.
              </p>
            </div>
          ) : (
            newOrders.map((order, index) => (
              <div
                key={order._id || index}
                className="bg-white shadow-sm border border-gray-100 rounded-[1.5rem] p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:shadow-md group"
              >
                {/* Store Branding & Time */}
                <div className="flex items-center gap-5">
                  <div className="h-14 w-14 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-orange-50 transition-colors">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-7 w-7 text-gray-400 group-hover:text-orange-500 transition-colors"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                      {order.restaurantId?.nameEtabliss || "Boutique Inconnue"}
                    </h2>
                    <div className="flex items-center gap-3 mt-1 text-sm">
                      <span className="text-gray-400 flex items-center gap-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleTimeString(
                              "fr-FR",
                              { hour: "2-digit", minute: "2-digit" },
                            )
                          : "--:--"}
                      </span>
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase">
                        ID: {order.TrackingId || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Primary Action Button */}
                <div className="w-full md:w-auto">
                  <button
                    onClick={() => handleStartProcessing(order)}
                    className="w-full md:min-w-[200px] bg-gray-900 hover:bg-orange-600 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg shadow-gray-200 hover:shadow-orange-200 active:scale-[0.98]"
                  >
                    <span className="text-sm uppercase tracking-wider">
                      Prendre en charge
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
