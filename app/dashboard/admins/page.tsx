"use client";
import React, { useEffect, useState } from "react";
import {
  Search,
  ShieldCheck,
  Eye,
  UserPlus,
  MapPin,
  MoreVertical,
} from "lucide-react";
import { useUser } from "@/app/context/UserContext";
import Link from "next/link";
import { GetAdminsList } from "../admins/api/GetListAdmins";
import { AdminData } from "@/app/types/Admins";
import { useRouter } from "next/navigation";

const tabs = [
  { id: "active", label: "Actifs" },
  { id: "inactive", label: "Inactifs" },
];

const AdminsPage = () => {
  const { user, loading: authLoading } = useUser();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("active");
  const [adminData, setAdminData] = useState<AdminData[]>([]);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user || user.role !== "super_admin") {
      router.replace("/dashboard");
    } else {
      setIsAuthorized(true);
      GetAdminsList(user, activeTab, setAdminData,router);
    }
  }, [user, activeTab, router, authLoading]);

  if (authLoading || !isAuthorized) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-11 bg-white min-h-screen font-sans text-black">
      {/* Header - بسيط ومباشر */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Gestion des Admins
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Gérez les accès et les comptes administratifs du système.
          </p>
        </div>
        <button className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl hover:bg-red-600 transition-all duration-300 shadow-lg shadow-black/5 font-bold text-sm uppercase">
          <UserPlus size={18} />
          Nouveau Compte
        </button>
      </div>

      {/* Control Bar - الفلترة والبحث */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 animate-in fade-in duration-700 delay-100">
        <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? "bg-white text-black shadow-sm"
                  : "text-gray-500 hover:text-black"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Rechercher un admin..."
            className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-red-600 outline-none text-sm transition-all"
          />
        </div>
      </div>

      {/* Grid Layout - أفضل من الجدول العادي للموبايل والجمالية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
        {adminData.map((admin, index) => (
          <div
            key={admin.id}
            className="group p-6 border border-gray-100 rounded-2xl hover:border-red-600/20 hover:shadow-xl hover:shadow-red-600/5 transition-all duration-300 relative"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-gray-100 text-black rounded-xl flex items-center justify-center font-bold text-lg group-hover:bg-red-600 group-hover:text-white transition-colors duration-300">
                {admin.userName.charAt(0).toUpperCase()}
              </div>
              <div
                className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${admin.isActive ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"}`}
              >
                {admin.isActive ? "En ligne" : "Hors ligne"}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-bold text-lg truncate flex items-center gap-2">
                {admin.userName.split("@")[0]}
                {admin.role === "super_admin" && (
                  <ShieldCheck size={16} className="text-red-600" />
                )}
              </h3>
              <p className="text-gray-400 text-xs flex items-center gap-1 mt-1 font-medium">
                <MapPin size={12} /> {admin.ville}
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  Solde
                </p>
                <p className="font-black text-black">
                  {admin.balance.toLocaleString()}{" "}
                  <span className="text-red-600 text-[10px]">DZD</span>
                </p>
              </div>

              <Link href={`/dashboard/admins/details?id=${admin.id}`}>
                <button className="flex items-center gap-2 bg-gray-50 text-black px-4 py-2 rounded-lg hover:bg-black hover:text-white transition-all text-xs font-bold uppercase">
                  <Eye size={14} />
                  Détails
                </button>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {adminData.length === 0 && (
        <div className="py-20 text-center animate-in fade-in duration-500">
          <p className="text-gray-400 font-medium">
            Aucun administrateur trouvé.
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminsPage;
