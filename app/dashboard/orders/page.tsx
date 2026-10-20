"use client";
import { useRouter } from "next/navigation";
import MyOrders from "./components/myOrder";
import NewOrders from "./components/NewOrder";
import OrderEncours from "./components/OrderEncours";
import OrderEnRoute from "./components/OrderEnRoute";
import { useOrderDetails } from "./controller/useOrderController";
import {
  Users,
  Truck,
  Utensils,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  UtensilsCrossed,
} from "lucide-react";
import { useState } from "react";
import { useUser } from "@/app/context/UserContext";
import NewAutoOrders from "./components/autoAccepted";

export default function Home() {
  const router = useRouter();
  const { user } = useUser();

  // قم بإضافة pendingMenuUpdates (أو الاسم المطابق لديك) من الـ Hook الخاص بالتحكم
  const {
    newOrders,
    myOrders,
    orderEnCours,
    orderEnRoute,
    newAutoOrders,
    stats,
    refetch,
    pendingMenuUpdates = [], // تأكد من إرجاع قائمة التحديثات من useOrderDetails
  } = useOrderDetails();

  const [loading, setLoading] = useState(false);
  const handleRefresh = async () => {
    setLoading(true);
    await refetch();
    setTimeout(() => setLoading(false), 1200);
  };

  if (!user) return null;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* رأس الصفحة مع زر التحديث */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">لوحة التحكم</h1>
        <button
          onClick={handleRefresh}
          className="p-3 bg-white rounded-full shadow-md border border-gray-100 active:scale-95 transition-transform cursor-pointer"
        >
          <RefreshCw
            className={loading ? "animate-spin text-red-500" : "text-gray-600"}
          />
        </button>
      </div>

      {/* دائرة التحميل المركزية (Overlay) */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* قسم الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatCard
          title="إجمالي المستخدمين"
          value={stats?.usersCount || 0}
          icon={<Users size={24} />}
          gradient="from-blue-500 to-blue-700"
        />
        <StatCard
          title="السائقين النشطين"
          value={stats?.driversCount || 0}
          icon={<Truck size={24} />}
          gradient="from-emerald-500 to-emerald-700"
        />
        <StatCard
          title="المطاعم المسجلة"
          value={stats?.restaurantsCount || 0}
          icon={<Utensils size={24} />}
          gradient="from-orange-500 to-orange-700"
        />
      </div>

      {Number(stats.totalProductsPending) > 0 && (
        <div className="mb-8 p-5 bg-red-50 border-r-4 border-red-500 rounded-2xl shadow-sm border">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-500 text-white rounded-xl shadow-md animate-pulse">
                <UtensilsCrossed size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-amber-900 flex items-center gap-2">
                  طلب تحديث القائمة (Menu)
                  <span className="bg-amber-200 text-amber-900 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                    {stats.totalProductsPending} معلق
                  </span>
                </h3>
                <p className="text-sm text-amber-700 mt-0.5">
                  هناك مطاعم قامت بتعديل أسعار أو تفاصيل المنتجات وتنتظر
                  المراجعة والاعتماد.
                </p>
              </div>
            </div>

            <button
              onClick={() => router.push("/dashboard/orders/approvals")}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <span>مراجعة التعديلات</span>
            </button>
          </div>
        </div>
      )}

      {/* قسم الطلبات */}
      <div className="space-y-6">
        {/* إذا كان autoAccepted مفعلاً، نعرض NewAutoOrders وفيها البيانات، وإلا نعرض NewOrders */}
        {user.autoAccepted ? (
          <NewAutoOrders newAutoOrders={newAutoOrders} />
        ) : (
          <NewOrders newOrders={newOrders} />
        )}

        {!user.autoAccepted && <MyOrders myOrders={myOrders} />}

        <OrderEncours orderEncours={orderEnCours} />

        <OrderEnRoute orderEnRoute={orderEnRoute} />
      </div>
    </div>
  );
}

// المكون الفرعي بتصميم احترافي
interface StatProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  gradient: string;
}

function StatCard({ title, value, icon, gradient }: StatProps) {
  const formatNumber = (num: number) => {
    return Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(num || 0);
  };

  return (
    <div
      className={`relative overflow-hidden bg-white p-6 rounded-2xl shadow-lg border-b-4 border-transparent hover:shadow-xl transition-all duration-300 group`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-3xl font-extrabold text-gray-800 tracking-tight">
            +{formatNumber(value)}
            {value >= 1000 && (
              <span className="text-xs text-gray-400 ml-1">
                ({value.toLocaleString()})
              </span>
            )}
          </h3>
        </div>
        <div
          className={`p-3 rounded-lg bg-gradient-to-br ${gradient} text-white shadow-md group-hover:scale-110 transition-transform`}
        >
          {icon}
        </div>
      </div>

      <div
        className={`absolute -bottom-2 -right-2 w-16 h-16 bg-gradient-to-br ${gradient} opacity-5 rounded-full`}
      />
    </div>
  );
}
