"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import {
  Wallet,
  History,
  ShieldCheck,
  Phone,
  MapPin,
  ChevronRight,
  Calendar,
  CreditCard,
  Clock,
  Zap,
} from "lucide-react";
import {
  GetAmountList,
  GetDriverDetailes,
  SendAmountDriver,
} from "./api/GetDetailesDriver";
import { AmountItem, PaymentInfo } from "@/app/types/PaymentInfo";
import { DriverData } from "@/app/types/Drivers";
import { PageShimmer } from "../../orders/[orderId]/components/shimmerPage";
import { useUser } from "@/app/context/UserContext";

const SimpleDriverProfile = () => {
  const { user } = useUser();
  const { driverId } = useParams();
  const validOrderId = driverId as string;

  const [listPayement, setlistPayement] = useState<PaymentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [listAmount, setListAmount] = useState<AmountItem[]>([]);
  const [driverDetailes, setDriverDetailes] = useState<DriverData | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<AmountItem | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    GetDriverDetailes(
      validOrderId,
      setlistPayement,
      setLoading,
      setDriverDetailes,
    );
    GetAmountList(setListAmount);
  }, [user, validOrderId]);

  const handleRecharge = () => {
    if (!selectedAmount || !driverDetailes) return;
    const payload = {
      ...selectedAmount,
      notificationsToken: driverDetailes.notificationsToken,
      driverId: driverDetailes._id,
      adminId:user?.id
    };
    SendAmountDriver(payload);
    setOpenDialog(false);
  };

  if (loading) return <PageShimmer />;

  return (
    <div
      className="bg-white min-h-screen text-gray-800 font-sans max-w-4xl mx-auto p-4 md:py-12"
      dir="ltr"
    >
      {/* 1. Header: Minimalist */}
      <header className="flex flex-col md:flex-row items-center gap-6 mb-12 border-b border-gray-50 pb-10">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-2xl font-bold text-gray-400">
          {driverDetailes?.firstName?.charAt(0)}
        </div>
        <div className="text-center md:text-left grow">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {driverDetailes?.firstName} {driverDetailes?.lastName}
            </h1>
            <ShieldCheck size={18} className="text-green-500" />
          </div>
          <div className="flex flex-wrap justify-center md:justify-start gap-4 text-gray-500 text-sm">
            <span className="flex items-center gap-1.5">
              <Phone size={14} /> {driverDetailes?.phoneNumber}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin size={14} /> {driverDetailes?.ville}
            </span>
          </div>
        </div>

        {/* Simple Balance Card */}
        <div className="bg-gray-50 px-8 py-4 rounded-2xl text-center md:text-right border border-gray-100">
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">
            Current Balance
          </p>
          <p className="text-2xl font-black text-gray-900">
            {driverDetailes?.balance}{" "}
            <span className="text-xs font-normal">DZD</span>
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        {/* 2. Quick Recharge: Modern Chips Style */}
        <section className="md:col-span-1">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Zap size={16} className="text-orange-500 fill-orange-500" />{" "}
              Quick Recharge
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {listAmount.map((amount) => (
              <button
                key={amount.id}
                onClick={() => {
                  setSelectedAmount(amount);
                  setOpenDialog(true);
                }}
                className="relative group flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-gray-50 bg-gray-50/30 hover:border-orange-500 hover:bg-white hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                {/* الدائرة الخلفية التأثيرية عند التحويم */}
                <div className="absolute -right-2 -top-2 w-12 h-12 bg-orange-500/5 rounded-full group-hover:scale-[3] transition-transform duration-500" />

                <span className="text-lg font-black text-gray-900 group-hover:text-orange-600 transition-colors">
                  {amount.amount}
                </span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                  DZD
                </span>
              </button>
            ))}

            <button className="col-span-2 mt-2 p-3 text-[11px] font-bold text-gray-400 border border-dashed border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              Custom Amount
            </button>
          </div>
        </section>

        {/* 3. Activity: Simple List */}
        <section className="md:col-span-2">
          <h3 className="text-sm font-bold text-gray-900 mb-5 flex items-center gap-2">
            <Clock size={16} /> Recent Activity
          </h3>
          <div className="divide-y divide-gray-50">
            {listPayement.length > 0 ? (
              listPayement.map((trip, idx) => (
                <div
                  key={idx}
                  className="py-4 flex items-center justify-between hover:bg-gray-50 transition-colors px-2 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gray-50 relative overflow-hidden border border-gray-100">
                      <Image
                        src={trip.image || "/default.png"}
                        alt="store"
                        fill
                        className="object-cover opacity-80"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {trip.nameEtabliss}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {trip.createdAt}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-bold ${trip.typeOperation === "Recharge" ? "text-blue-600" : "text-gray-900"}`}
                    >
                      {trip.typeOperation === "add" ? "+" : ""}
                      {trip.balance}
                    </p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-tighter">
                      {trip.typeOperation}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm italic">
                No recent activity found.
              </p>
            )}
          </div>
        </section>
      </div>

      {/* 4. Simple Modal */}
      {openDialog && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-xl border border-gray-100 text-center animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              Confirm Recharge
            </h2>
            <p className="text-gray-500 text-sm mb-8">
              Add{" "}
              <span className="font-bold text-gray-900">
                {selectedAmount?.amount} DZD
              </span>{" "}
              to the drivers wallet?
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleRecharge}
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-colors"
              >
                Confirm Deposit
              </button>
              <button
                onClick={() => setOpenDialog(false)}
                className="w-full py-3 text-gray-400 font-semibold text-sm hover:text-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleDriverProfile;
