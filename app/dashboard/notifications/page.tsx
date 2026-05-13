"use client";
import React, { ChangeEvent, useState, useEffect } from "react";
import {
  Bell,
  Send,
  Smartphone,
  MessageCircle,
  Type,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useUser } from "@/app/context/UserContext";
import { sendNotifications } from "./api/send_notfiy";

const NotificationDashboard = () => {
  const { user } = useUser();

  // الحالة للبيانات
  const [formData, setFormData] = useState({
    topic: `${user?.country}_${user?.ville}`,
    title: "ريح في دارك.. وحنا نجيبولك! 🏠",
    message:
      "كل أنواع الماكلة اللي راهي في تطبيق واحد! 📱 ادخل لـ Bulek Eats واكتشف أطباق جديدة تفتح الشهية! 🛵🔥",
  });

  // حالة الإرسال والتنبيهات
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error" | "warning" | null;
    text: string;
  }>({
    type: null,
    text: "",
  });

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // إخفاء التنبيه عند البدء في التصحيح
    if (status.type) setStatus({ type: null, text: "" });
  };

  useEffect(() => {

    if (user?.country && user?.ville) {
      setFormData((prev) => ({
        ...prev,
        topic: `${user.country}_${user.ville}`,
      }));
    }
  //  setIsLoading(false);

    /// GetOfferList(setOfferData,setAppliedOffers)
  }, [user]);

  const handleSendNotification = async () => {
    // 1. الحماية من الحقول الفارغة
    if (!formData.title.trim() || !formData.message.trim()) {
      setStatus({
        type: "error",
        text: "⚠️ خطأ: يجب ملء العنوان ومحتوى الرسالة قبل الإرسال.",
      });
      return;
    }

    setIsLoading(true);
    setStatus({ type: null, text: "" });

    await sendNotifications(user, formData);

    setIsLoading(false);

    // try {
    //   // 2. محاكاة الإرسال إلى Backend Node.js
    //   // استبدل المسار بـ API الإشعارات الخاص بك
    //   const response = await fetch("/api/notifications/send", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify(formData),
    //   });

    //   if (response.ok) {
    //     setStatus({
    //       type: "success",
    //       text: "تم بث الإشعار بنجاح لجميع المستخدمين! 🚀",
    //     });
    //   } else {
    //     throw new Error();
    //   }
    // } catch (err) {
    //   setStatus({
    //     type: "error",
    //     text: "حدث خطأ أثناء الاتصال بالخادم، يرجى المحاولة لاحقاً.",
    //   });
    // } finally {
    //   setIsLoading(false);
    // }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans" dir="rtl">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
        {/* نموذج الإدخال */}
        <div className="order-2 lg:order-1 lg:col-span-7 bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 p-5 md:p-8">
          <div className="flex items-center gap-3 mb-6 md:mb-8 border-b pb-5">
            <div className="bg-red-500 p-2 rounded-xl text-white shadow-lg shadow-red-200">
              <Bell size={24} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-800">
                إدارة الإشعارات
              </h1>
              <p className="text-xs md:text-sm text-slate-500 mt-1 uppercase tracking-wider">
                الهدف الحالي: {formData.topic}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* عرض رسالة الحالة */}
            {status.type && (
              <div
                className={`p-4 rounded-xl text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-1 ${
                  status.type === "success"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {status.type === "success" ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <AlertCircle size={18} />
                )}
                {status.text}
              </div>
            )}

            {/* حقل العنوان */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2 font-sans">
                <Type size={18} className="text-red-500" /> عنوان الإشعار
                (Title)
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-slate-50 border rounded-xl md:rounded-2xl outline-none transition-all font-medium text-sm md:text-base ${
                  status.type === "error" && !formData.title.trim()
                    ? "border-red-500 ring-2 ring-red-50"
                    : "border-slate-200 focus:ring-2 focus:ring-red-500 focus:bg-white"
                }`}
                placeholder="اكتب العنوان هنا..."
              />
            </div>

            {/* حقل الرسالة */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2 font-sans">
                <MessageCircle size={18} className="text-red-500" /> محتوى
                الرسالة (Message)
              </label>
              <textarea
                name="message"
                rows={4}
                value={formData.message}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-slate-50 border rounded-xl md:rounded-2xl outline-none transition-all font-medium resize-none text-sm md:text-base ${
                  status.type === "error" && !formData.message.trim()
                    ? "border-red-500 ring-2 ring-red-50"
                    : "border-slate-200 focus:ring-2 focus:ring-red-500 focus:bg-white"
                }`}
                placeholder="اكتب تفاصيل الرسالة..."
              ></textarea>
            </div>

            {/* زر الإرسال */}
            <button
              onClick={handleSendNotification}
              disabled={isLoading}
              className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-black text-base md:text-lg rounded-xl md:rounded-2xl shadow-xl shadow-red-100 flex items-center justify-center gap-3 transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={22} />
              ) : (
                <Send size={22} />
              )}
              {isLoading ? "جاري البث..." : "بث الإشعار الآن"}
            </button>
          </div>
        </div>

        {/* قسم المعاينة (الهاتف) */}
        <div className="order-1 lg:order-2 lg:col-span-5 flex flex-col items-center justify-center space-y-6">
          <div className="flex items-center gap-2 text-slate-400 font-medium text-sm">
            <Smartphone size={18} />
            <span>معاينة فورية على الجوال</span>
          </div>

          <div className="w-64 h-[500px] md:w-72 md:h-[580px] bg-slate-900 rounded-[2.5rem] md:rounded-[3rem] border-[7px] border-slate-800 relative shadow-2xl overflow-hidden ring-4 ring-slate-100">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-slate-800 rounded-b-2xl z-20"></div>

            <div
              className="h-full w-full bg-gradient-to-br from-red-500 to-orange-400 p-4 pt-12 md:pt-16 text-right"
              dir="rtl"
            >
              <div className="text-white text-center mb-8">
                <p className="text-4xl md:text-5xl font-light opacity-90">
                  14:30
                </p>
                <p className="text-xs mt-1 font-medium opacity-70 italic">
                  السبت، 25 أفريل
                </p>
              </div>

              {/* بطاقة الإشعار المحاكية */}
              <div className="bg-white/95 backdrop-blur-xl rounded-xl md:rounded-2xl p-4 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 bg-red-600 rounded flex items-center justify-center text-[10px] font-black text-white font-sans italic">
                      B
                    </div>
                    <span className="text-[11px] font-bold text-slate-800 uppercase tracking-tight">
                      Bulek Eats
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">
                    الآن
                  </span>
                </div>
                <h4 className="text-xs md:text-sm font-black text-slate-900 mb-1 leading-tight line-clamp-1">
                  {formData.title || "عنوان الإشعار..."}
                </h4>
                <p className="text-[10px] md:text-xs text-slate-700 leading-relaxed font-medium line-clamp-4">
                  {formData.message || "اكتب رسالة ليظهر شكلها هنا..."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationDashboard;
