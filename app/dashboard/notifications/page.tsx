"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  Smartphone,
  Clock,
  TicketPercent,
} from "lucide-react";
import { useUser } from "@/app/context/UserContext";
import type { PromoCodeItem } from "@/app/types/promo";
import { listPromoCodes } from "../promo/api/promo";
import {
  cancelNotification,
  listCampaigns,
  queueNotification,
  type NotificationCampaign,
} from "./api/campaigns";

type Tab = "manual" | "promo" | "log";

const TABS: { id: Tab; label: string }[] = [
  { id: "manual", label: "يدوي" },
  { id: "promo", label: "برومو" },
  { id: "log", label: "السجل" },
];

const WEEK_DAYS = [
  { value: 0, label: "أحد" },
  { value: 1, label: "إثن" },
  { value: 2, label: "ثلا" },
  { value: 3, label: "أرب" },
  { value: 4, label: "خمي" },
  { value: 5, label: "جمع" },
  { value: 6, label: "سبت" },
];

function textOf(message: string | undefined, fallback: string): string {
  return message || fallback;
}

function when(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("ar-DZ");
}

export default function NotificationDashboard() {
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("manual");
  const [title, setTitle] = useState("ريح في دارك.. وحنا نجيبولك");
  const [message, setMessage] = useState(
    "ادخل لـ Bulek Eats واكتشف أطباق جديدة.",
  );
  const [topic, setTopic] = useState("");
  const [sendAt, setSendAt] = useState("");
  const [daily, setDaily] = useState(false);
  const [dailyTimes, setDailyTimes] = useState<string[]>(["14:00"]);
  const [skipDays, setSkipDays] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeOk, setNoticeOk] = useState(true);
  const [campaigns, setCampaigns] = useState<NotificationCampaign[]>([]);
  const [promos, setPromos] = useState<PromoCodeItem[]>([]);
  const [busyId, setBusyId] = useState("");

  const show = (ok: boolean, text: string) => {
    setNoticeOk(ok);
    setNotice(text);
  };

  const refresh = async () => {
    const [campaignData, promoData] = await Promise.all([
      listCampaigns(),
      listPromoCodes(),
    ]);
    if (campaignData.status && Array.isArray(campaignData.result)) {
      setCampaigns(campaignData.result);
    }
    if (promoData.status && Array.isArray(promoData.result)) {
      setPromos(promoData.result.filter((item) => item.isActive));
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "super_admin") {
      router.replace("/dashboard");
      return;
    }
    setReady(true);
    if (user.country && user.ville) {
      setTopic(`${user.country}_${user.ville}`);
    }
    void refresh().catch(() => show(false, "تعذر تحميل الإشعارات"));
  }, [user, authLoading, router]);

  const submitManual = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !message.trim() || !topic.trim()) {
      show(false, "العنوان والرسالة والوجهة مطلوبة");
      return;
    }
    setSaving(true);
    try {
      const times = dailyTimes
        .map((value) => {
          const [hourText, minuteText] = value.split(":");
          const hour = Number(hourText);
          const minute = Number(minuteText);
          if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
          return { hour, minute };
        })
        .filter((slot): slot is { hour: number; minute: number } => slot !== null);
      if (daily && times.length === 0) {
        show(false, "أضف ساعة واحدة على الأقل");
        setSaving(false);
        return;
      }
      const data = await queueNotification({
        kind: "manual",
        title: title.trim(),
        body: message.trim(),
        topics: topic.split(",").map((item) => item.trim()).filter(Boolean),
        sendAt: !daily && sendAt ? new Date(sendAt).toISOString() : undefined,
        repeat: daily ? "daily" : "once",
        hour: times[0]?.hour,
        minute: times[0]?.minute,
        times,
        skipDays,
      });
      show(Boolean(data.status), textOf(data.message, "تعذر جدولة الإشعار"));
      if (data.status) await refresh();
    } catch {
      show(false, "تعذر الاتصال بالخادم");
    } finally {
      setSaving(false);
    }
  };

  const blastPromo = async (item: PromoCodeItem) => {
    const id = item.id || item._id;
    if (!id) return;
    setBusyId(id);
    try {
      const data = await queueNotification({
        kind: "promo",
        title: `كود ${item.promoCode}`,
        body: item.content || `استخدم الكود ${item.promoCode}`,
        topics: item.cities?.length ? item.cities : ["all"],
        promoId: id,
        promoCode: item.promoCode,
      });
      show(Boolean(data.status), textOf(data.message, "تعذر إرسال إشعار البرومو"));
      if (data.status) await refresh();
    } catch {
      show(false, "تعذر الاتصال بالخادم");
    } finally {
      setBusyId("");
    }
  };

  const cancel = async (id: string) => {
    setBusyId(id);
    try {
      const data = await cancelNotification(id);
      show(Boolean(data.status), textOf(data.message, "تعذر الإلغاء"));
      if (data.status) await refresh();
    } catch {
      show(false, "تعذر الاتصال بالخادم");
    } finally {
      setBusyId("");
    }
  };

  const toggleSkipDay = (day: number) => {
    setSkipDays((current) =>
      current.includes(day)
        ? current.filter((item) => item !== day)
        : [...current, day].sort((a, b) => a - b),
    );
  };

  if (authLoading || !ready) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const visible =
    tab === "log"
      ? campaigns
      : tab === "promo"
        ? campaigns.filter((item) => item.kind === "promo")
        : campaigns.filter((item) => item.kind === "manual");

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto" dir="rtl">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-red-500 p-2.5 rounded-xl text-white">
          <Bell size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">الإشعارات</h1>
          <p className="text-sm text-slate-500">
            إرسال فوري، أو يومي على عدة ساعات بتوقيت الجزائر، مع أيام لا يُرسل فيها.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold ${
              tab === item.id ? "bg-[#e91818] text-white" : "bg-white text-slate-600 border"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {notice && (
        <p
          className={`mb-4 rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2 ${
            noticeOk ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}
        >
          {noticeOk ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {notice}
        </p>
      )}

      {tab === "manual" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={submitManual}
            className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 space-y-4"
          >
            <label className="block">
              <span className="text-xs font-bold text-slate-500">العنوان</span>
              <input
                className="mt-1 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-slate-500">الرسالة</span>
              <textarea
                rows={4}
                className="mt-1 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-slate-500">
                الوجهة: all أو Algeria_Alger، ويمكن الجمع بينهما بفاصلة
              </span>
              <input
                className="mt-1 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
              />
            </label>
            <label className="flex items-center justify-between gap-3 bg-slate-50 rounded-xl px-4 py-3">
              <span className="text-sm font-bold">إرسال يومي</span>
              <input
                type="checkbox"
                checked={daily}
                onChange={(event) => setDaily(event.target.checked)}
              />
            </label>
            {daily ? (
              <>
                <div>
                  <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                    <Clock size={14} /> ساعات الإرسال بتوقيت الجزائر
                  </span>
                  <div className="mt-2 space-y-2">
                    {dailyTimes.map((value, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="time"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                          value={value}
                          onChange={(event) =>
                            setDailyTimes((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index ? event.target.value : item,
                              ),
                            )
                          }
                        />
                        {dailyTimes.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setDailyTimes((current) =>
                                current.filter((_, itemIndex) => itemIndex !== index),
                              )
                            }
                            className="px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-500"
                          >
                            حذف
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {dailyTimes.length < 8 && (
                    <button
                      type="button"
                      onClick={() => setDailyTimes((current) => [...current, "18:00"])}
                      className="mt-2 text-xs font-bold text-[#e91818]"
                    >
                      أضف ساعة
                    </button>
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 mb-2">
                    الأيام التي لا يُرسل فيها
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {WEEK_DAYS.map((day) => {
                      const selected = skipDays.includes(day.value);
                      return (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleSkipDay(day.value)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold ${
                            selected
                              ? "bg-slate-800 text-white"
                              : "bg-slate-50 text-slate-600"
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <label className="block">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  <Clock size={14} /> موعد الإرسال، فارغ يعني الآن
                </span>
                <input
                  type="datetime-local"
                  className="mt-1 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                  value={sendAt}
                  onChange={(event) => setSendAt(event.target.value)}
                />
              </label>
            )}
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-red-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:bg-slate-300"
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
              {daily ? "جدولة الإرسال اليومي" : sendAt ? "جدولة الإشعار" : "إرسال الآن"}
            </button>
          </form>
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-64 h-[460px] bg-slate-900 rounded-[2.5rem] border-[7px] border-slate-800 p-4 pt-12 text-right">
              <div className="text-white text-center mb-6">
                <Smartphone className="mx-auto mb-2" size={18} />
                <p className="text-3xl font-light">الآن</p>
              </div>
              <div className="bg-white rounded-2xl p-4">
                <p className="text-sm font-black text-slate-900 line-clamp-2">
                  {title || "العنوان"}
                </p>
                <p className="text-xs text-slate-600 mt-2 line-clamp-4">
                  {message || "الرسالة"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "promo" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          <h2 className="font-bold flex items-center gap-2">
            <TicketPercent size={18} /> إشعار لكود نشط
          </h2>
          {promos.length === 0 ? (
            <p className="text-sm text-slate-400">لا توجد أكواد مفعّلة</p>
          ) : (
            promos.map((item) => {
              const id = item.id || item._id || item.promoCode;
              return (
                <div
                  key={id}
                  className="flex items-center justify-between gap-3 border border-slate-100 rounded-xl px-3 py-2"
                >
                  <div>
                    <p className="font-black">{item.promoCode}</p>
                    <p className="text-xs text-slate-500">
                      {(item.cities || []).join("، ") || "كل المدن"}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={busyId === (item.id || item._id)}
                    onClick={() => blastPromo(item)}
                    className="px-3 py-2 rounded-lg bg-[#e91818] text-white text-xs font-bold disabled:opacity-50"
                  >
                    إرسال
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      <section className="mt-6 bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="font-bold mb-3">
          {tab === "log" ? "كل الإشعارات" : "المرتبط بهذا التبويب"}
        </h2>
        {visible.length === 0 ? (
          <p className="text-sm text-slate-400">لا يوجد شيء بعد</p>
        ) : (
          <div className="space-y-2">
            {visible.map((item) => (
              <article key={item.id} className="border border-slate-100 rounded-xl p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold">{item.title}</p>
                    <p className="text-xs text-slate-500 line-clamp-2">{item.body}</p>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-1 rounded-md bg-slate-100">
                    {item.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  {item.repeat === "daily"
                    ? `يومي ${(item.times?.length
                        ? item.times
                        : [(item.hour ?? 0) * 60 + (item.minute ?? 0)]
                      )
                        .map(
                          (value) =>
                            `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`,
                        )
                        .join(" · ")}`
                    : item.kind}{" "}
                  · {(item.topics || []).join("، ")} · {when(item.sendAt)}
                  {item.repeat === "daily" && (item.skipDays || []).length > 0
                    ? ` · لا يُرسل: ${WEEK_DAYS.filter((day) =>
                        (item.skipDays || []).includes(day.value),
                      )
                        .map((day) => day.label)
                        .join("، ")}`
                    : ""}
                </p>
                {item.error && <p className="text-[11px] text-red-500 mt-1">{item.error}</p>}
                {item.status === "queued" && (
                  <button
                    type="button"
                    disabled={busyId === item.id}
                    onClick={() => cancel(item.id)}
                    className="mt-2 text-xs font-bold text-[#e91818]"
                  >
                    إلغاء
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
