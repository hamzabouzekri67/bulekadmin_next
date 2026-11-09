/* eslint-disable @next/next/no-img-element */
"use client";

import { useMemo, useState, useEffect } from "react";
import { Tag, AlertCircle, Check, Loader2 } from "lucide-react";
import { getTags } from "../api/GetProducts";

interface TagCategory {
  _id?: string;
  id?: string;
  name?: string;
  name_ar?: string;
  color?: string;
  icons?: string;
}

interface TagItem {
  _id: string;
  id?: string;
  name: string;
  name_ar: string;
  image?: string;
  color?: string;
  icons?: string;
  catgId?: string | null;
  category?: TagCategory | null;
}

// 💡 2. تعريف واجهة الـ Props لربط المكون مع الأب (DashboardLayout)
interface StepTagsProps {
  tags: string[];
  catgId: string;
  onTagToggle: (tagId: string) => void;
  onCategoryChange: (catgId: string) => void;
}

export default function StepTags({
  tags,
  catgId,
  onTagToggle,
  onCategoryChange,
}: StepTagsProps) {
  const [availableTags, setAvailableTags] = useState<TagItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  // الاعتماد على طول المصفوفة القادمة من الـ Props
  const isMaxReached = tags.length >= 3;

  const groups = useMemo(() => {
    const buckets = new Map<
      string,
      { id: string; title: string; color: string; icons: string; tags: TagItem[] }
    >();

    availableTags.forEach((item) => {
      const category = item.category;
      const id = category?._id || category?.id || (item.catgId ? "" : "none");
      const key = id || "none";
      const current = buckets.get(key) || {
        id: key,
        title: category?.name_ar || category?.name || "بدون تصنيف",
        color: category?.color || item.color || "#9ca3af",
        icons: category?.icons || "",
        tags: [],
      };
      current.tags.push(item);
      buckets.set(key, current);
    });

    return Array.from(buckets.values()).sort((a, b) => {
      if (a.id === "none") return 1;
      if (b.id === "none") return -1;
      return a.title.localeCompare(b.title, "ar");
    });
  }, [availableTags]);

  const categories = useMemo(
    () => groups.filter((group) => group.id !== "none"),
    [groups],
  );
  const visibleGroups = catgId
    ? groups.filter((group) => group.id === catgId)
    : [];

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
            الخطوة 1: تصنيف المحل والوسوم
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
        اختر تصنيفاً واحداً للمحل، مثل مطعم أو بقالة. بعدها يمكنك اختيار حتى 3
        وسوم من هذا التصنيف.
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
        <div className="mb-4 flex flex-wrap gap-2">
          {categories.length === 0 ? (
            <span className="text-xs font-bold text-gray-400">
              لا توجد تصنيفات بعد.
            </span>
          ) : (
            categories.map((category) => {
              const selected = catgId === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => onCategoryChange(category.id)}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border ${
                    selected
                      ? "bg-red-600 border-red-600 text-white"
                      : "bg-white border-gray-200 text-gray-700"
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: selected ? "#fff" : category.color }}
                  />
                  {category.title}
                </button>
              );
            })
          )}
        </div>
      )}

      {!isLoading && !hasError && catgId && (
        <div className="space-y-4 p-3 sm:p-5 border border-gray-100 bg-gray-50/40 rounded-xl sm:rounded-2xl">
          {availableTags.length === 0 ? (
            <span className="text-xs sm:text-sm text-gray-400 w-full text-center py-4">
              لا توجد تصنيفات متاحة حالياً.
            </span>
          ) : (
            visibleGroups.map((group) => (
              <div key={group.id}>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: group.color }}
                  />
                  {group.icons ? (
                    <img
                      src={group.icons}
                      alt={group.title}
                      className="w-4 h-4 object-contain rounded"
                    />
                  ) : null}
                  <p className="text-xs font-black text-gray-500">{group.title}</p>
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {group.tags.map((option) => {
                    const tagId = option.id || option._id;
                    const isSelected = tags.includes(tagId);
                    const hasCategory = Boolean(option.catgId && option.category);
                    const icon = option.icons || option.category?.icons || option.image;

                    return (
                      <button
                        key={option._id}
                        type="button"
                        onClick={() => hasCategory && onTagToggle(tagId)}
                        disabled={!hasCategory || (isMaxReached && !isSelected)}
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
                        {icon ? (
                          <img
                            src={icon}
                            alt={option.name}
                            className={`w-4 h-4 sm:w-5 sm:h-5 object-contain rounded-md transition-all shrink-0 ${
                              isSelected ? "brightness-0 invert" : ""
                            }`}
                          />
                        ) : null}

                        <span className="truncate max-w-[120px] sm:max-w-none">
                          {option.name_ar}
                          {!hasCategory ? " · بلا تصنيف" : ""}
                        </span>

                        {isSelected && (
                          <span className="bg-white text-red-600 p-0.5 rounded-full animate-in zoom-in duration-150 shrink-0">
                            <Check size={9} strokeWidth={4} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
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
