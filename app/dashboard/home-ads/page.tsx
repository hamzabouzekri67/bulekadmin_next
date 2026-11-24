"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Loader2,
  Megaphone,
  Pencil,
  Plus,
  Power,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useUser } from "@/app/context/UserContext";
import type { StoreData } from "@/app/types/store";
import type {
  HomeAd,
  HomeAdForm,
  HomeAdItem,
  HomeAdSection,
  ItemDiscount,
  L10n,
  SectionDisplay,
  Lang,
  StoreProduct,
} from "@/app/types/home_ad";
import { findProductsFauterd, searchandFindStore } from "../featured/api/api_featured";
import { deleteHomeAd, listHomeAds, saveHomeAd, setHomeAdStatus, uploadHomeAdImage } from "./api/home_ads";

const inputClass = "w-full p-3 border border-gray-200 rounded-xl text-sm bg-white";
const LANGS: { key: Lang; label: string }[] = [
  { key: "ar", label: "العربية" },
  { key: "fr", label: "Français" },
  { key: "en", label: "English" },
];
const emptyL10n = (): L10n => ({ ar: "", fr: "", en: "" });

const emptyForm = (): HomeAdForm => ({
  title: emptyL10n(),
  subtitle: emptyL10n(),
  buttonText: { ar: "استفد الآن", fr: "J'en profite", en: "Get it" },
  badgeText: emptyL10n(),
  bgColor: "#F28C38",
  textColor: "#FFFFFF",
  buttonColor: "#FFFFFF",
  buttonTextColor: "#1F1F1F",
  sections: [newSection()],
  target: "offers",
  targetStoreId: "",
  targetStoreName: "",
  order: "0",
  startAt: "",
  endAt: "",
  scheduleOn: false,
  scheduleDays: [5],
  scheduleFrom: "18:00",
  scheduleTo: "23:00",
});

// ─── التكرار الأسبوعي (توقيت الجزائر) ───
const DAY_NAMES = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const toHHMM = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

/** "كل جمعة من 18:00 إلى 23:00" */
function scheduleText(days: number[], from: string, to: string): string {
  const d =
    days.length === 0 || days.length === 7
      ? "كل يوم"
      : "كل " + [...days].sort().map((i) => DAY_NAMES[i]).join(" و");
  if (from === to) return `${d} طوال اليوم`;
  const crosses = toMin(to) < toMin(from);
  return `${d} من ${from} إلى ${to}${crosses ? " (اليوم التالي)" : ""}`;
}

/** ISO → قيمة input datetime-local بالتوقيت المحلي */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const l10nOf = (v: Partial<L10n> | undefined): L10n => ({ ar: v?.ar ?? "", fr: v?.fr ?? "", en: v?.en ?? "" });

const newSection = (): HomeAdSection => ({
  title: emptyL10n(),
  items: [],
  displayType: "horizontal",
  groupWithNext: false,
  discount: null,
});

const DISPLAY_OPTIONS: { key: SectionDisplay; label: string }[] = [
  { key: "horizontal", label: "أفقي (سحب)" },
  { key: "card", label: "بطاقة (4 منتجات)" },
  { key: "grid", label: "شبكة" },
];

const normItem = (it: HomeAdItem): HomeAdItem => ({
  ...it,
  kind: it.kind === "custom" ? "custom" : "product",
  productId: it.productId ? String(it.productId) : null,
  storeId: String(it.storeId),
});

/** أقسام الإعلان؛ الإعلانات القديمة (items) تُفتح كقسم واحد */
function sectionsOf(ad: HomeAd): HomeAdSection[] {
  if (ad.sections && ad.sections.length > 0) {
    return ad.sections.map((s) => ({
      title: l10nOf(s.title),
      items: (s.items ?? []).map(normItem),
      displayType: s.displayType === "card" || s.displayType === "grid" ? s.displayType : "horizontal",
      groupWithNext: s.displayType === "card" && s.groupWithNext === true,
      discount: s.discount ?? null,
    }));
  }
  return [{ ...newSection(), items: (ad.items ?? []).map(normItem) }];
}

const adItemCount = (ad: HomeAd) =>
  ad.sections && ad.sections.length > 0
    ? ad.sections.reduce((n, s) => n + (s.items?.length ?? 0), 0)
    : (ad.items?.length ?? 0);

export default function HomeAdsPage() {
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  const [ads, setAds] = useState<HomeAd[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const [form, setForm] = useState<HomeAdForm>(emptyForm);
  const [lang, setLang] = useState<Lang>("ar");
  const [image, setImage] = useState<File | null>(null);
  const [existingImage, setExistingImage] = useState("");
  const [saving, setSaving] = useState(false);

  // اختيار المنتجات: متجر ← منتجاته
  const [storeQuery, setStoreQuery] = useState("");
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loadingStores, setLoadingStores] = useState(false);
  const [activeStore, setActiveStore] = useState<StoreData | null>(null);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // القسم الذي تُضاف إليه المنتجات المختارة
  const [activeSection, setActiveSection] = useState(0);

  // منتج خارجي (custom) مربوط بالمتجر المختار
  const [customTitle, setCustomTitle] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [customDesc, setCustomDesc] = useState("");
  const [customImage, setCustomImage] = useState<File | null>(null);
  const [addingCustom, setAddingCustom] = useState(false);

  const previewImage = useMemo(() => (image ? URL.createObjectURL(image) : existingImage), [image, existingImage]);
  useEffect(() => {
    return () => {
      if (image) URL.revokeObjectURL(previewImage);
    };
  }, [image, previewImage]);

  const loadAds = async () => {
    setLoadingList(true);
    try {
      const data = await listHomeAds();
      if (data.status && Array.isArray(data.result)) setAds(data.result);
      else setNotice({ ok: false, text: data.message || "load failed" });
    } catch {
      setNotice({ ok: false, text: "conn failed" });
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
    void loadAds();
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(async () => {
      setLoadingStores(true);
      try {
        const data = await searchandFindStore(storeQuery, router);
        setStores(Array.isArray(data) ? data : []);
      } catch {
        setStores([]);
      } finally {
        setLoadingStores(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [storeQuery, ready, router]);

  const openStore = async (store: StoreData) => {
    setActiveStore(store);
    setProducts([]);
    setLoadingProducts(true);
    try {
      const data = await findProductsFauterd(store.clientId);
      // المنتجات المتاحة (public) فقط — الخادم يفلتر أيضاً ويرفض غيرها عند الحفظ
      setProducts(Array.isArray(data) ? (data as StoreProduct[]).filter((p) => p.status === "public") : []);
    } catch {
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const setText = (field: "title" | "subtitle" | "buttonText" | "badgeText", value: string) =>
    setForm((f) => ({ ...f, [field]: { ...f[field], [lang]: value } }));

  // ─────────── الأقسام ───────────
  const current = form.sections[activeSection] ?? form.sections[0];

  /** يعدّل قسماً واحداً بدون لمس الباقي */
  const updateSection = (index: number, fn: (s: HomeAdSection) => HomeAdSection) =>
    setForm((f) => ({ ...f, sections: f.sections.map((s, i) => (i === index ? fn(s) : s)) }));

  const addSection = () => {
    if (form.sections.length >= 10) return;
    setForm((f) => ({ ...f, sections: [...f.sections, newSection()] }));
    setActiveSection(form.sections.length);
  };

  const removeSection = (index: number) => {
    if (form.sections.length === 1) {
      updateSection(0, () => newSection());
      return;
    }
    if (form.sections[index].items.length > 0 && !window.confirm("حذف هذا القسم ومنتجاته؟")) return;
    setForm((f) => ({ ...f, sections: f.sections.filter((_, i) => i !== index) }));
    setActiveSection((a) => Math.max(0, a >= index ? a - 1 : a));
  };

  const moveSection = (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= form.sections.length) return;
    setForm((f) => {
      const sections = [...f.sections];
      [sections[index], sections[j]] = [sections[j], sections[index]];
      return { ...f, sections };
    });
    setActiveSection(j);
  };

  const isSelected = (id: string) => (current?.items ?? []).some((it) => it.kind !== "custom" && it.productId === id);

  const toggleProduct = (p: StoreProduct) => {
    if (!activeStore) return;
    updateSection(activeSection, (s) => {
      if (s.items.some((it) => it.kind !== "custom" && it.productId === p._id)) {
        return { ...s, items: s.items.filter((it) => !(it.kind !== "custom" && it.productId === p._id)) };
      }
      if (s.items.length >= 50) return s;
      const item: HomeAdItem = {
        kind: "product",
        productId: p._id,
        storeId: activeStore._id,
        title: p.title,
        image: p.image ?? "",
        price: p.price ?? "",
        storeName: activeStore.nameEtabliss,
        discount: null,
      };
      return { ...s, items: [...s.items, item] };
    });
  };

  const addCustomProduct = async () => {
    if (!activeStore) {
      setNotice({ ok: false, text: "اختر المتجر الذي يُربط به المنتج الخارجي" });
      return;
    }
    if (!customTitle.trim() || !customImage) {
      setNotice({ ok: false, text: "اسم المنتج الخارجي وصورته مطلوبان" });
      return;
    }
    setAddingCustom(true);
    try {
      const up = await uploadHomeAdImage(customImage);
      const url = up.result?.url;
      if (!up.status || !url) {
        setNotice({ ok: false, text: up.message || "image upload failed" });
        return;
      }
      updateSection(activeSection, (s) =>
        s.items.length >= 50
          ? s
          : {
              ...s,
              items: [
                ...s.items,
                {
                  kind: "custom",
                  productId: null,
                  storeId: activeStore._id,
                  storeName: activeStore.nameEtabliss,
                  title: customTitle.trim(),
                  price: customPrice.trim(),
                  description: customDesc.trim(),
                  image: url,
                },
              ],
            },
      );
      setCustomTitle("");
      setCustomPrice("");
      setCustomDesc("");
      setCustomImage(null);
      setNotice({ ok: true, text: "أضيف المنتج الخارجي للقسم" });
    } catch {
      setNotice({ ok: false, text: "conn failed" });
    } finally {
      setAddingCustom(false);
    }
  };

  const moveItem = (sectionIndex: number, index: number, dir: -1 | 1) =>
    updateSection(sectionIndex, (s) => {
      const items = [...s.items];
      const j = index + dir;
      if (j < 0 || j >= items.length) return s;
      [items[index], items[j]] = [items[j], items[index]];
      return { ...s, items };
    });

  const updateItem = (sectionIndex: number, index: number, patch: Partial<HomeAdItem>) =>
    updateSection(sectionIndex, (s) => ({
      ...s,
      items: s.items.map((it, i) => (i === index ? { ...it, ...patch } : it)),
    }));

  const removeItem = (sectionIndex: number, index: number) =>
    updateSection(sectionIndex, (s) => ({ ...s, items: s.items.filter((_, i) => i !== index) }));

  const totalItems = form.sections.reduce((n, s) => n + s.items.length, 0);

  const resetForm = () => {
    setForm(emptyForm());
    setImage(null);
    setExistingImage("");
    setLang("ar");
    setActiveSection(0);
  };

  const editAd = (ad: HomeAd) => {
    setForm({
      id: ad._id,
      title: l10nOf(ad.title),
      subtitle: l10nOf(ad.subtitle),
      buttonText: l10nOf(ad.buttonText),
      badgeText: l10nOf(ad.badgeText),
      bgColor: ad.bgColor || "#F28C38",
      textColor: ad.textColor || "#FFFFFF",
      buttonColor: ad.buttonColor || "#FFFFFF",
      buttonTextColor: ad.buttonTextColor || "#1F1F1F",
      sections: sectionsOf(ad),
      target: ad.target === "store" ? "store" : "offers",
      targetStoreId: ad.targetStoreId ? String(ad.targetStoreId) : "",
      targetStoreName: ad.targetStoreName ?? "",
      order: String(ad.order ?? 0),
      startAt: toLocalInput(ad.startAt),
      endAt: toLocalInput(ad.endAt),
      scheduleOn: !!ad.schedule,
      scheduleDays: ad.schedule?.daysOfWeek ?? [5],
      scheduleFrom: ad.schedule ? toHHMM(ad.schedule.from) : "18:00",
      scheduleTo: ad.schedule ? toHHMM(ad.schedule.to) : "23:00",
    });
    setImage(null);
    setExistingImage(ad.imageUrl || "");
    setActiveSection(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.title.ar && !form.title.fr && !form.title.en) {
      setNotice({ ok: false, text: "أدخل العنوان بلغة واحدة على الأقل" });
      return;
    }
    if (form.target === "store" && !form.targetStoreId) {
      setNotice({ ok: false, text: "اختر المتجر الذي يفتحه الإعلان" });
      return;
    }
    if (form.target === "offers" && totalItems === 0) {
      setNotice({ ok: false, text: "أضف منتجاً واحداً على الأقل في قسم" });
      return;
    }
    const badDiscount = form.sections
      .flatMap((s) => s.items)
      .find(
        (it) =>
          it.discount &&
          ((it.discount.type === "bogo"
            ? !((it.discount.buyQty ?? 1) >= 1 && (it.discount.freeQty ?? 1) >= 1 && (it.discount.maxFree ?? 2) >= 1)
            : !(it.discount.value > 0) || (it.discount.type === "percentage" && it.discount.value > 90)) ||
            it.discount.restaurantShare < 0 ||
            it.discount.restaurantShare > 100),
      );
    if (badDiscount) {
      setNotice({
        ok: false,
        text: `تخفيض غير صالح على "${badDiscount.title}" (النسبة 1-90%، حصة المطعم 0-100%، أعداد العرض 1 أو أكثر)`,
      });
      return;
    }
    if (!form.id && !image) {
      setNotice({ ok: false, text: "الصورة مطلوبة" });
      return;
    }
    setSaving(true);
    try {
      const data = await saveHomeAd(form, image);
      setNotice({ ok: Boolean(data.status), text: data.message || "save failed" });
      if (data.status) {
        resetForm();
        await loadAds();
      }
    } catch {
      setNotice({ ok: false, text: "conn failed" });
    } finally {
      setSaving(false);
    }
  };

  const toggleAd = async (ad: HomeAd) => {
    setBusyId(ad._id);
    try {
      const data = await setHomeAdStatus(ad._id, !ad.isActive);
      setNotice({ ok: Boolean(data.status), text: data.message || "update failed" });
      if (data.status) await loadAds();
    } catch {
      setNotice({ ok: false, text: "conn failed" });
    } finally {
      setBusyId("");
    }
  };

  const removeAd = async (ad: HomeAd) => {
    if (!window.confirm("حذف هذا الإعلان نهائياً؟")) return;
    setBusyId(ad._id);
    try {
      const data = await deleteHomeAd(ad._id);
      setNotice({ ok: Boolean(data.status), text: data.message || "delete failed" });
      if (data.status) {
        if (form.id === ad._id) resetForm();
        await loadAds();
      }
    } catch {
      setNotice({ ok: false, text: "conn failed" });
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

  const pickText = (v: L10n) => v[lang] || v.ar || v.fr || v.en;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto text-right" dir="rtl">
      <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
        <div className="bg-red-600 p-2.5 rounded-xl text-white">
          <Megaphone size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-950">إعلانات الرئيسية</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            تظهر أعلى الصفحة الرئيسية في التطبيق. الضغط عليها يفتح صفحة بالمنتجات المختارة (بأسعارها الحالية).
          </p>
        </div>
      </div>

      {notice && (
        <p
          className={`mb-4 rounded-xl px-4 py-3 text-sm font-medium ${notice.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
        >
          {notice.text}
        </p>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <form onSubmit={submit} className="xl:col-span-3 space-y-5">
          {/* معاينة حية */}
          <section className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <h2 className="font-bold text-gray-800 mb-3">معاينة</h2>
            <AdPreview
              title={pickText(form.title)}
              subtitle={pickText(form.subtitle)}
              buttonText={pickText(form.buttonText)}
              image={previewImage}
              bgColor={form.bgColor}
              textColor={form.textColor}
              buttonColor={form.buttonColor}
              buttonTextColor={form.buttonTextColor}
              rtl={lang === "ar"}
            />
          </section>

          <section className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-800">{form.id ? "تعديل الإعلان" : "إعلان جديد"}</h2>
              {form.id && (
                <button type="button" onClick={resetForm} className="text-sm text-gray-500 flex items-center gap-1">
                  <X size={14} /> إلغاء التعديل
                </button>
              )}
            </div>

            <div className="flex gap-2">
              {LANGS.map((l) => (
                <button
                  key={l.key}
                  type="button"
                  onClick={() => setLang(l.key)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${lang === l.key ? "bg-red-600 text-white" : "bg-gray-100 text-gray-600"}`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            <div dir={lang === "ar" ? "rtl" : "ltr"} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="العنوان *">
                <input className={inputClass} value={form.title[lang]} maxLength={60} onChange={(e) => setText("title", e.target.value)} />
              </Field>
              <Field label="نص الزر">
                <input className={inputClass} value={form.buttonText[lang]} maxLength={30} onChange={(e) => setText("buttonText", e.target.value)} />
              </Field>
              <Field label="الوصف">
                <textarea
                  className={`${inputClass} h-20 resize-none`}
                  value={form.subtitle[lang]}
                  maxLength={120}
                  onChange={(e) => setText("subtitle", e.target.value)}
                />
              </Field>
              <Field label="شارة العرض على المنتجات (مثل: 2 بسعر 1)">
                <input className={inputClass} value={form.badgeText[lang]} maxLength={30} onChange={(e) => setText("badgeText", e.target.value)} />
              </Field>
            </div>
            <p className="text-xs text-gray-400">اللغة غير المعبأة تعرض العربية بدلها.</p>

            <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm font-bold text-gray-700">الألوان</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">قوالب جاهزة:</span>
                  {COLOR_PRESETS.map((p) => (
                    <button
                      key={p.bg + p.button}
                      type="button"
                      title="تطبيق القالب"
                      onClick={() =>
                        setForm((f) => ({ ...f, bgColor: p.bg, textColor: p.text, buttonColor: p.button, buttonTextColor: p.buttonText }))
                      }
                      className="relative w-7 h-7 rounded-full ring-1 ring-black/10 hover:scale-110 transition-transform overflow-hidden"
                      style={{ background: p.bg }}
                    >
                      <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full ring-1 ring-black/10" style={{ background: p.button }} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <ColorField label="الخلفية" value={form.bgColor} onChange={(v) => setForm((f) => ({ ...f, bgColor: v }))} />
                    <ColorField label="النص" value={form.textColor} onChange={(v) => setForm((f) => ({ ...f, textColor: v }))} />
                  </div>
                  <ContrastHint fg={form.textColor} bg={form.bgColor} />
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <ColorField label="الزر" value={form.buttonColor} onChange={(v) => setForm((f) => ({ ...f, buttonColor: v }))} />
                    <ColorField
                      label="نص الزر"
                      value={form.buttonTextColor}
                      onChange={(v) => setForm((f) => ({ ...f, buttonTextColor: v }))}
                    />
                  </div>
                  <ContrastHint fg={form.buttonTextColor} bg={form.buttonColor} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label={form.id ? "الصورة (اتركها لإبقاء الحالية)" : "الصورة * (PNG شفافة أفضل)"}>
                <input type="file" accept="image/*" className={inputClass} onChange={(e) => setImage(e.target.files?.[0] ?? null)} />
              </Field>
              <Field label="يبدأ (اختياري)">
                <input type="datetime-local" className={inputClass} value={form.startAt} onChange={(e) => setForm((f) => ({ ...f, startAt: e.target.value }))} />
              </Field>
              <Field label="ينتهي (اختياري)">
                <input type="datetime-local" className={inputClass} value={form.endAt} onChange={(e) => setForm((f) => ({ ...f, endAt: e.target.value }))} />
              </Field>
              <Field label="الترتيب (الأصغر أولاً)">
                <input type="number" className={inputClass} value={form.order} onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))} />
              </Field>
            </div>

            {/* تكرار أسبوعي: يظهر الإعلان وتُطبق تخفيضاته فقط في هذه الأيام والساعات */}
            <div className="border border-gray-100 rounded-xl p-3 space-y-3">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-800">
                <input
                  type="checkbox"
                  checked={form.scheduleOn}
                  onChange={(e) => setForm((f) => ({ ...f, scheduleOn: e.target.checked }))}
                />
                تكرار أسبوعي (أيام وساعات محددة)
              </label>
              {form.scheduleOn && (
                <>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, scheduleDays: [] }))}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                        form.scheduleDays.length === 0 ? "bg-red-600 text-white border-red-600" : "bg-white text-gray-700 border-gray-200"
                      }`}
                    >
                      كل يوم
                    </button>
                    {DAY_NAMES.map((name, i) => {
                      const on = form.scheduleDays.includes(i);
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              scheduleDays: on ? f.scheduleDays.filter((d) => d !== i) : [...f.scheduleDays, i].sort(),
                            }))
                          }
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                            on ? "bg-red-600 text-white border-red-600" : "bg-white text-gray-700 border-gray-200"
                          }`}
                        >
                          {name}
                        </button>
                      );
                    })}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Field label="من الساعة">
                      <input
                        type="time"
                        className={inputClass}
                        value={form.scheduleFrom}
                        onChange={(e) => setForm((f) => ({ ...f, scheduleFrom: e.target.value }))}
                      />
                    </Field>
                    <Field label="إلى الساعة">
                      <input
                        type="time"
                        className={inputClass}
                        value={form.scheduleTo}
                        onChange={(e) => setForm((f) => ({ ...f, scheduleTo: e.target.value }))}
                      />
                    </Field>
                  </div>
                  <p className="text-xs text-gray-600">
                    🕕 يظهر <b>{scheduleText(form.scheduleDays, form.scheduleFrom, form.scheduleTo)}</b> (توقيت الجزائر).
                    تخفيضات منتجات الإعلان تُطبق في هذه الأوقات فقط. يعمل مع تاريخي البداية والنهاية إن حُددا.
                  </p>
                </>
              )}
            </div>

            {/* ما يفتحه الضغط على الإعلان */}
            <div className="border border-gray-100 rounded-xl p-3 space-y-3">
              <p className="text-sm font-bold text-gray-800">عند الضغط على الإعلان</p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["offers", "يفتح صفحة العروض (الأقسام)"],
                    ["store", "يفتح صفحة متجر مباشرة"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, target: key }))}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold ${form.target === key ? "bg-red-600 text-white" : "bg-gray-100 text-gray-600"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {form.target === "store" && (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-gray-500">المتجر:</span>
                  <span className="font-semibold">{form.targetStoreName || "لم يُختر بعد"}</span>
                  <button
                    type="button"
                    disabled={!activeStore}
                    onClick={() =>
                      activeStore &&
                      setForm((f) => ({
                        ...f,
                        targetStoreId: activeStore._id,
                        targetStoreName: activeStore.nameEtabliss,
                      }))
                    }
                    className="px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-semibold disabled:opacity-40"
                  >
                    {activeStore ? `استخدم "${activeStore.nameEtabliss}"` : "اختر متجراً من البحث بالأسفل"}
                  </button>
                </div>
              )}
              {form.target === "store" && (
                <p className="text-xs text-gray-400">
                  الإعلان يظهر فقط لمن المتجر قريب منه (≈10 كم). التخفيضات على منتجات الأقسام تبقى مطبقة داخل المتجر.
                </p>
              )}
              {form.target === "store" &&
                form.targetStoreId &&
                totalItems > 0 &&
                !form.sections.some((s) => s.items.some((it) => it.storeId === form.targetStoreId)) && (
                  <p className="text-xs font-semibold text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                    تنبيه: المتجر الذي يفتحه الإعلان ({form.targetStoreName}) ليس من متاجر منتجات الأقسام. الإعلان يظهر فقط قرب
                    هذا المتجر — اضغط &quot;استخدم&quot; بعد اختيار المتجر الصحيح من البحث.
                  </p>
                )}
            </div>
          </section>

          {/* أقسام صفحة العروض */}
          <section className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-800">
                أقسام صفحة العروض <span className="text-sm text-gray-400">({totalItems} منتج)</span>
              </h2>
              <button
                type="button"
                onClick={addSection}
                disabled={form.sections.length >= 10}
                className="text-sm font-semibold text-red-600 flex items-center gap-1 disabled:opacity-40"
              >
                <Plus size={16} /> قسم جديد
              </button>
            </div>
            <p className="text-xs text-gray-400">
              كل قسم يظهر في التطبيق كصف أفقي بعنوانه (مثل &quot;الأكثر مبيعاً&quot;). المنتجات المختارة تُضاف للقسم المحدّد.
            </p>

            <div className="space-y-3">
              {form.sections.map((s, si) => {
                const active = si === activeSection;
                return (
                  <div
                    key={si}
                    onClick={() => setActiveSection(si)}
                    className={`rounded-xl border-2 p-3 cursor-pointer ${active ? "border-red-500 bg-red-50/40" : "border-gray-100"}`}
                  >
                    <div className="flex items-center gap-2" dir={lang === "ar" ? "rtl" : "ltr"}>
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded ${active ? "bg-red-600 text-white" : "bg-gray-100 text-gray-500"}`}
                      >
                        {si + 1}
                      </span>
                      <input
                        className={`${inputClass} !p-2`}
                        value={s.title[lang]}
                        maxLength={50}
                        placeholder={`عنوان القسم (${lang})`}
                        onClick={(e) => e.stopPropagation()}
                        onFocus={() => setActiveSection(si)}
                        onChange={(e) =>
                          updateSection(si, (x) => ({ ...x, title: { ...x.title, [lang]: e.target.value } }))
                        }
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveSection(si, -1);
                        }}
                        className="p-1.5 rounded bg-gray-50 text-gray-500"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveSection(si, 1);
                        }}
                        className="p-1.5 rounded bg-gray-50 text-gray-500"
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSection(si);
                        }}
                        className="p-1.5 rounded bg-red-50 text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* شكل القسم (مثل مجموعات البقالة) + تخفيض القسم كاملاً */}
                    <div
                      className="mt-2 flex flex-wrap items-start gap-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="text-xs text-gray-500 ml-1">الشكل:</span>
                        {DISPLAY_OPTIONS.map((o) => (
                          <button
                            key={o.key}
                            type="button"
                            onClick={() =>
                              updateSection(si, (x) => ({
                                ...x,
                                displayType: o.key,
                                groupWithNext: o.key === "card" ? x.groupWithNext : false,
                              }))
                            }
                            className={`px-2 py-1 rounded-md text-xs font-semibold ${(s.displayType ?? "horizontal") === o.key ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"}`}
                          >
                            {o.label}
                          </button>
                        ))}
                        {s.displayType === "card" && (
                          <label className="flex items-center gap-1 text-xs text-gray-600 mr-2">
                            <input
                              type="checkbox"
                              checked={s.groupWithNext === true}
                              onChange={(e) => updateSection(si, (x) => ({ ...x, groupWithNext: e.target.checked }))}
                            />
                            بجانب القسم التالي (card مع card)
                          </label>
                        )}
                      </div>
                      <div className="w-48">
                        <p className="text-xs text-gray-500">تخفيض القسم كاملاً</p>
                        <DiscountEditor
                          value={s.discount ?? null}
                          onChange={(discount) => updateSection(si, (x) => ({ ...x, discount }))}
                        />
                      </div>
                    </div>

                    {s.items.length === 0 ? (
                      <p className="text-xs text-gray-400 mt-2">
                        {active ? "اختر منتجات من الأسفل أو أضف منتجاً خارجياً" : "قسم فارغ (لن يُحفظ)"}
                      </p>
                    ) : (
                      <ul className="mt-2 flex gap-2 overflow-x-auto pb-1">
                        {s.items.map((it, i) => (
                          <li
                            key={`${it.kind}_${it.productId ?? it.image}_${i}`}
                            className="shrink-0 w-44 border border-gray-100 rounded-lg p-1.5 bg-white"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {it.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={it.image} alt={it.title} className="w-full h-16 object-contain rounded" />
                            ) : (
                              <div className="w-full h-16 bg-gray-100 rounded" />
                            )}
                            <p className="text-[11px] font-semibold truncate mt-1">{it.title || it.productId}</p>
                            <p className="text-[10px] text-gray-500 truncate">
                              {it.kind === "custom" ? <span className="text-amber-600 font-semibold">خارجي · </span> : null}
                              {it.storeName}
                            </p>
                            <div className="flex justify-between mt-1">
                              <button
                                type="button"
                                title="قبل"
                                onClick={() => moveItem(si, i, -1)}
                                className="p-1 rounded bg-gray-50 text-gray-500"
                              >
                                <ArrowUp size={12} className="rotate-90" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeItem(si, i)}
                                className="p-1 rounded bg-red-50 text-red-600"
                              >
                                <Trash2 size={12} />
                              </button>
                              <button
                                type="button"
                                title="بعد"
                                onClick={() => moveItem(si, i, 1)}
                                className="p-1 rounded bg-gray-50 text-gray-500"
                              >
                                <ArrowDown size={12} className="rotate-90" />
                              </button>
                            </div>
                            {it.kind !== "custom" && (
                              <>
                                {!it.discount && s.discount && (
                                  <p className="mt-1 text-[10px] text-green-700">يرث تخفيض القسم</p>
                                )}
                                <DiscountEditor
                                  value={it.discount ?? null}
                                  price={it.price}
                                  // عرض السعر المتوقع بتخفيض القسم إن لم يكن للمنتج تخفيض خاص
                                  inherited={it.discount ? null : (s.discount ?? null)}
                                  onChange={(discount) => updateItem(si, i, { discount })}
                                />
                              </>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* اختيار المنتجات للقسم المحدّد */}
          <section className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h2 className="font-bold text-gray-800">
              إضافة إلى القسم {activeSection + 1}
              {current?.title[lang] ? <span className="text-gray-500 font-normal"> - {current.title[lang]}</span> : null}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-100 rounded-xl p-3">
                <div className="relative mb-3">
                  <Search className="absolute right-3 top-3.5 text-gray-400" size={18} />
                  <input
                    className={`${inputClass} pr-10`}
                    value={storeQuery}
                    onChange={(e) => setStoreQuery(e.target.value)}
                    placeholder="ابحث عن متجر"
                  />
                </div>
                {loadingStores ? (
                  <Loader2 className="animate-spin text-gray-400 mx-auto" size={18} />
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-1">
                    {stores.slice(0, 20).map((s) => (
                      <button
                        key={s._id}
                        type="button"
                        onClick={() => openStore(s)}
                        className={`w-full text-right px-3 py-2 rounded-lg text-sm ${activeStore?._id === s._id ? "bg-red-50 text-red-700 font-semibold" : "bg-gray-50 text-gray-700"}`}
                      >
                        {s.nameEtabliss}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="border border-gray-100 rounded-xl p-3">
                {!activeStore ? (
                  <p className="text-sm text-gray-400 text-center py-8">اختر متجراً لعرض منتجاته</p>
                ) : loadingProducts ? (
                  <Loader2 className="animate-spin text-gray-400 mx-auto my-8" size={20} />
                ) : products.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">لا توجد منتجات - يمكنك إضافة منتج خارجي</p>
                ) : (
                  <div className="max-h-72 overflow-y-auto grid grid-cols-2 gap-2">
                    {products.map((p) => {
                      const selected = isSelected(p._id);
                      return (
                        <button
                          key={p._id}
                          type="button"
                          onClick={() => toggleProduct(p)}
                          className={`text-right rounded-lg border p-2 ${selected ? "border-red-500 bg-red-50" : "border-gray-100"}`}
                        >
                          {p.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.image} alt={p.title} className="w-full h-20 object-contain rounded" />
                          ) : (
                            <div className="w-full h-20 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">
                              بدون صورة
                            </div>
                          )}
                          <p className="text-xs font-semibold mt-1 line-clamp-2">{p.title}</p>
                          <p className="text-xs text-gray-500">
                            {p.price} {p.currency}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* منتج خارجي */}
            <div className="border border-dashed border-amber-300 bg-amber-50/40 rounded-xl p-3 space-y-3">
              <p className="text-sm font-bold text-gray-800">منتج خارجي (غير موجود في المتجر)</p>
              <p className="text-xs text-gray-500">
                يُربط بالمتجر المختار{activeStore ? `: ${activeStore.nameEtabliss}` : " (اختر متجراً أولاً)"}. في التطبيق يظهر
                مع باقي المنتجات، والضغط عليه يفتح المتجر - لا يُضاف للسلة.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  className={inputClass}
                  placeholder="اسم المنتج *"
                  maxLength={120}
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                />
                <input
                  className={inputClass}
                  placeholder="السعر (مثل 450)"
                  maxLength={30}
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                />
                <input
                  type="file"
                  accept="image/*"
                  className={inputClass}
                  onChange={(e) => setCustomImage(e.target.files?.[0] ?? null)}
                />
              </div>
              <textarea
                className={`${inputClass} h-16 resize-none`}
                placeholder="وصف (اختياري)"
                maxLength={300}
                value={customDesc}
                onChange={(e) => setCustomDesc(e.target.value)}
              />
              <button
                type="button"
                onClick={addCustomProduct}
                disabled={addingCustom || !activeStore}
                className="h-10 px-4 rounded-xl bg-amber-500 text-white font-bold text-sm disabled:opacity-50 flex items-center gap-2"
              >
                {addingCustom ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                إضافة للقسم {activeSection + 1}
              </button>
            </div>

            <p className="text-xs text-gray-400">
              في التطبيق تظهر فقط عناصر المتاجر القريبة من الزبون. الإعلان لا يظهر إن لم يكن له عنصر قريب.
            </p>
          </section>

          <button
            type="submit"
            disabled={saving}
            className="w-full h-12 rounded-xl bg-red-600 text-white font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : form.id ? <Pencil size={16} /> : <Plus size={16} />}
            {form.id ? "حفظ التعديلات" : "نشر الإعلان"}
          </button>
        </form>

        {/* القائمة */}
        <section className="xl:col-span-2 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3 h-fit">
          <h2 className="font-bold text-gray-800">الإعلانات ({ads.length})</h2>
          {loadingList ? (
            <Loader2 className="animate-spin text-gray-400 mx-auto" size={20} />
          ) : ads.length === 0 ? (
            <p className="text-sm text-gray-500">لا توجد إعلانات بعد</p>
          ) : (
            ads.map((ad) => {
              const busy = busyId === ad._id;
              const expired = ad.endAt ? new Date(ad.endAt) < new Date() : false;
              return (
                <article key={ad._id} className={`rounded-xl border p-2 ${form.id === ad._id ? "border-red-400" : "border-gray-100"}`}>
                  <AdPreview
                    compact
                    title={ad.title?.ar || ad.title?.fr || ad.title?.en || ""}
                    subtitle={ad.subtitle?.ar || ad.subtitle?.fr || ""}
                    buttonText={ad.buttonText?.ar || ad.buttonText?.fr || ""}
                    image={ad.imageUrl}
                    bgColor={ad.bgColor}
                    textColor={ad.textColor}
                    buttonColor={ad.buttonColor}
                    buttonTextColor={ad.buttonTextColor}
                    rtl
                  />
                  <div className="flex items-center justify-between gap-2 pt-2">
                    <div className="text-xs text-gray-500">
                      {adItemCount(ad)} منتج · ترتيب {ad.order ?? 0}
                      <br />
                      {ad.target === "store" ? (
                        <span className="font-semibold text-gray-700">
                          يفتح متجر: {ad.targetStoreName || ad.targetStoreId} (يظهر قربه فقط)
                        </span>
                      ) : (
                        <span>يفتح صفحة العروض</span>
                      )}
                      {ad.schedule && (
                        <>
                          <br />
                          <span className="text-purple-700 font-semibold">
                            🕕 {scheduleText(ad.schedule.daysOfWeek ?? [], toHHMM(ad.schedule.from), toHHMM(ad.schedule.to))}
                          </span>
                        </>
                      )}
                      {expired && <span className="text-red-600 font-semibold"> · منتهي</span>}
                      {!ad.isActive && <span className="text-gray-400 font-semibold"> · متوقف</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => editAd(ad)} className="p-2 rounded-lg bg-gray-100 text-gray-600">
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => toggleAd(ad)}
                        title={ad.isActive ? "إيقاف" : "تفعيل"}
                        className={`p-2 rounded-lg disabled:opacity-50 ${ad.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}
                      >
                        {busy ? <Loader2 className="animate-spin" size={16} /> : <Power size={16} />}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => removeAd(ad)}
                        className="p-2 rounded-lg bg-red-50 text-red-600 disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-gray-500 mb-2">{label}</span>
      {children}
    </label>
  );
}

const COLOR_PRESETS = [
  { bg: "#317ee3", text: "#ffffff", button: "#ffffff", buttonText: "#317ee3" },
  { bg: "#111827", text: "#ffffff", button: "#facc15", buttonText: "#111827" },
  { bg: "#fef3c7", text: "#78350f", button: "#b45309", buttonText: "#ffffff" },
  { bg: "#dc2626", text: "#ffffff", button: "#ffffff", buttonText: "#dc2626" },
  { bg: "#ecfdf5", text: "#065f46", button: "#059669", buttonText: "#ffffff" },
];

const HEX_RE = /^#[0-9a-f]{6}$/i;

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ContrastHint({ fg, bg }: { fg: string; bg: string }) {
  if (!HEX_RE.test(fg) || !HEX_RE.test(bg)) return null;
  const [a, b] = [luminance(fg), luminance(bg)];
  const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  const ok = ratio >= 3;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="px-2 py-0.5 rounded-md font-semibold ring-1 ring-black/5" style={{ background: bg, color: fg }}>
        Aa
      </span>
      <span className={ok ? "text-green-600" : "text-amber-600"}>
        {ok ? "وضوح جيد" : "التباين ضعيف، قد يصعب قراءة النص"} ({ratio.toFixed(1)}:1)
      </span>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const valid = HEX_RE.test(value);
  return (
    <div>
      <span className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</span>
      <div
        className={`flex items-center gap-2 bg-white border rounded-xl p-1.5 transition focus-within:ring-2 focus-within:ring-blue-100 ${
          valid ? "border-gray-200 focus-within:border-blue-400" : "border-red-300"
        }`}
      >
        <label
          className="relative shrink-0 w-8 h-8 rounded-lg ring-1 ring-black/10 shadow-inner cursor-pointer overflow-hidden"
          style={{ background: valid ? value : "#ffffff" }}
        >
          <input
            type="color"
            value={valid ? value : "#ffffff"}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </label>
        <input
          className="w-full min-w-0 text-sm font-mono uppercase bg-transparent outline-none text-gray-700"
          dir="ltr"
          value={value}
          maxLength={7}
          placeholder="#FFFFFF"
          onChange={(e) => {
            const v = e.target.value.trim();
            onChange(v && !v.startsWith("#") ? `#${v}` : v);
          }}
        />
      </div>
    </div>
  );
}

/** نفس شكل الإعلان في التطبيق (lib/home/utils/hero_ads.dart) */
function AdPreview(props: {
  title: string;
  subtitle: string;
  buttonText: string;
  image: string;
  bgColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  rtl: boolean;
  compact?: boolean;
}) {
  const { compact } = props;
  return (
    <div
      dir={props.rtl ? "rtl" : "ltr"}
      className={`relative overflow-hidden rounded-2xl flex items-center ${compact ? "h-28 p-3" : "h-44 p-5"}`}
      style={{ backgroundColor: props.bgColor }}
    >
      <div className="flex-1 min-w-0 z-10" style={{ color: props.textColor }}>
        <p className={`font-black leading-tight line-clamp-2 ${compact ? "text-base" : "text-2xl"}`}>{props.title || "العنوان"}</p>
        {props.subtitle && (
          <p className={`opacity-90 mt-1 line-clamp-2 ${compact ? "text-[11px]" : "text-sm"}`}>{props.subtitle}</p>
        )}
        {props.buttonText && (
          <span
            className={`inline-block mt-2 rounded-full font-semibold ${compact ? "text-[11px] px-3 py-1" : "text-sm px-4 py-1.5"}`}
            style={{ backgroundColor: props.buttonColor, color: props.buttonTextColor }}
          >
            {props.buttonText}
          </span>
        )}
      </div>
      {props.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={props.image} alt="" className={`object-contain shrink-0 ${compact ? "w-24 h-24" : "w-40 h-40"}`} />
      ) : (
        <div className={`shrink-0 rounded-xl bg-white/20 ${compact ? "w-24 h-20" : "w-40 h-32"}`} />
      )}
      <span className="absolute bottom-2 end-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/30 text-white">Ad</span>
    </div>
  );
}

/**
 * تخفيض منتج: نوع + قيمة + حصة المطعم. يعرض السعر الجديد وتوزيع التكلفة.
 * يُطبق فعلياً في حساب الطلب طوال فترة الإعلان (الأسعار من الخادم وليست من هنا).
 */
function DiscountEditor({
  value,
  price,
  inherited,
  onChange,
}: {
  value: ItemDiscount | null;
  price?: string;
  /** تخفيض القسم الموروث (يُعرض كمعاينة فقط حين لا يوجد تخفيض خاص) */
  inherited?: ItemDiscount | null;
  onChange: (d: ItemDiscount | null) => void;
}) {
  const base = parseFloat(String(price ?? "").replace(/,/g, "")) || 0;
  if (!value) {
    const inheritedAmount =
      inherited && inherited.type !== "bogo" && base > 0
        ? Math.min(
            base,
            Math.round(inherited.type === "percentage" ? (base * inherited.value) / 100 : inherited.value),
          )
        : 0;
    return (
      <>
        {inheritedAmount > 0 && (
          <p className="text-[10px] text-gray-600">
            <span className="line-through text-gray-400">{base}</span> → <b>{base - inheritedAmount}</b>
          </p>
        )}
        {inherited?.type === "bogo" && (
          <p className="text-[10px] font-semibold text-purple-700">{bogoLabel(inherited)}</p>
        )}
        <button
          type="button"
          onClick={() => onChange({ type: "percentage", value: 10, restaurantShare: inherited?.restaurantShare ?? 0 })}
          className="w-full mt-1.5 text-[11px] font-semibold text-green-700 bg-green-50 rounded py-1"
        >
          {inherited ? "+ تخفيض خاص بالمنتج" : "+ تخفيض"}
        </button>
      </>
    );
  }
  const isBogo = value.type === "bogo";
  const amount =
    base > 0 && !isBogo
      ? Math.min(base, Math.round(value.type === "percentage" ? (base * value.value) / 100 : value.value))
      : 0;
  const storePart = Math.round((amount * value.restaurantShare) / 100);
  // bogo: قيمة كل قطعة مجانية = السعر الأساسي
  const bogoStorePart = Math.round((base * value.restaurantShare) / 100);

  const changeType = (type: ItemDiscount["type"]) => {
    if (type === "bogo") {
      onChange({ type, value: 0, buyQty: 1, freeQty: 1, maxFree: 2, restaurantShare: 100 });
    } else {
      onChange({ type, value: value.value > 0 ? value.value : 10, restaurantShare: value.restaurantShare });
    }
  };
  const qtyInput = (label: string, key: "buyQty" | "freeQty" | "maxFree", def: number) => (
    <label className="flex items-center justify-between gap-1">
      <span className="text-gray-600">{label}</span>
      <input
        type="number"
        min={1}
        className="w-12 rounded border border-purple-200 bg-white px-1 py-0.5"
        value={value[key] ?? def}
        onChange={(e) => onChange({ ...value, [key]: Math.max(1, Math.floor(Number(e.target.value) || 1)) })}
      />
    </label>
  );

  return (
    <div className={`mt-1.5 rounded p-1.5 space-y-1 text-[11px] ${isBogo ? "bg-purple-50" : "bg-green-50"}`}>
      <div className="flex gap-1">
        <select
          className="flex-1 rounded border border-green-200 bg-white px-1 py-0.5"
          value={value.type}
          onChange={(e) => changeType(e.target.value as ItemDiscount["type"])}
        >
          <option value="percentage">%</option>
          <option value="fixed">مبلغ</option>
          <option value="bogo">1 acheté = 1 offert</option>
        </select>
        {!isBogo && (
          <input
            type="number"
            min={0}
            max={value.type === "percentage" ? 90 : undefined}
            className="w-16 rounded border border-green-200 bg-white px-1 py-0.5"
            value={value.value}
            onChange={(e) => onChange({ ...value, value: Number(e.target.value) })}
          />
        )}
        <button type="button" title="إزالة التخفيض" onClick={() => onChange(null)} className="px-1 text-red-600">
          ✕
        </button>
      </div>
      {isBogo && (
        <>
          {qtyInput("يشتري", "buyQty", 1)}
          {qtyInput("يأخذ مجاناً", "freeQty", 1)}
          {qtyInput("أقصى مجاني/طلب", "maxFree", 2)}
        </>
      )}
      <label className="flex items-center justify-between gap-1">
        <span className="text-gray-600">المطعم يتحمل</span>
        <span className="flex items-center gap-0.5">
          <input
            type="number"
            min={0}
            max={100}
            className="w-12 rounded border border-green-200 bg-white px-1 py-0.5"
            value={value.restaurantShare}
            onChange={(e) => onChange({ ...value, restaurantShare: Number(e.target.value) })}
          />
          %
        </span>
      </label>
      {isBogo ? (
        <p className="text-purple-800 leading-tight">
          <b>{bogoLabel(value)}</b>
          {base > 0 && (
            <>
              <br />
              كل قطعة مجانية ({base}): مطعم {bogoStorePart} · تطبيق {base - bogoStorePart}
            </>
          )}
        </p>
      ) : (
        base > 0 && (
          <p className="text-gray-700 leading-tight">
            <span className="line-through text-gray-400">{base}</span> → <b>{base - amount}</b>
            <br />
            مطعم {storePart} · تطبيق {amount - storePart}
          </p>
        )
      )}
    </div>
  );
}

/** "يشتري 1 ويأخذ 1 مجاناً — حد أقصى 2 مجاناً في الطلب" */
function bogoLabel(d: ItemDiscount) {
  return `يشتري ${d.buyQty ?? 1} ويأخذ ${d.freeQty ?? 1} مجاناً — حد أقصى ${d.maxFree ?? 2} مجاناً في الطلب`;
}
