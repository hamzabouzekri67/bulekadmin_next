/* eslint-disable @next/next/no-img-element */
"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowRight, ArrowUp, ImagePlus, Loader2, Pause, Pencil, Play, Plus, Trash2 } from "lucide-react";
import { useUser } from "@/app/context/UserContext";
import {
  CourseCategoryItem,
  CourseItem,
  CourseProductItem,
  listCourseCategories,
  listCourseProducts,
  listCourses,
} from "../../courses/api/courses";
import {
  addCourseStoreProducts,
  addRestaurantProducts,
  listStoreMenu,
  setStoreProductStatus,
  sortStoreMenuProducts,
  StoreMenuCategory,
  StoreMenuProduct,
  updateStoreMenuProduct,
} from "./api";

interface DraftProduct {
  key: string;
  title: string;
  price: string;
  file: File | null;
  preview: string;
}

const inputClass =
  "w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#e91818] bg-white";

function newDraft(): DraftProduct {
  return {
    key: `${Date.now()}-${Math.random()}`,
    title: "",
    price: "",
    file: null,
    preview: "",
  };
}

function AddStoreProductsPage() {
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const storeId = searchParams.get("id") || "";
  const storeName = searchParams.get("name") || "المحل";
  const isCourse = searchParams.get("course") === "1";
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeOk, setNoticeOk] = useState(true);

  const [categoryName, setCategoryName] = useState("");
  const [drafts, setDrafts] = useState<DraftProduct[]>([newDraft()]);

  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [categories, setCategories] = useState<CourseCategoryItem[]>([]);
  const [products, setProducts] = useState<CourseProductItem[]>([]);
  const [courseId, setCourseId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [panel, setPanel] = useState<"menu" | "stock">("menu");
  const [menu, setMenu] = useState<StoreMenuCategory[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [editing, setEditing] = useState<StoreMenuProduct | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editMaxCount, setEditMaxCount] = useState("");
  const [busyId, setBusyId] = useState("");
  const [sorting, setSorting] = useState(false);

  const showNotice = (ok: boolean, text: string) => {
    setNoticeOk(ok);
    setNotice(text);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
      router.replace("/dashboard");
      return;
    }
    if (!storeId) {
      router.replace("/dashboard/storelist");
      return;
    }
    setReady(true);
  }, [user, authLoading, router, storeId]);

  const loadMenu = async () => {
    setLoadingMenu(true);
    try {
      const data = await listStoreMenu(storeId);
      if (data.status && Array.isArray(data.result)) {
        setMenu(data.result);
      } else {
        showNotice(false, data.message || "تعذر جلب منتجات المحل");
      }
    } catch {
      showNotice(false, "تعذر الاتصال بالخادم");
    } finally {
      setLoadingMenu(false);
    }
  };

  useEffect(() => {
    if (!ready || !isCourse) return;
    void loadMenu();
  }, [ready, isCourse, storeId]);

  useEffect(() => {
    if (!ready || !isCourse) return;
    setLoadingCourses(true);
    void listCourses()
      .then((data) => {
        const list = data.status && Array.isArray(data.result) ? data.result : [];
        setCourses(list);
        setCourseId(list[0]?.id || "");
      })
      .catch(() => showNotice(false, "تعذر جلب الكورسات"))
      .finally(() => setLoadingCourses(false));
  }, [ready, isCourse]);

  useEffect(() => {
    if (!ready || !isCourse) return;
    if (!courseId) {
      setCategories([]);
      setCategoryId("");
      return;
    }
    setLoadingCategories(true);
    void listCourseCategories(courseId)
      .then((data) => {
        const list = data.status && Array.isArray(data.result) ? data.result : [];
        setCategories(list);
        setCategoryId(list[0]?.id || "");
      })
      .catch(() => showNotice(false, "تعذر جلب التصنيفات"))
      .finally(() => setLoadingCategories(false));
  }, [ready, isCourse, courseId]);

  useEffect(() => {
    if (!ready || !isCourse) return;
    if (!categoryId) {
      setProducts([]);
      return;
    }
    setLoadingProducts(true);
    void listCourseProducts(categoryId)
      .then((data) => {
        setProducts(data.status && Array.isArray(data.result) ? data.result : []);
      })
      .catch(() => showNotice(false, "تعذر جلب المنتجات"))
      .finally(() => setLoadingProducts(false));
  }, [ready, isCourse, categoryId]);

  const updateDraft = (key: string, patch: Partial<DraftProduct>) => {
    setDrafts((current) =>
      current.map((item) => {
        if (item.key !== key) return item;
        if (patch.file && item.preview) URL.revokeObjectURL(item.preview);
        const preview = patch.file ? URL.createObjectURL(patch.file) : item.preview;
        return { ...item, ...patch, preview: patch.file ? preview : item.preview };
      }),
    );
  };

  const removeDraft = (key: string) => {
    setDrafts((current) => {
      const target = current.find((item) => item.key === key);
      if (target?.preview) URL.revokeObjectURL(target.preview);
      const next = current.filter((item) => item.key !== key);
      return next.length > 0 ? next : [newDraft()];
    });
  };

  const saveRestaurant = async (event: FormEvent) => {
    event.preventDefault();
    if (!categoryName.trim()) {
      showNotice(false, "اسم التصنيف مطلوب");
      return;
    }
    if (drafts.some((item) => !item.title.trim() || !item.price.trim() || !item.file)) {
      showNotice(false, "كل منتج يحتاج اسماً وسعراً وصورة");
      return;
    }
    setSaving(true);
    try {
      const data = await addRestaurantProducts(
        storeId,
        categoryName.trim(),
        drafts.map((item) => ({
          title: item.title.trim(),
          price: item.price.trim(),
          currency: "DZD",
          file: item.file as File,
        })),
      );
      if (!data.status) {
        showNotice(false, data.message || "تعذر إضافة المنتجات");
        return;
      }
      showNotice(true, data.message || "تمت إضافة المنتجات");
      setCategoryName("");
      setDrafts([newDraft()]);
    } catch {
      showNotice(false, "تعذر الاتصال بالخادم");
    } finally {
      setSaving(false);
    }
  };

  const saveCourse = async () => {
    const category = categories.find((item) => item.id === categoryId);
    const chosen = products.filter((item) => checked[item.id] && !alreadyInStore(item));
    const repeated = products.filter((item) => checked[item.id] && alreadyInStore(item));
    if (!courseId || !category) {
      showNotice(false, "اختر الكورس والتصنيف");
      return;
    }
    if (chosen.length === 0) {
      showNotice(
        false,
        repeated.length > 0
          ? `موجود من قبل: ${repeated.map((item) => item.productsTitle).join("، ")}`
          : "حدد منتجاً واحداً على الأقل",
      );
      return;
    }
    if (chosen.some((item) => !prices[item.id] || Number(prices[item.id]) <= 0)) {
      showNotice(false, "أدخل سعر البيع لكل منتج محدد");
      return;
    }
    setSaving(true);
    try {
      const data = await addCourseStoreProducts(
        storeId,
        courseId,
        category.catg,
        chosen.map((item) => ({
          title: item.productsTitle,
          price: prices[item.id],
          image: item.prodcutsImage,
          currency: item.currency || "DZD",
          maxCount: item.maxCount || 0,
        })),
      );
      if (!data.status) {
        showNotice(false, data.message || "تعذر إضافة المنتجات");
        return;
      }
      showNotice(true, data.message || "تمت إضافة المنتجات");
      setChecked({});
      void loadMenu();
    } catch {
      showNotice(false, "تعذر الاتصال بالخادم");
    } finally {
      setSaving(false);
    }
  };

  const moveMenuProduct = async (categoryId: string, index: number, direction: -1 | 1) => {
    const category = menu.find((item) => item._id === categoryId);
    if (!category || sorting) return;
    const target = index + direction;
    if (target < 0 || target >= category.products.length) return;
    const previous = menu;
    const nextProducts = [...category.products];
    const [moved] = nextProducts.splice(index, 1);
    nextProducts.splice(target, 0, moved);
    setMenu((current) =>
      current.map((item) => (item._id === categoryId ? { ...item, products: nextProducts } : item)),
    );
    setSorting(true);
    try {
      const data = await sortStoreMenuProducts(
        storeId,
        categoryId,
        nextProducts.map((product) => product._id),
      );
      if (!data.status) {
        setMenu(previous);
        showNotice(false, data.message || "تعذر حفظ الترتيب");
      }
    } catch {
      setMenu(previous);
      showNotice(false, "تعذر الاتصال بالخادم");
    } finally {
      setSorting(false);
    }
  };

  const openEdit = (product: StoreMenuProduct) => {
    setEditing(product);
    setEditTitle(product.title);
    setEditPrice(String(product.price || "").replace(/[^\d]/g, ""));
    setEditMaxCount(product.maxCount && product.maxCount > 0 ? String(product.maxCount) : "");
  };

  const saveEdit = async (event: FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    if (!editTitle.trim() || !editPrice || Number(editPrice) <= 0) {
      showNotice(false, "الاسم والسعر مطلوبان");
      return;
    }
    setSaving(true);
    try {
      const data = await updateStoreMenuProduct(
        storeId,
        editing._id,
        editTitle.trim(),
        editPrice,
        Math.max(0, Math.floor(Number(editMaxCount) || 0)),
      );
      if (!data.status) {
        showNotice(false, data.message || "تعذر تعديل المنتج");
        return;
      }
      setMenu((current) =>
        current.map((category) => ({
          ...category,
          products: category.products.map((product) =>
            product._id === editing._id
              ? {
                  ...product,
                  title: editTitle.trim(),
                  price: editPrice,
                  maxCount: Math.max(0, Math.floor(Number(editMaxCount) || 0)),
                }
              : product,
          ),
        })),
      );
      setEditing(null);
      showNotice(true, data.message || "تم تعديل المنتج");
    } catch {
      showNotice(false, "تعذر الاتصال بالخادم");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (product: StoreMenuProduct) => {
    const nextStatus = product.status === "public" ? "pause" : "public";
    setBusyId(product._id);
    try {
      const data = await setStoreProductStatus(product._id, nextStatus);
      if (!data.status) {
        showNotice(false, data.message || "تعذر تغيير الحالة");
        return;
      }
      setMenu((current) =>
        current.map((category) => ({
          ...category,
          products: category.products.map((item) =>
            item._id === product._id ? { ...item, status: nextStatus } : item,
          ),
        })),
      );
    } catch {
      showNotice(false, "تعذر الاتصال بالخادم");
    } finally {
      setBusyId("");
    }
  };

  const menuGroups = useMemo(() => {
    const groups = new Map<string, { id: string; name: string; categories: StoreMenuCategory[] }>();
    menu.forEach((category) => {
      const key = category.groupId || "other";
      const name = courses.find((item) => item.id === key)?.catg || "بدون كورس";
      const group = groups.get(key) || { id: key, name, categories: [] };
      group.categories.push(category);
      groups.set(key, group);
    });
    return [...groups.values()];
  }, [menu, courses]);

  const alreadyInStore = (item: CourseProductItem) => {
    const stockCategory = categories.find((category) => category.id === categoryId)?.catg || "";
    return menu.some((category) =>
      category.products.some((product) => {
        const sameImage = Boolean(product.image) && product.image === item.prodcutsImage;
        const sameTitle =
          product.title.trim().toLowerCase() === item.productsTitle.trim().toLowerCase() &&
          category.category === stockCategory &&
          category.groupId === courseId;
        return sameImage || sameTitle;
      }),
    );
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
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-black text-gray-800">{storeName}</h2>
          <p className="text-sm text-gray-500 mt-1">
            {isCourse
              ? "منتجات هذا المحل، مع إمكانية تعديل السعر أو إضافة منتجات من المخزون."
              : "مطعم: أنشئ تصنيفاً ثم أضف المنتجات بالاسم والسعر والصورة."}
          </p>
        </div>
        <Link
          href="/dashboard/storelist"
          className="inline-flex items-center gap-1 text-sm font-bold text-gray-500"
        >
          رجوع
          <ArrowRight size={16} />
        </Link>
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

      {isCourse ? (
        <>
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setPanel("menu")}
              className={`px-4 py-2 rounded-xl text-sm font-bold ${
                panel === "menu" ? "bg-[#e91818] text-white" : "bg-white text-gray-600 border border-gray-100"
              }`}
            >
              منتجات المحل
            </button>
            <button
              type="button"
              onClick={() => setPanel("stock")}
              className={`px-4 py-2 rounded-xl text-sm font-bold ${
                panel === "stock" ? "bg-[#e91818] text-white" : "bg-white text-gray-600 border border-gray-100"
              }`}
            >
              إضافة من المخزون
            </button>
          </div>
          {panel === "menu" ? (
            <section className="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm h-[calc(100vh-12rem)] min-h-[36rem] overflow-y-auto">
              {loadingMenu ? (
                <Loader2 className="animate-spin text-gray-300 mx-auto my-8" />
              ) : menu.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-sm text-gray-400 mb-4">لا توجد منتجات في هذا المحل</p>
                  <button
                    type="button"
                    onClick={() => setPanel("stock")}
                    className="text-sm font-bold text-[#e91818]"
                  >
                    إضافة من المخزون
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {menuGroups.map((group) => (
                    <section key={group.id} className="border border-gray-100 rounded-2xl overflow-hidden">
                      <h3 className="bg-red-50 text-[#e91818] font-black px-4 py-3">{group.name}</h3>
                      {group.categories.map((category) => (
                      <div key={category._id} className="px-4 py-4 border-t border-gray-100">
                        <h4 className="font-bold text-gray-800 mb-3">{category.category}</h4>
                        <ul className="space-y-2">
                          {category.products.map((product, index) => (
                            <li
                              key={product._id}
                              className="flex items-center gap-3 p-3 rounded-2xl border border-gray-100"
                            >
                              <span className="w-5 text-center text-[11px] font-black text-red-600">
                                {index + 1}
                              </span>
                              <div className="flex flex-col">
                                <button
                                  type="button"
                                  disabled={sorting || index === 0}
                                  onClick={() => void moveMenuProduct(category._id, index, -1)}
                                  className="text-red-600 disabled:text-gray-200"
                                >
                                  <ArrowUp size={14} />
                                </button>
                                <button
                                  type="button"
                                  disabled={sorting || index === category.products.length - 1}
                                  onClick={() => void moveMenuProduct(category._id, index, 1)}
                                  className="text-red-600 disabled:text-gray-200"
                                >
                                  <ArrowDown size={14} />
                                </button>
                              </div>
                              <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                                {product.image ? (
                                  <img
                                    src={product.image}
                                    alt={product.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : null}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm text-gray-800 leading-6">{product.title}</p>
                                <p className="text-xs text-gray-400">
                                  {product.price} {product.currency || "DZD"}
                                  {product.maxCount && product.maxCount > 0 ? ` · الحد ${product.maxCount}` : ""}
                                  {product.status === "pause" ? " · متوقف" : ""}
                                </p>
                              </div>
                              <button
                                type="button"
                                disabled={busyId === product._id}
                                onClick={() => void toggleStatus(product)}
                                className="p-2 text-gray-400 hover:text-gray-700"
                                title={product.status === "public" ? "إيقاف" : "نشر"}
                              >
                                {product.status === "public" ? <Pause size={16} /> : <Play size={16} />}
                              </button>
                              <button
                                type="button"
                                onClick={() => openEdit(product)}
                                className="p-2 text-gray-400 hover:text-gray-700"
                              >
                                <Pencil size={16} />
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                      ))}
                    </section>
                  ))}
                </div>
              )}
            </section>
          ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          <section className="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm">
            <h3 className="font-black text-gray-800 mb-3">الكورس</h3>
            {loadingCourses ? (
              <Loader2 className="animate-spin text-gray-300 mx-auto my-8" />
            ) : (
              <ul className="space-y-2">
                {courses.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setCourseId(item.id)}
                      className={`w-full text-right p-3 rounded-2xl border font-bold text-sm ${
                        courseId === item.id
                          ? "border-[#e91818] bg-red-50"
                          : "border-gray-100"
                      }`}
                    >
                      {item.catg}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm">
            <h3 className="font-black text-gray-800 mb-3">تصنيف المخزون</h3>
            {loadingCategories ? (
              <Loader2 className="animate-spin text-gray-300 mx-auto my-8" />
            ) : categories.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">لا توجد تصنيفات</p>
            ) : (
              <ul className="space-y-2">
                {categories.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setCategoryId(item.id)}
                      className={`w-full text-right p-3 rounded-2xl border font-bold text-sm ${
                        categoryId === item.id
                          ? "border-[#e91818] bg-red-50"
                          : "border-gray-100"
                      }`}
                    >
                      {item.catg}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm flex flex-col h-[calc(100vh-8rem)] min-h-[40rem]">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <h3 className="font-black text-gray-800">المنتجات</h3>
              <button
                type="button"
                disabled={saving}
                onClick={() => void saveCourse()}
                className="bg-[#e91818] text-white text-sm font-bold px-4 py-2 rounded-xl disabled:opacity-60"
              >
                {saving ? "جارٍ الحفظ..." : "حفظ في المحل"}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pe-1">
              {loadingProducts ? (
                <Loader2 className="animate-spin text-gray-300 mx-auto my-8" />
              ) : products.length === 0 ? (
                <p className="text-sm text-gray-400 py-8 text-center">لا توجد منتجات</p>
              ) : (
                <ul className="space-y-2">
                  {products.map((item) => {
                    const exists = alreadyInStore(item);
                    return (
                    <li
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-2xl border border-gray-100"
                    >
                      <input
                        type="checkbox"
                        checked={!exists && (checked[item.id] || false)}
                        disabled={exists}
                        onChange={(event) =>
                          setChecked((current) => ({
                            ...current,
                            [item.id]: event.target.checked,
                          }))
                        }
                        className="accent-[#e91818] w-4 h-4 disabled:opacity-40"
                      />
                      <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden shrink-0">
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
                        {item.maxCount > 0 ? (
                          <p className="text-[11px] font-bold text-red-600">الحد {item.maxCount}</p>
                        ) : null}
                        {exists ? (
                          <p className="mt-2 text-xs font-bold text-amber-600">موجود من قبل</p>
                        ) : (
                        <input
                          inputMode="numeric"
                          placeholder="سعر البيع"
                          value={prices[item.id] || ""}
                          onChange={(event) =>
                            setPrices((current) => ({
                              ...current,
                              [item.id]: event.target.value.replace(/[^\d]/g, ""),
                            }))
                          }
                          className="mt-2 w-full p-2 border border-gray-200 rounded-lg text-sm"
                        />
                        )}
                      </div>
                    </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        </div>
          )}
          {editing && (
            <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-4">
              <form
                onSubmit={(event) => void saveEdit(event)}
                className="bg-white w-full max-w-md rounded-3xl p-5 shadow-xl"
              >
                <h3 className="font-black text-gray-800 mb-4">تعديل المنتج</h3>
                <label className="block text-xs font-bold text-gray-500 mb-1">الاسم</label>
                <input
                  className={inputClass}
                  value={editTitle}
                  onChange={(event) => setEditTitle(event.target.value)}
                />
                <label className="block text-xs font-bold text-gray-500 mt-3 mb-1">سعر البيع</label>
                <input
                  className={inputClass}
                  inputMode="numeric"
                  value={editPrice}
                  onChange={(event) => setEditPrice(event.target.value.replace(/[^\d]/g, ""))}
                />
                <label className="block text-xs font-bold text-gray-500 mt-3 mb-1">
                  الحد الأقصى للشراء
                </label>
                <input
                  className={inputClass}
                  inputMode="numeric"
                  placeholder="بدون حد"
                  value={editMaxCount}
                  onChange={(event) => setEditMaxCount(event.target.value.replace(/[^\d]/g, ""))}
                  maxLength={3}
                />
                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="flex-1 py-3 rounded-2xl border border-gray-200 font-bold text-sm"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-[#e91818] text-white py-3 rounded-2xl font-bold text-sm disabled:opacity-60"
                  >
                    {saving ? "جارٍ الحفظ..." : "حفظ"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      ) : (
        <form
          onSubmit={(event) => void saveRestaurant(event)}
          className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm"
        >
          <label className="block text-xs font-bold text-gray-500 mb-1">اسم التصنيف</label>
          <input
            className={inputClass}
            value={categoryName}
            onChange={(event) => setCategoryName(event.target.value)}
            placeholder="مثال: أطباق"
            maxLength={80}
          />

          <div className="mt-5 space-y-3">
            {drafts.map((item, index) => (
              <div key={item.key} className="border border-gray-100 rounded-2xl p-3">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-black text-gray-700">منتج {index + 1}</p>
                  <button
                    type="button"
                    onClick={() => removeDraft(item.key)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-[1fr_140px_auto] gap-3 items-center">
                  <input
                    className={inputClass}
                    value={item.title}
                    placeholder="اسم المنتج"
                    onChange={(event) => updateDraft(item.key, { title: event.target.value })}
                  />
                  <input
                    className={inputClass}
                    inputMode="numeric"
                    value={item.price}
                    placeholder="السعر"
                    onChange={(event) =>
                      updateDraft(item.key, {
                        price: event.target.value.replace(/[^\d]/g, ""),
                      })
                    }
                  />
                  <label className="flex items-center gap-2 cursor-pointer">
                    {item.preview ? (
                      <img src={item.preview} alt="" className="w-12 h-12 rounded-xl object-cover" />
                    ) : (
                      <span className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                        <ImagePlus size={18} />
                      </span>
                    )}
                    <span className="text-xs font-bold text-gray-500">صورة</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) =>
                        updateDraft(item.key, { file: event.target.files?.[0] || null })
                      }
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-5">
            <button
              type="button"
              onClick={() => setDrafts((current) => [...current, newDraft()])}
              className="inline-flex items-center gap-1 text-sm font-bold text-[#e91818]"
            >
              <Plus size={16} />
              منتج آخر
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-[#e91818] text-white px-5 py-3 rounded-2xl text-sm font-bold disabled:opacity-60"
            >
              {saving ? "جارٍ الحفظ..." : "حفظ في المطعم"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24 text-gray-400">
          <Loader2 className="animate-spin" />
        </div>
      }
    >
      <AddStoreProductsPage />
    </Suspense>
  );
}
