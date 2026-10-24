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
  MapPin,
  ShieldCheck,
  Headset,
} from "lucide-react";
import { useUser } from "@/app/context/UserContext";
import { Order } from "@/app/types/Orders";
import { AnnuleOrder } from "../details/api/GetDetailesOrder";

const CANCEL_REASONS = [
  "Erreur dans le contenu de la commande (خطأ في محتويات الطلب أو تفاصيله)",
  "Affluence excessive / Cuisine débordée (ضغط كبير في المطبخ / عدم القدرة على تلبية الطلب حالياً)",
  "Client injoignable par téléphone (الزبون لا يرد على الاتصالات الهاتفية لتأكيد الطلب)",
  "Adresse de livraison incorrecte ou hors zone (عنوان التوصيل غير صحيح أو خارج نطاق التغطية)",
  "Demande du client d'annuler la commande (الزبون طلب إلغاء الطلب بنفسه)",
];

function isOpenOrder(status: string | undefined): boolean {
  const value = (status ?? "").toLowerCase();
  return (
    value !== "rejected" &&
    value !== "completed" &&
    value !== "incompleted" &&
    value !== "delivered"
  );
}

interface VilleGroup {
  ville: string;
  orders: Order[];
}

export default function OrderHistoryPage() {
  const { user } = useUser();
  const [ordersData, setOrdersData] = useState<Order[] | VilleGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [selectedReason, setSelectedReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  
  // ولاية التبويب النشطة حالياً للـ Super Admin
  const [activeTab, setActiveTab] = useState<string>("");

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const response = await GetOrdersHistory(user);
        if (response && response.status && Array.isArray(response.result)) {
          setOrdersData(response.result);
          if (user.role === "super_admin" && response.result.length > 0) {
            setActiveTab(response.result[0].ville);
          }
        }
      } catch (error) {
        console.error("Error fetching order history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  const isSuperAdmin = user?.role === "super_admin";

  const confirmCancel = async () => {
    if (!cancelId || !selectedReason || cancelling) return;
    setCancelling(true);
    const data = await AnnuleOrder(user, cancelId, selectedReason);
    if (data?.status) {
      setOrdersData((current) => {
        if (current.length > 0 && "orders" in current[0]) {
          return (current as VilleGroup[]).map((group) => ({
            ...group,
            orders: group.orders.map((order) =>
              order._id === cancelId ? { ...order, status: "rejected" } : order,
            ),
          }));
        }
        return (current as Order[]).map((order) =>
          order._id === cancelId ? { ...order, status: "rejected" } : order,
        );
      });
      setCancelId(null);
      setSelectedReason("");
    }
    setCancelling(false);
  };

  // دالة مساعدة للبحث داخل الطلب (تتضمن الولاية أيضاً للـ Admin/Agent)
  const matchesSearch = (order: Order) => {
    const tracking = order.TrackingId?.toLowerCase() || "";
    const clientName =
      `${order.client?.firstName || ""} ${order.client?.lastName || ""}`.toLowerCase();
    const clientPhone = order.client?.phone?.toLowerCase() || "";
    const restoName = order.restaurantId?.nameEtabliss?.toLowerCase() || "";
    const villeName = order.ville?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();

    return (
      tracking.includes(search) ||
      clientName.includes(search) ||
      clientPhone.includes(search) ||
      restoName.includes(search) ||
      villeName.includes(search)
    );
  };

  const wilayasList = isSuperAdmin ? (ordersData as VilleGroup[]).map((g) => g.ville) : [];

  let displayedContent: VilleGroup[] | Order[] = [];

  if (isSuperAdmin) {
    const groups = ordersData as VilleGroup[];
    const searchedGroups = groups
      .map((group) => ({
        ville: group.ville,
        orders: group.orders.filter(matchesSearch),
      }))
      .filter((group) => group.orders.length > 0);

    displayedContent = searchedGroups.filter((group) => group.ville === activeTab);
  } else {
    displayedContent = (ordersData as Order[]).filter(matchesSearch);
  }

  // مكون فرعي لعرض الجدول
  const renderOrdersTable = (ordersList: Order[]) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              <th className="py-3.5 px-6">Tracking</th>
              <th className="py-3.5 px-6">Date & Heure</th>
              {/* إظهار عمود الولاية للـ Admin و Agent */}
              {!isSuperAdmin && <th className="py-3.5 px-6">Wilaya</th>}
              <th className="py-3.5 px-6">Client</th>
              <th className="py-3.5 px-6">Restaurant</th>
              {isSuperAdmin && (
                <>
                  <th className="py-3.5 px-6">Agent المكلف</th>
                  <th className="py-3.5 px-6">Admin المسؤول</th>
                </>
              )}
              <th className="py-3.5 px-6">Livreur</th>
              <th className="py-3.5 px-6">Livraison</th>
              <th className="py-3.5 px-6">Montant Total</th>
              <th className="py-3.5 px-6">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {ordersList.map((order) => {
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

                  {/* عرض الولاية للـ Admin و Agent */}
                  {!isSuperAdmin && (
                    <td className="py-4 px-6 text-gray-700 font-medium whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-[#e91818]" />
                        <span>{order.ville || "N/A"}</span>
                      </div>
                    </td>
                  )}

                  {/* بيانات العميل والهاتف */}
                  <td className="py-4 px-6 text-gray-700 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 font-medium">
                      <User size={14} className="text-gray-400" />
                      <span>{order.client?.firstName} {order.client?.lastName}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                      <Phone size={12} className="text-emerald-500" />
                      <span dir="ltr">{order.client?.phone || "N/A"}</span>
                    </div>
                  </td>

                  <td className="py-4 px-6 text-gray-700 font-semibold whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Store size={14} className="text-[#e91818]" />
                      {order.restaurantId?.nameEtabliss || "N/A"}
                    </div>
                  </td>

                  {/* خانة Agent المكلف (تظهر للـ Super Admin فقط) */}
                  

                  {/* خانة Admin المسؤول (تظهر للـ Super Admin فقط) */}
                  {isSuperAdmin && (
                    <td className="py-4 px-6 text-xs whitespace-nowrap">
                      {order.assistedBy ? (
                        <div>
                          <div className="flex items-center gap-1.5 font-semibold text-gray-800">
                            <ShieldCheck size={14} className="text-purple-500" />
                            {order.assistedBy.userName}
                          </div>
                        
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Non assigné</span>
                      )}
                    </td>
                  )}

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
                    {isSuperAdmin && isOpenOrder(order.status) && (
                      <button
                        type="button"
                        onClick={() => setCancelId(order._id)}
                        className="mt-2 block px-2.5 py-1 rounded-lg text-xs font-bold text-red-600 bg-red-50 border border-red-100"
                      >
                        Annuler
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-gray-50/50">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <History className="text-[#e91818]" size={28} />
            Historique des Commandes
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isSuperAdmin
              ? "Gestion des dernières commandes par wilaya avec détails des agents et admins"
              : "Affichage des commandes gérées (Dernier mois)"}
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Rechercher par Tracking, Wilaya, Client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#e91818] shadow-sm transition-all"
          />
        </div>
      </div>

      {/* شريط الـ TabBar للولايات (خاص بالـ Super Admin فقط) */}
      {isSuperAdmin && wilayasList.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
          {wilayasList.map((villeName) => (
            <button
              key={villeName}
              onClick={() => setActiveTab(villeName)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all shadow-sm ${
                activeTab === villeName
                  ? "bg-[#e91818] text-white shadow-md shadow-red-500/20"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              <MapPin size={16} />
              {villeName}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#e91818]"></div>
        </div>
      ) : displayedContent.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
          <Package size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-600 font-bold text-lg">
            Aucune commande trouvée
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Il n&apos;y a pas d&apos;historique disponible pour le moment.
          </p>
        </div>
      ) : isSuperAdmin ? (
        <div className="space-y-6">
          {(displayedContent as VilleGroup[]).map((group) => (
            <div key={group.ville} className="space-y-3">
              <div className="flex items-center gap-2 bg-white px-5 py-3 rounded-xl border border-gray-100 shadow-sm w-fit">
                <MapPin className="text-[#e91818]" size={20} />
                <h2 className="text-base font-bold text-gray-800">
                  Wilaya : <span className="text-[#e91818]">{group.ville}</span>
                </h2>
                <span className="text-xs bg-gray-100 px-2.5 py-1 rounded-full font-semibold text-gray-600 ml-2">
                  {group.orders.length} commandes
                </span>
              </div>
              {renderOrdersTable(group.orders)}
            </div>
          ))}
        </div>
      ) : (
        renderOrdersTable(displayedContent as Order[])
      )}

      {cancelId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-800">
              Annuler la commande
            </h3>
            <div className="space-y-2">
              {CANCEL_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${
                    selectedReason === reason
                      ? "border-red-500 bg-red-50/50"
                      : "border-gray-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="historyCancelReason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(event) => setSelectedReason(event.target.value)}
                  />
                  <span className="text-sm text-gray-700">{reason}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  setCancelId(null);
                  setSelectedReason("");
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={confirmCancel}
                disabled={!selectedReason || cancelling}
                className="px-4 py-2 rounded-lg text-sm text-white bg-red-600 disabled:bg-gray-300"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}