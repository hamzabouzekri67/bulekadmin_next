'use client'
import React from 'react';
import { 
  Plus, Search, Filter, 
  MoreHorizontal, Bike,
} from 'lucide-react';


import {GetDriverList ,handelAccountDriver} from './api/GetListDriver'
import {useEffect ,useState  } from "react";
import { useUser  } from "@/app/context/UserContext";

import { DriverData ,DriverStatus  } from "@/app/types/Drivers";
import Link from "next/link";





const tabs = [
    { id: 'online', label: 'En ligne' },
    { id: 'offline', label: 'Hors ligne' },
    { id: 'sent', label: 'En attente' },
    { id: 'disabled', label: 'désactivé' }
  ];

const VehiclesPage = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('online');
  const [DriverData, setDriverData] = useState< DriverData[]>([]);
  
   
  useEffect(()=>{
    if (!user) return
    GetDriverList(user,activeTab,setDriverData)
  },[user,activeTab])


  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen font-sans text-slate-800" dir="ltr">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Véhicules</h1>
          <p className="text-gray-500 text-sm">Gestion complète des véhicules</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-[#1e7b8d] hover:bg-[#165e6b] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-sm text-sm font-medium">
            <Plus size={18} />
            <span>Ajouter un véhicule</span>
          </button>
          <button className="p-2 border rounded-lg bg-white hover:bg-gray-50 text-gray-500">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-2 whitespace-nowrap text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id 
                ? 'border-b-2 border-[#1e7b8d] text-[#1e7b8d]' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher un véhicule..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e7b8d] outline-none text-sm"
            />
          </div>
          
          <div className="flex flex-wrap gap-2 w-full lg:w-auto">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 text-gray-700 ml-auto lg:ml-0">
              <Filter size={16} />
              <span>Filtre avancé</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b text-gray-500 text-[11px] uppercase tracking-wider font-semibold">
                <th className="px-6 py-4">Véhicule</th>
                <th className="px-6 py-4">Réception des demandes</th>
                 <th className="px-6 py-4">numéro de téléphone</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4">Pay</th>
                <th className="px-6 py-4">Ville</th>
                <th className="px-6 py-4">commandes totales</th>
                <th className="px-6 py-4">Solde du compte</th>
                 <th className="px-6 py-4">détails</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {DriverData.map((v, i) => (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 p-2 rounded-full text-[#1e7b8d]">
                        <Bike size={18} />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900">{v.firstName} {v.lastName}</div>
                        <div className="text-[11px] text-gray-400 uppercase">{v.createdAt}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                  <div className="flex items-center justify-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={v.isAccountActive || false} 
                        onChange={async () => {

                          if (v.isAccountActive) {
                               await handelAccountDriver(v,false);
                             
                          }else{
                              await handelAccountDriver(v,true);
                          }
                          
                           setDriverData(prev =>
                                prev.map(d =>
                                  d._id === v._id
                                    ? { ...d, isAccountActive: !v.isAccountActive }
                                    : d
                                )
                              );
                        }}
                      />
                      
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1e7b8d]"></div>
                      
                      <span className="ms-3 text-xs font-medium text-gray-400 uppercase">
                        {v.isAccountActive ? 'Actif' : 'Inactif'}
                      </span>
                    </label>
                  </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <a
                            href={`tel:+${v.phoneNumber}`}
                            className="text-sm text-gray-500"
                            >
                                +{v.phoneNumber}
                     </a>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{v.Model}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={v.status} />
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">{v.pay}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-700">{v.ville}</div>
                    <div className="text-[11px] text-gray-400">{v.online}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{v.totalOrders}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-700">{v.balance}</td>
                  <td className="px-6 py-4">
                  <Link href={`/dashboard/drivers/${v._id}`}>
                    <button className="text-xs bg-[#088bb3] text-white px-3  rounded-lg hover:bg-[#e85a20] transition py-2">
                      plus de détails
                    </button>
                  </Link>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

};




const StatusBadge = ({ status }: { status: DriverStatus }) => {
  // استخدام Record بدلاً من any
  const styles: Record<DriverStatus, string> = {
    'completed': 'bg-green-50 text-green-700 border-green-100',
    'disabled': 'bg-red-50 text-red-700 border-red-100',
    'sent': 'bg-orange-50 text-orange-700 border-orange-100',
  };

  const labels: Record<DriverStatus, string> = {
    'completed': 'Actif',
    'disabled': 'Hors service',
    'sent': 'En atelier',
  };
  
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 w-fit ${styles[status]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {labels[status]}
    </span>
  );
};

export default VehiclesPage;