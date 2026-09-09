"use client";
import { useState, useEffect } from "react";
import { GetOrdersHistory } from "./api/history";
import {
  History,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Package,
  Store,
  User,
  Bike,
  CalendarDays,
  Phone,
} from "lucide-react";
import { useUser } from "@/app/context/UserContext";
import { Order } from "@/app/types/Orders";

export default function OrderHistoryPage() {
  const { user } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const response = await GetOrdersHistory(user);
        if (response && response.status && Array.isArray(response.result)) {
          setOrders(response.result);
        }
      } catch (error) {
        console.error("Error fetching order history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  const filteredOrders = orders.filter((order) => {
    const tracking = order.TrackingId?.toLowerCase() || "";
    const clientName =
      `${order.client?.firstName || ""} ${order.client?.lastName || ""}`.toLowerCase();
    const clientPhone = order.client?.phone?.toLowerCase() || "";
    const restoName = order.restaurantId?.nameEtabliss?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();

    return (
      tracking.includes(search) ||
      clientName.includes(search) ||
      clientPhone.includes(search) ||
      restoName.includes(search)
    );
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-gray-50/50">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <History className="text-[#e91818]" size={28} />
            Historique des Commandes
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Affichage des commandes gérées (Dernier mois)
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Rechercher par Tracking, Client, Tél, Resto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#e91818] shadow-sm transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#e91818]"></div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
          <Package size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-600 font-bold text-lg">
            Aucune commande trouvée
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Il n&apos;y a pas d&apos;historique disponible pour le moment.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Tracking</th>
                  <th className="py-3.5 px-6">Date & Heure</th>
                  <th className="py-3.5 px-6">Client</th>
                  <th className="py-3.5 px-6">Téléphone Client</th>
                  <th className="py-3.5 px-6">Restaurant</th>
                  <th className="py-3.5 px-6">Livreur</th>
                  <th className="py-3.5 px-6">Livraison</th>
                  <th className="py-3.5 px-6">Montant Total</th>
                  <th className="py-3.5 px-6">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredOrders.map((order) => {
                  const hasDriver =
                    order.driver && Object.keys(order.driver).length > 0;

                  const orderDate = order.createdAt ? new Date(order.createdAt) : null;
                  const formattedDate = orderDate ? orderDate.toLocaleDateString() : "N/A";
                  const formattedTime = orderDate ? orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";

                  return (
                    <tr
                      key={order._id}
                      className="hover:bg-gray-50/50 transition-colors align-middle"
                    >
                      <td className="py-4 px-6 font-bold text-gray-800">
                        <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md text-xs">
                          #{order.TrackingId || "N/A"}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-xs text-gray-600 whitespace-nowrap">
                        <div className="flex items-center gap-1 font-medium text-gray-800">
                          <CalendarDays size={13} className="text-gray-400" />
                          {formattedDate}
                        </div>
                        <div className="flex items-center gap-1 text-gray-400 mt-0.5">
                          <Clock size={13} />
                          {formattedTime}
                        </div>
                      </td>

                      <td className="py-4 px-6 text-gray-700 font-medium whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <User size={14} className="text-gray-400" />
                          
                        </div>
                      </td>

                      <td className="py-4 px-6 text-gray-600 font-medium whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Phone size={14} className="text-emerald-500" />
                          <span dir="ltr">
                            {order.client?.phone || "N/A"}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-gray-700 font-semibold whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Store size={14} className="text-[#e91818]" />
                          {order.restaurantId?.nameEtabliss || "N/A"}
                        </div>
                      </td>

                      <td className="py-4 px-6 text-xs whitespace-nowrap">
                        {hasDriver ? (
                          <div className="flex items-center gap-1.5 text-gray-600 font-medium">
                            <Bike size={14} className="text-blue-500" />
                            {order.driver!.firstName} {order.driver!.lastName}
                          </div>
                        ) : (
                          <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-semibold">
                            Non assigné
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 font-semibold text-gray-600 whitespace-nowrap">
                        {order.feedelivery ?? 0}{" "}
                        <span className="text-xs font-normal text-gray-400">
                          {order.currency}
                        </span>
                      </td>

                      <td className="py-4 px-6 font-black text-gray-800 whitespace-nowrap">
                        {order.grandTotal}{" "}
                        <span className="text-xs font-normal text-gray-500">
                          {order.currency}
                        </span>
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap">
                        {order.status === "delivered" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                            <CheckCircle2 size={12} /> Livrée
                          </span>
                        ) : order.status === "rejected" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-100">
                            <XCircle size={12} /> Rejetée
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-100">
                            <Clock size={12} /> {order.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}