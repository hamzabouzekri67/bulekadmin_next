"use client";

export const dynamic = "force-dynamic";
import React, { Suspense, useEffect, useState } from "react";
// أضف هذا السطر في أعلى الملف بعد الـ imports

import {
  Users,
  Wallet,
  History,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  MapPin,
  Eye,
  TrendingUp,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { AddAmountAdmin, GetAgentList } from "./api/GetListAgents";
import { AdminData } from "@/app/types/Admins";
import { useUser } from "@/app/context/UserContext";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminProfileDetails />
    </Suspense>
  );
}

const AdminProfileDetails = () => {
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [activeTab, setActiveTab] = useState("agents");
  const [adminData, setAdminData] = useState<AdminData[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState<AdminData | null>(null);
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "super_admin") {
      router.replace("/dashboard");
    } else {
      setIsAuthorized(true);
      GetAgentList(id as string, setAdminData, setCurrentAdmin);
    }
  }, [id, router, user, authLoading]);

  if (authLoading || !isAuthorized)
    return <div className="h-screen bg-white" />;

  const handleDeposit = async () => {
    setErrorMessage("");
    setIsSubmitting(true);
    try {
      await AddAmountAdmin(user, id as string, amount);
      setAmount("");
      setShowConfirm(false);
      GetAgentList(id as string, setAdminData, setCurrentAdmin);
    } catch (error: unknown) {
      console.error(error);
      setErrorMessage(
        "Une erreur est survenue lors de la recharge. Veuillez réessayer.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-11 bg-white min-h-screen font-sans text-black relative">
      {/* 1. Header */}
      <div className="border-b-2 border-red-600 pb-8 mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-red-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold shadow-sm">
            {currentAdmin?.userName?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {currentAdmin?.userName?.split("@")[0]}
              <ShieldCheck size={20} className="text-red-600" />
            </h1>
            <p className="text-gray-500 text-sm font-medium flex items-center gap-1 uppercase tracking-wider">
              <MapPin size={14} /> {currentAdmin?.ville} • {currentAdmin?.role}
            </p>
          </div>
        </div>

        <div className="text-center md:text-right">
          <p className="text-gray-400 text-[10px] font-bold uppercase mb-1">
            Solde Actuel
          </p>
          <div className="text-4xl font-black">
            {currentAdmin?.balance?.toLocaleString()}
            <span className="text-red-600 ml-2 text-sm uppercase">
              {currentAdmin?.currency || "DZD"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Navigation */}
      <div className="flex gap-4 mb-8">
        {[
          { id: "agents", label: "Agents", icon: Users },
          { id: "recharge", label: "Recharger", icon: Wallet },
          { id: "history", label: "Historique", icon: History },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
              activeTab === tab.id
                ? "bg-red-600 text-white shadow-md scale-105"
                : "bg-gray-50 text-gray-500 hover:bg-gray-100"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          {activeTab === "agents" && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <h3 className="text-xs font-bold uppercase text-gray-400 mb-4 tracking-widest">
                Liste des agents
              </h3>
              <div className="space-y-3">
                {adminData.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-red-200 hover:bg-red-50/30 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center font-bold">
                        {item.userName?.charAt(0).toUpperCase()}
                      </div>
                      <p className="font-bold text-sm uppercase">
                        {item?.userName?.split("@")[0]}
                      </p>
                    </div>
                    <button className="text-gray-400 hover:text-red-600 transition-colors">
                      <Eye size={20} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "recharge" && (
            <div className="animate-in zoom-in-95 duration-300 max-w-md">
              <h3 className="text-xs font-bold uppercase text-gray-400 mb-6 tracking-widest">
                Effectuer une recharge
              </h3>
              <div className="space-y-4">
                <input
                  type="number"
                  placeholder="Montant DZD"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (errorMessage) setErrorMessage("");
                  }}
                  className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-red-600 rounded-xl outline-none font-bold text-2xl transition-all"
                />

                {errorMessage && (
                  <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm font-medium animate-in fade-in">
                    <AlertCircle size={16} />
                    {errorMessage}
                  </div>
                )}

                <button
                  onClick={() =>
                    amount && parseFloat(amount) > 0 && setShowConfirm(true)
                  }
                  disabled={!amount || parseFloat(amount) <= 0}
                  className="w-full py-4 rounded-xl font-bold uppercase text-sm tracking-widest bg-black text-white hover:bg-red-600 shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirmer le montant
                </button>
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div className="animate-in fade-in duration-400">
              <h3 className="text-xs font-bold uppercase text-gray-400 mb-4 tracking-widest">
                Flux financiers
              </h3>
              <div className="border border-gray-100 rounded-2xl divide-y divide-gray-100">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="p-5 flex justify-between items-center"
                  >
                    <div className="flex items-center gap-3">
                      {i % 2 === 0 ? (
                        <ArrowDownLeft className="text-green-500" />
                      ) : (
                        <ArrowUpRight className="text-red-500" />
                      )}
                      <span className="text-sm font-bold">
                        Transaction #{i}482
                      </span>
                    </div>
                    <span
                      className={`font-bold ${i % 2 === 0 ? "text-green-600" : "text-black"}`}
                    >
                      {i % 2 === 0 ? "+" : "-"} 5,000 DZD
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="p-6 border border-gray-100 rounded-3xl">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp size={18} className="text-red-600" />
              <h4 className="text-xs font-bold uppercase">Performance</h4>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-3xl font-black">94%</span>
                <span className="text-[10px] font-bold text-green-500">
                  OPTIMAL
                </span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-600"
                  style={{ width: "94%" }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Dialog (Modal) التأكيد --- */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4">
                <Wallet size={32} />
              </div>
              <h2 className="text-xl font-bold mb-2">Confirmer la recharge</h2>
              <p className="text-gray-500 text-sm mb-6">
                Êtes-vous sûr de vouloir ajouter{" "}
                <span className="font-bold text-black">
                  {parseFloat(amount).toLocaleString()} DZD
                </span>{" "}
                au compte de {currentAdmin?.userName?.split("@")[0]} ?
              </p>

              <div className="flex flex-col w-full gap-3">
                <button
                  onClick={handleDeposit}
                  disabled={isSubmitting}
                  className="w-full py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      En cours...
                    </>
                  ) : (
                    "Oui, Valider"
                  )}
                </button>

                <button
                  onClick={() => !isSubmitting && setShowConfirm(false)}
                  disabled={isSubmitting}
                  className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
