// app/dashboard/[id]/components/StepTags.tsx
"use client";

import { useState, useEffect } from "react";
import { Tag, AlertCircle, Check, Loader2 } from "lucide-react";
import { getTags } from "../api/GetProducts"; // تأكد من صحة مسار ملف الـ API تبعاً لمشروعك

// 💡 1. تعريف واجهة بيانات التاغ القادم من الـ API
interface TagItem {
  _id: string;
  name: string;
  name_ar: string;
  color: string;
  icons: string;
}

// 💡 2. تعريف واجهة الـ Props لربط المكون مع الأب (DashboardLayout)
interface StepTagsProps {
  tags: string[]; // مصفوفة التاغات المختارة القادمة من الـ State في الأب
  onTagToggle: (tagName: string) => void; // دالة التبديل (Toggle) الممررة من الأب
}

export default function StepTags({ tags, onTagToggle }: StepTagsProps) {
  const [availableTags, setAvailableTags] = useState<TagItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  // الاعتماد على طول المصفوفة القادمة من الـ Props
  const isMaxReached = tags.length >= 3;

  useEffect(() => {
    const fetchAllTags = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        const data = await getTags();

        if (data && data.status === true && Array.isArray(data.result)) {
          setAvailableTags(data.result);
        } else {
          setHasError(true);
        }
      } catch (err) {
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllTags();
  }, []);

  return (
    <div className="w-full mx-auto" dir="rtl">
      {/* رأس القسم الفرعي */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 text-red-600 font-bold">
          <Tag size={22} className="shrink-0" />
          <h3 className="text-base sm:text-lg">
            الخطوة 1: تصنيفات وميزات المحل (Tags)
          </h3>
        </div>
        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-full self-start sm:self-auto ${
            isMaxReached ? "bg-red-50 text-red-500" : "bg-gray-50 text-gray-400"
          }`}
        >
          ({tags.length} من 3)
        </span>
      </div>

      <p className="text-xs sm:text-sm text-gray-500 mb-5 leading-relaxed">
        اختر التصنيفات المناسبة لمطبخك أو محلك من الخيارات المتاحة أدناه (يمكنك
        اختيار حتى 3 تصنيفات).
      </p>

      {/* حالة التحميل */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2 animate-pulse">
          <Loader2 className="animate-spin text-red-500" size={32} />
          <span className="text-xs font-semibold">جاري جلب التصنيفات...</span>
        </div>
      )}

      {/* حالة الخطأ */}
      {hasError && !isLoading && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-xl text-xs sm:text-sm font-bold border border-red-100">
          <AlertCircle size={18} className="shrink-0" />
          <span>فشل في جلب البيانات من الخادم. تأكد من اتصالك بالشبكة.</span>
        </div>
      )}

      {/* صندوق عرض التاغات */}
      {!isLoading && !hasError && (
        <div className="flex flex-wrap gap-2 sm:gap-3 p-3 sm:p-5 border border-gray-100 bg-gray-50/40 rounded-xl sm:rounded-2xl">
          {availableTags.length === 0 ? (
            <span className="text-xs sm:text-sm text-gray-400 w-full text-center py-4">
              لا توجد تصنيفات متاحة حالياً.
            </span>
          ) : (
            availableTags.map((option) => {
              // التحقق من التحديد بناءً على المصفوفة القادمة من البروبس
              const isSelected = tags.includes(option.name);

              return (
                <button
                  key={option._id}
                  type="button"
                  onClick={() => onTagToggle(option.name)} // استدعاء الدالة الممررة من الأب مباشرة
                  disabled={isMaxReached && !isSelected}
                  className={`
                    flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl text-xs font-bold transition-all border select-none
                    ${
                      isSelected
                        ? "bg-red-600 border-red-600 text-white shadow-md shadow-red-100 scale-95"
                        : "bg-white border-gray-200 text-gray-700 hover:border-red-300 hover:bg-red-50/30"
                    }
                    disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200
                  `}
                >
                  {option.icons && (
                    <img
                      src={option.icons}
                      alt={option.name}
                      className={`w-4 h-4 sm:w-5 sm:h-5 object-contain rounded-md transition-all shrink-0 ${
                        isSelected ? "brightness-0 invert" : ""
                      }`}
                    />
                  )}

                  <span className="truncate max-w-[120px] sm:max-w-none">
                    {option.name_ar}
                  </span>

                  {isSelected && (
                    <span className="bg-white text-red-600 p-0.5 rounded-full animate-in zoom-in duration-150 shrink-0">
                      <Check size={9} strokeWidth={4} />
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}

      {/* رسالة التنبيه */}
      {isMaxReached && (
        <div className="mt-4 flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-xl text-xs font-bold animate-in slide-in-from-top-1 duration-200 border border-amber-100">
          <AlertCircle size={16} className="shrink-0" />
          <span className="leading-relaxed">
            لقد وصلت للحد الأقصى (3 تصنيفات). يمكنك إلغاء تحديد تصنيف مضاف
            لتتمكن من اختيار غيره.
          </span>
        </div>
      )}
    </div>
  );
}
