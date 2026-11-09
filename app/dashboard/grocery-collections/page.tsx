/* eslint-disable @next/next/no-img-element */
"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Loader2, Package, Pencil, Plus, Search, ShoppingBasket, Store, Trash2, X } from "lucide-react";
import { useUser } from "@/app/context/UserContext";
import RoleGuard from "@/app/dashboard/components/RoleGuard";
import {
  addGroceryCollection,
  CARD_MAX_PRODUCTS,
  deleteGroceryCollection,
  GroceryCollectionItem,
  GroceryDisplayType,
  GroceryProductOption,
  GroceryStoreOption,
  listGroceryCollections,
  listGroceryStoreProducts,
  listGroceryStores,
  reorderGroceryCollections,
  updateGroceryCollection,
} from "./api/grocery-collections";

const inputClass =
  "w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#e91818] bg-white";

type GroceryPlacement = "store" | "stores" | "both";

const placementLabels: Record<GroceryPlacement, string> = {
  store: "داخل المتجر",
  stores: "مع المحلات",
  both: "داخل المتجر ومع المحلات",
};

const displayTypeLabels: Record<GroceryDisplayType, string> = {
  horizontal: "أفقية (سحب جانبي)",
  card: `Card (بحد أقصى ${CARD_MAX_PRODUCTS} منتجات)`,
  grid: "شبكة",
};

export default function GroceryCollectionsPage() {
  return (
    <RoleGuard allowedRoles={["super_admin"]}>
      <GroceryCollectionsContent />
    </RoleGuard>
  );
}

function GroceryCollectionsContent() {
  const router = useRouter();
  const [collections, setCollections] = useState<GroceryCollectionItem[]>([]);
  const [stores, setStores] = useState<GroceryStoreOption[]>([]);
  const [products, setProducts] = useState<GroceryProductOption[]>([]);
  const [filterStoreId, setFilterStoreId] = useState("");
  const [formStoreId, setFormStoreId] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState("");
  const [title, setTitle] = useState("");
  const [placement, setPlacement] = useState<GroceryPlacement>("store");
  const [displayType, setDisplayType] = useState<GroceryDisplayType>("horizontal");
  const [groupWithNext, setGroupWithNext] = useState(false);
  const [search, setSearch] = useState("");
  const [loadingCollections, setLoadingCollections] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [reordering, setReordering] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeOk, setNoticeOk] = useState(true);

  const showNotice = (ok: boolean, text: string) => {
    setNoticeOk(ok);
    setNotice(text);
  };

  const loadCollections = useCallback(async (storeId: string) => {
    setLoadingCollections(true);
    try {
      const data = await listGroceryCollections(storeId);
      if (data.status && Array.isArray(data.result)) {
        setCollections(data.result);
      } else {
        showNotice(false, data.message || "تعذر جلب القوائم");
      }
    } catch {
      showNotice(false, "تعذر الاتصال بالخادم");
    } finally {
      setLoadingCollections(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await listGroceryStores();
        if (!active) return;
        if (data.status && Array.isArray(data.result)) {
          setStores(data.result);
        } else {
          showNotice(false, data.message || "تعذر جلب متاجر Grocery");
        }
        await loadCollections("");
      } catch {
        if (active) showNotice(false, "تعذر الاتصال بالخادم");
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [loadCollections]);

  useEffect(() => {
    let active = true;
    if (!formStoreId) {
      setProducts([]);
      return;
    }
    setLoadingProducts(true);
    listGroceryStoreProducts(formStoreId)
      .then((data) => {
        if (!active) return;
        if (data.status && Array.isArray(data.result)) {
          setProducts(data.result);
          const available = new Set(data.result.map((product) => product.id));
          setSelectedIds((current) => current.filter((id) => available.has(id)));
        } else {
          setProducts([]);
          showNotice(false, data.message || "تعذر جلب منتجات المتجر");
        }
      })
      .catch(() => {
        if (active) showNotice(false, "تعذر الاتصال بالخادم");
      })
      .finally(() => {
        if (active) setLoadingProducts(false);
      });
    return () => {
      active = false;
    };
  }, [formStoreId]);

  const resetForm = () => {
    setEditingId("");
    setTitle("");
    setPlacement("store");
    setDisplayType("horizontal");
    setGroupWithNext(false);
    setFormStoreId("");
    setSelectedIds([]);
    setSearch("");
  };

  const openEditor = (item: GroceryCollectionItem) => {
    setEditingId(item.id);
    setTitle(item.title);
    setPlacement(item.placement);
    setDisplayType(item.displayType || "horizontal");
    setGroupWithNext(Boolean(item.groupWithNext));
    setFormStoreId(item.storeId);
    setSelectedIds(item.productIds);
    setSearch("");
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !formStoreId || selectedIds.length === 0) {
      showNotice(false, "أدخل العنوان واختر المتجر ومنتجاً واحداً على الأقل");
      return;
    }
    if (displayType === "card" && selectedIds.length > CARD_MAX_PRODUCTS) {
      showNotice(false, `قائمة Card لا تحتوي على أكثر من ${CARD_MAX_PRODUCTS} منتجات`);
      return;
    }
    setSaving(true);
    try {
      const params = {
        title: title.trim(),
        storeId: formStoreId,
        productIds: selectedIds,
        placement,
        displayType,
        groupWithNext: displayType === "card" && groupWithNext,
      };
      const data = editingId
        ? await updateGroceryCollection({ id: editingId, ...params })
        : await addGroceryCollection(params);
      if (!data.status) {
        showNotice(false, data.message || "تعذر حفظ القائمة");
        return;
      }
      showNotice(true, data.message || "تم حفظ القائمة");
      resetForm();
      await loadCollections(filterStoreId);
    } catch {
      showNotice(false, "تعذر الاتصال بالخادم");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: GroceryCollectionItem) => {
    if (!window.confirm(`حذف قائمة «${item.title}»؟ لن تُحذف منتجات المتجر.`)) return;
    setDeletingId(item.id);
    try {
      const data = await deleteGroceryCollection(item.id);
      if (!data.status) {
        showNotice(false, data.message || "تعذر حذف القائمة");
        return;
      }
      if (editingId === item.id) resetForm();
      showNotice(true, data.message || "تم حذف القائمة");
      await loadCollections(filterStoreId);
    } catch {
      showNotice(false, "تعذر الاتصال بالخادم");
    } finally {
      setDeletingId("");
    }
  };

  // تحريك قائمة موضعاً واحداً (direction = -1 للأعلى، 1 للأسفل) وحفظ الترتيب في الخادم.
  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (reordering || target < 0 || target >= collections.length) return;
    const previous = collections;
    const next = [...collections];
    [next[index], next[target]] = [next[target], next[index]];
    setCollections(next);
    setReordering(true);
    try {
      const data = await reorderGroceryCollections(next.map((item) => item.id));
      if (!data.status) {
        setCollections(previous);
        showNotice(false, data.message || "تعذر حفظ الترتيب");
      }
    } catch {
      setCollections(previous);
      showNotice(false, "تعذر الاتصال بالخادم");
    } finally {
      setReordering(false);
    }
  };

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;
    return products.filter((product) => product.title.toLowerCase().includes(query));
  }, [products, search]);

  return (
    <div className="max-w-7xl mx-auto" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 text-[#e91818] font-black">
            <ShoppingBasket size={24} />
            <h2 className="text-xl">قوائم Grocery</h2>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            أنشئ قوائم مثل الأكثر مبيعاً، واختر منتجات حقيقية من متجر واحد لكل قائمة.
          </p>
        </div>
        <button type="button" onClick={resetForm} className="inline-flex items-center gap-2 bg-[#e91818] text-white px-4 py-2.5 rounded-xl text-sm font-bold">
          <Plus size={17} />
          قائمة جديدة
        </button>
      </div>

      {notice && (
        <div className={`mb-4 px-4 py-3 rounded-2xl text-sm font-bold border ${noticeOk ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"}`}>
          {notice}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[390px_1fr] gap-5 items-start">
        <form onSubmit={(event) => void save(event)} className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-gray-800">{editingId ? "تعديل القائمة" : "إنشاء قائمة"}</h3>
            {editingId && (
              <button type="button" onClick={resetForm} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
            )}
          </div>

          <label className="block text-xs font-bold text-gray-500 mb-1">عنوان القائمة</label>
          <input className={inputClass} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="مثال: الأكثر مبيعاً" maxLength={120} required />

          <label className="block text-xs font-bold text-gray-500 mt-4 mb-1">متجر Grocery</label>
          <select
            className={inputClass}
            value={formStoreId}
            onChange={(event) => {
              setFormStoreId(event.target.value);
              setSelectedIds([]);
            }}
            required
          >
            <option value="">اختر المتجر</option>
            {stores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}
          </select>

          <label className="block text-xs font-bold text-gray-500 mt-4 mb-1">مكان العرض</label>
          <select
            className={inputClass}
            value={placement}
            onChange={(event) => setPlacement(event.target.value as GroceryPlacement)}
          >
            <option value="store">داخل المتجر فقط</option>
            <option value="stores">مع قائمة المحلات فقط</option>
            <option value="both">داخل المتجر ومع المحلات</option>
          </select>

          <label className="block text-xs font-bold text-gray-500 mt-4 mb-1">نوع ظهور القائمة</label>
          <select
            className={inputClass}
            value={displayType}
            onChange={(event) => {
              const next = event.target.value as GroceryDisplayType;
              setDisplayType(next);
              if (next !== "card") setGroupWithNext(false);
              if (next === "card") setSelectedIds((current) => current.slice(0, CARD_MAX_PRODUCTS));
            }}
          >
            {(Object.keys(displayTypeLabels) as GroceryDisplayType[]).map((type) => (
              <option key={type} value={type}>{displayTypeLabels[type]}</option>
            ))}
          </select>

          {displayType === "card" && (
            <label className="flex items-start gap-2 mt-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={groupWithNext}
                onChange={(event) => setGroupWithNext(event.target.checked)}
                className="accent-[#e91818] mt-0.5"
              />
              <span className="text-xs text-gray-600">
                <span className="block font-bold text-gray-700">تظهر مع القائمة التالية في نفس الصف</span>
                تُعرض هذه القائمة بجانب القائمة التالية مباشرة (حسب الترتيب) في صف واحد، بشرط أن تكون القائمة التالية Card أيضاً.
                الجمع في صف واحد خاص بقوائم Card فقط، أما الأفقية والشبكة فتأخذان صفاً كاملاً.
              </span>
            </label>
          )}

          {formStoreId && (
            <>
              <div className="flex items-center justify-between mt-4 mb-2">
                <label className="text-xs font-bold text-gray-500">منتجات المتجر</label>
                <span className="text-xs font-bold text-[#e91818]">
                  تم اختيار {selectedIds.length}
                  {displayType === "card" ? ` / ${CARD_MAX_PRODUCTS}` : ""}
                </span>
              </div>
              <div className="relative mb-2">
                <Search size={16} className="absolute right-3 top-3.5 text-gray-400" />
                <input className={`${inputClass} pr-9`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="بحث في المنتجات" />
              </div>
              <div className="max-h-96 overflow-y-auto border border-gray-100 rounded-2xl p-2 space-y-1">
                {loadingProducts ? (
                  <Loader2 className="animate-spin text-gray-300 mx-auto my-8" />
                ) : filteredProducts.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">لا توجد منتجات مطابقة</p>
                ) : (
                  filteredProducts.map((product) => {
                    const checked = selectedIds.includes(product.id);
                    return (
                      <label key={product.id} className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer border ${checked ? "border-red-200 bg-red-50" : "border-transparent hover:bg-gray-50"}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            if (!checked && displayType === "card" && selectedIds.length >= CARD_MAX_PRODUCTS) {
                              showNotice(false, `قائمة Card لا تحتوي على أكثر من ${CARD_MAX_PRODUCTS} منتجات`);
                              return;
                            }
                            setSelectedIds((current) => checked ? current.filter((id) => id !== product.id) : [...current, product.id]);
                          }}
                          className="accent-[#e91818]"
                        />
                        <span className="w-11 h-11 shrink-0 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden">
                          {product.image ? <img src={product.image} alt="" className="w-full h-full object-contain" /> : <Package size={18} className="text-gray-300" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-bold text-gray-700 truncate">{product.title}</span>
                          <span className="block text-xs text-gray-400">{product.price} {product.currency}</span>
                        </span>
                        {product.status !== "public" && <span className="text-[10px] text-amber-600">موقوف</span>}
                      </label>
                    );
                  })
                )}
              </div>
            </>
          )}

          <button type="submit" disabled={saving} className="mt-4 w-full bg-[#e91818] text-white py-3 rounded-2xl font-bold disabled:opacity-60">
            {saving ? "جارٍ الحفظ..." : editingId ? "حفظ التعديلات" : "إضافة القائمة"}
          </button>
        </form>

        <section>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <h3 className="font-black text-gray-800">القوائم المنشورة</h3>
            <select
              className="p-2.5 border border-gray-200 rounded-xl text-sm bg-white min-w-48"
              value={filterStoreId}
              onChange={(event) => {
                const value = event.target.value;
                setFilterStoreId(value);
                void loadCollections(value);
              }}
            >
              <option value="">كل متاجر Grocery</option>
              {stores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}
            </select>
          </div>

          {loadingCollections ? (
            <div className="bg-white rounded-3xl border border-gray-100 py-16"><Loader2 className="animate-spin text-gray-300 mx-auto" /></div>
          ) : collections.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-gray-200 py-16 text-center">
              <Store className="mx-auto text-gray-300 mb-3" size={30} />
              <p className="text-sm text-gray-400">لا توجد قوائم لهذا الاختيار</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {collections.map((item, index) => (
                <article key={item.id} className="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center shrink-0">
                      <button
                        type="button"
                        disabled={reordering || index === 0}
                        onClick={() => void move(index, -1)}
                        className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                        title="تقديم"
                      >
                        <ArrowUp size={15} />
                      </button>
                      <span className="w-6 h-6 rounded-full bg-[#e91818] text-white text-xs font-black flex items-center justify-center">
                        {index + 1}
                      </span>
                      <button
                        type="button"
                        disabled={reordering || index === collections.length - 1}
                        onClick={() => void move(index, 1)}
                        className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                        title="تأخير"
                      >
                        <ArrowDown size={15} />
                      </button>
                    </div>
                    <span className="w-11 h-11 rounded-full bg-gray-50 overflow-hidden flex items-center justify-center shrink-0">
                      {item.storeImage ? <img src={item.storeImage} alt="" className="w-full h-full object-cover" /> : <Store size={19} className="text-gray-300" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-black text-gray-800 truncate">{item.title}</h4>
                      <p className="text-xs text-gray-400 truncate">{item.storeName} · {item.products.length} منتجات · {placementLabels[item.placement]}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {displayTypeLabels[item.displayType || "horizontal"]}
                        </span>
                        {item.groupWithNext && (
                          <span className="text-[10px] font-bold bg-red-50 text-[#e91818] px-2 py-0.5 rounded-full">
                            مع القائمة التالية
                          </span>
                        )}
                      </div>
                    </div>
                    <button type="button" onClick={() => openEditor(item)} className="p-2 text-gray-400 hover:text-gray-700" title="تعديل">
                      <Pencil size={16} />
                    </button>
                    <button type="button" disabled={deletingId === item.id} onClick={() => void remove(item)} className="p-2 text-gray-400 hover:text-red-600 disabled:opacity-40" title="حذف">
                      {deletingId === item.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  </div>
                  <div className="flex gap-2 mt-4 overflow-hidden">
                    {item.products.slice(0, 4).map((product) => (
                      <div key={product.id} className="min-w-0 flex-1 text-center">
                        <div className="h-16 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden">
                          {product.image ? <img src={product.image} alt={product.title} className="w-full h-full object-contain" /> : <Package size={18} className="text-gray-300" />}
                        </div>
                        <p className="text-[10px] text-gray-500 truncate mt-1">{product.title}</p>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}


