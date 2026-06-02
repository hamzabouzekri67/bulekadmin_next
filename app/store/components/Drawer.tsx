"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, Plus, X, Pencil, Trash2 } from "lucide-react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useCategories } from "@/app/context/CategoryContext";
import { addCatg, deleteCatg, updateCatg } from "../api/GetProducts";
import { Category } from "@/app/types/Orders";

export default function Drawer() {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [ready, setReady] = useState(false);

  // States الخاصة بالنافذة المنبثقة (Modal) للإضافة والتعديل
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null,
  );
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isOffer, setIsOffer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { id } = useParams();
  const params = useParams();
  const router = useRouter();
  const SearchParams = useSearchParams();
  const orderId = SearchParams?.get("orderId");
  const validOrderId = id as string;

  const { categories, loading, fetchCategories, order } = useCategories();

  const [isActive, setIsActive] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null,
  );

  // 🛠️ جلب الـ ID النشط من الرابط (تأكد أن اسم المتغير هنا يطابق اسم المجلد لديك مثل [catId] أو [categoryId])
  // إذا كان اسم مجلد الفئة عندك مختلفاً، استبدل params.catId باسم المجلد الصحيح.
  const activeCategoryId = params?._id;

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

  // فتح المودال في وضع الإضافة
  const handleOpenAddModal = () => {
    setModalMode("add");
    setNewCategoryName("");
    setIsOffer(false);
    setEditingCategoryId(null);
    setShowModal(true);
  };

  // دالة حفظ الفئة والانتقال إليها مباشرة
  const handleConfirmSaveCategory = async () => {
    if (!newCategoryName.trim()) {
      alert("الرجاء إدخال اسم الفئة أولاً");
      return;
    }

    try {
      setIsSubmitting(true);

      if (modalMode === "add") {
        const response = await addCatg(id, newCategoryName, isOffer);
        console.log("تمت إضافة الفئة بنجاح");

        await fetchCategories(validOrderId, orderId);

        const newId =
          response?._id || response?.data?._id || response?.result?._id;

        if (newId) {
          router.push(
            `/store/${id}/products/${newId}${orderId ? `?orderId=${orderId}` : ""}`,
          );
        }
      } else if (modalMode === "edit" && editingCategoryId) {
        await updateCatg(
          id,
          editingCategoryId,
          isActive,
          newCategoryName,
          isOffer,
        );
        console.log("تم تعديل الفئة بنجاح");
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

      // 1. تحديد ما إذا كنا نحذف الفئة النشطة مفتوحة الرابط حالياً
      const isDeletingActiveCategory =
        String(categoryToDelete._id) === String(activeCategoryId);

      // 2. البحث عن فئة بديلة للانتقال إليها قبل إتمام الحذف
      let fallbackCategoryId: string | null = null;
      if (isDeletingActiveCategory && categories.length > 1) {
        const currentIndex = categories.findIndex(
          (cat) => cat._id === categoryToDelete._id,
        );

        if (currentIndex > 0) {
          // الفئة السابقة (إذا لم تكن الفئة المحذوفة هي الأولى)
          fallbackCategoryId = categories[currentIndex - 1]._id;
        } else {
          // الفئة التالية (إذا كانت الفئة المحذوفة هي الأولى في القائمة)
          fallbackCategoryId = categories[currentIndex + 1]._id;
        }
      }

      // 3. تنفيذ عملية الحذف في السيرفر
      await deleteCatg(categoryToDelete._id);
      console.log("تم حذف الفئة بنجاح");

      // 4. تحديث البيانات في الـ Context
      await fetchCategories(validOrderId, orderId);

      setShowDeleteModal(false);
      setCategoryToDelete(null);

      // 5. توجيه المستخدم تلقائياً بناءً على موقعه
      if (isDeletingActiveCategory) {
        if (fallbackCategoryId) {
          // الانتقال للفئة البديلة (السابقة أو التالية)
          router.push(
            `/store/${id}/products/${fallbackCategoryId}${orderId ? `?orderId=${orderId}` : ""}`,
          );
        } else {
          // إذا كانت هذه آخر فئة في المتجر وتم حذفها، نرجع لصفحة المنتجات العامة
          router.push(
            `/store/${id}/products${orderId ? `?orderId=${orderId}` : ""}`,
          );
        }
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
                القوائم والفئات
              </h2>
            </div>

            <nav className="flex flex-col gap-1.5 p-3">
              {categories.map((cat) => {
                const isMatched = order?.listOrder.some(
                  (item) => item.category === cat.category,
                );

                // 🌟 فحص ما إذا كانت هذه الفئة هي النشطة حالياً في المتصفح
                const isSelected = String(cat._id) === String(activeCategoryId);
                const isDeletable = !cat.products || cat.products.length === 0;

                return (
                  <div key={cat._id} className="relative group">
                    <Link
                      href={{
                        pathname: `/store/${id}/products/${cat._id}`,
                        query: orderId ? { orderId: orderId } : undefined,
                      }}
                      // 🌟 تغيير اللون بناءً على حالة التحديد فقط
                      className={`block w-full text-right py-2.5 pl-20 pr-3 rounded-xl transition-all duration-200 ${
                        isSelected
                          ? "bg-amber-500 text-white font-bold"
                          : isMatched
                            ? "bg-orange-700 text-white font-bold"
                            : "hover:bg-red-500 text-white"
                      } ${cat.status == "pause" ? "opacity-50" : ""}`}
                    >
                      <div className="flex justify-between items-center flex-row-reverse">
                        <span>{cat.category}</span>
                      </div>
                    </Link>

                    {/* أزرار التحكم الجانبية */}
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleOpenEditModal(cat);
                        }}
                        title="تعديل الاسم"
                        className="p-1 text-blue-200 hover:bg-blue-700 rounded-md transition"
                      >
                        <Pencil size={14} />
                      </button>

                      <button
                        onClick={(e) => handleDeleteCategory(cat, e)}
                        title={
                          isDeletable
                            ? "حذف الفئة"
                            : "لا يمكن الحذف (تحتوي على منتجات)"
                        }
                        className={`p-1 rounded-md transition ${isDeletable ? "text-white hover:bg-red-800" : "text-red-400/40 cursor-not-allowed"}`}
                      >
                        <Trash2 size={14} />
                      </button>
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
                disabled={
                  isSubmitting ||
                  (modalMode === "edit" &&
                    categories
                      .find((cat) => cat._id === editingCategoryId)
                      ?.category.trim() === newCategoryName.trim() &&
                    categories.find((cat) => cat._id === editingCategoryId)
                      ?.offer === isOffer &&
                    (categories.find((cat) => cat._id === editingCategoryId)
                      ?.status ==
                      "public") ===
                      isActive)
                }
                onClick={handleConfirmSaveCategory}
                className="flex-1 py-2.5 px-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow transition disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400 text-sm"
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
