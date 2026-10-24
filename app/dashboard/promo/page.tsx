"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  MapPin,
  Power,
  Search,
  TicketPercent,
} from "lucide-react";
import { useUser } from "@/app/context/UserContext";
import { StoreData } from "@/app/types/store";
import type { DeliveryBearer, PromoCodeItem } from "@/app/types/promo";
import { searchandFindStore } from "../featured/api/api_featured";
import { addPromoCode, listPromoCodes, setPromoStatus } from "./api/promo";

const WEEK_DAYS = [
  { value: 0, label: "أحد" },
  { value: 1, label: "إثن" },
  { value: 2, label: "ثلا" },
  { value: 3, label: "أرب" },
  { value: 4, label: "خمي" },
  { value: 5, label: "جمع" },
  { value: 6, label: "سبت" },
];

const inputClass =
  "w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#e91818] bg-white";

function minutesOf(value: string): number {
  if (!value) return 0;
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0;
  return Math.min(1440, Math.max(0, hours * 60 + minutes));
}

function promoKey(item: PromoCodeItem): string {
  return item.id || item._id || item.promoCode;
}

function formatDate(value: number | string): string {
  if (typeof value === "string" && value) return value;
  if (!value) return "—";
  const date = new Date(Number(value));
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("ar-DZ");
}

export default function PromoPage() {
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [promos, setPromos] = useState<PromoCodeItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeOk, setNoticeOk] = useState(true);

  const [promoCode, setPromoCode] = useState("");
  const [content, setContent] = useState("");
  const [expiringDate, setExpiringDate] = useState("");
  const [storePercent, setStorePercent] = useState("0");
  const [defaultPercent, setDefaultPercent] = useState("0");
  const [minOrderAmount, setMinOrderAmount] = useState("0");
  const [maxDiscountAmount, setMaxDiscountAmount] = useState("0");
  const [deliveryDiscount, setDeliveryDiscount] = useState("0");
  const [isFirstOrderOnly, setIsFirstOrderOnly] = useState(false);
  const [deliveryBearer, setDeliveryBearer] = useState<DeliveryBearer>("app");
  const [storeShare, setStoreShare] = useState("0");
  const [appShare, setAppShare] = useState("100");
  const [radius, setRadius] = useState("2000");
  const [lng, setLng] = useState("");
  const [lat, setLat] = useState("");
  const [cities, setCities] = useState("");
  const [usageLimitPerUser, setUsageLimitPerUser] = useState("1");
  const [fromTime, setFromTime] = useState("");
  const [toTime, setToTime] = useState("");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [restaurantId, setRestaurantId] = useState("");
  const [image, setImage] = useState<File | null>(null);

  const [storeQuery, setStoreQuery] = useState("");
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loadingStores, setLoadingStores] = useState(false);

  const showNotice = (ok: boolean, text: string) => {
    setNoticeOk(ok);
    setNotice(text);
  };

  const loadPromos = async () => {
    setLoadingList(true);
    try {
      const data = await listPromoCodes();
      if (data.status && Array.isArray(data.result)) {
        setPromos(data.result);
      } else {
        showNotice(false, data.message || "تعذر جلب الأكواد");
      }
    } catch {
      showNotice(false, "تعذر الاتصال بالخادم");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "super_admin") {
      router.replace("/dashboard");
      return;
    }
    setReady(true);
    void loadPromos();
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(async () => {
      setLoadingStores(true);
      try {
        const data = await searchandFindStore(storeQuery, router);
        setStores(Array.isArray(data) ? data : []);
      } finally {
        setLoadingStores(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [storeQuery, ready, router]);

  const chooseStore = (store: StoreData) => {
    setRestaurantId(store._id);
    const point = store.location ?? store.postionsEtabliss;
    if (point?.coordinates && point.coordinates.length >= 2) {
      setLng(String(point.coordinates[0]));
      setLat(String(point.coordinates[1]));
    }
    if (store.ville) setCities(store.ville);
  };

  const toggleDay = (day: number) => {
    setDaysOfWeek((current) =>
      current.includes(day)
        ? current.filter((item) => item !== day)
        : [...current, day].sort((a, b) => a - b),
    );
  };

  const onBearerChange = (value: DeliveryBearer) => {
    setDeliveryBearer(value);
    if (value === "app") {
      setStoreShare("0");
      setAppShare("100");
    } else if (value === "store") {
      setStoreShare("100");
      setAppShare("0");
    } else {
      setStoreShare("50");
      setAppShare("50");
    }
  };

  const submitPromo = async (event: FormEvent) => {
    event.preventDefault();
    const code = promoCode.trim();
    const longitude = Number(lng);
    const latitude = Number(lat);
    const storePart = Number(storePercent);
    const appPart = Number(defaultPercent);
    const restaurantPart = Number(storeShare);
    const platformPart = Number(appShare);

    if (!code) {
      showNotice(false, "كود البرومو مطلوب");
      return;
    }
    if (!expiringDate) {
      showNotice(false, "تاريخ الانتهاء مطلوب");
      return;
    }
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
      showNotice(false, "إحداثيات المركز مطلوبة");
      return;
    }
    if (
      storePart < 0 ||
      storePart > 100 ||
      appPart < 0 ||
      appPart > 100 ||
      storePart + appPart > 100
    ) {
      showNotice(false, "نسب الخصم يجب أن تكون بين 0 و 100");
      return;
    }
    if (restaurantPart + platformPart !== 100) {
      showNotice(false, "مجموع تحمل التوصيل يجب أن يساوي 100");
      return;
    }

    const expiring = new Date(`${expiringDate}T23:59:59`).getTime();
    const fields: Record<string, string> = {
      promoCode: code,
      content,
      expiringDate: String(expiring),
      dateFinish: expiringDate,
      storePercent: String(storePart),
      defaultPercent: String(appPart),
      totalPercent: String(storePart + appPart),
      minOrderAmount,
      maxDiscountAmount,
      deliveryDiscount,
      isFirstOrderOnly: String(isFirstOrderOnly),
      deliveryBearer,
      radius: radius || "2000",
      isActive: "true",
      usageLimitPerUser: usageLimitPerUser || "1",
      cities,
      lng: String(longitude),
      lat: String(latitude),
      center: JSON.stringify({
        type: "Point",
        coordinates: [longitude, latitude],
      }),
      timeSlot: JSON.stringify({
        from: minutesOf(fromTime),
        to: minutesOf(toTime),
        timezone: "Africa/Algiers",
        daysOfWeek,
      }),
      deliveryBearerRatio: JSON.stringify({
        storeShare: restaurantPart,
        appShare: platformPart,
        total: 100,
      }),
    };
    if (restaurantId) fields.restaurantId = restaurantId;

    setSaving(true);
    try {
      const data = await addPromoCode(fields, image);
      showNotice(Boolean(data.status), data.message || "تعذر إضافة الكود");
      if (data.status) {
        setPromoCode("");
        setContent("");
        setImage(null);
        await loadPromos();
      }
    } catch {
      showNotice(false, "تعذر الاتصال بالخادم");
    } finally {
      setSaving(false);
    }
  };

  const togglePromo = async (item: PromoCodeItem) => {
    const id = item.id || item._id;
    if (!id) return;
    setBusyId(id);
    try {
      const data = await setPromoStatus(id, !item.isActive);
      showNotice(Boolean(data.status), data.message || "تعذر تحديث الكود");
      if (data.status) await loadPromos();
    } catch {
      showNotice(false, "تعذر الاتصال بالخادم");
    } finally {
      setBusyId("");
    }
  };

  if (authLoading || !ready) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto text-right" dir="rtl">
      <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
        <div className="bg-[#e91818]/10 p-2.5 rounded-xl text-[#e91818]">
          <TicketPercent size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-950">Codes promo</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            إضافة أكواد الخصم وتعطيلها. الصفحة متاحة لـ super admin فقط.
          </p>
        </div>
      </div>

      {notice && (
        <p
          className={`mb-4 rounded-xl px-4 py-3 text-sm font-medium ${
            noticeOk ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}
        >
          {notice}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <form
          onSubmit={submitPromo}
          className="lg:col-span-3 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4"
        >
          <h2 className="font-bold text-gray-800">كود جديد</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-xs font-semibold text-gray-500 mb-2">
                الكود
              </span>
              <input
                className={inputClass}
                value={promoCode}
                onChange={(event) => setPromoCode(event.target.value)}
                placeholder="BULEK10"
              />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-gray-500 mb-2">
                تاريخ الانتهاء
              </span>
              <input
                type="date"
                className={inputClass}
                value={expiringDate}
                onChange={(event) => setExpiringDate(event.target.value)}
              />
            </label>
            <label className="block md:col-span-2">
              <span className="block text-xs font-semibold text-gray-500 mb-2">
                الوصف
              </span>
              <input
                className={inputClass}
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="خصم على الطلب"
              />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-gray-500 mb-2">
                نسبة المتجر %
              </span>
              <input
                type="number"
                min={0}
                max={100}
                className={inputClass}
                value={storePercent}
                onChange={(event) => setStorePercent(event.target.value)}
              />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-gray-500 mb-2">
                نسبة التطبيق %
              </span>
              <input
                type="number"
                min={0}
                max={100}
                className={inputClass}
                value={defaultPercent}
                onChange={(event) => setDefaultPercent(event.target.value)}
              />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-gray-500 mb-2">
                الحد الأدنى للطلب
              </span>
              <input
                type="number"
                min={0}
                className={inputClass}
                value={minOrderAmount}
                onChange={(event) => setMinOrderAmount(event.target.value)}
              />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-gray-500 mb-2">
                أقصى خصم
              </span>
              <input
                type="number"
                min={0}
                className={inputClass}
                value={maxDiscountAmount}
                onChange={(event) => setMaxDiscountAmount(event.target.value)}
              />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-gray-500 mb-2">
                خصم التوصيل
              </span>
              <input
                type="number"
                min={0}
                className={inputClass}
                value={deliveryDiscount}
                onChange={(event) => setDeliveryDiscount(event.target.value)}
              />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-gray-500 mb-2">
                من يتحمل التوصيل
              </span>
              <select
                className={inputClass}
                value={deliveryBearer}
                onChange={(event) =>
                  onBearerChange(event.target.value as DeliveryBearer)
                }
              >
                <option value="app">التطبيق</option>
                <option value="store">المتجر</option>
                <option value="both">الاثنان</option>
              </select>
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-gray-500 mb-2">
                حصة المتجر من التوصيل %
              </span>
              <input
                type="number"
                min={0}
                max={100}
                className={inputClass}
                value={storeShare}
                onChange={(event) => setStoreShare(event.target.value)}
              />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-gray-500 mb-2">
                حصة التطبيق من التوصيل %
              </span>
              <input
                type="number"
                min={0}
                max={100}
                className={inputClass}
                value={appShare}
                onChange={(event) => setAppShare(event.target.value)}
              />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-gray-500 mb-2">
                الحد لكل مستخدم
              </span>
              <input
                type="number"
                min={1}
                className={inputClass}
                value={usageLimitPerUser}
                onChange={(event) => setUsageLimitPerUser(event.target.value)}
              />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-gray-500 mb-2">
                نصف القطر (متر)
              </span>
              <input
                type="number"
                min={0}
                className={inputClass}
                value={radius}
                onChange={(event) => setRadius(event.target.value)}
              />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-gray-500 mb-2">
                خط الطول
              </span>
              <input
                className={inputClass}
                value={lng}
                onChange={(event) => setLng(event.target.value)}
                placeholder="3.05"
              />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-gray-500 mb-2">
                خط العرض
              </span>
              <input
                className={inputClass}
                value={lat}
                onChange={(event) => setLat(event.target.value)}
                placeholder="36.75"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="block text-xs font-semibold text-gray-500 mb-2">
                المدن، مفصولة بفاصلة
              </span>
              <input
                className={inputClass}
                value={cities}
                onChange={(event) => setCities(event.target.value)}
                placeholder="Alger, Oran"
              />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-gray-500 mb-2">
                من الساعة
              </span>
              <input
                type="time"
                className={inputClass}
                value={fromTime}
                onChange={(event) => setFromTime(event.target.value)}
              />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-gray-500 mb-2">
                إلى الساعة
              </span>
              <input
                type="time"
                className={inputClass}
                value={toTime}
                onChange={(event) => setToTime(event.target.value)}
              />
            </label>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">أيام الأسبوع</p>
            <div className="flex flex-wrap gap-2">
              {WEEK_DAYS.map((day) => {
                const selected = daysOfWeek.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold ${
                      selected
                        ? "bg-[#e91818] text-white"
                        : "bg-gray-50 text-gray-600"
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex items-center justify-between gap-3 bg-gray-50 rounded-xl px-4 py-3">
            <span className="text-sm font-medium text-gray-700">
              للطلب الأول فقط
            </span>
            <input
              type="checkbox"
              checked={isFirstOrderOnly}
              onChange={(event) => setIsFirstOrderOnly(event.target.checked)}
            />
          </label>

          <label className="block">
            <span className="block text-xs font-semibold text-gray-500 mb-2">
              صورة الكود
            </span>
            <input
              type="file"
              accept="image/*"
              className={inputClass}
              onChange={(event) => setImage(event.target.files?.[0] ?? null)}
            />
          </label>

          <div className="border border-gray-100 rounded-xl p-3">
            <div className="relative mb-3">
              <Search className="absolute right-3 top-2.5 text-gray-400" size={18} />
              <input
                className={`${inputClass} pr-10`}
                value={storeQuery}
                onChange={(event) => setStoreQuery(event.target.value)}
                placeholder="ابحث عن متجر لربط الكود وملء الإحداثيات"
              />
            </div>
            {loadingStores ? (
              <Loader2 className="animate-spin text-gray-400 mx-auto" size={18} />
            ) : (
              <div className="max-h-36 overflow-y-auto space-y-1">
                {stores.slice(0, 6).map((store) => (
                  <button
                    key={store._id}
                    type="button"
                    onClick={() => chooseStore(store)}
                    className={`w-full text-right px-3 py-2 rounded-lg text-sm ${
                      restaurantId === store._id
                        ? "bg-[#e91818] text-white"
                        : "bg-gray-50 text-gray-700"
                    }`}
                  >
                    {store.nameEtabliss}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full h-11 rounded-xl bg-[#e91818] text-white font-bold text-sm disabled:bg-gray-300"
          >
            {saving ? "جارٍ الحفظ..." : "إضافة الكود"}
          </button>
        </form>

        <section className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="font-bold text-gray-800 mb-4">الأكواد الحالية</h2>
          {loadingList ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-gray-400" />
            </div>
          ) : promos.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              لا توجد أكواد بعد
            </p>
          ) : (
            <div className="space-y-3 max-h-[760px] overflow-y-auto">
              {promos.map((item) => {
                const id = promoKey(item);
                return (
                  <article
                    key={id}
                    className="border border-gray-100 rounded-xl p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-black text-gray-900">{item.promoCode}</p>
                        <p className="text-xs text-gray-500">{item.content || "—"}</p>
                      </div>
                      <span
                        className={`text-[11px] font-bold px-2 py-1 rounded-md ${
                          item.isActive
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {item.isActive ? "مفعّل" : "معطّل"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin size={12} />
                      {(item.cities || []).join("، ") || "كل المدن"} · ينتهي{" "}
                      {formatDate(item.dateFinish || item.expiringDate)}
                    </p>
                    <p className="text-xs text-gray-500">
                      خصم {item.totalPercent || 0}% · توصيل {item.deliveryBearer}
                    </p>
                    <button
                      type="button"
                      disabled={busyId === (item.id || item._id)}
                      onClick={() => togglePromo(item)}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold border border-gray-200 hover:border-[#e91818] hover:text-[#e91818] disabled:opacity-50"
                    >
                      <Power size={14} />
                      {item.isActive ? "تعطيل" : "تفعيل"}
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
