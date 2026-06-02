// app/dashboard/[id]/layout.tsx (أو مسار ملفك الأب الحالي)
"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Drawer from "./components/Drawer";
import { CategoryProvider } from "@/app/context/CategoryContext";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";
import { checkStatusStore, compeletedProfileStore } from "./api/GetProducts";

// استيراد المكونات
import StepTags from "./components/StepTags";
import StepTiming from "./components/StepTiming";
import StepLocationCover from "./components/StepLocationCover";

interface DaySchedule {
  open: string;
  close: string;
  isClosed: boolean;
}

interface WeeklyHours {
  [key: string]: DaySchedule;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { id } = useParams();
  const router = useRouter();

  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // States الخاصة بالبيانات
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [prepTime, setPrepTime] = useState("");

  const [workingHours, setWorkingHours] = useState<WeeklyHours>({
    saturday: { open: "11:00", close: "23:00", isClosed: false },
    sunday: { open: "11:00", close: "23:00", isClosed: false },
    monday: { open: "11:00", close: "23:00", isClosed: false },
    tuesday: { open: "11:00", close: "23:00", isClosed: false },
    wednesday: { open: "11:00", close: "23:00", isClosed: false },
    thursday: { open: "11:00", close: "23:00", isClosed: false },
    friday: { open: "11:00", close: "23:00", isClosed: true },
  });

  const [location, setLocation] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, coverPreviewSet] = useState("");
  const [coordinates, setCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  useEffect(() => {
    if (!id) return;

    const getStoreStatus = async () => {
      try {
        const data = await checkStatusStore(id);
        if (data && data.status === true && data.result) {
          setStatus(data.result.status);
        } else {
          setStatus(null);
        }
      } catch (error) {
        console.error("خطأ أثناء جلب حالة المتجر:", error);
        setStatus(null);
      } finally {
        setLoading(false);
      }
    };

    getStoreStatus();
  }, [id]);

  const handleAddTag = () => {
    if (tags.length >= 3) return;
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverImage(file);
      coverPreviewSet(URL.createObjectURL(file));
    }
  };

  // 🎯 دالة فحص جاهزية بيانات الخطوة الحالية لمنع الانتقال بدون حقول مكتملة
  // 🎯 ابحث عن هذه الدالة في ملف المكون الأب وقم بتحديث الـ case 3:
  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return tags.length > 0;
      case 2:
        return prepTime.trim() !== "";
      case 3:
        // ✅ تمت إزالة شرط الـ location بنجاح!
        // الآن الشرط يتطلب فقط: تحديد إحداثيات الخريطة + رفع صورة الغلاف
        return coordinates !== null && coverImage !== null;
      default:
        return false;
    }
  };

  const handleFinalSubmit = async () => {
    try {
      setIsSaving(true);
      const dataToSend = new FormData();
      dataToSend.append("tags", JSON.stringify(tags));
      dataToSend.append("prepTime", prepTime);
      dataToSend.append("workingHours", JSON.stringify(workingHours));
      dataToSend.append("location", location);
      dataToSend.append("coordinates", JSON.stringify(coordinates));
      dataToSend.append("id", JSON.stringify(id));
      if (coverImage) dataToSend.append("coverImage", coverImage);

      const res = await compeletedProfileStore(dataToSend);

      if (res && res.status === true) {
        alert("تم حفظ البيانات وتنشيط المحل بنجاح! 🎉");

        // 🔄 تحديث الصفحة فوراً لإعادة فحص حالة الـ Layout والانتقال للواجهة النشطة
        window.location.reload();
      } else {
        // في حال رجوع رسالة خطأ معينة من الباكيند نقوم بعرضها
        alert(res?.message || "فشل حفظ البيانات، يرجى التحقق من المدخلات.");
      }

      setIsSaving(false);
    } catch (err) {
      console.error(err);
      alert("فشل الاتصال بالخادم");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex justify-center items-center bg-gray-50 text-gray-500 font-bold">
        ⏳ جاري فحص صلاحيات المتجر...
      </div>
    );
  }

  if (status === "accepted") {
    return (
      <div className="fixed inset-0 bg-slate-50 flex flex-col items-center justify-center p-4 z-50 overflow-y-auto">
        <div
          className="bg-white rounded-3xl shadow-xl border border-gray-150 max-w-lg w-full p-6 md:p-8 text-right"
          dir="rtl"
        >
          {/* العداد العلوي */}
          <div className="flex items-center justify-between mb-8 border-b pb-4">
            <h2 className="text-xl font-black text-gray-900">
              إعداد بيانات المحل النشط
            </h2>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
              <span
                className={`px-2.5 py-1 rounded-full ${currentStep === 1 ? "bg-red-100 text-red-600" : "bg-gray-100"}`}
              >
                1
              </span>
              <span
                className={`px-2.5 py-1 rounded-full ${currentStep === 2 ? "bg-red-100 text-red-600" : "bg-gray-100"}`}
              >
                2
              </span>
              <span
                className={`px-2.5 py-1 rounded-full ${currentStep === 3 ? "bg-red-100 text-red-600" : "bg-gray-100"}`}
              >
                3
              </span>
            </div>
          </div>

          {/* رندرة المكونات */}
          {currentStep === 1 && (
            <StepTags
              tags={tags}
              newTag={newTag}
              setNewTag={setNewTag}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
            />
          )}

          {currentStep === 2 && (
            <StepTiming
              prepTime={prepTime}
              setPrepTime={setPrepTime}
              workingHours={workingHours}
              setWorkingHours={setWorkingHours}
            />
          )}

          {currentStep === 3 && (
            <StepLocationCover
              location={location}
              setLocation={setLocation}
              coordinates={coordinates}
              setCoordinates={setCoordinates}
              coverPreview={coverPreview}
              onImageChange={handleImageChange}
            />
          )}

          {/* أزرار التنقل السفلية */}
          <div className="flex items-center justify-between pt-6 mt-8 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => prev - 1)}
              disabled={currentStep === 1 || isSaving}
              className="flex items-center gap-1 text-sm font-bold text-gray-500 disabled:opacity-30"
            >
              <ChevronRight size={16} />
              السابق
            </button>

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev + 1)}
                // 💡 تعطيل الزر برمجياً إذا لم تكتمل شروط الخطوة الحالية وتخفيف لونه شفافاً
                disabled={!isStepValid()}
                className="flex items-center gap-1 py-2.5 px-5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition shadow-sm disabled:opacity-40 disabled:hover:bg-red-600 disabled:cursor-not-allowed"
              >
                التالي
                <ChevronLeft size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                // 💡 تعطيل زر الإنهاء والتثبيت حتى تكتمل جميع مدخلات خطوة الخريطة والصورة والعنوان
                disabled={isSaving || !isStepValid()}
                className="flex items-center gap-1 py-2.5 px-6 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm transition shadow-md disabled:opacity-40 disabled:hover:bg-green-600 disabled:cursor-not-allowed"
              >
                {isSaving ? "جاري الحفظ..." : "حفظ وإنهاء الإعداد"}
                <Check size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <CategoryProvider>
      <Drawer />
      <main className="ml-0 md:ml-64 pt-16 md:pt-6 h-screen overflow-auto">
        {children}
      </main>
    </CategoryProvider>
  );
}
