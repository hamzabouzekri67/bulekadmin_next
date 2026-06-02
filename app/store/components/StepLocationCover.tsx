// components/StepLocationCover.tsx
"use client";

import { useState, useEffect } from "react";
import {
  MapPin as MapPinIcon,
  Upload as UploadIcon,
  Maximize2,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image"; // استيراد مكون الأوبتميزيشن لـ Next.js

// استيراد الخريطة ديناميكياً
const StoreMap = dynamic(() => import("./StoreMap"), { ssr: false });

interface StepLocationCoverProps {
  location: string;
  setLocation: (val: string) => void;
  coordinates: { lat: number; lng: number } | null;
  setCoordinates: (coords: { lat: number; lng: number }) => void;
  coverPreview: string;
  // تعديل النوع ليتوافق مع استقبال الحدث أو معالجته بعد الفحص
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function StepLocationCover({
  location,
  setLocation,
  coordinates,
  setCoordinates,
  coverPreview,
  onImageChange,
}: StepLocationCoverProps) {
  const [isClient, setIsClient] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // 🛠️ دالة التحقق من أبعاد الصورة محلياً قبل الموافقة عليها
  // 🛠️ دالة التحقق من أبعاد الصورة محلياً وتوافقها الكامل مع TypeScript
  const handleFileValidation = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null); // تصفية الأخطاء السابقة

    const reader = new FileReader();
    reader.onload = (event) => {
      // ✔️ الحل: إنشاء الكائن القياسي مباشرة بدون استخدام كائن window الوهمي
      const img = new globalThis.Image();

      img.onload = () => {
        const targetWidth = 1600;
        const targetHeight = 900;

        // 🎯 فحص الأبعاد بدقة حاسمة
        if (img.width !== targetWidth || img.height !== targetHeight) {
          setErrorMsg(
            `أبعاد الصورة غير مطابقة! المطلوب ${targetWidth}x${targetHeight}px. الحالية: ${img.width}x${img.height}px.`,
          );
          e.target.value = ""; // تفريغ حقل الإدخال فوراً لحظر الملف
          return;
        }

        // إذا كانت الأبعاد سليمة، يتم تمرير الحدث مباشرة للدالة الأب
        onImageChange(e);
      };

      img.src = event.target?.result as string;
    };

    reader.readAsDataURL(file);
  };
  return (
    <div
      className="space-y-5 animate-in fade-in duration-200 text-right"
      dir="rtl"
    >
      {/* عنوان الخطوة */}
      <div className="flex items-center gap-2 text-red-600 font-bold mb-2">
        <MapPinIcon size={20} />
        <h3 className="text-lg">الخطوة 3: موقع وتصميم المحل</h3>
      </div>

      {/* قسم الخريطة التفاعلية الافتراضية */}
      <div className="space-y-2">
        <label className="block text-sm font-bold text-gray-700">
          حدد موقع المحل بدقة على الخريطة:
        </label>

        <div className="w-full h-64 rounded-2xl overflow-hidden border border-gray-300 relative z-10 bg-gray-50">
          {/* زر التكبير المخصص المثبت في الزاوية اليسرى للخريطة الصغيرة */}
          <button
            type="button"
            onClick={() => setIsFullscreen(true)}
            className="absolute bottom-3 left-3 z-20 bg-white text-gray-700 p-2 rounded-xl shadow-md border border-gray-200 hover:bg-gray-100 transition flex items-center gap-1 text-xs font-bold"
            title="تكبير الخريطة على كامل الشاشة"
          >
            <Maximize2 size={14} className="text-gray-600" />
            عرض كاملة
          </button>

          {isClient && (
            <StoreMap
              coordinates={coordinates}
              setCoordinates={setCoordinates}
            />
          )}
        </div>

        {/* طباعة حالة الإحداثيات للمستخدم */}
        {coordinates ? (
          <p className="text-[11px] text-green-600 font-semibold">
            ✅ تم التقاط الموقع بنجاح ({coordinates.lat.toFixed(5)},{" "}
            {coordinates.lng.toFixed(5)})
          </p>
        ) : (
          <p className="text-[11px] text-amber-600 font-semibold">
            ⚠️ يرجى النقر على الخريطة أو تكبيرها لتحديد موقع المتجر بدقة.
          </p>
        )}
      </div>

      {/* المودال لتكبير الخريطة على كامل الشاشة */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[9999] bg-white w-screen h-screen flex flex-col animate-in fade-in zoom-in-95 duration-200">
          <div className="w-full bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <MapPinIcon size={20} className="text-red-500" />
              <span className="font-bold text-gray-800 text-sm md:text-base">
                انقر لتحديد موقع المحل بدقة عالية
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-red-100 transition"
            >
              <X size={16} />
              حفظ وإغلاق
            </button>
          </div>

          <div className="flex-1 w-full h-full relative">
            {isClient && (
              <StoreMap
                coordinates={coordinates}
                setCoordinates={setCoordinates}
              />
            )}
          </div>
        </div>
      )}

      {/* قسم رفع صورة الغلاف للمتجر مع حماية الدقة */}
      <div className="space-y-2 pt-2">
        <label className="block text-sm font-bold text-gray-700">
          صورة غلاف المحل (Cover Image):
        </label>

        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition duration-150 p-4 text-center">
          <div className="flex flex-col items-center justify-center pt-2 pb-2">
            <UploadIcon className="w-6 h-6 text-gray-400 mb-2" />
            <p className="text-xs text-gray-500 font-medium">
              اضغط لرفع صورة الغلاف الخاصة بالمحل
            </p>
            <p className="text-[11px] text-red-500 mt-1.5 font-black bg-red-50 px-2 py-0.5 rounded-md">
              المقاس الإجباري المطلوب: 1600 × 900 بكسل فقط
            </p>
          </div>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileValidation} // استدعاء دالة التحقق الجديدة
          />
        </label>

        {/* طباعة رسالة الخطأ للمستخدم إن وجدت */}
        {errorMsg && (
          <p className="text-xs text-red-600 font-bold mt-1 bg-red-50 border border-red-200 p-2 rounded-xl">
            {errorMsg}
          </p>
        )}

        {/* عرض المعاينة للصورة بعد قبول أبعادها */}
        {coverPreview && !errorMsg && (
          <div className="mt-3 relative rounded-xl overflow-hidden h-40 w-full border border-gray-200 shadow-sm bg-slate-100">
            <Image
              src={coverPreview}
              alt="Cover Preview"
              fill
              className="object-cover"
            />
          </div>
        )}
      </div>
    </div>
  );
}
