"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Menu, Plus, X, Pencil, Trash2, GripVertical } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useCategories } from "@/app/context/CategoryContext";
import { addCatg, deleteCatg, updateCatg } from "../api/GetProducts";
import { Category } from "@/app/types/Orders";
import { ParsedUrlQueryInput } from "querystring";

export default function Drawer() {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [ready, setReady] = useState(false);

  // States الخاصة بالنافذة المنبثقة (Modal) للإضافة والتعديل
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isOffer, setIsOffer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const router = useRouter();
  const orderId = searchParams?.get("orderId");
  const validOrderId = id as string;

  const { categories, loading, fetchCategories, order, isCategoryDeletable } = useCategories();

  // حالة محلية للفئات لكي تتحدث الواجهة (UI) فوراً عند السحب والإفلات
  const [localCategories, setLocalCategories] = useState<Category[]>([]);
  
  // مراجع لتتبع العنصر الذي يتم سحبه (سواء بالماوس أو باللمس)
  const draggedItemIndex = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // تحديث الحالة المحلية كلما جلبنا الفئات من الـ Context مع فصل دقيق للعروض
  useEffect(() => {
    if (categories) {
      const offers = categories.filter((cat) => cat.offer === true);
      const normals = categories.filter((cat) => !cat.offer);
      setLocalCategories([...offers, ...normals]);
    }
  }, [categories]);

  const [isActive, setIsActive] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const categoryId = searchParams.get("categoryId") ?? "";
  const activeCategoryId = categoryId;

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setOpen(true);
      else setOpen(false);
      setReady(true);
    };

    handleResize();
    fetchCategories(validOrderId, orderId);
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, [ready]);

  const isDrawerOpen = isMobile ? open : true;

  const handleOpenAddModal = () => {
    setModalMode("add");
    setNewCategoryName("");
    setIsOffer(false);
    setEditingCategoryId(null);
    setShowModal(true);
  };

  // دالة مشتركة لتنفيذ عملية إعادة الترتيب
  const moveItem = (sourceIndex: number, targetIndex: number) => {
    if (sourceIndex === targetIndex || sourceIndex < 0 || targetIndex < 0 || targetIndex >= localCategories.length) return;

    const updatedList = [...localCategories];
    const [movedItem] = updatedList.splice(sourceIndex, 1);
    updatedList.splice(targetIndex, 0, movedItem);

    setLocalCategories(updatedList);
  };

  // دوال التعامل مع الماوس (Desktop Drag and Drop)
  const handleDragStart = (index: number) => {
    draggedItemIndex.current = index;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (targetIndex: number) => {
    const sourceIndex = draggedItemIndex.current;
    if (sourceIndex !== null) {
      moveItem(sourceIndex, targetIndex);
    }
    draggedItemIndex.current = null;
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    draggedItemIndex.current = null;
    setDragOverIndex(null);
  };

  // دوال التعامل مع اللمس (Mobile Touch Drag and Drop)
  const handleTouchStart = (index: number) => {
    draggedItemIndex.current = index;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const targetItem = element?.closest("[data-index]");
    if (targetItem) {
      const targetIndex = Number(targetItem.getAttribute("data-index"));
      if (!isNaN(targetIndex)) {
        setDragOverIndex(targetIndex);
      }
    }
  };

  const handleTouchEnd = () => {
    const sourceIndex = draggedItemIndex.current;
    const targetIndex = dragOverIndex;
    if (sourceIndex !== null && targetIndex !== null) {
      moveItem(sourceIndex, targetIndex);
    }
    draggedItemIndex.current = null;
    setDragOverIndex(null);
  };

  const handleConfirmSaveCategory = async () => {
    if (!newCategoryName.trim()) {
      alert("الرجاء إدخال اسم الفئة أولاً");
      return;
    }

    try {
      setIsSubmitting(true);

      if (modalMode === "add") {
        const response = await addCatg(id, newCategoryName, isOffer);
        await fetchCategories(validOrderId, orderId);

        const newId = response?._id || response?.data?._id || response?.result?._id;

        if (newId) {
          const queryParams: Record<string, string> = {
            id: id,
            categoryId: newId,
          };

          if (orderId) {
            queryParams.orderId = orderId;
          }

          const searchParams = new URLSearchParams(queryParams);
          const url = `/store/details/products/details?${searchParams.toString()}`;
          router.push(url);
        }
      } else if (modalMode === "edit" && editingCategoryId) {
        await updateCatg(
          id,
          editingCategoryId,
          isActive,
          newCategoryName,
          isOffer,
        );
        await fetchCategories(validOrderId, orderId);
      }

      setNewCategoryName("");
      setShowModal(false);
    } catch (error) {
      console.error("حدث خطأ أثناء معالجة الفئة:", error);
      alert("فشلت العملية، يرجى المحاولة لاحقاً");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditModal = (cat: Category) => {
    setModalMode("edit");
    setEditingCategoryId(cat._id);
    setNewCategoryName(cat.category);
    setIsOffer(cat.offer || false);
    setIsActive(cat.status == "public");
    setShowModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;

    try {
      setIsSubmitting(true);

      const isDeletingActiveCategory =
        String(categoryToDelete._id) === String(activeCategoryId);

      let fallbackCategoryId: string | null = null;
      if (isDeletingActiveCategory && localCategories.length > 1) {
        const currentIndex = localCategories.findIndex(
          (cat) => cat._id === categoryToDelete._id,
        );

        if (currentIndex > 0) {
          fallbackCategoryId = localCategories[currentIndex - 1]._id;
        } else {
          fallbackCategoryId = localCategories[currentIndex + 1]._id;
        }
      }

      await deleteCatg(categoryToDelete._id);
      await fetchCategories(validOrderId, orderId);

      setShowDeleteModal(false);
      setCategoryToDelete(null);

      if (isDeletingActiveCategory) {
        const queryParams: Record<string, string> = {
          id: id,
        };
        if (fallbackCategoryId) queryParams.categoryId = fallbackCategoryId;
        if (orderId) queryParams.orderId = orderId;

        const searchParams = new URLSearchParams(queryParams);
        const url = `/store/details/products/details?${searchParams.toString()}`;
        router.push(url);
      }
    } catch (error) {
      console.error("حدث خطأ أثناء الحذف:", error);
      alert("فشلت عملية الحذف");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = (cat: Category, e: React.MouseEvent) => {
    e.preventDefault();
    const hasProducts = cat.products && cat.products.length > 0;

    if (hasProducts) {
      alert(
        "لا يمكن حذف هذه الفئة لأنها تحتوي على منتجات نشطة. قم بنقل أو حذف المنتجات أولاً.",
      );
      return;
    }

    setCategoryToDelete(cat);
    setShowDeleteModal(true);
  };

  if (loading)
    return (
      <div className="p-4 flex justify-center items-center h-full w-full text-gray-600">
        ⏳ Chargement...
      </div>
    );

  return (
    <>
      {/* زر الموبايل فقط */}
      {isMobile && (
        <button
          onClick={() => setOpen(true)}
          className={`fixed top-4 left-4 z-50 bg-white p-2 rounded-full shadow transition-opacity duration-200
          ${open ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        >
          <Menu size={24} className="text-red-600" />
        </button>
      )}

      {/* Overlay للموبايل */}
      {isMobile && isDrawerOpen && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/40 z-10"
        />
      )}

      {/* Drawer */}
      {ready && (
        <aside
          className={`
              fixed top-0 left-0 h-screen w-64 z-30
              bg-red-600 text-white border-r border-gray-200
              transform transition-transform duration-300 flex flex-col justify-between
              ${isDrawerOpen ? "translate-x-0" : "-translate-x-full"}
      `}
        >
          <div className="overflow-y-auto flex-1 text-right">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-sm font-bold text-gray-100 tracking-wide">
                القوائم والفئات (اسحب للترتيب)
              </h2>
            </div>

            <nav className="flex flex-col gap-1.5 p-3">
              {localCategories.map((cat, index) => {
                const isMatched = order?.listOrder.some(
                  (item) => item.category === cat.category,
                );

                const queryParams: ParsedUrlQueryInput = {
                  id: id,
                  categoryId: cat._id,
                };

                if (orderId) {
                  queryParams.orderId = orderId;
                }

                const isSelected = String(cat._id) === String(activeCategoryId);
                const isOver = dragOverIndex === index;
                const canDelete = isCategoryDeletable(cat._id);

                return (
                  <div
                    key={cat._id}
                    data-index={index}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={() => handleDrop(index)}
                    onDragEnd={handleDragEnd}
                    onTouchStart={() => handleTouchStart(index)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    className={`relative group transition-all duration-200 select-none touch-none ${
                      isOver ? "border-t-2 border-white pt-1" : ""
                    }`}
                  >
                    <Link
                      href={{
                        pathname: `/store/details/products/details`,
                        query: queryParams,
                      }}
                      className={`block w-full text-right py-3 pl-24 pr-10 rounded-xl transition-all duration-200 truncate ${
                        isSelected
                          ? "bg-amber-500 text-white font-bold"
                          : isMatched
                            ? "bg-orange-700 text-white font-bold"
                            : "hover:bg-red-500 text-white"
                      } ${cat.status == "pause" ? "opacity-50" : ""}`}
                    >
                      {/* عرض اسم الفئة في سطر واحد كامل */}
                      <span className="block truncate" title={cat.category}>
                        {cat.category}
                      </span>
                    </Link>

                    {/* مقبض السحب (Drag Handle) يدعم الماوس واللمس في أقصى اليسار */}
                    <div 
                      title="اضغط واسحب لترتيب الفئة"
                      className="absolute left-1.5 top-3 p-1 text-red-200 hover:text-white cursor-grab active:cursor-grabbing flex items-center"
                    >
                      <GripVertical size={16} />
                    </div>

                    {/* أزرار التعديل والحذف الجانبية */}
                    <div className="absolute left-7 top-3 flex items-center gap-0.5 bg-red-700/80 backdrop-blur-xs px-1 py-0.5 rounded-lg shadow-sm">
                      {/* زر التعديل */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleOpenEditModal(cat);
                        }}
                        title="تعديل الاسم"
                        className="p-1 text-blue-200 hover:bg-blue-800 rounded transition"
                      >
                        <Pencil size={13} />
                      </button>

                      {/* زر الحذف يظهر فقط إذا كان متاحاً */}
                      {canDelete && (
                        <button
                          onClick={(e) => handleDeleteCategory(cat, e)}
                          title="حذف الفئة"
                          className="p-1 text-white hover:bg-red-900 rounded transition"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </nav>
          </div>

          {/* القسم السفلي الثابت */}
          <div className="p-4 border-t border-red-600 bg-red-600">
            <button
              onClick={handleOpenAddModal}
              className="flex items-center justify-center gap-2 w-full py-3 px-4 
                       bg-linear-to-r from-gray-200 to-gray-100
                       hover:from-red-600 hover:to-red-600 
                       text-black font-bold rounded-xl shadow-md 
                       hover:shadow-lg active:scale-[0.98] 
                       transition-all duration-200 text-sm"
            >
              <Plus size={18} />
              <span>إضافة فئة جديدة</span>
            </button>
          </div>
        </aside>
      )}

      {/* نافذة تأكيد الحذف */}
      {showDeleteModal && categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 text-right">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => {
              if (!isSubmitting) setShowDeleteModal(false);
            }}
          />
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl z-10 border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <div className="text-center mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                تأكيد حذف الفئة
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed px-2">
                هل أنت متأكد تماماً من حذف فئة{" "}
                <span className="font-bold text-gray-800">
                  &quot;{categoryToDelete.category}&quot;
                </span>{" "}
                ؟
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                disabled={isSubmitting}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 text-sm"
              >
                {isSubmitting ? "جاري الحذف..." : "نعم، احذف الفئة"}
              </button>
              <button
                disabled={isSubmitting}
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 px-4 bg-gray-150 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition text-sm text-center"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* النافذة المنبثقة المشتركة (للإضافة والتعديل) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 text-right">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => {
              if (!isSubmitting) setShowModal(false);
            }}
          />

          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl z-10 border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center flex-row-reverse border-b pb-3 mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                {modalMode === "add"
                  ? "إضافة فئة منتجات جديدة"
                  : "تعديل اسم الفئة"}
              </h3>
              <button
                disabled={isSubmitting}
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-2 mb-6">
              <label className="block text-sm font-semibold text-gray-600">
                اسم الفئة <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                disabled={isSubmitting}
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="مثال: مشويات، بيتزا، مشروبات..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition text-sm bg-gray-50 text-black"
                dir="rtl"
                autoFocus
              />
            </div>

            {/* خيار تعيين كـ عرض خاص */}
            <div className="mb-4 bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-center justify-between flex-row-reverse">
              <div className="text-right">
                <label
                  className="block text-sm font-bold text-gray-700 cursor-pointer"
                  htmlFor="offer-checkbox"
                >
                  تعيين كـ عرض خاص (Offer)
                </label>
                <span className="text-xs text-gray-400">
                  تفعيل هذا الخيار يضع الفئة في قسم العروض
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="offer-checkbox"
                  disabled={isSubmitting}
                  checked={isOffer}
                  onChange={(e) => setIsOffer(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
              </label>
            </div>

            {/* خيار حالة الفئة نشطة */}
            <div className="mb-6 bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-center justify-between flex-row-reverse">
              <div className="text-right">
                <label
                  className="block text-sm font-bold text-gray-700 cursor-pointer"
                  htmlFor="active-checkbox"
                >
                  حالة الفئة (نشطة)
                </label>
                <span className="text-xs text-gray-400">
                  إيقاف هذا الخيار يخفي الفئة ومنتجاتها مؤقتاً
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="active-checkbox"
                  disabled={isSubmitting}
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
              </label>
            </div>

            {/* أزرار التحكم */}
            <div className="flex gap-3 justify-start">
              <button
                disabled={isSubmitting}
                onClick={handleConfirmSaveCategory}
                className="flex-1 py-2.5 px-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow transition disabled:opacity-50 text-sm"
              >
                {isSubmitting
                  ? "جاري الحفظ..."
                  : modalMode === "add"
                    ? "تأكيد الإضافة"
                    : "حفظ التعديلات"}
              </button>

              <button
                disabled={isSubmitting}
                onClick={() => setShowModal(false)}
                className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold rounded-xl transition text-sm"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}