"use client";
import { Tag, AlertCircle } from "lucide-react";

interface StepTagsProps {
  tags: string[];
  newTag: string;
  setNewTag: (val: string) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
}

export default function StepTags({ tags, newTag, setNewTag, onAddTag, onRemoveTag }: StepTagsProps) {
  // 💡 فحص ما إذا كان المستخدم قد وصل للحد الأقصى
  const isMaxReached = tags.length >= 3;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-red-600 font-bold">
          <Tag size={20} />
          <h3>الخطوة 1: تصنيفات وميزات المحل (Tags)</h3>
        </div>
        {/* مؤشر عددي يوضح كم أضاف المستخدم */}
        <span className={`text-xs font-bold ${isMaxReached ? "text-red-500" : "text-gray-400"}`}>
          ({tags.length} من 3)
        </span>
      </div>
      
      <p className="text-sm text-gray-500">أضف الكلمات الدلالية التي تعبر عن الوجبات أو نوع المحل المتاح للزبائن (مثال: برجر، سريع، دايت).</p>
      
      <div className="flex gap-2">
        <input
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          // 💡 منع الإضافة عبر Enter إذا وصل للحد الأقصى
          onKeyDown={(e) => e.key === "Enter" && !isMaxReached && onAddTag()}
          // 💡 تعطيل الحقل عند الوصول للحد الأقصى
          disabled={isMaxReached}
          placeholder={isMaxReached ? "لقد وصلت للحد الأقصى (3 تاغات)" : "اكتب التاغ هنا..."}
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-black outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-all"
        />
        <button
          onClick={onAddTag}
          // 💡 تعطيل الزر برمجياً وبصرياً
          disabled={isMaxReached || !newTag.trim()}
          className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          إضافة
        </button>
      </div>

      {/* 💡 إظهار رسالة تنبيهية خفيفة عند بلوغ الحد الأقصى */}
      {isMaxReached && (
        <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 p-2.5 rounded-xl text-xs font-bold animate-in slide-in-from-top-1 duration-200">
          <AlertCircle size={14} />
          <span>يمكنك حذف Tag مضاف إذا كنت ترغب في استبداله بتصنيف آخر.</span>
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-2">
        {tags.length === 0 ? (
          <span className="text-xs text-gray-400">لم يتم إضافة أي تاغات بعد.</span>
        ) : (
          tags.map((t, idx) => (
            <span key={idx} className="flex items-center gap-1.5 bg-gray-100 text-gray-800 px-3 py-1.5 rounded-full text-xs font-semibold border border-gray-200">
              {t}
              <button 
                onClick={() => onRemoveTag(t)} 
                className="text-red-500 hover:text-red-700 font-bold mr-1 transition-colors"
                type="button"
              >
                ×
              </button>
            </span>
          ))
        )}
      </div>
    </div>
  );
}