/* eslint-disable @next/next/no-img-element */
"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  GraduationCap,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useUser } from "@/app/context/UserContext";
import RoleGuard from "@/app/dashboard/components/RoleGuard";
import {
  addCourse,
  addCourseCategory,
  addCourseProduct,
  CourseCategoryItem,
  CourseItem,
  CourseProductItem,
  deleteCourse,
  deleteCourseCategory,
  listCourseCategories,
  listCourseProducts,
  listCourses,
  sortCourseItems,
  updateCourse,
  updateCourseCategory,
  updateCourseProduct,
} from "./api/courses";

type DialogKind = "course" | "category" | "product";

const inputClass =
  "w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#e91818] bg-white";

function CoursesContent() {
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [categories, setCategories] = useState<CourseCategoryItem[]>([]);
  const [products, setProducts] = useState<CourseProductItem[]>([]);
  const [courseId, setCourseId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [sorting, setSorting] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeOk, setNoticeOk] = useState(true);

  const [dialog, setDialog] = useState<DialogKind | null>(null);
  const [editingId, setEditingId] = useState("");
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("DZD");
  const [maxCount, setMaxCount] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [keptImage, setKeptImage] = useState("");
  const categoryRequest = useRef(0);
  const productRequest = useRef(0);

  const showNotice = (ok: boolean, text: string) => {
    setNoticeOk(ok);
    setNotice(text);
  };

  const loadCourses = async () => {
    setLoadingCourses(true);
    try {
      const data = await listCourses();
      if (data.status && Array.isArray(data.result)) {
        setCourses(data.result);
        setCourseId((current) =>
          data.result?.some((item) => item.id === current)
            ? current
            : data.result?.[0]?.id || "",
        );
      } else {
        showNotice(false, data.message || "تعذر جلب الكورسات");
      }
    } catch {
      showNotice(false, "تعذر الاتصال بالخادم");
    } finally {
      setLoadingCourses(false);
    }
  };

  const loadCategories = async (id: string) => {
    const request = ++categoryRequest.current;
    if (!id) {
      setCategories([]);
      setCategoryId("");
      return;
    }
    setLoadingCategories(true);
    try {
      const data = await listCourseCategories(id);
      if (request !== categoryRequest.current) return;
      if (data.status && Array.isArray(data.result)) {
        setCategories(data.result);
        setCategoryId((current) =>
          data.result?.some((item) => item.id === current)
            ? current
            : data.result?.[0]?.id || "",
        );
      } else {
        setCategories([]);
        setCategoryId("");
        showNotice(false, data.message || "تعذر جلب التصنيفات");
      }
    } catch {
      if (request === categoryRequest.current) showNotice(false, "تعذر الاتصال بالخادم");
    } finally {
      if (request === categoryRequest.current) setLoadingCategories(false);
    }
  };

  const loadProducts = async (id: string) => {
    const request = ++productRequest.current;
    if (!id) {
      setProducts([]);
      return;
    }
    setLoadingProducts(true);
    try {
      const data = await listCourseProducts(id);
      if (request !== productRequest.current) return;
      if (data.status && Array.isArray(data.result)) {
        setProducts(data.result);
      } else {
        setProducts([]);
        showNotice(false, data.message || "تعذر جلب المنتجات");
      }
    } catch {
      if (request === productRequest.current) showNotice(false, "تعذر الاتصال بالخادم");
    } finally {
      if (request === productRequest.current) setLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    setReady(true);
    void loadCourses();
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!ready) return;
    setCategories([]);
    setProducts([]);
    setCategoryId("");
    void loadCategories(courseId);
  }, [courseId, ready]);

  useEffect(() => {
    if (!ready) return;
    void loadProducts(categoryId);
  }, [categoryId, ready]);

  useEffect(() => {
    if (!image) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const moveItem = async <T extends { id: string }>(
    kind: "course" | "category" | "product",
    list: T[],
    index: number,
    direction: -1 | 1,
    apply: (next: T[]) => void,
  ) => {
    const target = index + direction;
    if (sorting || target < 0 || target >= list.length) return;
    const previous = list;
    const next = [...list];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    apply(next);
    setSorting(true);
    try {
      const data = await sortCourseItems({
        kind,
        ids: next.map((entry) => entry.id),
        coursesId: kind === "category" ? courseId : undefined,
        coursesCatgId: kind === "product" ? categoryId : undefined,
      });
      if (!data.status) {
        apply(previous);
        showNotice(false, data.message || "تعذر حفظ الترتيب");
      }
    } catch {
      apply(previous);
      showNotice(false, "تعذر الاتصال بالخادم");
    } finally {
      setSorting(false);
    }
  };

  const openDialog = (
    kind: DialogKind,
    item?: CourseItem | CourseCategoryItem | CourseProductItem,
  ) => {
    setDialog(kind);
    setImage(null);
    if (!item) {
      setEditingId("");
      setName("");
      setCurrency("DZD");
      setMaxCount("");
      setKeptImage("");
      return;
    }
    if (kind === "product" && "productsTitle" in item) {
      setEditingId(item.id);
      setName(item.productsTitle);
      setCurrency(item.currency || "DZD");
      setMaxCount(item.maxCount > 0 ? String(item.maxCount) : "");
      setKeptImage(item.prodcutsImage || "");
      return;
    }
    if ("catg" in item) {
      setEditingId(item.id);
      setName(item.catg);
      setKeptImage("image" in item ? item.image || "" : "");
    }
  };

  const closeDialog = () => {
    if (saving) return;
    setDialog(null);
  };

  const removeCourse = async (item: CourseItem) => {
    const confirmed = window.confirm(
      `حذف الكورس «${item.catg}» مع تصنيفاته ومنتجاته؟`,
    );
    if (!confirmed) return;
    setDeletingId(item.id);
    try {
      const data = await deleteCourse(item.id);
      if (!data.status) {
        showNotice(false, data.message || "تعذر حذف الكورس");
        return;
      }
      const next = courses.filter((course) => course.id !== item.id);
      setCourses(next);
      if (courseId === item.id) setCourseId(next[0]?.id || "");
      showNotice(true, data.message || "تم حذف الكورس");
    } catch {
      showNotice(false, "تعذر الاتصال بالخادم");
    } finally {
      setDeletingId("");
    }
  };

  const removeCategory = async (item: CourseCategoryItem) => {
    const confirmed = window.confirm(
      `حذف التصنيف «${item.catg}» مع منتجاته؟`,
    );
    if (!confirmed) return;
    setDeletingId(item.id);
    try {
      const data = await deleteCourseCategory(item.id);
      if (!data.status) {
        showNotice(false, data.message || "تعذر حذف التصنيف");
        return;
      }
      const next = categories.filter((category) => category.id !== item.id);
      setCategories(next);
      if (categoryId === item.id) setCategoryId(next[0]?.id || "");
      showNotice(true, data.message || "تم حذف التصنيف");
    } catch {
      showNotice(false, "تعذر الاتصال بالخادم");
    } finally {
      setDeletingId("");
    }
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const label = name.trim();
    if (!dialog || !label) {
      showNotice(false, "الاسم مطلوب");
      return;
    }
    if (dialog === "product" && !editingId && !image) {
      showNotice(false, "صورة المنتج مطلوبة");
      return;
    }
    setSaving(true);
    try {
      if (dialog === "course") {
        const data = editingId
          ? await updateCourse(editingId, label, image)
          : await addCourse(label, image);
        if (!data.status || !data.result) {
          showNotice(false, data.message || "تعذر حفظ الكورس");
          return;
        }
        const saved = data.result;
        setCourses((prev) =>
          editingId
            ? prev.map((item) => (item.id === saved.id ? saved : item))
            : [saved, ...prev],
        );
        setCourseId(saved.id);
      } else if (dialog === "category") {
        if (!courseId) return;
        const data = editingId
          ? await updateCourseCategory(editingId, label)
          : await addCourseCategory(courseId, label);
        if (!data.status || !data.result) {
          showNotice(false, data.message || "تعذر حفظ التصنيف");
          return;
        }
        const saved = data.result;
        setCategories((prev) =>
          editingId
            ? prev.map((item) => (item.id === saved.id ? saved : item))
            : [saved, ...prev],
        );
        setCategoryId(saved.id);
      } else {
        if (!categoryId) return;
        const limit = Math.max(0, Math.floor(Number(maxCount) || 0));
        const data = editingId
          ? await updateCourseProduct(
              {
                id: editingId,
                productsTitle: label,
                currency: currency.trim() || "DZD",
                maxCount: limit,
              },
              image,
            )
          : await addCourseProduct(
              {
                coursesCatgId: categoryId,
                productsTitle: label,
                currency: currency.trim() || "DZD",
                maxCount: limit,
              },
              image as File,
            );
        if (!data.status || !data.result) {
          showNotice(false, data.message || "تعذر حفظ المنتج");
          return;
        }
        const saved = data.result;
        setProducts((prev) =>
          editingId
            ? prev.map((item) => (item.id === saved.id ? saved : item))
            : [saved, ...prev],
        );
      }
      showNotice(true, editingId ? "تم الحفظ" : "تمت الإضافة");
      setDialog(null);
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

  const shownImage = preview || keptImage;
  const dialogTitle =
    dialog === "course"
      ? editingId
        ? "تعديل الكورس"
        : "كورس جديد"
      : dialog === "category"
        ? editingId
          ? "تعديل التصنيف"
          : "تصنيف مخزون جديد"
        : editingId
          ? "تعديل المنتج"
          : "منتج جديد";

  return (
    <div className="max-w-6xl mx-auto" dir="rtl">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-[#e91818] font-black">
          <GraduationCap size={22} />
          <h2 className="text-xl">منتجات الكورس</h2>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          أضف الكورس، ثم تصنيف المخزون، ثم المنتجات. متجر الكورس يختارها ويحدد سعر البيع.
        </p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <section className="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm">
          <header className="flex items-center justify-between mb-3">
            <h3 className="font-black text-gray-800">الكورسات</h3>
            <button
              type="button"
              onClick={() => openDialog("course")}
              className="inline-flex items-center gap-1 text-sm font-bold text-[#e91818]"
            >
              <Plus size={16} />
              جديد
            </button>
          </header>
          {loadingCourses ? (
            <Loader2 className="animate-spin text-gray-300 mx-auto my-8" />
          ) : courses.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">لا توجد كورسات بعد</p>
          ) : (
            <ul className="space-y-2">
              {courses.map((item, index) => (
                <li key={item.id}>
                  <div
                    className={`flex items-center gap-2 p-3 rounded-2xl border ${
                      courseId === item.id
                        ? "border-[#e91818] bg-red-50"
                        : "border-gray-100"
                    }`}
                  >
                    <span className="w-5 text-center text-[11px] font-black text-red-600">
                      {index + 1}
                    </span>
                    <div className="flex flex-col">
                      <button
                        type="button"
                        disabled={sorting || index === 0}
                        onClick={() => void moveItem("course", courses, index, -1, setCourses)}
                        className="text-red-600 disabled:text-gray-200"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={sorting || index === courses.length - 1}
                        onClick={() => void moveItem("course", courses, index, 1, setCourses)}
                        className="text-red-600 disabled:text-gray-200"
                      >
                        <ArrowDown size={14} />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCourseId(item.id)}
                      className="flex-1 text-right font-bold text-sm text-gray-800"
                    >
                      {item.catg}
                    </button>
                    <button
                      type="button"
                      onClick={() => openDialog("course", item)}
                      className="p-2 text-gray-400 hover:text-gray-700"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === item.id}
                      onClick={() => void removeCourse(item)}
                      className="p-2 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm">
          <header className="flex items-center justify-between mb-3">
            <h3 className="font-black text-gray-800">تصنيفات المخزون</h3>
            <button
              type="button"
              disabled={!courseId}
              onClick={() => openDialog("category")}
              className="inline-flex items-center gap-1 text-sm font-bold text-[#e91818] disabled:text-gray-300"
            >
              <Plus size={16} />
              جديد
            </button>
          </header>
          {!courseId ? (
            <p className="text-sm text-gray-400 py-8 text-center">اختر كورساً أولاً</p>
          ) : loadingCategories ? (
            <Loader2 className="animate-spin text-gray-300 mx-auto my-8" />
          ) : categories.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">لا توجد تصنيفات</p>
          ) : (
            <ul className="space-y-2">
              {categories.map((item, index) => (
                <li key={item.id}>
                  <div
                    className={`flex items-center gap-2 p-3 rounded-2xl border ${
                      categoryId === item.id
                        ? "border-[#e91818] bg-red-50"
                        : "border-gray-100"
                    }`}
                  >
                    <span className="w-5 text-center text-[11px] font-black text-red-600">
                      {index + 1}
                    </span>
                    <div className="flex flex-col">
                      <button
                        type="button"
                        disabled={sorting || index === 0}
                        onClick={() =>
                          void moveItem("category", categories, index, -1, setCategories)
                        }
                        className="text-red-600 disabled:text-gray-200"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={sorting || index === categories.length - 1}
                        onClick={() =>
                          void moveItem("category", categories, index, 1, setCategories)
                        }
                        className="text-red-600 disabled:text-gray-200"
                      >
                        <ArrowDown size={14} />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCategoryId(item.id)}
                      className="flex-1 text-right font-bold text-sm text-gray-800"
                    >
                      {item.catg}
                    </button>
                    <button
                      type="button"
                      onClick={() => openDialog("category", item)}
                      className="p-2 text-gray-400 hover:text-gray-700"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === item.id}
                      onClick={() => void removeCategory(item)}
                      className="p-2 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm flex flex-col h-[calc(100vh-8rem)] min-h-[40rem]">
          <header className="flex items-center justify-between mb-3 shrink-0">
            <h3 className="font-black text-gray-800">المنتجات</h3>
            <button
              type="button"
              disabled={!categoryId}
              onClick={() => openDialog("product")}
              className="inline-flex items-center gap-1 text-sm font-bold text-[#e91818] disabled:text-gray-300"
            >
              <Plus size={16} />
              جديد
            </button>
          </header>
          <div className="flex-1 overflow-y-auto pe-1">
          {!categoryId ? (
            <p className="text-sm text-gray-400 py-8 text-center">اختر تصنيفاً أولاً</p>
          ) : loadingProducts ? (
            <Loader2 className="animate-spin text-gray-300 mx-auto my-8" />
          ) : products.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">لا توجد منتجات</p>
          ) : (
            <ul className="space-y-2">
              {products.map((item, index) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-2xl border border-gray-100"
                >
                  <span className="w-5 text-center text-[11px] font-black text-red-600">
                    {index + 1}
                  </span>
                  <div className="flex flex-col">
                    <button
                      type="button"
                      disabled={sorting || index === 0}
                      onClick={() => void moveItem("product", products, index, -1, setProducts)}
                      className="text-red-600 disabled:text-gray-200"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={sorting || index === products.length - 1}
                      onClick={() => void moveItem("product", products, index, 1, setProducts)}
                      className="text-red-600 disabled:text-gray-200"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>
                  <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                    {item.prodcutsImage ? (
                      <img
                        src={item.prodcutsImage}
                        alt={item.productsTitle}
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-800 leading-6">
                      {item.productsTitle}
                    </p>
                    <p className="text-xs text-gray-400">
                      {item.currency}
                      {item.maxCount > 0 ? ` · الحد ${item.maxCount}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openDialog("product", item)}
                    className="p-2 text-gray-400 hover:text-gray-700"
                  >
                    <Pencil size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          </div>
        </section>
      </div>

      {dialog && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-4">
          <form
            onSubmit={(event) => void save(event)}
            className="bg-white w-full max-w-md rounded-3xl p-5 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-gray-800">{dialogTitle}</h3>
              <button type="button" onClick={closeDialog} className="text-gray-400">
                <X size={18} />
              </button>
            </div>
            <label className="block text-xs font-bold text-gray-500 mb-1">
              {dialog === "product" ? "اسم المنتج" : "الاسم"}
            </label>
            <input
              className={inputClass}
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={120}
              required
            />
            {dialog === "product" && (
              <>
                <label className="block text-xs font-bold text-gray-500 mt-3 mb-1">
                  العملة
                </label>
                <input
                  className={inputClass}
                  value={currency}
                  onChange={(event) => setCurrency(event.target.value)}
                  maxLength={8}
                />
                <label className="block text-xs font-bold text-gray-500 mt-3 mb-1">
                  الحد الأقصى للشراء
                </label>
                <input
                  className={inputClass}
                  inputMode="numeric"
                  placeholder="بدون حد"
                  value={maxCount}
                  onChange={(event) => setMaxCount(event.target.value.replace(/[^\d]/g, ""))}
                  maxLength={3}
                />
              </>
            )}
            {dialog !== "category" && (
              <label className="mt-3 flex items-center gap-3 p-3 border border-dashed border-gray-200 rounded-2xl cursor-pointer">
                {shownImage ? (
                  <img src={shownImage} alt="" className="w-12 h-12 rounded-xl object-cover" />
                ) : (
                  <span className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                    <ImagePlus size={18} />
                  </span>
                )}
                <span className="text-sm font-bold text-gray-600">
                  {dialog === "product" && !editingId ? "صورة المنتج مطلوبة" : "صورة اختيارية"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => setImage(event.target.files?.[0] || null)}
                />
              </label>
            )}
            <button
              type="submit"
              disabled={saving}
              className="mt-4 w-full bg-[#e91818] text-white py-3 rounded-2xl font-bold disabled:opacity-60"
            >
              {saving ? "جارٍ الحفظ..." : "حفظ"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function CoursesPage() {
  return (
    <RoleGuard allowedRoles={["super_admin"]}>
      <CoursesContent />
    </RoleGuard>
  );
}
