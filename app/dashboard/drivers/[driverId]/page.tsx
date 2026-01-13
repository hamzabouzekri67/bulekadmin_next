'use client'
import React from 'react';
import { GetAmountList, GetDriverDetailes, SendAmountDriver } from './api/GetDetailesDriver';
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { AmountItem, PaymentInfo } from '@/app/types/PaymentInfo';
import {PageShimmer} from "../../orders/[orderId]/components/shimmerPage"
import Image from "next/image";
import { DriverData } from '@/app/types/Drivers';

const ResponsiveDriverProfile = () => {
 
  const { driverId } = useParams();
  const validOrderId = driverId as string;
  const [listPayement, setlistPayement] = useState<PaymentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [listAmount, setListAmount] = useState<AmountItem[]>([]);
   const [driverDetailes, setDriverDetailes] = useState<DriverData | null>(null);
   const [openDialog, setOpenDialog] = useState(false);
   const [selectedAmount, setSelectedAmount] = useState<AmountItem | null>(null);
   const [selectedDriver, setSelectedDriver] = useState<DriverData | null>(null);



  useEffect(() => {

    setLoading(true);
    GetDriverDetailes(validOrderId,setlistPayement ,setLoading,setDriverDetailes);
    GetAmountList(setListAmount)
  }, [validOrderId]);

  const onClickRecharge = (amount: AmountItem, driver: DriverData | null) => {
  setSelectedAmount(amount);
  setSelectedDriver(driver);
  setOpenDialog(true);
};

const handleRecharge = () => {
 if (!selectedAmount || !selectedDriver) return;

  const payload = {
    ...selectedAmount,
    notificationsToken: selectedDriver.notificationsToken,
    driverId: selectedDriver._id,
  };

  //console.log("Recharge amount:", payload);
  SendAmountDriver(payload)

  setOpenDialog(false);
};


  
  if (loading) return <PageShimmer />
  return (
   <div className="bg-[#f8f9fa] p-2 text-gray-800 font-sans min-h-screen">

  {/* Recharge Section */}
  <div className="mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-2">
    <h3 className="text-lg font-bold mb-4">💰 تعبئة الحساب</h3>
    <p className="text-sm text-gray-500 mb-4">اختر المبلغ الذي تريد إضافته:</p>

    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {listAmount.map((amount) => (
        <button
          key={amount.id}
          className="py-3 bg-[#088bb3] text-white rounded-xl font-bold hover:bg-[#e85a20] transition active:scale-95"
          onClick={() =>{
            onClickRecharge(amount, driverDetailes)
           
          }}
        >
          {amount.amount} دج
        </button>
      ))}
    </div>
  </div>
  {/* Trips Section */}
  <h2 className="text-xl md:text-2xl font-bold mb-6">Trips History</h2>

  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
    <table className="w-full min-w-200 text-left">
      <thead className="bg-[#fcfcfc] border-b border-gray-100 text-gray-400 text-[11px] uppercase tracking-wider">
        <tr>
          <th className="px-6 py-4">Image</th>
          <th className="px-6 py-4">name</th>
          <th className="px-6 py-4 text-center">status</th>
          <th className="px-6 py-4">Balance</th>
          <th className="px-6 py-4">créé</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {listPayement.map((trip, idx) => (
          <tr key={idx} className="hover:bg-gray-50">
           <td className="px-6 py-4">
        <div className="w-10 h-10 relative">
          <Image
            src={trip.image ?? ""}
            alt={trip.nameEtabliss}
            fill
            className="rounded-full object-cover border border-gray-200"
          />
        </div>
      </td>
            <td className="px-6 py-4 text-sm font-medium text-gray-700">{trip.nameEtabliss}</td>
            <td className="px-6 py-4 text-sm text-center font-bold text-gray-900">{trip.typeOperation}</td>
            <td className="px-6 py-4 text-sm text-gray-500">{trip.balance}</td>
            <td className="px-6 py-4 text-sm text-gray-500">{trip.createdAt}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>


  {openDialog && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl p-6 w-[90%] max-w-sm shadow-xl animate-in zoom-in-95">
      
      <h2 className="text-lg font-bold mb-2">تأكيد الشحن</h2>
      <p className="text-sm text-gray-600 mb-4">
        هل تريد شحن الرصيد بقيمة{" "}
        <span className="font-bold text-cyan-600">
          {selectedAmount?.amount} DZD
        </span>
        ؟
      </p>

      <div className="flex justify-end gap-3">
        <button
          onClick={() => setOpenDialog(false)}
          className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
        >
          إلغاء
        </button>

        <button
          onClick={handleRecharge}
          className="px-4 py-2 rounded-lg bg-cyan-600 text-white hover:bg-orange-600"
        >
          تأكيد
        </button>
      </div>
    </div>
  </div>
)}


  
</div>

  );
};



export default ResponsiveDriverProfile;