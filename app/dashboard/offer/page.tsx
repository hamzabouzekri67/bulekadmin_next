

'use client'
import { Filter, MoreHorizontal, Plus, Search,Home, GiftIcon } from "lucide-react";
import { useState ,useEffect } from "react";
import { useUser  } from "@/app/context/UserContext";
import { GetOfferList, addOfferAdmin } from "./api/GetOffer";
import { Promotion } from "@/app/types/offer";

export default function OfferApp(){

     const [offerData, setOfferData] = useState<Promotion[]>([]);
     const { user } = useUser()
     const [open, setOpen] = useState(false);
     const [selectedOffer, setSelectedOffer] = useState<Promotion | null>(null);
     const [appliedOffers, setAppliedOffers] = useState<string[]>([]);
     //const [loadingOfferId, setLoadingOfferId] = useState<string | null>(null);




    useEffect(()=>{
       GetOfferList(setOfferData,setAppliedOffers)
      },[user])

     return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen font-sans text-slate-800" dir="ltr">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Magasin de listes</h1>
          <p className="text-gray-500 text-sm">Gestion complète des magazines</p>
        </div>
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
                <th className="px-6 py-4">description</th>
                <th className="px-6 py-4">date de début</th>
                 <th className="px-6 py-4">début fin</th>
                <th className="px-6 py-4">durées</th>
                <th className="px-6 py-4">Montant</th>
                <th className="px-6 py-4">Appliqué</th>
               
              </tr>
            </thead>
              <tbody className="divide-y divide-gray-100">
              {offerData.map((v, i) => (
                
                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 p-2 rounded-full text-[#1e7b8d]">
                        <GiftIcon size={18} />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900">{v.title}</div>
                        <div className="text-[11px] text-gray-400 uppercase">{v.description}</div>
                      </div>
                    </div>
                  </td>
              
                  <td className="px-6 py-4 text-sm text-gray-600">{v.startDate}</td>
                  
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-700">{v.endDate}</div>
                  </td>
                  <td>
                     <div className="text-sm font-semibold text-gray-700">{v.duration}</div>
                  </td>
                   <td>
                     <div className="text-sm font-semibold text-gray-700">{v.discountValue}</div>
                  </td>
                 
                  {/* <td className="px-6 py-4 text-sm text-gray-600">{v.totalOrders}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-700">{v.balance}</td> */}
                  <td className="px-6 py-4">
                   <button  onClick={() => {
                    if (appliedOffers.includes(v._id)) return
                     setSelectedOffer(v);   
                     setOpen(true);       
                   }}className={`text-xs px-3 rounded-lg transition py-2 text-white
                      ${
                        appliedOffers.includes(v._id)
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-[#088bb3] hover:bg-[#e85a20]"
                      }`}>
                      Appliqué
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
         
          
          </table>
        </div>
        {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white rounded-xl shadow-lg w-96 p-6 animate-fadeIn">
                    <h2 className="text-lg font-bold mb-4">تأكيد العملية</h2>

                    <p className="text-sm text-gray-600 mb-6">
                    هل تريد تطبيق هذا العرض؟
                    </p>

                    <div className="flex justify-end gap-3">
                    <button
                        onClick={() => setOpen(false)}
                        className="px-4 py-2 text-sm rounded-lg bg-gray-200 hover:bg-gray-300"
                    >
                        إلغاء
                    </button>

                    <button
                        onClick={() => {
                         addOfferAdmin(user,selectedOffer,setAppliedOffers)
                        
                        setOpen(false);
                        }}
                        className="px-4 py-2 text-sm rounded-lg bg-[#088bb3] text-white hover:bg-[#e85a20]"
                    >
                        تأكيد
                    </button>
                    </div>
                </div>
                </div>
           )}

      </div>
     
   
    </div>
  );
}
