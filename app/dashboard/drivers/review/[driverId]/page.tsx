"use client";
import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  FileText,
  User,
  MapPin,
  Phone,
  Calendar,
  ShieldCheck,
  ZoomIn,
  X,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { GetDriverDetailes } from "../../[driverId]/api/GetDetailesDriver";
import { useUser } from "@/app/context/UserContext";
import { PaymentInfo } from "@/app/types/PaymentInfo";
import { DriverData } from "@/app/types/Drivers";
import Image from "next/image";

const DriverReviewPage = () => {
  const { user } = useUser();
  const router = useRouter();
  const { driverId } = useParams();
  const validOrderId = driverId as string;
  
  const [loading, setLoading] = useState(false);
  const [listPayement, setlistPayement] = useState<PaymentInfo[]>([]);
  const [driverDetailes, setDriverDetailes] = useState<DriverData | null>(null);
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    GetDriverDetailes(
      validOrderId,
      setlistPayement,
      setLoading,
      setDriverDetailes
    );
  }, [user, validOrderId]);

  const handleAction = async (status: "approve" | "reject") => {
    if (!confirm(`Voulez-vous vraiment ${status === 'approve' ? 'approuver' : 'rejeter'} ce profil ?`)) return;
    
    setLoading(true);
    // ملاحظة: هنا يجب استدعاء API الحقيقي الخاص بك لتحديث الحالة في قاعدة البيانات
    setTimeout(() => {
      setLoading(false);
      alert(status === "approve" ? "Livreur Approuvé ✅" : "Livreur Refusé ❌");
      router.push("/dashboard/drivers");
    }, 1500);
  };

  return (
    <div className="p-6 md:p-10 bg-[#f8fafc] min-h-screen relative">
      
      {/* --- Modal الزوم اللحظي --- */}
      {selectedImg && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 transition-all duration-300"
          onClick={() => setSelectedImg(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 p-3 rounded-full transition-all"
            onClick={() => setSelectedImg(null)}
          >
            <X size={32} />
          </button>
          
          <div className="relative w-full h-[85vh] max-w-6xl">
            <Image
              src={selectedImg}
              alt="Document Agrandit"
              fill
              className="object-contain"
              quality={100}
              priority
            />
          </div>
          <p className="absolute bottom-10 text-white/50 font-medium tracking-widest uppercase text-xs">
            Cliquez n importe où pour fermer
          </p>
        </div>
      )}

      {/* Top Navigation & Actions */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Link
          href="/dashboard/drivers"
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors group w-fit"
        >
          <div className="p-2 bg-white rounded-xl shadow-sm group-hover:-translate-x-1 transition-transform border border-slate-100">
            <ArrowLeft size={20} />
          </div>
          <span className="font-bold text-sm">Retour à la liste</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleAction("reject")}
            disabled={loading}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white text-red-600 border border-red-100 px-6 py-3 rounded-2xl font-bold text-sm hover:bg-red-50 transition-all active:scale-95 disabled:opacity-50"
          >
            <XCircle size={18} />
            Rejeter
          </button>
          <button
            onClick={() => handleAction("approve")}
            disabled={loading}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-green-600 text-white px-8 py-3 rounded-2xl font-bold text-sm hover:bg-green-700 transition-all shadow-lg shadow-green-200 active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                 <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                 Traitement...
              </div>
            ) : (
              <>
                <CheckCircle size={18} /> Approuver le Profil
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Driver Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-300 mb-4 border-4 border-slate-50 relative overflow-hidden">
                {/* هنا يمكن وضع صورة الشخص إذا كانت متوفرة */}
                <User size={48} />
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {driverDetailes ? `${driverDetailes.firstName} ${driverDetailes.lastName}` : "Chargement..."}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">
                  Nouveau Candidat
                </span>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <InfoRow icon={<Phone size={16} />} label="Téléphone" value={`+${driverDetailes?.phoneNumber || '...'}`} />
              <InfoRow icon={<MapPin size={16} />} label="Localisation" value={`${driverDetailes?.ville || '...'}, ${driverDetailes?.pay || ''}`} />
              <InfoRow icon={<Calendar size={16} />} label="Inscription" value={driverDetailes?.createdAt ? new Date(driverDetailes.createdAt).toLocaleDateString() : '...'} />
            </div>
          </div>

          <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <ShieldCheck size={80} />
            </div>
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <ShieldCheck className="text-green-400" />
              <span className="font-bold">Vérification de sécurité</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed relative z-10">
              Veuillez vérifier scrupuleusement la validité des documents. Assurez-vous que les dates ne sont pas expirées et que les photos correspondent aux informations saisies.
            </p>
          </div>
        </div>

        {/* Right Column: Documents Viewer */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                <FileText size={20} />
              </div>
              <h3 className="font-black text-slate-900 uppercase tracking-tight">
                Documents de Bord ({driverDetailes?.document?.length || 0})
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {driverDetailes?.document?.map((imgUrl, index) => (
                <div key={index} className="group flex flex-col gap-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Document {index + 1}</span>
                  </div>
                  
                  <div
                    onClick={() => setSelectedImg(imgUrl)}
                    className="relative h-64 w-full overflow-hidden rounded-[1.5rem] border-2 border-slate-100 bg-slate-50 cursor-zoom-in shadow-sm transition-all hover:border-blue-400 hover:shadow-md"
                  >
                    <Image
                      src={imgUrl}
                      alt={`Document ${index + 1}`}
                      fill
                      className="object-contain p-2 transition-transform duration-700 group-hover:scale-105"
                    />

                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="p-4 bg-white rounded-full shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-transform">
                        <ZoomIn size={24} className="text-slate-900" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Revision Comments */}
            <div className="mt-10 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
              <h4 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
                <FileText size={16} className="text-slate-400" />
                Commentaires de révision (Optionnel)
              </h4>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Ex: La photo de la carte grise est floue, veuillez la reprendre..."
                className="w-full bg-white border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500/10 outline-none min-h-[120px] shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// مكون فرعي لعرض صفوف المعلومات
const InfoRow = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) => (
  <div className="flex items-center gap-4 p-3.5 hover:bg-slate-50 rounded-2xl transition-colors border border-transparent hover:border-slate-100">
    <div className="text-slate-400 bg-white p-2 rounded-lg shadow-sm">{icon}</div>
    <div>
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
        {label}
      </p>
      <p className="text-xs font-black text-slate-700 tracking-tight">
        {value}
      </p>
    </div>
  </div>
);

export default DriverReviewPage;