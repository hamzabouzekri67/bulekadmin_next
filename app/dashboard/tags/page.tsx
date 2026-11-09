/* eslint-disable @next/next/no-img-element */
"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Check,
  FolderPlus,
  ImagePlus,
  Loader2,
  Pencil,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { useUser } from "@/app/context/UserContext";
import RoleGuard from "@/app/dashboard/components/RoleGuard";
import {
  addTagCategory,
  assignTagCategory,
  listTagCatalog,
  deleteTag,
  updateTag,
  updateTagCategory,
  type StoreTag,
  type TagCategory,
} from "./api/tags";

type FilterMode = "all" | "missing" | "assigned";
type DrawerMode = "assign" | "create" | "edit-category" | "edit-tag";

function mediaUrl(value: string): boolean {
  return value.startsWith("http") || value.startsWith("/");
}

function Mark({
  src,
  label,
  color,
  className,
}: {
  src: string;
  label: string;
  color: string;
  className: string;
}) {
  if (src && mediaUrl(src)) {
    return (
      <img
        src={src}
        alt={label}
        className={`${className} object-cover bg-white`}
      />
    );
  }
  return (
    <span
      className={`${className} flex items-center justify-center font-black text-white`}
      style={{ backgroundColor: color }}
    >
      {(label || "?").charAt(0)}
    </span>
  );
}

function TagsContent() {
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [tags, setTags] = useState<StoreTag[]>([]);
  const [categories, setCategories] = useState<TagCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeOk, setNoticeOk] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>("assign");
  const [activeTag, setActiveTag] = useState<StoreTag | null>(null);
  const [pickedId, setPickedId] = useState("");
  const [catQuery, setCatQuery] = useState("");

  const [catName, setCatName] = useState("");
  const [catNameAr, setCatNameAr] = useState("");
  const [catColor, setCatColor] = useState("#e91818");
  const [catImage, setCatImage] = useState<File | null>(null);
  const [catPreview, setCatPreview] = useState("");
  const [keptImage, setKeptImage] = useState("");
  const [recordStatus, setRecordStatus] = useState(true);
  const [editingCategoryId, setEditingCategoryId] = useState("");
  const shownImage = catPreview || keptImage;

  const showNotice = (ok: boolean, text: string) => {
    setNoticeOk(ok);
    setNotice(text);
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await listTagCatalog();
      if (data.status && data.result) {
        setTags(Array.isArray(data.result.tags) ? data.result.tags : []);
        setCategories(
          Array.isArray(data.result.categories) ? data.result.categories : [],
        );
      } else {
        showNotice(false, data.message || "تعذر جلب الوسوم");
      }
    } catch {
      showNotice(false, "تعذر الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    setReady(true);
    void load();
  }, [user, authLoading, router]);

  const missingCount = tags.filter((tag) => !tag.catgId).length;

  const visibleTags = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return tags
      .filter((tag) => {
        if (filter === "missing" && tag.catgId) return false;
        if (filter === "assigned" && !tag.catgId) return false;
        if (categoryFilter === "none" && tag.catgId) return false;
        if (
          categoryFilter !== "all" &&
          categoryFilter !== "none" &&
          tag.catgId !== categoryFilter
        ) {
          return false;
        }
        if (!needle) return true;
        return (
          tag.name.toLowerCase().includes(needle) ||
          tag.name_ar.toLowerCase().includes(needle) ||
          (tag.category?.name_ar || "").toLowerCase().includes(needle)
        );
      })
      .sort((a, b) => Number(Boolean(a.catgId)) - Number(Boolean(b.catgId)));
  }, [tags, query, filter, categoryFilter]);

  const visibleCategories = useMemo(() => {
    const needle = catQuery.trim().toLowerCase();
    if (!needle) return categories;
    return categories.filter(
      (item) =>
        item.name.toLowerCase().includes(needle) ||
        item.name_ar.toLowerCase().includes(needle),
    );
  }, [categories, catQuery]);

  const openAssign = (tag: StoreTag) => {
    setActiveTag(tag);
    setPickedId(tag.catgId || "");
    setCatQuery("");
    setDrawerMode("assign");
    setDrawerOpen(true);
  };

  useEffect(() => {
    if (!catImage) {
      setCatPreview("");
      return;
    }
    const preview = URL.createObjectURL(catImage);
    setCatPreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [catImage]);

  const openCreate = () => {
    setEditingCategoryId("");
    setCatName("");
    setCatNameAr("");
    setCatColor("#e91818");
    setCatImage(null);
    setKeptImage("");
    setRecordStatus(true);
    setDrawerMode("create");
    setDrawerOpen(true);
  };

  const openEditCategory = (category: TagCategory, returnToAssign = false) => {
    if (!returnToAssign) setActiveTag(null);
    setEditingCategoryId(category.id || category._id);
    setCatName(category.name);
    setCatNameAr(category.name_ar);
    setCatColor(category.color || "#e91818");
    setCatImage(null);
    setKeptImage(category.icons || "");
    setRecordStatus(category.status);
    setDrawerMode("edit-category");
    setDrawerOpen(true);
  };

  const openEditTag = (tag: StoreTag) => {
    setActiveTag(tag);
    setCatName(tag.name);
    setCatNameAr(tag.name_ar);
    setCatImage(null);
    setKeptImage(tag.image || "");
    setRecordStatus(tag.status);
    setPickedId(tag.catgId || "");
    setDrawerMode("edit-tag");
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    if (saving) return;
    setDrawerOpen(false);
  };

  const removeTag = async (tag: StoreTag) => {
    const label = tag.name_ar || tag.name;
    const confirmed = window.confirm(
      `حذف الوسم «${label}» نهائياً؟ سيُزال من كل المطاعم ولا يمكن التراجع.`,
    );
    if (!confirmed) return;
    setDeletingId(tag.id);
    try {
      const data = await deleteTag(tag.id || tag._id);
      if (!data.status) {
        showNotice(false, data.message || "تعذر حذف الوسم");
        return;
      }
      setTags((prev) => prev.filter((item) => item.id !== tag.id && item._id !== tag._id));
      if (activeTag?.id === tag.id) setDrawerOpen(false);
      showNotice(true, data.message || "تم حذف الوسم نهائياً");
    } catch {
      showNotice(false, "تعذر الاتصال بالخادم");
    } finally {
      setDeletingId("");
    }
  };

  const saveAssignment = async () => {
    if (!activeTag || !pickedId) return;
    setSaving(true);
    try {
      const data = await assignTagCategory(activeTag.id || activeTag._id, pickedId);
      const saved = data.result;
      if (data.status && saved) {
        setTags((prev) =>
          prev.map((tag) => (tag._id === saved._id ? saved : tag)),
        );
        showNotice(true, data.message || "تم حفظ التصنيف");
        setDrawerOpen(false);
      } else {
        showNotice(false, data.message || "تعذر حفظ التصنيف");
      }
    } catch {
      showNotice(false, "تعذر الاتصال بالخادم");
    } finally {
      setSaving(false);
    }
  };

  const applyCategory = (saved: TagCategory) => {
    setCategories((prev) => {
      const exists = prev.some((item) => item.id === saved.id);
      return exists
        ? prev.map((item) => (item.id === saved.id ? saved : item))
        : [...prev, saved];
    });
    setTags((prev) =>
      prev.map((tag) =>
        tag.catgId === saved.id ? { ...tag, category: saved } : tag,
      ),
    );
  };

  const saveCategory = async (event: FormEvent) => {
    event.preventDefault();
    const editing = drawerMode === "edit-category";
    if (!editing && !catImage) {
      showNotice(false, "اختر صورة التصنيف");
      return;
    }
    if (editing && !catImage && !keptImage) {
      showNotice(false, "صورة التصنيف مطلوبة");
      return;
    }
    setSaving(true);
    try {
      const fields = {
        name: catName,
        name_ar: catNameAr,
        color: catColor,
      };
      const data = editing
        ? await updateTagCategory(
            { ...fields, id: editingCategoryId, status: recordStatus },
            catImage,
          )
        : await addTagCategory(fields, catImage as File);
      if (data.status && data.result) {
        const saved = data.result;
        applyCategory(saved);
        setPickedId(saved.id);
        showNotice(true, data.message || (editing ? "تم تعديل التصنيف" : "تم إضافة التصنيف"));
        if (!editing && activeTag) {
          setDrawerMode("assign");
        } else {
          setDrawerOpen(false);
        }
      } else {
        showNotice(false, data.message || "تعذر حفظ التصنيف");
      }
    } catch {
      showNotice(false, "تعذر الاتصال بالخادم");
    } finally {
      setSaving(false);
    }
  };

  const saveTag = async (event: FormEvent) => {
    event.preventDefault();
    if (!activeTag) return;
    if (!catImage && !keptImage) {
      showNotice(false, "صورة الوسم مطلوبة");
      return;
    }
    setSaving(true);
    try {
      const data = await updateTag(
        {
          id: activeTag.id || activeTag._id,
          name: catName,
          name_ar: catNameAr,
          status: recordStatus,
          catgId: pickedId,
        },
        catImage,
      );
      const saved = data.result;
      if (data.status && saved) {
        setTags((prev) => prev.map((tag) => (tag._id === saved._id ? saved : tag)));
        setActiveTag(saved);
        showNotice(true, data.message || "تم تعديل الوسم");
        setDrawerOpen(false);
      } else {
        showNotice(false, data.message || "تعذر تعديل الوسم");
      }
    } catch {
      showNotice(false, "تعذر الاتصال بالخادم");
    } finally {
      setSaving(false);
    }
  };

  if (!ready) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-[#e91818] font-black">
            <Tag size={22} />
            <h2 className="text-xl">الوسوم والتصنيفات</h2>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            الوسوم القديمة بدون تصنيف تبقى ظاهرة، ويمكن ربطها بتصنيف في أي وقت.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setActiveTag(null);
            openCreate();
          }}
          className="inline-flex items-center justify-center gap-2 bg-[#e91818] text-white px-4 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-red-100 active:scale-95"
        >
          <FolderPlus size={18} />
          تصنيف جديد
        </button>
      </div>

      {notice && (
        <div
          className={`mb-4 px-4 py-3 rounded-2xl text-sm font-bold border ${
            noticeOk
              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
              : "bg-red-50 text-red-600 border-red-100"
          }`}
        >
          {notice}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: "كل الوسوم", value: tags.length },
          { label: "بدون تصنيف", value: missingCount },
          { label: "مصنّفة", value: tags.length - missingCount },
          { label: "التصنيفات", value: categories.length },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm"
          >
            <p className="text-[11px] font-bold text-gray-400">{item.label}</p>
            <p className="text-2xl font-black text-gray-800 mt-1">{item.value}</p>
          </div>
        ))}
      </div>

      {missingCount > 0 && (
        <button
          type="button"
          onClick={() => {
            setFilter("missing");
            setCategoryFilter("all");
          }}
          className="w-full mb-5 flex items-center gap-3 text-right bg-amber-50 border border-amber-100 text-amber-800 rounded-2xl px-4 py-3"
        >
          <AlertCircle size={18} className="shrink-0" />
          <span className="text-sm font-bold">
            {missingCount} وسم قديم بلا تصنيف. اضغط على الوسم لإضافة التصنيف من الدرج.
          </span>
        </button>
      )}

      <div className="bg-white border border-gray-100 rounded-3xl p-4 md:p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3 mb-4">
          <label className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-2xl px-3">
            <Search size={16} className="text-gray-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ابحث بالاسم أو التصنيف"
              className="w-full bg-transparent py-3 text-sm outline-none"
            />
          </label>
          <div className="flex gap-2">
            {(
              [
                ["all", "الكل"],
                ["missing", "بدون تصنيف"],
                ["assigned", "مصنّفة"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border ${
                  filter === key
                    ? "bg-[#e91818] text-white border-[#e91818]"
                    : "bg-white text-gray-500 border-gray-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-3 mb-2">
          <button
            type="button"
            onClick={() => setCategoryFilter("all")}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border ${
              categoryFilter === "all"
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-500 border-gray-200"
            }`}
          >
            كل التصنيفات
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter("none")}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border ${
              categoryFilter === "none"
                ? "bg-amber-500 text-white border-amber-500"
                : "bg-amber-50 text-amber-700 border-amber-100"
            }`}
          >
            غير مصنّف
          </button>
          {categories.map((category) => (
            <span
              key={category.id}
              className="shrink-0 inline-flex items-center rounded-full border bg-white"
              style={{
                borderColor:
                  categoryFilter === category.id ? category.color : "#e5e7eb",
              }}
            >
              <button
                type="button"
                onClick={() => setCategoryFilter(category.id)}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold"
                style={{
                  color:
                    categoryFilter === category.id ? category.color : "#4b5563",
                }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                {category.name_ar || category.name}
              </button>
              <button
                type="button"
                onClick={() => openEditCategory(category)}
                className="ml-1 mr-1 w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-[#e91818] hover:bg-red-50"
                aria-label="تعديل التصنيف"
              >
                <Pencil size={13} />
              </button>
            </span>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
            <Loader2 className="animate-spin text-[#e91818]" />
            <span className="text-xs font-bold">جاري جلب الوسوم...</span>
          </div>
        ) : visibleTags.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-16">لا توجد وسوم مطابقة.</p>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {visibleTags.map((tag) => {
              const missing = !tag.catgId;
              const tone = tag.category?.color || "#e91818";
              return (
                <article
                  key={tag._id}
                  className={`text-right bg-white border rounded-2xl p-4 ${
                    missing ? "border-amber-200" : "border-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Mark
                      src={tag.image}
                      label={tag.name_ar || tag.name}
                      color={tone}
                      className="w-14 h-14 rounded-2xl shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-gray-800 truncate">
                        {tag.name_ar || tag.name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{tag.name}</p>
                      {!tag.status && (
                        <p className="text-[11px] font-bold text-gray-400 mt-1">متوقف</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-2">
                    {tag.category ? (
                      <span
                        className="inline-flex items-center gap-2 text-xs font-bold px-2.5 py-1 rounded-full min-w-0"
                        style={{ backgroundColor: `${tone}18`, color: tone }}
                      >
                        <Mark
                          src={tag.category.icons}
                          label={tag.category.name_ar}
                          color={tone}
                          className="w-4 h-4 rounded-full"
                        />
                        <span className="truncate">
                          {tag.category.name_ar || tag.category.name}
                        </span>
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                        بدون تصنيف
                      </span>
                    )}
                    <span className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditTag(tag)}
                        className="inline-flex items-center gap-1 text-[11px] font-black text-gray-600 bg-gray-50 border border-gray-100 px-2.5 py-1.5 rounded-xl"
                      >
                        <Pencil size={12} />
                        تعديل
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === tag.id}
                        onClick={() => void removeTag(tag)}
                        className="inline-flex items-center gap-1 text-[11px] font-black text-red-700 bg-red-50 border border-red-100 px-2.5 py-1.5 rounded-xl disabled:opacity-50"
                      >
                        {deletingId === tag.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Trash2 size={12} />
                        )}
                        حذف
                      </button>
                      <button
                        type="button"
                        onClick={() => openAssign(tag)}
                        className="text-[11px] font-black text-[#e91818] bg-red-50 px-2.5 py-1.5 rounded-xl"
                      >
                        {missing ? "تصنيف" : "تغيير"}
                      </button>
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="إغلاق"
            className="absolute inset-0 bg-black/40"
            onClick={closeDrawer}
          />
          <aside className="absolute top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <p className="text-xs font-bold text-gray-400">
                  {drawerMode === "create"
                    ? "تصنيف جديد"
                    : drawerMode === "edit-category"
                      ? "تعديل التصنيف"
                      : drawerMode === "edit-tag"
                        ? "تعديل الوسم"
                        : "ربط التصنيف"}
                </p>
                <h3 className="font-black text-gray-900">
                  {drawerMode === "create"
                    ? "أضف تصنيفاً للوسوم"
                    : drawerMode === "assign"
                      ? activeTag?.name_ar || activeTag?.name
                      : catNameAr || catName || "تعديل"}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500"
              >
                <X size={18} />
              </button>
            </div>

            {drawerMode === "assign" && activeTag && (
              <>
                <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/70">
                  <div className="flex items-center gap-3">
                    <Mark
                      src={activeTag.image}
                      label={activeTag.name_ar || activeTag.name}
                      color={activeTag.category?.color || "#e91818"}
                      className="w-16 h-16 rounded-2xl"
                    />
                    <div>
                      <p className="font-black text-gray-800">
                        {activeTag.name_ar || "وسم"}
                      </p>
                      <p className="text-xs text-gray-400">{activeTag.name}</p>
                      <p className="text-xs font-bold mt-1 text-amber-700">
                        {activeTag.catgId
                          ? "يمكنك تغيير التصنيف الحالي"
                          : "هذا الوسم القديم لا يملك تصنيفاً بعد"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="px-5 pt-4">
                  <label className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-2xl px-3">
                    <Search size={16} className="text-gray-400" />
                    <input
                      value={catQuery}
                      onChange={(event) => setCatQuery(event.target.value)}
                      placeholder="ابحث في التصنيفات"
                      className="w-full bg-transparent py-3 text-sm outline-none"
                    />
                  </label>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
                  {visibleCategories.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-sm text-gray-400 mb-3">لا توجد تصنيفات بعد.</p>
                      <button
                        type="button"
                        onClick={openCreate}
                        className="text-sm font-bold text-[#e91818]"
                      >
                        أنشئ تصنيفاً الآن
                      </button>
                    </div>
                  ) : (
                    visibleCategories.map((category) => {
                      const selected = pickedId === category.id;
                      return (
                        <div key={category.id} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPickedId(category.id)}
                          className={`flex-1 flex items-center gap-3 p-3 rounded-2xl border text-right ${
                            selected
                              ? "border-[#e91818] bg-red-50"
                              : "border-gray-100 bg-white"
                          }`}
                        >
                          <Mark
                            src={category.icons}
                            label={category.name_ar || category.name}
                            color={category.color}
                            className="w-11 h-11 rounded-xl shrink-0"
                          />
                          <span className="flex-1 min-w-0">
                            <span className="block font-bold text-gray-800 truncate">
                              {category.name_ar || category.name}
                            </span>
                            <span className="block text-xs text-gray-400 truncate">
                              {category.name}
                            </span>
                          </span>
                          <span
                            className={`w-6 h-6 rounded-full border flex items-center justify-center ${
                              selected
                                ? "bg-[#e91818] border-[#e91818] text-white"
                                : "border-gray-200"
                            }`}
                          >
                            {selected && <Check size={14} />}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditCategory(category, true)}
                          className="w-11 h-11 rounded-2xl border border-gray-100 text-gray-400 hover:text-[#e91818] flex items-center justify-center shrink-0"
                          aria-label="تعديل التصنيف"
                        >
                          <Pencil size={15} />
                        </button>
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="p-4 border-t border-gray-100 flex gap-2">
                  <button
                    type="button"
                    onClick={openCreate}
                    className="px-4 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-600"
                  >
                    جديد
                  </button>
                  <button
                    type="button"
                    disabled={!pickedId || saving}
                    onClick={() => void saveAssignment()}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-[#e91818] text-white py-3 rounded-2xl text-sm font-bold disabled:opacity-40"
                  >
                    {saving && <Loader2 size={16} className="animate-spin" />}
                    حفظ التصنيف
                  </button>
                </div>
              </>
            )}

            {(drawerMode === "create" || drawerMode === "edit-category") && (
              <form onSubmit={saveCategory} className="flex-1 flex flex-col">
                <div className="p-5 space-y-4 flex-1 overflow-y-auto">
                  <label className="block">
                    <span className="text-xs font-bold text-gray-500">الاسم</span>
                    <input
                      required
                      value={catName}
                      onChange={(event) => setCatName(event.target.value)}
                      className="mt-1 w-full p-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#e91818]"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-gray-500">الاسم بالعربية</span>
                    <input
                      required
                      value={catNameAr}
                      onChange={(event) => setCatNameAr(event.target.value)}
                      className="mt-1 w-full p-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#e91818]"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-gray-500">صورة التصنيف</span>
                    <div className="mt-2 flex items-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-3">
                      {shownImage ? (
                        <img
                          src={shownImage}
                          alt="معاينة التصنيف"
                          className="w-16 h-16 rounded-2xl object-cover bg-white border border-gray-100"
                        />
                      ) : (
                        <span
                          className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shrink-0"
                          style={{ backgroundColor: catColor }}
                        >
                          <ImagePlus size={22} />
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-gray-700 truncate">
                          {catImage
                            ? catImage.name
                            : drawerMode === "edit-category"
                              ? "الإبقاء على الصورة الحالية"
                              : "اختر صورة من الجهاز"}
                        </span>
                        <input
                          required={drawerMode === "create"}
                          type="file"
                          accept="image/*"
                          onChange={(event) =>
                            setCatImage(event.target.files?.[0] ?? null)
                          }
                          className="mt-2 block w-full text-xs text-gray-500 file:ml-3 file:rounded-xl file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-bold file:text-[#e91818]"
                        />
                      </span>
                    </div>
                  </label>
                  <label className="flex items-center justify-between gap-3">
                    <span className="text-xs font-bold text-gray-500">اللون</span>
                    <input
                      type="color"
                      value={catColor}
                      onChange={(event) => setCatColor(event.target.value)}
                      className="w-14 h-10 border border-gray-200 rounded-xl bg-white"
                    />
                  </label>
                  {drawerMode === "edit-category" && (
                    <label className="flex items-center justify-between gap-3 bg-gray-50 rounded-xl px-3 py-3">
                      <span className="text-xs font-bold text-gray-500">ظاهر</span>
                      <input
                        type="checkbox"
                        checked={recordStatus}
                        onChange={(event) => setRecordStatus(event.target.checked)}
                      />
                    </label>
                  )}
                </div>
                <div className="p-4 border-t border-gray-100 flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      activeTag && drawerMode === "create"
                        ? setDrawerMode("assign")
                        : activeTag && drawerMode === "edit-category"
                          ? setDrawerMode("assign")
                          : closeDrawer()
                    }
                    className="px-4 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-600"
                  >
                    رجوع
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-[#e91818] text-white py-3 rounded-2xl text-sm font-bold disabled:opacity-40"
                  >
                    {saving && <Loader2 size={16} className="animate-spin" />}
                    {drawerMode === "edit-category" ? "حفظ التعديل" : "إضافة التصنيف"}
                  </button>
                </div>
              </form>
            )}

            {drawerMode === "edit-tag" && (
              <form onSubmit={saveTag} className="flex-1 flex flex-col">
                <div className="p-5 space-y-4 flex-1 overflow-y-auto">
                  <label className="block">
                    <span className="text-xs font-bold text-gray-500">الاسم</span>
                    <input
                      required
                      value={catName}
                      onChange={(event) => setCatName(event.target.value)}
                      className="mt-1 w-full p-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#e91818]"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-gray-500">الاسم بالعربية</span>
                    <input
                      required
                      value={catNameAr}
                      onChange={(event) => setCatNameAr(event.target.value)}
                      className="mt-1 w-full p-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#e91818]"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-gray-500">صورة الوسم</span>
                    <div className="mt-2 flex items-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-3">
                      {shownImage ? (
                        <img
                          src={shownImage}
                          alt="معاينة الوسم"
                          className="w-16 h-16 rounded-2xl object-cover bg-white border border-gray-100"
                        />
                      ) : (
                        <span className="w-16 h-16 rounded-2xl flex items-center justify-center text-white bg-[#e91818] shrink-0">
                          <ImagePlus size={22} />
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-gray-700 truncate">
                          {catImage ? catImage.name : "الإبقاء على الصورة الحالية"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(event) =>
                            setCatImage(event.target.files?.[0] ?? null)
                          }
                          className="mt-2 block w-full text-xs text-gray-500 file:ml-3 file:rounded-xl file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-bold file:text-[#e91818]"
                        />
                      </span>
                    </div>
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-gray-500">التصنيف</span>
                    <select
                      value={pickedId}
                      onChange={(event) => setPickedId(event.target.value)}
                      className="mt-1 w-full p-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#e91818] bg-white"
                    >
                      <option value="">بدون تصنيف</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name_ar || category.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex items-center justify-between gap-3 bg-gray-50 rounded-xl px-3 py-3">
                    <span className="text-xs font-bold text-gray-500">ظاهر</span>
                    <input
                      type="checkbox"
                      checked={recordStatus}
                      onChange={(event) => setRecordStatus(event.target.checked)}
                    />
                  </label>
                </div>
                <div className="p-4 border-t border-gray-100 flex gap-2">
                  <button
                    type="button"
                    onClick={closeDrawer}
                    className="px-4 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-600"
                  >
                    رجوع
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-[#e91818] text-white py-3 rounded-2xl text-sm font-bold disabled:opacity-40"
                  >
                    {saving && <Loader2 size={16} className="animate-spin" />}
                    حفظ التعديل
                  </button>
                </div>
              </form>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

export default function TagsPage() {
  return (
    <RoleGuard allowedRoles={["super_admin"]}>
      <TagsContent />
    </RoleGuard>
  );
}
