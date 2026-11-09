"use client";
import {
  Filter,
  Search,
  Store,
  MapPin,
  Phone,
  Eye,
  Edit,
  Clock,
  X,
  Plus,
  Trash2,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  acceptedStoreSent,
  GetStoreList,
  handleOnlineStatus,
  linkStoreCategories,
  updateStoreDetails,
} from "./api/storeHandel";
import { useUser } from "@/app/context/UserContext";
import { StoreData, Workday } from "@/app/types/store";
import { listTagCatalog, type StoreTag, type TagCategory } from "../tags/api/tags";
import { useRouter } from "next/navigation";

type ChosenTag = { id: string; name: string; label: string };

function chosenTags(store: StoreData, catalog: StoreTag[]): ChosenTag[] {
  return (store.tag || []).flatMap((item) => {
    if (typeof item === "string") {
      const found = catalog.find((tag) => tag.name === item);
      return [{ id: found?.id || "", name: item, label: found?.name_ar || item }];
    }
    const found = catalog.find((tag) => tag.id === item.id || tag.name === item.name);
    const id = item.id || found?.id || "";
    const name = item.name || found?.name || "";
    if (!id && !name) return [];
    return [{ id, name, label: found?.name_ar || name }];
  });
}

const tabs = [
  { id: "online", label: "En ligne" },
  { id: "offline", label: "Hors ligne" },
  { id: "sent", label: "En attente" },
  { id: "accepted", label: "Accepté" },
  { id: "disabled", label: "Désactivé" },
];

const daysMapping = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
];

export default function ListStore() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("online");
  const [categoryTab, setCategoryTab] = useState("");
  const [storeData, setStoreData] = useState<StoreData[]>([]);
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [catalog, setCatalog] = useState<TagCategory[]>([]);
  const [tagCatalog, setTagCatalog] = useState<StoreTag[]>([]);
  const [editTags, setEditTags] = useState<ChosenTag[]>([]);
  const [tagsDirty, setTagsDirty] = useState(false);
  const [pickerStore, setPickerStore] = useState<StoreData | null>(null);
  const [pickedCatg, setPickedCatg] = useState("");
  const [linking, setLinking] = useState(false);

  // حالات الـ Dialog والتعديل
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<StoreData | null>(null);
  const [editPhone, setEditPhone] = useState("");
  const [editTimeP, setEditTimeP] = useState("");
  const [editWorkdays, setEditWorkdays] = useState<Workday[]>([]);

  // حالة الأرقام الاحتياطية (secondaryPhones)
  const [editSecondaryPhones, setEditSecondaryPhones] = useState<string[]>([]);
  const [newPhoneInput, setNewPhoneInput] = useState("");
  const [editTax, setEditTax] = useState("");

  useEffect(() => {
    if (!user) return;
    GetStoreList(user, activeTab, setStoreData, router);
  }, [user, activeTab]);

  const filteredStores = useMemo(() => {
    return storeData.filter((store) => {
      const name = store.nameEtabliss?.toLowerCase() || "";
      const phone = store.phoneNumber?.toString() || "";
      const query = searchQuery.toLowerCase();
      return name.includes(query) || phone.includes(query);
    });
  }, [storeData, searchQuery]);

  const storeGroups = useMemo(() => {
    const groups = new Map<
      string,
      { id: string; label: string; color: string; stores: StoreData[] }
    >();
    filteredStores.forEach((store) => {
      const id = store.category?.id || store.catgId || "none";
      const fromCatalog = catalog.find((item) => item.id === id);
      const label =
        store.category?.name_ar ||
        store.category?.name ||
        fromCatalog?.name_ar ||
        fromCatalog?.name ||
        "غير مربوط";
      const color = store.category?.color || fromCatalog?.color || "#94a3b8";
      const group = groups.get(id) || { id, label, color, stores: [] };
      group.stores.push(store);
      groups.set(id, group);
    });
    const ordered = catalog
      .map((item) => groups.get(item.id))
      .filter((group): group is NonNullable<typeof group> => Boolean(group));
    const rest = [...groups.values()].filter(
      (group) => !catalog.some((item) => item.id === group.id),
    );
    return [...ordered, ...rest];
  }, [filteredStores, catalog]);

  useEffect(() => {
    if (storeGroups.length === 0) return;
    if (!storeGroups.some((group) => group.id === categoryTab)) {
      setCategoryTab(storeGroups[0].id);
    }
  }, [storeGroups, categoryTab]);

  const visibleStores = useMemo(() => {
    return storeGroups.find((group) => group.id === categoryTab)?.stores || [];
  }, [storeGroups, categoryTab]);

  useEffect(() => {
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) return;
    void listTagCatalog().then((data) => {
      if (data.status && data.result) {
        if (Array.isArray(data.result.categories)) setCatalog(data.result.categories);
        if (Array.isArray(data.result.tags)) setTagCatalog(data.result.tags);
      }
    });
  }, [user]);

  const PROFILE_REQUIRED_MESSAGE =
    "يجب على الشريك إكمال الـ profile أولاً قبل التمكّن من التصنيف";

  // الشريك (مطعم أو course) بحالة accepted لم يُكمل الـ profile بعد
  const isProfileIncomplete = (store: StoreData) =>
    store.status === "accepted";

  const openCategoryPicker = (store: StoreData) => {
    if (isProfileIncomplete(store)) {
      alert(PROFILE_REQUIRED_MESSAGE);
      return;
    }
    setPickerStore(store);
    setPickedCatg(store.category?.id || store.catgId || "");
  };

  const saveStoreCategory = async () => {
    if (!pickerStore || !pickedCatg) return;
    if (isProfileIncomplete(pickerStore)) {
      alert(PROFILE_REQUIRED_MESSAGE);
      return;
    }
    setLinking(true);
    try {
      const data = await linkStoreCategories(pickerStore._id, pickedCatg);
      const category = data.result?.category;
      if (data.status && category) {
        setStoreData((prev) =>
          prev.map((store) =>
            store._id === pickerStore._id
              ? { ...store, catgId: category.id, category }
              : store,
          ),
        );
        setPickerStore(null);
      } else {
        alert(data.message || "تعذر ربط التصنيف");
      }
    } catch {
      alert("تعذر الاتصال بالخادم");
    } finally {
      setLinking(false);
    }
  };

  const handleOpenEditDialog = (store: StoreData) => {
    // التحقق من الصلاحية قبل فتح الـ Dialog
    if (user?.role !== "admin" && user?.role !== "super_admin") {
      alert("Accès refusé. Seuls les administrateurs peuvent modifier les magasins.");
      return;
    }

    setSelectedStore(store);
    setEditPhone(store.phoneNumber || "");
    setEditTimeP(store.timeP || "");

    // أوقات العمل
    const initialWorkdays =
      store.workdays && store.workdays.length > 0
        ? JSON.parse(JSON.stringify(store.workdays))
        : Array.from({ length: 7 }, (_, index) => ({
            day: index,
            time: "11:00",
            totime: "23:00",
          }));
    setEditWorkdays(initialWorkdays);

    setEditTags(chosenTags(store, tagCatalog));
    setTagsDirty(false);
    const secPhones = store.secondaryPhones;
    setEditSecondaryPhones(secPhones && Array.isArray(secPhones) ? [...secPhones] : []);
    setEditTax(store.taxPercent == null ? "" : String(store.taxPercent));
    setNewPhoneInput("");

    setIsDialogOpen(true);
  };

  const handleAddSecondaryPhone = () => {
    const trimmedInput = newPhoneInput.trim();
    if (!trimmedInput) return;

    const phoneRegex = /^[0-9]{8,15}$/;
    if (!phoneRegex.test(trimmedInput)) {
      alert("Ce numéro secondaire est invalide. Il doit contenir uniquement des chiffres (8 à 15 chiffres).");
      return;
    }

    setEditSecondaryPhones([...editSecondaryPhones, trimmedInput]);
    setNewPhoneInput("");
  };

  const handleRemoveSecondaryPhone = (indexToRemove: number) => {
    setEditSecondaryPhones(
      editSecondaryPhones.filter((_, index) => index !== indexToRemove),
    );
  };

  const handleSaveStoreUpdates = async () => {
    // فحص أمني إضافي أثناء الحفظ
    if (user?.role !== "admin" && user?.role !== "super_admin") {
      alert("Action non autorisée.");
      return;
    }

    if (!selectedStore) return;

    // 1. التحقق من صحة رقم الهاتف الأساسي
    const trimmedPhone = editPhone.trim();
    if (!trimmedPhone) {
      alert("Le numéro de téléphone principal ne peut pas être vide !");
      return;
    }

    const phoneRegex = /^[0-9]{8,15}$/;
    if (!phoneRegex.test(trimmedPhone)) {
      alert("Format de numéro de téléphone principal invalide. Veuillez entrer uniquement des chiffres.");
      return;
    }

    // 2. التحقق من صحة الأرقام الفرعية
    for (let i = 0; i < editSecondaryPhones.length; i++) {
      const secPhone = editSecondaryPhones[i].trim();
      if (!phoneRegex.test(secPhone)) {
        alert(`Le numéro secondaire #${i + 1} ("${secPhone}") est invalide.`);
        return;
      }
    }

    if (tagsDirty && editTags.some((item) => !item.id)) {
      alert("أحد الوسوم غير مربوط. أزله ثم اختره من جديد، أو أزل كل الوسوم.");
      return;
    }

    const isSuperAdmin = user?.role === "super_admin";
    let taxPercent: number | null | undefined;
    if (isSuperAdmin) {
      const rawTax = editTax.trim();
      if (rawTax === "") {
        taxPercent = null;
      } else {
        const value = Number(rawTax);
        if (!Number.isFinite(value) || value < 0 || value > 100) {
          alert("نسبة الضريبة يجب أن تكون بين 0 و 100");
          return;
        }
        taxPercent = value;
      }
    }

    const result = await updateStoreDetails(selectedStore._id, {
      phoneNumber: trimmedPhone,
      timeP: editTimeP,
      workdays: editWorkdays,
      secondaryPhones: editSecondaryPhones,
      ...(tagsDirty ? { tag: editTags.map((item) => item.id) } : {}),
      ...(isSuperAdmin ? { taxPercent } : {}),
    });

    if (!result || result.status === false) {
      if (result?.message) alert(result.message);
      return;
    }

    setStoreData((prev) =>
      prev.map((s) =>
        s._id === selectedStore._id
          ? ({
              ...s,
              phoneNumber: trimmedPhone,
              timeP: editTimeP,
              workdays: editWorkdays,
              secondaryPhones: editSecondaryPhones,
              ...(isSuperAdmin ? { taxPercent: taxPercent ?? null } : {}),
              ...(tagsDirty
                ? {
                    tag: editTags
                      .filter((item) => item.id && item.name)
                      .map((item) => ({ id: item.id, name: item.name })),
                  }
                : {}),
            } as StoreData)
          : s,
      ),
    );

    setIsDialogOpen(false);
    alert("Modifications enregistrées avec succès !");
  };

  return (
    <div
      className="p-4 md:p-10 bg-[#F6F6F6] min-h-screen font-sans text-black"
      dir="ltr"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-black uppercase">
            Magasin
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">
            Gestion de la plateforme logistique
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-8 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setSearchQuery("");
            }}
            className={`px-8 py-4 whitespace-nowrap text-xs font-bold uppercase tracking-widest transition-all duration-200 ${
              activeTab === tab.id
                ? "border-b-4 border-red-600 text-black"
                : "text-gray-400 hover:text-black"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="bg-white p-2 rounded-none shadow-sm mb-6 border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-0 items-center justify-between">
          <div className="relative w-full lg:max-w-xl">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Rechercher par nom ou numéro..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-transparent outline-none text-sm font-medium"
            />
          </div>
          <div className="flex w-full lg:w-auto border-t lg:border-t-0 lg:border-l border-gray-100">
            <button className="flex items-center gap-3 px-8 py-4 text-sm font-bold hover:bg-gray-50 transition-colors text-black">
              <Filter size={18} className="text-red-600" />
              <span className="uppercase tracking-widest">Filtres</span>
            </button>
          </div>
        </div>
      </div>

      {storeGroups.length > 0 && (
        <div className="flex border-b border-gray-200 mb-6 overflow-x-auto no-scrollbar">
          {storeGroups.map((group) => (
            <button
              key={group.id}
              type="button"
              onClick={() => setCategoryTab(group.id)}
              className={`px-6 py-3 whitespace-nowrap text-xs font-bold uppercase tracking-widest transition-all duration-200 flex items-center gap-2 text-red-600 ${
                categoryTab === group.id ? "border-b-4 border-red-600" : "hover:bg-red-50"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-600" />
              {group.label}
              <span className="text-[10px] font-black opacity-70">{group.stores.length}</span>
            </button>
          ))}
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white rounded-none shadow-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-black text-[13px] uppercase tracking-[0.2em] font-bold">
                <th className="px-6 py-5">Établissement</th>
                <th className="px-6 py-5 text-center">Disponibilité</th>
                <th className="px-6 py-5">Contact</th>
                <th className="px-6 py-5">Catégorie</th>
                <th className="px-6 py-5">Statut</th>
                <th className="px-6 py-5 text-right">Localisation</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visibleStores.length > 0 ? (
                visibleStores.map((v, i) => (
                  <tr
                    key={v._id || i}
                    className="hover:bg-gray-50 transition-colors group"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="bg-gray-100 p-3 rounded-none group-hover:bg-red-50 transition-colors">
                          <Store
                            size={20}
                            className="text-black group-hover:text-red-600"
                          />
                        </div>
                        <div>
                          <div className="font-bold text-base text-black">
                            {v.nameEtabliss}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-1">
                            {user?.role === "admin" || user?.role === "super_admin" ? (
                              <button
                                type="button"
                                onClick={() => openCategoryPicker(v)}
                                title={
                                  isProfileIncomplete(v)
                                    ? PROFILE_REQUIRED_MESSAGE
                                    : undefined
                                }
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 ${
                                  isProfileIncomplete(v)
                                    ? "opacity-40 cursor-not-allowed"
                                    : ""
                                }`}
                              >
                                {v.category?.name_ar || v.category?.name || "ربط التصنيف"}
                              </button>
                            ) : (
                              <span className="text-[10px] font-bold text-red-600">
                                {v.category?.name_ar || v.category?.name || "غير مربوط"}
                              </span>
                            )}
                            {chosenTags(v, tagCatalog).map((item) => (
                              <span
                                key={`${v._id}-${item.id || item.name}`}
                                className="text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full"
                              >
                                {item.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      {v.status === "completed" ? (
                        <div className="flex items-center justify-center">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={v.isOpen || false}
                              onChange={async () => {
                                const data = await handleOnlineStatus(
                                  v,
                                  !v.isOpen,
                                );
                                if (data !== null) {
                                  setStoreData((prev) =>
                                    prev.map((d) =>
                                      d._id === v._id
                                        ? { ...d, isOpen: data }
                                        : d,
                                    ),
                                  );
                                }
                              }}
                            />
                            <div className="w-12 h-6 bg-gray-400 rounded-none peer peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                            <span className="ms-3 text-[10px] font-black uppercase tracking-widest text-gray-800">
                              {v.isOpen ? "Actif" : "Inactif"}
                            </span>
                          </label>
                        </div>
                      ) : (
                        <div className="text-center text-[10px] font-bold text-gray-400 uppercase">
                          Hors ligne
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-5">
                      <a
                        href={`tel:+${v.phoneNumber}`}
                        className="flex items-center gap-2 text-sm font-bold text-black hover:text-red-600 transition-colors"
                      >
                        <Phone size={14} className="text-red-600" />+
                        {v.phoneNumber}
                      </a>
                    </td>

                    <td className="px-6 py-5">
                      <div className="text-[11px] font-black uppercase tracking-wide text-red-600">
                        {v.category?.name_ar || v.category?.name || "غير مربوط"}
                      </div>
                      {v.typeEtabliss ? (
                        <div className="text-[10px] font-bold uppercase text-black mt-1">
                          {v.typeEtabliss}
                        </div>
                      ) : null}
                      {user?.role === "super_admin" ? (
                        <div className="text-[10px] font-bold text-black mt-1">
                          ضريبة {v.taxPercent == null ? "الولاية" : `${v.taxPercent}%`}
                        </div>
                      ) : null}
                    </td>

                    <td className="px-6 py-5">
                      {user?.role === "admin" ||
                      user?.role === "super_admin" ? (
                        <button
                          onClick={async () => {
                            if (v.status === "accepted") return;
                            const status =
                              v.status === "sent"
                                ? "accepted"
                                : v.status === "disabled"
                                ? "completed"
                                : "disabled";
                            if (window.confirm("Changer le statut ?")) {
                              const data = await acceptedStoreSent(v, status);
                              if (data != null)
                                setStoreData((prev) =>
                                  prev.map((d) =>
                                    d._id === v._id
                                      ? { ...d, status: data }
                                      : d,
                                  ),
                                );
                            }
                          }}
                          className="text-[10px] font-black uppercase border-b-2 border-black hover:text-blue-600 transition-colors"
                        >
                          {v.status}
                        </button>
                      ) : (
                        <span className="text-[10px] font-black uppercase text-slate-500">
                          {v.status}
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-5 text-right">
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1 text-sm font-bold">
                          <MapPin size={14} className="text-red-600" />
                          {v.pays}
                        </div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase">
                          {v.ville}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {/* إظهار زر التعديل حصرياً للأدمن والسوبر أدمن */}
                        {(user?.role === "admin" || user?.role === "super_admin") && (
                          <button
                            onClick={() => handleOpenEditDialog(v)}
                            title="Modifier les horaires, numéros..."
                            className="text-black hover:text-red-600 transition-colors cursor-pointer"
                          >
                            <Edit size={18} />
                          </button>
                        )}

                        {v.status === "sent" ? (
                          <div
                            title="لا يمكن الدخول"
                            className="text-gray-400 opacity-40 cursor-not-allowed"
                          >
                            <Eye size={20} />
                          </div>
                        ) : (
                          <Link
                            href={
                              v.course && v.status !== "accepted"
                                ? {
                                    pathname: "/dashboard/storelist/add",
                                    query: {
                                      id: v._id,
                                      course: "1",
                                      name: v.nameEtabliss,
                                    },
                                  }
                                : {
                                    pathname: "/store/details",
                                    query: { id: v._id, menu: true },
                                  }
                            }
                            className="text-red-600 hover:scale-110 transition-transform cursor-pointer"
                          >
                            <Eye size={20} />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-20 text-center text-gray-400 font-bold uppercase tracking-widest"
                  >
                    Aucun établissement trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- DIALOG --- */}
      {isDialogOpen && selectedStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 p-6 relative">
            <div className="flex items-center justify-between border-b pb-4 mb-6">
              <div className="flex items-center gap-2">
                <Clock className="text-red-600" size={24} />
                <h2 className="text-lg font-black uppercase tracking-wider">
                  Modifier: {selectedStore.nameEtabliss}
                </h2>
              </div>
              <button
                onClick={() => setIsDialogOpen(false)}
                className="text-gray-400 hover:text-black"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-700 mb-2">
                  Numéro de téléphone principal
                </label>
                <div className="flex items-center border border-gray-300 px-3 py-2 bg-gray-50">
                  <span className="text-gray-500 font-bold mr-1">+</span>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-transparent outline-none text-sm font-medium"
                  />
                </div>
              </div>

              {user?.role === "super_admin" && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-700 mb-2">
                    نسبة الضريبة الخاصة بهذا المحل %
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.1"
                    value={editTax}
                    onChange={(e) => setEditTax(e.target.value)}
                    placeholder="فارغ = نسبة الولاية"
                    className="w-full border border-gray-300 px-3 py-2 text-sm font-medium outline-none"
                  />
                </div>
              )}

              <div dir="rtl">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <label className="block text-xs font-bold text-gray-700">
                    وسوم هذا المطعم ({editTags.length} من 3)
                  </label>
                  {editTags.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditTags([]);
                        setTagsDirty(true);
                      }}
                      className="text-[11px] font-black text-red-700"
                    >
                      إزالة كل الوسوم
                    </button>
                  )}
                </div>
                {editTags.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {editTags.map((item, index) => (
                      <button
                        key={`${item.id || item.name}-${index}`}
                        type="button"
                        onClick={() => {
                          setEditTags((prev) => prev.filter((_, i) => i !== index));
                          setTagsDirty(true);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold bg-red-600 text-white"
                      >
                        {item.label}
                        <X size={12} />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs font-bold text-gray-400 mb-3">لا توجد وسوم على هذا المطعم.</p>
                )}
                {selectedStore.category || selectedStore.catgId ? (
                  <div className="flex flex-wrap gap-2">
                    {tagCatalog
                      .filter(
                        (item) =>
                          item.catgId ===
                          (selectedStore.category?.id || selectedStore.catgId),
                      )
                      .map((item) => {
                        const selected = editTags.some((tag) => tag.id === item.id);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setTagsDirty(true);
                              setEditTags((prev) =>
                                prev.some((tag) => tag.id === item.id)
                                  ? prev.filter((tag) => tag.id !== item.id)
                                  : prev.length < 3
                                    ? [
                                        ...prev,
                                        {
                                          id: item.id,
                                          name: item.name,
                                          label: item.name_ar || item.name,
                                        },
                                      ]
                                    : prev,
                              );
                            }}
                            className={`px-3 py-2 text-xs font-bold border ${
                              selected
                                ? "bg-red-600 border-red-600 text-white"
                                : "bg-white border-gray-200 text-gray-700"
                            }`}
                          >
                            {item.name_ar || item.name}
                          </button>
                        );
                      })}
                  </div>
                ) : (
                  <p className="text-xs font-bold text-amber-700">
                    اربط تصنيف المحل قبل اختيار وسوم جديدة. يمكن إزالة الوسوم الحالية.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-700 mb-2">
                  Numéros de téléphone secondaires ( الاحتياطية )
                </label>

                <div className="space-y-2 mb-3">
                  {editSecondaryPhones.map((secPhone, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-gray-50 border border-gray-200 px-3 py-2"
                    >
                      <span className="text-sm font-medium">+{secPhone}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSecondaryPhone(idx)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <div className="flex items-center border border-gray-300 px-3 py-2 bg-gray-50 flex-1">
                    <span className="text-gray-500 font-bold mr-1">+</span>
                    <input
                      type="text"
                      value={newPhoneInput}
                      onChange={(e) => setNewPhoneInput(e.target.value)}
                      placeholder="Ajouter un numéro..."
                      className="w-full bg-transparent outline-none text-sm font-medium"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSecondaryPhone}
                    className="bg-black text-white px-4 py-2 flex items-center gap-1 text-xs font-bold uppercase hover:bg-gray-800 transition-colors"
                  >
                    <Plus size={16} /> Ajouter
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-700 mb-2">
                  Temps de préparation (ex: 10-15)
                </label>
                <input
                  type="text"
                  value={editTimeP}
                  onChange={(e) => setEditTimeP(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 bg-gray-50 outline-none text-sm font-medium"
                />
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-700 mb-3">
                  Horaires de travail (Workdays)
                </h3>
                <div className="space-y-3">
                  {editWorkdays.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 bg-gray-50 p-3 border border-gray-200"
                    >
                      <span className="w-24 text-xs font-bold uppercase text-gray-800">
                        {daysMapping[item.day] !== undefined
                          ? daysMapping[item.day]
                          : `Jour ${item.day}`}
                      </span>
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-[10px] text-gray-500 uppercase font-bold">
                          De:
                        </span>
                        <input
                          type="time"
                          value={item.time || "11:00"}
                          onChange={(e) => {
                            const updated = [...editWorkdays];
                            updated[index].time = e.target.value;
                            setEditWorkdays(updated);
                          }}
                          className="border border-gray-300 px-2 py-1 text-xs bg-white outline-none"
                        />
                        <span className="text-[10px] text-gray-500 uppercase font-bold">
                          À:
                        </span>
                        <input
                          type="time"
                          value={item.totime || "23:00"}
                          onChange={(e) => {
                            const updated = [...editWorkdays];
                            updated[index].totime = e.target.value;
                            setEditWorkdays(updated);
                          }}
                          className="border border-gray-300 px-2 py-1 text-xs bg-white outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-4 border-t pt-4 mt-6">
              <button
                onClick={() => setIsDialogOpen(false)}
                className="px-6 py-2 border border-gray-300 text-xs font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-100"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveStoreUpdates}
                className="px-6 py-2 bg-red-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-red-700"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {pickerStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white w-full max-w-md p-6" dir="rtl">
            <h3 className="font-black text-lg text-black">
              تصنيف {pickerStore.nameEtabliss}
            </h3>
            <p className="text-xs text-gray-500 mt-1 mb-4">
              تصنيف واحد فقط، مثل مطعم أو بقالة.
            </p>
            <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
              {catalog.map((category) => {
                const selected = pickedCatg === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setPickedCatg(category.id)}
                    className={`px-3 py-2 text-xs font-bold border ${
                      selected
                        ? "bg-red-600 border-red-600 text-white"
                        : "bg-white border-gray-200 text-gray-700"
                    }`}
                  >
                    {category.name_ar || category.name}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setPickerStore(null)}
                className="px-4 py-2 text-xs font-bold text-gray-600"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={!pickedCatg || linking}
                onClick={() => void saveStoreCategory()}
                className="px-4 py-2 bg-red-600 text-white text-xs font-bold disabled:opacity-40"
              >
                {linking ? "..." : "حفظ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}