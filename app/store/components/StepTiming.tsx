"use client";
import { Clock, Calendar } from "lucide-react";

// ✅ أبقينا على تعريف واحد فقط نظيف لبنية التوقيت لليوم الواحد
interface DaySchedule {
  open: string;
  close: string;
  isClosed: boolean;
}

export interface WeeklyHours {
  [key: string]: DaySchedule;
}

interface StepTimingProps {
  prepTime: string;
  setPrepTime: (val: string) => void;
  workingHours: WeeklyHours;
  setWorkingHours: (hours: WeeklyHours) => void;
}

const DAYS_OF_WEEK = [
  { key: "saturday", label: "السبت" },
  { key: "sunday", label: "الأحد" },
  { key: "monday", label: "الإثنين" },
  { key: "tuesday", label: "الثلاثاء" },
  { key: "wednesday", label: "الأربعاء" },
  { key: "thursday", label: "الخميس" },
  { key: "friday", label: "الجمعة" },
];

export default function StepTiming({
  prepTime,
  setPrepTime,
  workingHours,
  setWorkingHours,
}: StepTimingProps) {
  // ✅ تحديث الدالة باستخدام الـ Generics <K> لضمان مطابقة نوع القيمة مع الحقل بشكل آمن 100%
  const handleDayChange = <K extends keyof DaySchedule>(
    dayKey: string,
    field: K,
    value: DaySchedule[K],
  ) => {
    setWorkingHours({
      ...workingHours,
      [dayKey]: {
        ...workingHours[dayKey],
        [field]: value,
      },
    });
  };

  const prepTimeOptions = [
    "10-15",
    "15-25",
    "25-35",
    "35-45",
    "45-55",
    "55-60",
  ];

  return (
    <div
      className="space-y-6 animate-in fade-in duration-200 text-right"
      dir="rtl"
    >
      {/* العنوان الرئيسي */}
      <div className="space-y-2 text-right" dir="rtl">
        <label className="block text-sm font-bold text-gray-700">
          وقت التحضير المتوقع للطلبات:
        </label>

        <select
          value={prepTime}
          onChange={(e) => setPrepTime(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-black outline-none focus:ring-2 focus:ring-red-500 bg-white font-medium"
        >
          <option value="">اختر مجال وقت التحضير...</option>

          {prepTimeOptions.map((option) => (
            <option key={option} value={option}>
              {option} دقيقة
            </option>
          ))}
        </select>

        <p className="text-[11px] text-gray-400">
          * هذا الوقت سيظهر للزبائن في تطبيق Bulek Eats لتقدير زمن وصول الطلب.
        </p>
      </div>

      {/* قسم مواعيد الأيام */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 text-sm font-bold text-gray-700 mb-1">
          <Calendar size={18} className="text-gray-500" />
          <label>أوقات العمل لكل يوم على حدة:</label>
        </div>

        <div className="space-y-2 max-h-[280px] overflow-y-auto pl-1 pr-1 border border-gray-150 rounded-2xl p-3 bg-white">
          {DAYS_OF_WEEK.map((day) => {
            const dayData = workingHours[day.key] || {
              open: "08:00",
              close: "23:00",
              isClosed: false,
            };

            return (
              <div
                key={day.key}
                className={`grid grid-cols-1 sm:grid-cols-3 gap-3 items-center p-3 rounded-xl border transition-colors ${
                  dayData.isClosed
                    ? "bg-red-50/40 border-red-100 opacity-70"
                    : "bg-gray-50/50 border-gray-100"
                }`}
              >
                {/* اسم اليوم + زر التبديل لحالة الإغلاق */}
                <div className="flex items-center justify-between sm:justify-start gap-4">
                  <span className="font-bold text-sm text-gray-800 min-w-[60px]">
                    {day.label}
                  </span>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={dayData.isClosed}
                      onChange={(e) =>
                        handleDayChange(day.key, "isClosed", e.target.checked)
                      }
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500 h-4 w-4 accent-red-600"
                    />
                    <span className="text-xs font-semibold text-gray-500">
                      مغلق
                    </span>
                  </label>
                </div>

                {/* حقول الوقت */}
                <div className="grid grid-cols-2 gap-2 sm:col-span-2">
                  <div>
                    <span className="text-[10px] text-gray-400 block mb-0.5">
                      وقت الفتح
                    </span>
                    <input
                      type="time"
                      value={dayData.open}
                      disabled={dayData.isClosed}
                      onChange={(e) =>
                        handleDayChange(day.key, "open", e.target.value)
                      }
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded-xl text-xs text-black disabled:bg-gray-100 disabled:text-gray-400 transition-all outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block mb-0.5">
                      وقت الغلق
                    </span>
                    <input
                      type="time"
                      value={dayData.close}
                      disabled={dayData.isClosed}
                      onChange={(e) =>
                        handleDayChange(day.key, "close", e.target.value)
                      }
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded-xl text-xs text-black disabled:bg-gray-100 disabled:text-gray-400 transition-all outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
