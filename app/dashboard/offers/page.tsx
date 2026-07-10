"use client";
import { useState, useEffect } from "react";
import { Percent, Truck, Utensils, Search, Save, Loader2 } from "lucide-react";
import { searchandFindStore } from "../featured/api/api_featured";
import { StoreData } from "@/app/types/store";
import { getDocStore, saveDocStore } from "./api/handle_offers";
import { useUser } from "@/app/context/UserContext";
import { useRouter } from "next/navigation";

export default function OffersPage() {
  const { user } = useUser();
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [hasFreeDelivery, setHasFreeDelivery] = useState(false);
  const [freeDeliveryMinAmount, setFreeDeliveryMinAmount] = useState("");

  const [hasOrderDiscount, setHasOrderDiscount] = useState(false);
  const [discountMinAmount, setDiscountMinAmount] = useState("");
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState<number | "">("");

  const [stores, setStores] = useState<StoreData[]>([]);
  const [restaurantShare, setRestaurantShare] = useState(100);
  const [platformShare, setPlatformShare] = useState(0);
  const [deliveryResShare, setDeliveryResShare] = useState(100);
  const [deliveryPlatShare, setDeliveryPlatShare] = useState(0);
  const [maxFreeDeliveryDistance, setMaxFreeDeliveryDistance] = useState("");

  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    const fetchStores = async () => {
      try {
        setLoadingRestaurants(true);
        const data = await searchandFindStore(searchQuery, router);
        if (!!data) {
          setStores(data);
        }
      } catch (error) {
        console.error("Error fetching stores:", error);
      } finally {
        setLoadingRestaurants(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchStores();
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, user]);

  useEffect(() => {
    if (discountType === "percentage" && discountValue !== "") {
      const numericValue = Number(discountValue);

      if (numericValue > 100) {
        setDiscountValue(100);
        console.log("🛡️ تم قمع الرقم وتصغيره إلى 100% بسبب تحويل نوع الخصم");
      }
    }
  }, [discountType, discountValue]);

  useEffect(() => {
    if (!user) return;
    if (!selectedRestaurantId) return;

    async function fetchRestaurantSettings() {
      const data = await getDocStore(selectedRestaurantId);
      console.log(data.deliverySettings);
      setHasFreeDelivery(
        data.deliverySettings?.hasFreeDeliveryThreshold || false,
      );
      setFreeDeliveryMinAmount(
        data.deliverySettings?.freeDeliveryMinAmount || "",
      );

      setHasOrderDiscount(data.discountSettings?.hasOrderDiscount || false);
      setDiscountMinAmount(data.discountSettings?.minAmountForDiscount || "");
      setDiscountType(data.discountSettings?.discountType || "percentage");
      setDiscountValue(data.discountSettings?.discountValue || "");

      setMaxFreeDeliveryDistance(
        data.deliverySettings?.maxFreeDeliveryDistance ?? 0,
      );

      setRestaurantShare(
        data.discountSettings?.sponsoredBy?.restaurantShare ?? 100,
      );
      setPlatformShare(data.discountSettings?.sponsoredBy?.platformShare ?? 0);

      setDeliveryResShare(
        data.deliverySettings?.sponsoredBy?.restaurantShare ?? 100,
      );
      setDeliveryPlatShare(
        data.deliverySettings?.sponsoredBy?.platformShare ?? 0,
      );
    }
    fetchRestaurantSettings();
  }, [selectedRestaurantId, user]);

  const handleSaveSettings = async () => {
    if (!selectedRestaurantId) {
      alert("الرجاء اختيار مطعم أولاً!");
      return;
    }
    //  console.log(discountValue);

    if (Number(restaurantShare) + Number(platformShare) !== 100) {
      alert("خطأ: يجب أن يكون مجموع نسب تقاسم الخصم مساوياً لـ 100% تماماً!");
      return;
    }

    if (Number(deliveryResShare) + Number(deliveryPlatShare) !== 100) {
      alert("خطأ: يجب أن يكون مجموع نسب تقاسم التوصيل مساوياً لـ 100% تماماً!");
      return;
    }

    setIsSaving(true);

    const payload = {
      deliverySettings: {
        hasFreeDeliveryThreshold: hasFreeDelivery,
        freeDeliveryMinAmount: hasFreeDelivery
          ? Number(freeDeliveryMinAmount)
          : 0,
        // 🔥 إضافة الحد الأقصى للمسافة بالمتر
        maxFreeDeliveryDistance: hasFreeDelivery
          ? Number(maxFreeDeliveryDistance)
          : 0,
        // 🔥 إضافة كائن تقاسم تكلفة التوصيل
        sponsoredBy: {
          restaurantShare: Number(deliveryResShare),
          platformShare: Number(deliveryPlatShare),
        },
      },
      discountSettings: {
        hasOrderDiscount: hasOrderDiscount,
        minAmountForDiscount: hasOrderDiscount ? Number(discountMinAmount) : 0,
        discountType: discountType,
        discountValue: hasOrderDiscount ? Number(discountValue) : 0,
        // 🔥 إضافة كائن تقاسم تكلفة خصم السلة
        sponsoredBy: {
          restaurantShare: Number(restaurantShare),
          platformShare: Number(platformShare),
        },
      },
    };

    const data = await saveDocStore(selectedRestaurantId, payload);

    const updatedData = data;
    if (updatedData) {
      alert("تم تحديث عروض وتوصيل المطعم بنجاح! 🎉");
      setHasFreeDelivery(
        updatedData.deliverySettings?.hasFreeDeliveryThreshold ?? false,
      );
      setFreeDeliveryMinAmount(
        updatedData.deliverySettings?.freeDeliveryMinAmount ?? 0,
      );
      setMaxFreeDeliveryDistance(
        updatedData.deliverySettings?.maxFreeDeliveryDistance ?? 0,
      );

      setDeliveryResShare(
        updatedData.deliverySettings?.sponsoredBy?.restaurantShare ?? 100,
      );
      setDeliveryPlatShare(
        updatedData.deliverySettings?.sponsoredBy?.platformShare ?? 0,
      );

      setHasOrderDiscount(
        updatedData.discountSettings?.hasOrderDiscount ?? false,
      );
      setDiscountMinAmount(
        updatedData.discountSettings?.minAmountForDiscount ?? 0,
      );
      setDiscountType(
        updatedData.discountSettings?.discountType ?? "percentage",
      );
      setDiscountValue(updatedData.discountSettings?.discountValue ?? 0);

      setRestaurantShare(
        updatedData.discountSettings?.sponsoredBy?.restaurantShare ?? 100,
      );
      setPlatformShare(
        updatedData.discountSettings?.sponsoredBy?.platformShare ?? 0,
      );
    }
    setIsSaving(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto text-right" dir="rtl">
      {/* عنوان الصفحة الرئيسي */}
      <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-4">
        <div className="bg-[#e91818]/10 p-2.5 rounded-xl text-[#e91818]">
          <Percent size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-950">
            Offres & Livraisons
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            إدارة رسوم التوصيل المجاني والتخفيضات الخاصة بكل شريك
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* العمود الأيمن: اختيار وبحث عن المطعم المعني */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm h-fit">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Utensils size={18} className="text-gray-400" />
            1. اختيار المطعم
          </h2>

          <div className="relative mb-4">
            <Search
              className="absolute right-3 top-2.5 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="ابحث عن مطعم..."
              className="w-full pr-10 pl-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#e91818] transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {loadingRestaurants ? (
            <div className="flex justify-center p-4">
              <Loader2 className="animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {stores.map((store) => (
                <button
                  key={store._id}
                  onClick={() => setSelectedRestaurantId(store._id)}
                  className={`w-full text-right px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    selectedRestaurantId === store._id
                      ? "bg-[#e91818] text-white shadow-md font-bold"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {store.nameEtabliss}
                </button>
              ))}
              {stores.length === 0 && (
                <p className="text-xs text-center text-gray-400 py-4">
                  لا توجد نتائج مطابقة
                </p>
              )}
            </div>
          )}
        </div>

        {/* العمود الأيسر: لوحة التحكم وضبط الحقول */}
        <div className="md:col-span-2 space-y-6">
          {!selectedRestaurantId ? (
            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center text-gray-400">
              <Percent size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="font-medium text-sm">
                الرجاء تحديد مطعم من القائمة اليمنى للبدء في ضبط العروض الخاصة
                به.
              </p>
            </div>
          ) : (
            <>
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck size={20} className="text-orange-500" />
                    <h3 className="font-bold text-gray-800">
                      التوصيل المجاني المشروط
                    </h3>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasFreeDelivery}
                      onChange={(e) => setHasFreeDelivery(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-400 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full rtl:peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                  </label>
                </div>

                {hasFreeDelivery && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fadeIn">
                    {/* 1. الحد الأدنى للمبلغ */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-2">
                        الحد الأدنى لقيمة الطلب لتفعيل التوصيل المجاني (
                        {user?.currency})
                      </label>
                      <input
                        type="number"
                        placeholder="مثال: 1500"
                        className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#e91818]"
                        value={freeDeliveryMinAmount}
                        onChange={(e) =>
                          setFreeDeliveryMinAmount(e.target.value)
                        }
                      />
                    </div>

                    {/* 2. المسافة القصوى المشروطة */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-2">
                        المسافة القصوى للتوصيل المجاني (بالمتر - m)
                      </label>
                      <input
                        type="number"
                        // 🔥 تم تحديث المثال ليظهر أرقاماً تدل على الأمتار الحقيقية (مثل 4000 متر = 4 كلم)
                        placeholder="مثال: 4000 (اتركه 0 لإلغاء حدود المسافة)"
                        className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#e91818]"
                        value={maxFreeDeliveryDistance}
                        onChange={(e) =>
                          setMaxFreeDeliveryDistance(e.target.value)
                        }
                      />
                      <p className="text-[10px] text-gray-400 mt-1">
                        تنبيه: اكتب المسافة بالأمتار. إذا زادت مسافة العميل عن
                        هذا الرقم، يدفع رسوم التوصيل العادية.
                      </p>
                    </div>

                    {/* 3. الجهة المتحملة للتكلفة */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-2">
                        تقاسم تكلفة التوصيل المجاني (المطعم % / المنصة %)
                      </label>
                      <select
                        className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#e91818] bg-white h-[46px]"
                        value={`${deliveryResShare}-${deliveryPlatShare}`}
                        onChange={(e) => {
                          const [resValue, platValue] =
                            e.target.value.split("-");
                          setDeliveryResShare(Number(resValue));
                          setDeliveryPlatShare(Number(platValue));
                        }}
                      >
                        <option value="100-0">
                          المطعم بالكامل (100% / 0%)
                        </option>
                        <option value="80-20">80% مطعم / 20% منصة</option>
                        <option value="50-50">مناصفة (50% / 50%)</option>
                        <option value="20-80">20% مطعم / 80% منصة</option>
                        <option value="0-100">
                          المنصة بالكامل (0% / 100%)
                        </option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* 🎯 شريحة خصومات الطلبات */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Percent size={20} className="text-blue-500" />
                    <h3 className="font-bold text-gray-800">
                      خصم مالي على إجمالي الطلب
                    </h3>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasOrderDiscount}
                      onChange={(e) => setHasOrderDiscount(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-400 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full rtl:peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                  </label>
                </div>

                {hasOrderDiscount && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-2">
                        الحد الأدنى لتفعيل الخصم (DZD)
                      </label>
                      <input
                        type="number"
                        placeholder="مثال: 2000"
                        className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#e91818]"
                        value={discountMinAmount}
                        onChange={(e) => setDiscountMinAmount(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-2">
                        نوع التخفيض
                      </label>
                      <select
                        className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#e91818] bg-white h-[46px]"
                        value={discountType}
                        onChange={(e) => setDiscountType(e.target.value)}
                      >
                        <option value="percentage">نسبة مئوية (%)</option>
                        <option value="fixed">قيمة ثابتة (DZD)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-2">
                        قيمة الخصم المطلوبة{" "}
                        {discountType === "percentage" ? "(%)" : "(DZD)"}
                      </label>
                      <input
                        type="number"
                        placeholder={
                          discountType === "percentage"
                            ? "مثال: 10"
                            : "مثال: 300"
                        }
                        className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#e91818]"
                        value={discountValue}
                        onChange={(e) => {
                          let val = Number(e.target.value);

                          // 🔥 إذا كان نوع الخصم نسبة مئوية، نقوم بحصر القيمة بين 0 و 100
                          if (discountType === "percentage") {
                            val = Math.min(100, Math.max(0, val));
                          } else {
                            // إذا كان بالدينار (DZD)، نمنع فقط الأرقام السالبة
                            val = Math.max(0, val);
                          }

                          // إرجاع القيمة إلى الـ State (إذا كانت الخانة فارغة تماماً نتركها لتسهيل الكتابة)
                          setDiscountValue(e.target.value === "" ? "" : val);
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-2">
                        تقاسم تكلفة خصم السلة (المطعم % / المنصة %)
                      </label>
                      <select
                        className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#e91818] bg-white h-[46px]"
                        value={`${restaurantShare}-${platformShare}`}
                        onChange={(e) => {
                          const [resValue, platValue] =
                            e.target.value.split("-");
                          setRestaurantShare(Number(resValue));
                          setPlatformShare(Number(platValue));
                        }}
                      >
                        <option value="100-0">
                          المطعم بالكامل (100% / 0%)
                        </option>
                        <option value="80-20">80% مطعم / 20% منصة</option>
                        <option value="50-50">مناصفة (50% / 50%)</option>
                        <option value="20-80">20% مطعم / 80% منصة</option>
                        <option value="0-100">
                          المنصة بالكامل (0% / 100%)
                        </option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* 💾 زر الحفظ النهائي المثبت */}
              <button
                onClick={handleSaveSettings}
                disabled={isSaving || !selectedRestaurantId}
                className={`
    relative flex items-center justify-center gap-2 w-full md:w-auto min-w-[150px] h-[46px] px-6 rounded-xl font-semibold text-sm transition-all duration-300 ease-in-out
    ${
      isSaving
        ? "bg-gray-400 text-white cursor-not-allowed scale-98 shadow-inner"
        : !selectedRestaurantId
          ? "bg-gray-200 text-gray-450 cursor-not-allowed"
          : "bg-[#e91818] text-white hover:bg-[#c71212] hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
    }
  `}
              >
                {isSaving ? (
                  <>
                    {/* 🔄 أنيميشن Spinner الدوران */}
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>جاري حفظ البيانات...</span>
                  </>
                ) : (
                  <>
                    {/* 💾 الحالة العادية للزر قبل الحفظ */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
                      />
                    </svg>
                    <span>حفظ التعديلات</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
