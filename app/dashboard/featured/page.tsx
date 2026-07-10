/* eslint-disable @next/next/no-img-element */
"use client";
import { useState, useEffect } from "react";
import {
  Sparkles,
  Search,
  Store,
  CheckCircle2,
  Save,
  ChevronRight,
  Info,
  Calendar,
  Loader2,
} from "lucide-react";
import {
  findProductsFauterd,
  saveFeatuerd,
  searchandFindStore,
} from "./api/api_featured";
import { StoreData } from "@/app/types/store";
import { Product } from "@/app/types/Orders";
import { useRouter } from "next/navigation";

export default function FeaturedPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [stores, setStores] = useState<StoreData[]>([]);
  const [items, setItems] = useState<Product[]>([]);

  // تبويبات التصفية للمتاجر
  const [activeTab, setActiveTab] = useState<"all" | "featured">("all");

  const [selectedStore, setSelectedStore] = useState<StoreData | null>(null);
  const [isFeatured, setIsFeatured] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // حالات التحميل (Loading States)
  const [loadingStores, setLoadingStores] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];

  const router = useRouter();

  // 🔄 دالة مطورة لحساب الوقت المتبقي بناءً على تاريخ السيرفر الممرر
  const getRemainingDays = (
    endDateStr: string | undefined,
  ): { text: string; status: "active" | "urgent" | "expired" } => {
    if (!endDateStr) return { text: "Non défini", status: "expired" };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endDate = new Date(endDateStr);
    endDate.setHours(0, 0, 0, 0);

    const differenceInTime = endDate.getTime() - today.getTime();
    const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));

    if (differenceInDays > 0) {
      if (differenceInDays <= 3) {
        return { text: `Reste ${differenceInDays} j`, status: "urgent" }; // أقل من 3 أيام (برتقالي)
      }
      return { text: `Reste ${differenceInDays} j`, status: "active" }; // مستقر (أخضر)
    } else if (differenceInDays === 0) {
      return { text: "Expire Aujourd'hui", status: "urgent" };
    } else {
      return { text: "Expiré", status: "expired" }; // منتهي الصلاحية (رمادي)
    }
  };

  useEffect(() => {
    const fetchStores = async () => {
      setLoadingStores(true);
      try {
        const data = await searchandFindStore(searchQuery, router);
        if (!!data) {
          setStores(data);
        }
      } catch (error) {
        console.error("Error fetching stores:", error);
      } finally {
        setLoadingStores(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchStores();
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // 2. دالة جلب الأطباق وتعبئة التواريخ عند اختيار المتجر
  const handleSelectStore = async (store: StoreData) => {
    setSelectedStore(store);

    setIsFeatured(store.isFeatured || false);

    const savedStart = store.campaignStart
      ? store.campaignStart.split("T")[0]
      : "";
    const savedEnd = store.campaignEnd ? store.campaignEnd.split("T")[0] : "";

    setStartDate(savedStart >= todayStr ? savedStart : todayStr);
    setEndDate(savedEnd);

    setItems([]);
    setSelectedItems([]);
    setLoadingItems(true);

    const data = await findProductsFauterd(store.clientId);

    setItems(data);
    setLoadingItems(false);

    // setSelectedItems(store.featuredItems || data.currentlyFeaturedItemsIds || []);
  };

  const toggleItem = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter((id) => id !== itemId));
    } else {
      if (selectedItems.length < 6) {
        setSelectedItems([...selectedItems, itemId]);
      } else {
        alert("Maximum 6 items autorisés");
      }
    }
  };

  const storesToDisplay = stores.filter((store) => {
    if (activeTab === "featured") {
      return store.isFeatured === true; // يظهر فقط التي تم تفعيلها وبها isFeatured: true
    }
    return true;
  });

  const handleSave = async () => {
    if (!selectedStore) return;

    if (isFeatured) {
      if (!startDate || !endDate) {
        alert("Erreur: Veuillez sélectionner les dates de début et de fin.");
        return;
      }
      if (startDate < todayStr || endDate < todayStr) {
        alert("Erreur: Les dates ne peuvent pas être dans le passé.");
        return;
      }
      if (endDate <= startDate) {
        alert(
          "Erreur: La date de fin doit être supérieure à la date de début.",
        );
        return;
      }
      if (selectedItems.length === 0) {
        alert("Erreur: Veuillez sélectionner au moins un plat.");
        return;
      }
    }

    setSubmitting(true);
    try {
      await saveFeatuerd(selectedStore._id, selectedItems, startDate, endDate);

      alert("Configuration enregistrée sur le serveur avec succès ! ✅");
      setStores(
        stores.map((s) =>
          s._id === selectedStore._id
            ? {
                ...s,
                isFeatured,
                campaignStart: startDate,
                campaignEnd: endDate,
                featuredItems: selectedItems,
              }
            : s,
        ),
      );
    } catch (error) {
      alert("Une erreur est survenue lors de l'enregistrement.");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Sparkles className="text-[#e91818]" />
            Gestion des Sélections (Featured)
          </h1>
          <p className="text-gray-500 text-sm">
            Contrôlez les restaurants, plats et périodes de mise en avant
          </p>
        </div>

        {selectedStore && (
          <button
            onClick={handleSave}
            disabled={submitting}
            className="bg-[#e91818] text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-red-700 transition-all disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {submitting ? "Enregistrement..." : "Enregistrer"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Store Selection */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            {/* التصفية الذكية */}
            <div className="flex gap-2 mb-4 p-1 bg-gray-50 rounded-xl border border-gray-100">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === "all"
                    ? "bg-white shadow-sm text-gray-900"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                Tous
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("featured")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                  activeTab === "featured"
                    ? "bg-white shadow-sm text-[#e91818]"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                En Vedette 🔥
              </button>
            </div>

            <div className="relative mb-4">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un partenaire..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-red-100 outline-none text-gray-700"
              />
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {loadingStores ? (
                <div className="flex items-center justify-center py-8 text-gray-400 gap-2">
                  <Loader2 size={20} className="animate-spin text-[#e91818]" />
                  <span className="text-xs font-medium">
                    Chargement des restaurants...
                  </span>
                </div>
              ) : (
                storesToDisplay.map((store) => {
                  // حساب وعرض الوقت المتبقي بناءً على حقل حملة المتجر المخزنة
                  const badgeInfo = getRemainingDays(store.campaignEnd);

                  return (
                    <button
                      key={store._id}
                      onClick={() => handleSelectStore(store)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all border ${
                        selectedStore?._id === store._id
                          ? "bg-red-50 border-red-100 text-[#e91818]"
                          : "hover:bg-gray-50 border-transparent text-gray-700"
                      }`}
                    >
                      <div className="flex items-center gap-3 w-full min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 transition-all ${
                            selectedStore?._id === store._id
                              ? "bg-white text-[#e91818]"
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {store.image ? (
                            <img
                              src={store.image}
                              alt={store.nameEtabliss}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                  parent.innerHTML =
                                    '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-store"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v-4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2 2 0 0 1-2-2V7"/><path d="M14 7v3a2 2 0 0 1-2 2v0a2 2 0 0 1-2-2V7"/><path d="M6 7v3a2 2 0 0 1-2 2v0a2 2 0 0 1-2-2V7"/></svg>';
                                }
                              }}
                            />
                          ) : (
                            <Store size={18} />
                          )}
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-sm font-bold truncate">
                              {store.nameEtabliss}
                            </p>

                            {/* شارة إظهار وقت الانتهاء المستخلص من الـ Object الحقيقي */}
                            {store.isFeatured && store.campaignEnd && (
                              <span
                                className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold flex-shrink-0 ${
                                  badgeInfo.status === "expired"
                                    ? "bg-gray-100 text-gray-400"
                                    : badgeInfo.status === "urgent"
                                      ? "bg-orange-100 text-orange-600 animate-pulse"
                                      : "bg-green-50 text-green-600"
                                }`}
                              >
                                {badgeInfo.text}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] opacity-60 font-medium truncate">
                            {store.typeEtabliss || "Partenaire"} •{" "}
                            {store.ville || "Algérie"}
                          </p>
                        </div>
                      </div>
                      <ChevronRight
                        size={16}
                        className={`flex-shrink-0 ml-1 ${
                          selectedStore?._id === store._id
                            ? "opacity-100"
                            : "opacity-30"
                        }`}
                      />
                    </button>
                  );
                })
              )}

              {!loadingStores && storesToDisplay.length === 0 && (
                <p className="text-center py-6 text-xs text-gray-400 font-medium">
                  Aucun partenaire trouvé
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Configuration */}
        <div className="lg:col-span-2">
          {!selectedStore ? (
            <div className="h-64 bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center text-gray-400 gap-2">
              <Store size={48} strokeWidth={1} />
              <p className="font-medium text-sm">
                Veuillez sélectionner un partenaire pour commencer
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Activation Toggle + Date Settings */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm md:text-base">
                      Statut de mise en avant
                    </h3>
                    <p className="text-xs md:text-sm text-gray-500">
                      Afficher ce restaurant dans la section &quot;Pour
                      vous&quot; (Home)
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-7 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#e91818]"></div>
                  </label>
                </div>

                {isFeatured && (
                  <div className="pt-4 border-t border-gray-50 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 flex items-center gap-1">
                        <Calendar size={14} className="text-gray-400" />
                        Date de début
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        min={todayStr}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          if (endDate && e.target.value >= endDate)
                            setEndDate("");
                        }}
                        className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium text-gray-700 outline-none focus:border-red-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 flex items-center gap-1">
                        <Calendar size={14} className="text-gray-400" />
                        Date de fin
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        min={startDate || todayStr}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium text-gray-700 outline-none focus:border-red-200"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Items Selection */}
              <div
                className={`bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-opacity ${
                  !isFeatured &&
                  "opacity-40 peer-events-none select-none pointer-events-none"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-6">
                  <h3 className="font-bold text-gray-900 text-sm md:text-base">
                    Plats sélectionnés ({selectedItems.length}/6)
                  </h3>
                  <div className="flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-bold w-fit">
                    <Info size={12} />
                    INFO: Ces plats apparaîtront sous le restaurant
                  </div>
                </div>

                {loadingItems ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
                    <Loader2
                      size={32}
                      className="animate-spin text-[#e91818]"
                    />
                    <p className="text-xs font-medium">
                      Chargement du menu du restaurant...
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {items.map((item) => {
                      const isSelected = selectedItems.includes(item._id);
                      return (
                        <div
                          key={item._id}
                          onClick={() => toggleItem(item._id)}
                          className={`relative cursor-pointer p-4 rounded-2xl border-2 transition-all ${
                            isSelected
                              ? "border-[#e91818] bg-red-50/30"
                              : "border-gray-100 hover:border-gray-200"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shrink-0 transition-all ${
                                isSelected
                                  ? "bg-red-100 text-[#e91818]"
                                  : "bg-gray-100 text-gray-400"
                              }`}
                            >
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                    const parent =
                                      e.currentTarget.parentElement;
                                    if (parent) {
                                      parent.innerHTML =
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-store"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v-4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2 2 0 0 1-2-2V7"/><path d="M14 7v3a2 2 0 0 1-2 2v0a2 2 0 0 1-2-2V7"/><path d="M6 7v3a2 2 0 0 1-2 2v0a2 2 0 0 1-2-2V7"/></svg>';
                                    }
                                  }}
                                />
                              ) : (
                                <Store size={18} />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-gray-800">
                                {item.title}
                              </p>
                              <p className="text-[#e91818] font-black text-sm">
                                {item.price}{" "}
                                <span className="text-[10px] font-normal">
                                  {item.currency}
                                </span>
                              </p>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="absolute top-2 right-2 text-[#e91818]">
                              <CheckCircle2 size={20} fill="white" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
