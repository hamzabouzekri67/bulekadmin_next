"use client";
import React, { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Bike,
  Phone,
  MapPin,
  Package,
  Wallet,
  ChevronRight,
  Eye,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { GetDriverList, handelAccountDriver } from "./api/GetListDriver";
import { useUser } from "@/app/context/UserContext";
import { DriverData, DriverStatus } from "@/app/types/Drivers";
import Link from "next/link";
import { useRouter } from "next/navigation";

const tabs = [
  { id: "online", label: "En ligne" },
  { id: "offline", label: "Hors ligne" },
  { id: "sent", label: "En attente" }, // التبويب المهم للمراجعة
  { id: "disabled", label: "Désactivé" },
];

const VehiclesPage = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("online");
  const [driverData, setDriverData] = useState<DriverData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter()


  useEffect(() => {
    if (!user) return;
    GetDriverList(user, activeTab, setDriverData,router);
  }, [user, activeTab]);

  // تصفية البحث محلياً
  const filteredDrivers = driverData.filter(
    (d) =>
      d.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.ville.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="p-6 md:p-10 bg-[#fcfcfc] min-h-screen font-sans" dir="ltr">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div>
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
              Logistics Management
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Flotte de Véhicules
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Supervisez vos livreurs et performances en temps réel.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="group bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-2xl flex items-center gap-3 transition-all shadow-lg shadow-red-600/20 active:scale-95">
            <div className="bg-white/20 p-1 rounded-lg group-hover:rotate-90 transition-transform">
              <Plus size={18} />
            </div>
            <span className="font-bold text-sm">Ajouter un Livreur</span>
          </button>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        {/* Navigation & Filters Bar */}
        <div className="p-4 md:p-6 border-b border-slate-50 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Custom Tabs */}
            <div className="flex bg-slate-50 p-1.5 rounded-2xl w-fit">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                    activeTab === tab.id
                      ? "bg-white text-red-600 shadow-sm ring-1 ring-black/5"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative group min-w-[300px]">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-red-500 transition-colors"
                size={18}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par nom, ville..."
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-red-500/20 outline-none text-sm font-medium transition-all"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-slate-400 text-[10px] uppercase tracking-[0.15em] font-black border-b border-slate-50">
                <th className="px-8 py-5 text-left">Livreur Profil</th>
                <th className="px-6 py-5 text-center">Service</th>
                <th className="px-6 py-5 text-left">Documents</th>
                <th className="px-6 py-5 text-left">Stats & Zone</th>
                <th className="px-6 py-5 text-left">Finance</th>
                {(user?.role === "admin" || user?.role === "super_admin") && (
                  <th className="px-8 py-5 text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredDrivers.map((v, i) => (
                <tr
                  key={i}
                  className="hover:bg-slate-50/50 transition-colors group"
                >
                  {/* Profil */}
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 group-hover:bg-red-600 group-hover:text-white transition-all duration-300">
                          <Bike size={22} />
                        </div>
                        <div
                          className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${v.isAccountActive ? "bg-green-500" : "bg-slate-300"}`}
                        />
                      </div>
                      <div>
                        <div className="font-black text-slate-900 text-sm tracking-tight">
                          {v.firstName} {v.lastName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                          {v.Model || "Standard"}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Toggle Service */}
                  <td className="px-6 py-5">
                    <div className="flex flex-col items-center gap-2">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          disabled={v.status === "sent"} // تعطيل التبديل إذا لم يتم القبول بعد
                          checked={v.isAccountActive || false}
                          onChange={async () => {
                            const newState = !v.isAccountActive;
                            await handelAccountDriver(v, newState);
                            setDriverData((prev) =>
                              prev.map((d) =>
                                d._id === v._id
                                  ? { ...d, isAccountActive: newState }
                                  : d,
                              ),
                            );
                          }}
                        />
                        <div className="w-10 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-red-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all shadow-inner"></div>
                      </label>
                      <span
                        className={`text-[9px] font-black uppercase ${v.isAccountActive ? "text-red-600" : "text-slate-400"}`}
                      >
                        {v.isAccountActive ? "En Service" : "Pause"}
                      </span>
                    </div>
                  </td>

                  {/* New: Documents Status Column */}
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1">
                      {v.status === "sent" ? (
                        <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2 py-1 rounded-md w-fit">
                          <Clock size={12} className="animate-spin-slow" />
                          <span className="text-[10px] font-bold uppercase tracking-tighter">
                            À Réviser
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-green-600 bg-green-50 px-2 py-1 rounded-md w-fit">
                          <CheckCircle2 size={12} />
                          <span className="text-[10px] font-bold uppercase tracking-tighter">
                            Vérifié
                          </span>
                        </div>
                      )}
                      <div className="flex gap-1">
                        <div
                          className="w-1.5 h-1.5 rounded-full bg-blue-400"
                          title="Permis"
                        />
                        <div
                          className="w-1.5 h-1.5 rounded-full bg-blue-400"
                          title="Carte Grise"
                        />
                      </div>
                    </div>
                  </td>

                  {/* Contact & Zone */}
                  <td className="px-6 py-5">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone size={14} className="text-slate-300" />
                        <span className="text-xs font-bold">
                          +{v.phoneNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <MapPin size={14} className="text-red-300" />
                        <span className="text-[11px] font-medium">
                          {v.ville}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Finance */}
                  <td className="px-6 py-5">
                    <div className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 w-fit">
                      <div className="flex items-center gap-1.5 text-slate-900 font-black text-sm">
                        <Wallet size={14} className="text-red-500" />
                        {v.balance}{" "}
                        <span className="text-[10px] text-slate-400 ml-1">
                          DZD
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Actions: Conditional Rendering */}
                  {/* Actions: Conditional Rendering */}
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      {/* زر المراجعة يظهر للجميع إذا كانت الحالة sent */}
                      {v.status === "sent" && (
                        <Link href={`/dashboard/drivers/review/details?id=${v._id}`}>
                          <button className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95">
                            <FileText size={14} />
                            Réviser
                          </button>
                        </Link>
                      )}

                      {/* زر التفاصيل يظهر فقط إذا لم تكن الحالة sent وشرط الرتبة محقق */}
                      {v.status !== "sent" &&
                        (user?.role === "admin" ||
                          user?.role === "super_admin") && (
                          <Link href={`/dashboard/drivers/details?id=${v._id}`}>
                            <button className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-red-600 transition-all shadow-sm active:scale-95">
                              <Eye size={14} />
                              Détails
                            </button>
                          </Link>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50/50 flex justify-between items-center">
          <p className="text-xs text-slate-400 font-medium italic">
            Affichage de {filteredDrivers.length} livreurs
          </p>
          <div className="flex gap-2">
            <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-red-600 transition-colors">
              <ChevronRight size={16} className="rotate-180" />
            </button>
            <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-red-600 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehiclesPage;
