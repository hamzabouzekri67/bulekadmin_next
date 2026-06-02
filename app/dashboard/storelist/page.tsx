"use client";
import { Filter, Search, Store, MapPin, Phone, Eye } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  acceptedStoreSent,
  GetStoreList,
  handleOnlineStatus,
} from "./api/storeHandel";
import { useUser } from "@/app/context/UserContext";
import { StoreData } from "@/app/types/store";

const tabs = [
  { id: "online", label: "En ligne" },
  { id: "offline", label: "Hors ligne" },
  { id: "sent", label: "En attente" },
  { id: "accepted", label: "Accepté" },
  { id: "disabled", label: "Désactivé" },
];

export default function ListStore() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("online");
  const [storeData, setStoreData] = useState<StoreData[]>([]);

  // 1. إضافة حالة لتخزين نص البحث
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user) return;
    GetStoreList(user, activeTab, setStoreData);
  }, [user, activeTab]);

  // 2. منطق التصفية (البحث بالاسم أو الرقم)
  const filteredStores = useMemo(() => {
    return storeData.filter((store) => {
      const name = store.nameEtabliss?.toLowerCase() || "";
      const phone = store.phoneNumber?.toString() || "";
      const query = searchQuery.toLowerCase();

      return name.includes(query) || phone.includes(query);
    });
  }, [storeData, searchQuery]);

  return (
    <div
      className="p-4 md:p-10 bg-[#F6F6F6] min-h-screen font-sans text-black"
      dir="ltr"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-black uppercase">
            Magasin
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">
            Gestion de la plateforme logistique
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-8 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setSearchQuery(""); // اختياري: تصفير البحث عند تغيير التبويب
            }}
            className={`px-8 py-4 whitespace-nowrap text-xs font-bold uppercase tracking-widest transition-all duration-200 ${
              activeTab === tab.id
                ? "border-b-4 border-red-600 text-black"
                : "text-gray-400 hover:text-black"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. شريط البحث المحدث */}
      <div className="bg-white p-2 rounded-none shadow-sm mb-6 border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-0 items-center justify-between">
          <div className="relative w-full lg:max-w-xl">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Rechercher par nom ou numéro..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} // تحديث النص عند الكتابة
              className="w-full pl-12 pr-4 py-4 bg-transparent outline-none text-sm font-medium"
            />
          </div>

          <div className="flex w-full lg:w-auto border-t lg:border-t-0 lg:border-l border-gray-100">
            <button className="flex items-center gap-3 px-8 py-4 text-sm font-bold hover:bg-gray-50 transition-colors text-black">
              <Filter size={18} className="text-red-600" />
              <span className="uppercase tracking-widest">Filtres</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-none shadow-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-black text-[13px] uppercase tracking-[0.2em] font-bold">
                <th className="px-6 py-5">Établissement</th>
                <th className="px-6 py-5 text-center">Disponibilité</th>
                <th className="px-6 py-5">Contact</th>
                <th className="px-6 py-5">Catégorie</th>
                <th className="px-6 py-5">Statut</th>
                <th className="px-6 py-5 text-right">Localisation</th>
                <th className="px-6 py-5 text-right">Store</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {/* 4. عرض البيانات المصفاة بدلاً من storeData */}
              {filteredStores.length > 0 ? (
                filteredStores.map((v, i) => (
                  <tr
                    key={i}
                    className="hover:bg-gray-50 transition-colors group"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="bg-gray-100 p-3 rounded-none group-hover:bg-red-50 transition-colors">
                          <Store
                            size={20}
                            className="text-black group-hover:text-red-600"
                          />
                        </div>
                        <div>
                          <div className="font-bold text-base text-black">
                            {v.nameEtabliss}
                          </div>
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                            {v.createdAt}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      {v.status === "completed" ? (
                        <div className="flex items-center justify-center">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={v.isOpen || false}
                              onChange={async () => {
                                const data = await handleOnlineStatus(
                                  v,
                                  !v.isOpen,
                                );
                                if (data !== null) {
                                  setStoreData((prev) =>
                                    prev.map((d) =>
                                      d._id === v._id
                                        ? { ...d, isOpen: data }
                                        : d,
                                    ),
                                  );
                                }
                              }}
                            />
                            <div className="w-12 h-6 bg-gray-400 rounded-none peer peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                            <span className="ms-3 text-[10px] font-black uppercase tracking-widest text-gray-800">
                              {v.isOpen ? "Actif" : "Inactif"}
                            </span>
                          </label>
                        </div>
                      ) : (
                        <div className="text-center text-[10px] font-bold text-gray-400 uppercase">
                          Hors ligne
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-5">
                      <a
                        href={`tel:+${v.phoneNumber}`}
                        className="flex items-center gap-2 text-sm font-bold text-black hover:text-red-600 transition-colors"
                      >
                        <Phone size={14} className="text-red-600" />+
                        {v.phoneNumber}
                      </a>
                    </td>

                    <td className="px-6 py-5 text-[11px] font-bold uppercase">
                      {v.typeEtabliss}
                    </td>

                    <td className="px-6 py-5">
                      {user?.role === "admin" ||
                      user?.role === "super_admin" ? (
                        /* الزر يظهر فقط للـ Admin */
                        <button
                          onClick={async () => {
                            if (v.status === "accepted") return;
                            const status =
                              v.status === "sent"
                                ? "accepted"
                                : v.status === "disabled"
                                  ? "completed"
                                  : "disabled";
                            if (window.confirm("Changer le statut ?")) {
                              const data = await acceptedStoreSent(v, status);
                              if (data != null)
                                setStoreData((prev) =>
                                  prev.map((d) =>
                                    d._id === v._id
                                      ? { ...d, status: data }
                                      : d,
                                  ),
                                );
                            }
                          }}
                          className="text-[10px] font-black uppercase border-b-2 border-black hover:text-blue-600 transition-colors"
                        >
                          {v.status}
                        </button>
                      ) : (
                        /* باقي المستخدمين يرون الحالة كنص فقط ولا يمكنهم الضغط عليها */
                        <span className="text-[10px] font-black uppercase text-slate-500">
                          {v.status}
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-5 text-right">
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1 text-sm font-bold">
                          <MapPin size={14} className="text-red-600" />
                          {v.pays}
                        </div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase">
                          {v.ville}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5 text-right">
                      <div className="flex flex-col items-end">
                        {/* 🌟 فحص ما إذا كانت الحالة هي "sent" لتعطيل الزر */}
                        {v.status === "sent" ? (
                          <div
                            title="لا يمكن الدخول، الطلب أو المتجر أُرسل بالفعل"
                            className="flex items-center gap-1 text-sm font-bold text-gray-400 opacity-40 cursor-not-allowed"
                          >
                            <Eye size={20} />
                          </div>
                        ) : (
                          /* 🌟 إذا كانت الحالة طبيعية وليست "sent"، يظهر الرابط الفعّال */
                          <Link
                            href={{
                              pathname: `/store/${v._id}`,
                              query: { menu: true },
                            }}
                            className="flex items-center gap-1 text-sm font-bold text-red-600 transition-transform duration-200 hover:scale-110 cursor-pointer"
                          >
                            <Eye size={20} />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-20 text-center text-gray-400 font-bold uppercase tracking-widest"
                  >
                    Aucun établissement trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
