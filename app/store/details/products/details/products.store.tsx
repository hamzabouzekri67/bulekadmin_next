/* eslint-disable @next/next/no-img-element */
"use client";

import { useCategories } from "@/app/context/CategoryContext";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useMemo, Suspense } from "react";
import { updateProducts, updateStatusProducts } from "./api/UpdateOrder";
import {
  ArrowDown,
  ArrowUp,
  Edit2,
  Edit3,
  MoreVertical,
  Pause,
  Play,
  PlusCircle,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import Image from "next/image";
import { FloatingCart, QuantitySelector } from "./handler_quantity";
import { Product, Supplement } from "@/app/types/Orders";
import { useUser } from "@/app/context/UserContext";

interface SupplementItem {
  _id?: string;
  name: string;
  plusPrice: string | number;
}

interface NewSupplementType {
  _id: string;
  title: string;
  chose: string;
  data: SupplementItem[];
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductsStore />
    </Suspense>
  );
}

export function ProductsStore() {
  //  const { _id, id } = useParams();

  console.log("localProducts");

  const { user } = useUser();
  const { categories, order, cartItems, fetchCategories } = useCategories();
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("categoryId");
  const orderId = searchParams?.get("orderId") ?? "";
  const id = searchParams.get("id");

  const category = categories.find((c) => c._id === categoryId);
  const [localProducts, setLocalProducts] = useState<Product[]>(
    category?.products || [],
  );

  const [openedProductId, setOpenedProductId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [showProductModal, setShowProductModal] = useState(false);
  const [productModalMode, setProductModalMode] = useState<"add" | "edit">(
    "add",
  );
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const [showSupplementModal, setShowSupplementModal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editingSupplementId, setEditingSupplementId] = useState<string | null>(
    null,
  );

  // const SearchParams = useSearchParams();

  const storeId = id as string;

  
  

  useEffect(() => {
    //console.log(storeId);
    if (!user) return;
    if (category?.products) {
      setLocalProducts(category.products);
    }
  }, [category?.products, user]);

  // بيانات المنتج الجاري إنشاؤه أو تعديله
  const [newProduct, setNewProduct] = useState({
    title: "",
    price: "",
    image: "",
    description: "",
    comparePrice: 0,
    supplements: [] as NewSupplementType[],
  });

  // بيانات الـ Supplement الجديد الجاري إنشاؤه داخل النافذة الفرعية
  const [newSupplement, setNewSupplement] = useState({
    title: "",
    chose: "choix",
    data: [] as SupplementItem[],
  });

  // بيانات العنصر المفرد داخل الـ Supplement
  const [supItem, setSupItem] = useState<SupplementItem>({
    name: "",
    plusPrice: "",
  });

  const toggleMenu = (productId: string) => {
    setOpenMenuId(openMenuId === productId ? null : productId);
  };

  // دالة لفتح المودال في وضع الإضافة
  const handleOpenAddModal = () => {
    setProductModalMode("add");
    setEditingProductId(null);
    setNewProduct({
      title: "",
      price: "",
      image: "",
      description: "",
      comparePrice: 0,
      supplements: [],
    });
    setImagePreview("");
    setSelectedFile(null);
    setShowProductModal(true);
  };

  // دالة لفتح المودال وتعبئة البيانات في وضع التعديل
  const handleOpenEditModal = (product: Product) => {
    setProductModalMode("edit");
    setEditingProductId(product._id);
    setNewProduct({
      title: product.title,
      price: String(product.price),
      image: product.image || "",
      description: product.desc || "",
      comparePrice: product.discount || 0,
      supplements: (product.supplements as NewSupplementType[]) || [],
    });
    setImagePreview(product.image || "");
    setSelectedFile(null);
    setOpenMenuId(null);
    setShowProductModal(true);
  };

  const handleToggleProductStatus = async (product: Product) => {
    try {
      const nextStatus = product.status === "public" ? "pause" : "public";

      const formData = new FormData();
      formData.append("productId", product._id);
      formData.append("categoryId", category?._id ?? "");
      formData.append("status", nextStatus);

      setLocalProducts((prev) =>
        prev.map((p) =>
          p._id === product._id ? { ...p, status: nextStatus } : p,
        ),
      );
      setOpenMenuId(null);

      const response = await updateStatusProducts(product._id, nextStatus);

      if (response && response.status === true) {
        if (typeof fetchCategories === "function") {
          fetchCategories(storeId, orderId);
        }
      } else {
        setLocalProducts((prev) =>
          prev.map((p) =>
            p._id === product._id ? { ...p, status: product.status } : p,
          ),
        );
        alert("فشلت عملية تحديث حالة المنتج في السيرفر");
      }
    } catch (error) {
      console.error("Error toggling product status:", error);
      alert("حدث خطأ أثناء تعديل حالة المنتج");
    }
  };

  const handleAddSupplementToProduct = () => {
    if (!newSupplement.title || newSupplement.data.length === 0) return;

    setNewProduct((prev) => {
      let updatedSupplements;

      if (editingSupplementId) {
        updatedSupplements = prev.supplements.map((s) =>
          s._id === editingSupplementId
            ? { ...newSupplement, _id: editingSupplementId }
            : s,
        );
      } else {
        updatedSupplements = [
          ...prev.supplements,
          { ...newSupplement, _id: Date.now().toString() },
        ];
      }

      return {
        ...prev,
        supplements: updatedSupplements,
      };
    });

    setNewSupplement({ title: "", chose: "choix", data: [] });
    setEditingSupplementId(null);
    setShowSupplementModal(false);
  };

  const handleAddSubItemToSupplement = () => {
    if (!supItem.name || !supItem.plusPrice) return;
    setNewSupplement((prev) => ({
      ...prev,
      data: [...prev.data, { ...supItem, _id: Date.now().toString() }],
    }));
    setSupItem({ name: "", plusPrice: "" });
  };

  const handleRemoveSupplement = (id: string) => {
    setNewProduct((prev) => ({
      ...prev,
      supplements: prev.supplements.filter((s) => s._id !== id),
    }));
  };

  const existingSupplements = useMemo(() => {
    const map = new Map<
      string,
      NewSupplementType & { categoryName: string; categoryId: string }
    >();

    categories.forEach((cat) => {
      if (cat.products && Array.isArray(cat.products)) {
        cat.products.forEach((p) => {
          if (p.supplements && Array.isArray(p.supplements)) {
            p.supplements.forEach((s: Supplement) => {
              if (s && s.title) {
                const key = s.title.trim().toLowerCase();

                if (!map.has(key)) {
                  map.set(key, {
                    ...s,
                    categoryName: cat.category,
                    categoryId: cat._id,
                  });
                }
              }
            });
          }
        });
      }
    });

    return Array.from(map.values());
  }, [categories]); // تعتمد الآن على تغيير الفئات بالكامل وليس فقط المنتجات المحلية

  const handleEditSupplement = (supplement: NewSupplementType) => {
    setNewSupplement({
      title: supplement.title,
      chose: supplement.chose,
      data: supplement.data,
    });

    setEditingSupplementId(supplement._id);
    setShowSupplementModal(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const localPreviewUrl = URL.createObjectURL(file);
    setImagePreview(localPreviewUrl);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClearImage = () => {
    setImagePreview("");
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setNewProduct((prev) => ({
      ...prev,
      image: "",
    }));
  };

  const handleSaveProduct = async () => {
    try {
      setUploadingImage(true);
      const formData = new FormData();

      if (productModalMode === "edit" && editingProductId) {
        formData.append("productId", editingProductId);
      }

      if (selectedFile) {
        formData.append("image", selectedFile);
      } else if (productModalMode === "edit") {
        formData.append("image", newProduct.image);
      } else {
        formData.append("image", "null");
      }

      formData.append("categoryId", category?._id ?? "");
      formData.append("clientId", category?.clientId ?? "");
      formData.append("title", newProduct.title);
      formData.append("currency", user?.currency ?? "");
      formData.append("assistedBy", user?.id ?? "");
      formData.append("description", newProduct.description ?? "");
      formData.append("price", newProduct.price);
      formData.append("discount", newProduct.comparePrice.toString());
      formData.append("supplements", JSON.stringify(newProduct.supplements));

      const response = await updateProducts(formData);

      if (response && response.status === true && !!response.result) {
        const serverProduct = response.result;

        const finalProductToInject = {
          ...serverProduct,
          supplements:
            serverProduct.supplements && serverProduct.supplements.length > 0
              ? serverProduct.supplements
              : newProduct.supplements.map((sup) => ({
                  ...sup,
                  data: sup.data.map((d) => ({
                    _id: d._id || Date.now().toString(),
                    name: d.name || "",
                    plusPrice: d.plusPrice,
                  })),
                })),
        };

        //  console.log(productModalMode);

        if (productModalMode === "add") {
          setLocalProducts((prevProducts) => [
            ...prevProducts,
            finalProductToInject,
          ]);
        } else {
          setLocalProducts((prevProducts) =>
            prevProducts.map((p) =>
              p._id === editingProductId ? finalProductToInject : p,
            ),
          );
        }

        if (typeof fetchCategories === "function") {
          console.log("fff", orderId);

          fetchCategories(storeId, orderId);
        }
        setShowProductModal(false);
      }
    } catch (error: unknown) {
      console.error(error);
      alert("حدث خطأ أثناء حفظ المنتج، يرجى التحقق ثانية.");
    } finally {
      setUploadingImage(false);
    }
  };

  const moveSupplementUp = (index: number) => {
    if (index === 0) return; // إذا كان العنصر الأول بالفعل، لا تفعل شيء
    setNewProduct((prev) => {
      const updated = [...prev.supplements];
      // تبديل الأماكن
      const temp = updated[index];
      updated[index] = updated[index - 1];
      updated[index - 1] = temp;
      return { ...prev, supplements: updated };
    });
  };

  const moveSupplementDown = (index: number) => {
    setNewProduct((prev) => {
      if (index === prev.supplements.length - 1) return prev; // إذا كان العنصر الأخير
      const updated = [...prev.supplements];
      // تبديل الأماكن
      const temp = updated[index];
      updated[index] = updated[index + 1];
      updated[index + 1] = temp;
      return { ...prev, supplements: updated };
    });
  };

  const ExpandableDesc = ({ text }: { text: string }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
      <span
        onClick={(e) => {
          e.stopPropagation(); // 💡 يمنع الضغطة من تفعيل أي زر أو حدث في الكرت الأب
          setIsExpanded(!isExpanded);
        }}
        className={`text-[14px] sm:text-xs text-gray-400 font-medium cursor-pointer transition-all leading-tight pl-2 ${
          isExpanded
            ? "block max-w-full line-clamp-none whitespace-normal text-gray-500 backend-fade"
            : "line-clamp-3 max-w-40 sm:max-w-70" // عند الاختصار ليترك مساحة للأزرار
        }`}
        title={isExpanded ? "اضغط للاختصار" : "اضغط لعرض كامل النص"}
      >
        {text}
      </span>
    );
  };
  return (
    <div className="max-w-4xl mx-auto p-3 md:p-4 pb-32" dir="rtl">
      {/* زر إضافة منتج */}
      {order?.id === undefined && (
        <div className="mb-4 md:mb-6 flex justify-end">
          <button
            onClick={handleOpenAddModal}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-black px-5 py-3 rounded-2xl shadow-md transition-all active:scale-95 text-sm md:text-base"
          >
            <PlusCircle size={18} />
            <span>إضافة منتج جديد</span>
          </button>
        </div>
      )}

      {/* قائمة المنتجات */}
      <div className="grid gap-3 md:gap-4">
        {localProducts.map((e, index) => (
          <div
            key={e._id || index}
            className={`bg-white p-3 md:p-4 rounded-2xl border hover:shadow-sm transition group ${
              e.status === "pause"
                ? "opacity-60 border-dashed bg-gray-50/50"
                : ""
            }`}
          >
            <div className="flex flex-row items-center justify-between gap-3 md:gap-4">
              <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                {/* صورة المنتج */}
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 shadow-sm border border-gray-100 rounded-xl overflow-hidden">
                  {!!e.image ? (
                    <Image
                      src={e.image}
                      alt={e.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-300 text-[10px] sm:text-xs text-center p-1">
                      لا توجد صورة
                    </div>
                  )}
                  {e.status === "pause" && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-white text-center p-0.5">
                      موقوف مؤقتاً
                    </div>
                  )}
                </div>

                {/* تفاصيل المنتج */}
                <div className="min-w-0 flex-1 text-right">
                  {category?.offer && (
                    <span className="inline-block text-[9px] sm:text-[10px] bg-red-50 text-red-600 font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider mb-1">
                      Best Seller
                    </span>
                  )}
                  <h4
                    className={`font-black text-gray-800 text-sm sm:text-base md:text-lg leading-snug mt-0.5 line-clamp-2 ${
                      e.status === "pause" ? "line-through text-gray-400" : ""
                    }`} // 👈 تم تغيير truncate إلى line-clamp-2 وإضافة leading-snug لتحسين مظهر السطرين
                  >
                    {e.title}
                  </h4>
                  {!!e.desc && <ExpandableDesc text={e.desc} />}
                  <p className="text-orange-600 font-black text-base sm:text-lg md:text-xl flex items-center gap-0.5">
                    <span>{e.price}</span>
                    <span className="text-[10px] sm:text-xs font-bold text-gray-500 mr-0.5">
                      {e.currency || user?.currency}
                    </span>
                  </p>

                  {/* السعر القديم قبل الخصم - يظهر فقط إذا كان موجوداً وأكبر من السعر الحالي */}
                  {e.discount && Number(e.discount) > Number(e.price) && (
                    <p className="text-gray-400 line-through text-xs sm:text-sm font-medium flex items-center gap-0.5 self-end mb-0.5">
                      <span>{e.discount}</span>
                      <span className="text-[9px] sm:text-[10px] font-normal no-underline inline-block text-gray-400 mr-0.5">
                        {e.currency || user?.currency}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              {/* التحكم */}
              {!!orderId ? (
                
                <div className="flex justify-center items-center shrink-0">
                  <QuantitySelector
                    order={order}
                    product={e}
                    cartItems={cartItems || []}
                    openedProductId={openedProductId}
                    setOpenedProductId={setOpenedProductId}
                    category={category!}
                  />
                </div>
              ) : (
                <div className="relative flex justify-center items-center shrink-0">
                  <button
                    onClick={() => toggleMenu(e._id)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
                  >
                    <MoreVertical size={18} className="text-gray-500" />
                  </button>

                  {openMenuId === e._id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpenMenuId(null)}
                      />

                      <div className="absolute left-0 top-9 w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-20 origin-top-left">
                        <button
                          onClick={() => handleOpenEditModal(e)}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 text-right font-medium"
                        >
                          <Edit2 size={15} className="text-blue-500" />
                          <span>تعديل المنتج</span>
                        </button>

                        <hr className="border-gray-100 my-1" />

                        {e.status === "public" ? (
                          <button
                            onClick={() => handleToggleProductStatus(e)}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-amber-600 hover:bg-amber-50 text-right font-medium"
                          >
                            <Pause size={15} />
                            <span>إيقاف مؤقت (Pause)</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleProductStatus(e)}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-green-600 hover:bg-green-50 text-right font-medium"
                          >
                            <Play size={15} />
                            <span>تفعيل (Active)</span>
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className={openedProductId ? "hidden" : ""}>
        <FloatingCart cartItems={cartItems || []} order={order || null} />
      </div>

      {/* ==================== نافذة إضافة/تعديل المنتج الرئيسي (تم تحديث التمرير هنا) ==================== */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-[95%] sm:max-w-md my-auto max-h-[85vh] flex flex-col overflow-hidden shadow-2xl transition-all">
            {/* 1. الرأس الثابت (Fixed Header) */}
            <div className="flex justify-between items-center px-5 py-4 border-b shrink-0 bg-white rounded-t-3xl">
              <h3 className="font-black text-base sm:text-lg text-gray-800">
                {productModalMode === "add"
                  ? "إضافة منتج جديد"
                  : "تعديل تفاصيل المنتج"}
              </h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="text-gray-400 hover:text-gray-700 p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* 2. جسم المودال القابل للتمرير عمودياً (Scrollable Body) */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4 touch-pan-y bg-gray-50/50 layout-scrollbar">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  اسم المنتج *
                </label>
                <input
                  type="text"
                  value={newProduct.title}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, title: e.target.value })
                  }
                  className="w-full border p-2.5 rounded-xl focus:ring-2 focus:ring-orange-500 bg-white outline-none text-black text-sm transition-all"
                  placeholder="مثال: بيتزا مارغريتا"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  السعر *
                </label>
                <input
                  type="number"
                  value={newProduct.price}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, price: e.target.value })
                  }
                  className="w-full border p-2.5 rounded-xl focus:ring-2 focus:ring-orange-500 bg-white outline-none text-black text-sm transition-all"
                  placeholder="السعر بالـ DZD"
                />
              </div>

              {/* الخانة الجديدة: السعر قبل الخصم (اختياري) */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">
                  السعر القديم قبل الخصم (إختياري)
                </label>
                <input
                  type="number"
                  value={newProduct.comparePrice || 0}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      comparePrice:
                        e.target.value === "" ? 0 : Number(e.target.value),
                    })
                  }
                  className="w-full border p-2.5 rounded-xl focus:ring-2 focus:ring-orange-500 bg-white outline-none text-black text-sm transition-all border-gray-200"
                  placeholder="مثال: 750"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  محتوى أو وصف المنتج
                </label>
                <textarea
                  rows={3}
                  value={newProduct.description}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      description: e.target.value,
                    })
                  }
                  className="w-full border p-2.5 rounded-xl focus:ring-2 focus:ring-orange-500 bg-white outline-none resize-none text-black text-sm transition-all"
                  placeholder="اكتب هنا محتويات المنتج بالتفصيل..."
                />
              </div>

              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed bg-white rounded-xl font-bold text-xs transition border-gray-300 hover:bg-gray-50 text-gray-600"
                >
                  <Upload size={16} />
                  <span>تغيير أو اختيار صورة</span>
                </button>
                {imagePreview && (
                  <div className="mt-3 text-center flex flex-col items-center justify-center">
                    <div className="relative w-28 h-28 border-2 border-gray-200 rounded-xl bg-gray-50 shadow-sm overflow-hidden">
                      <img
                        src={imagePreview}
                        alt="Product Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleClearImage}
                        className="absolute top-1 left-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md transition"
                        title="حذف الصورة"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* الإضافات */}
              <div className="border-t pt-3">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-2">
                  <label className="block text-xs font-bold text-gray-700">
                    الإضافات (Supplements)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setNewSupplement({ title: "", chose: "choix", data: [] });
                      setShowSupplementModal(true);
                    }}
                    className="text-[11px] bg-orange-100 text-orange-600 font-black px-2.5 py-1.5 rounded-lg hover:bg-orange-200 transition text-center"
                  >
                    + إضافة Supplement جديد
                  </button>
                </div>

                {/* قسم الإضافات المدرجة في هذا المنتج مسبقاً */}
                {newProduct.supplements &&
                  newProduct.supplements.length > 0 && (
                    <div className="mb-4">
                      <label className="block text-xs font-bold text-gray-700 mb-2">
                        مجموعات الإضافات الحالية للمنتج (
                        {newProduct.supplements.length}):
                      </label>

                      <div className="space-y-2 max-h-60 overflow-y-auto layout-scrollbar pr-1">
                        {newProduct.supplements.map((supplement, index) => (
                          <div
                            key={supplement._id || index}
                            className="border border-gray-200 bg-gray-50/50 rounded-xl p-3 shadow-sm flex flex-col justify-between gap-2"
                          >
                            {/* رأس بطاقة الـ Supplement: العنوان والنوع والتحكم */}
                            <div className="flex justify-between items-start border-b border-gray-200/60 pb-2">
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-black text-xs text-gray-800">
                                    {supplement.title}
                                  </span>
                                  <span
                                    className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold ${
                                      supplement.chose === "requis"
                                        ? "bg-red-50 text-red-600 border border-red-100"
                                        : "bg-blue-50 text-blue-600 border border-blue-100"
                                    }`}
                                  >
                                    {supplement.chose === "requis"
                                      ? "إجباري"
                                      : "اختياري"}
                                  </span>
                                </div>
                              </div>

                              {/* أزرار التعديل والحذف لمجموعة الإضافات */}
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleEditSupplement(supplement)
                                  }
                                  className="p-1 text-gray-500 hover:text-orange-500 hover:bg-white rounded-md border border-transparent hover:border-gray-200 transition shadow-sm"
                                  title="تعديل المجموعة"
                                >
                                  <Edit3 size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveSupplement(supplement._id)
                                  }
                                  className="p-1 text-gray-400 hover:text-red-500 hover:bg-white rounded-md border border-transparent hover:border-gray-200 transition shadow-sm"
                                  title="حذف المجموعة بالكامل"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>

                            {/* الخيارات الفرعية المدرجة داخل هذه المجموعة */}
                            <div className="flex flex-wrap gap-1">
                              {supplement.data &&
                                supplement.data.map((item, idx) => (
                                  <div
                                    key={item._id || idx}
                                    className="text-[10px] bg-white border border-gray-200 text-gray-700 px-2 py-0.5 rounded-md flex items-center gap-1"
                                  >
                                    <span className="font-medium text-gray-600">
                                      {item.name}
                                    </span>
                                    <span className="font-bold text-orange-500">
                                      (
                                      {item.plusPrice &&
                                      Number(item.plusPrice) > 0
                                        ? `+${item.plusPrice}`
                                        : "مجاني"}
                                      )
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {existingSupplements.length > 0 && (
                  <div className="mb-3">
                    <label className="block text-xs font-bold text-gray-600 mb-1">
                      إضافة إضافات جاهزة من الفئات الأخرى:
                    </label>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1.5 bg-white rounded-xl border border-dashed">
                      {existingSupplements.map((sup, sIdx) => (
                        <button
                          key={sup._id || sIdx}
                          type="button"
                          onClick={() => {
                            const isAlreadyAdded = newProduct.supplements.some(
                              (s) =>
                                s.title.trim().toLowerCase() ===
                                sup.title.trim().toLowerCase(),
                            );

                            if (!isAlreadyAdded) {
                              // فصل خصائص الفئة لكي لا نرسلها إلى السيرفر ضمن كائن الـ supplement
                              const {
                                categoryName,
                                categoryId,
                                ...pureSupplement
                              } = sup;

                              setNewProduct((prev) => ({
                                ...prev,
                                supplements: [
                                  ...prev.supplements,
                                  {
                                    ...pureSupplement,
                                    _id: Date.now().toString() + sIdx,
                                  },
                                ],
                              }));
                            }
                          }}
                          className="flex items-center gap-1 text-[11px] bg-gray-50 hover:bg-orange-500 border border-gray-200 hover:border-orange-500 hover:text-white text-gray-700 font-medium px-2 py-1 rounded-md transition"
                        >
                          {/* اسم الإضافة */}
                          <span>+ {sup.title}</span>

                          {/* شارة اسم الفئة التابع لها */}
                          <span className="text-[9px] opacity-70 bg-gray-200 text-gray-800 px-1 rounded group-hover:bg-orange-600 group-hover:text-white transition-colors duration-150">
                            ({sup.categoryName})
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {newProduct.supplements.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto p-1.5 rounded-xl">
                    {newProduct.supplements.map((s, idx) => (
                      <div
                        key={s._id || idx}
                        className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm gap-2"
                      >
                        <div className="flex flex-col gap-0.5 min-w-0 text-right">
                          <span className="font-bold text-xs text-gray-800 truncate">
                            {s.title}
                          </span>
                          <span className="text-[10px] text-gray-500 font-medium truncate">
                            {s.chose === "requis" ? "⚠️ إجباري" : "⚙️ اختياري"}{" "}
                            • {s.data.length} عناصر
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleEditSupplement(s)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveSupplement(s._id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-400 italic bg-white p-3 rounded-xl border border-dashed text-center">
                    لا توجد إضافات مضافة لهذا المنتج بعد.
                  </p>
                )}
              </div>
            </div>

            {/* 3. أسفل المودال الثابت (Fixed Footer) */}
            <div className="p-4 border-t bg-white shrink-0 rounded-b-3xl">
              <button
                onClick={handleSaveProduct}
                disabled={!newProduct.title || !newProduct.price}
                className={`w-full py-3 rounded-xl font-black text-white shadow-md transition-all text-sm ${
                  newProduct.title && newProduct.price
                    ? "bg-green-600 hover:bg-green-700 active:scale-[0.99]"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
              >
                {productModalMode === "add"
                  ? "حفظ المنتج النهائي"
                  : "تعديل وحفظ المنتج"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== نافذة إضافة الـ Supplement الفرعية (تم تحديث التمرير هنا) ==================== */}
      {showSupplementModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-[95%] sm:max-w-sm my-auto max-h-[80vh] flex flex-col overflow-hidden shadow-2xl transition-all">
            {/* رأس النافذة الثابت */}
            <div className="flex justify-between items-center px-4 py-3 border-b shrink-0 bg-white rounded-t-3xl">
              <div className="flex flex-col">
                <h4 className="font-black text-sm sm:text-base text-gray-800">
                  تفاصيل الـ Supplement
                </h4>
                {newSupplement.title && (
                  <span className="text-[10px] text-orange-500 font-bold truncate max-w-[200px]">
                    جاري تعديل: {newSupplement.title}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowSupplementModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full"
              >
                <X size={18} />
              </button>
            </div>

            {/* جسم النافذة الفرعية القابل للتمرير */}
            <div className="p-4 overflow-y-auto flex-1 space-y-3 touch-pan-y bg-gray-50/50 layout-scrollbar">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">
                  اسم مجموعة الإضافات
                </label>
                <input
                  type="text"
                  value={newSupplement.title}
                  onChange={(e) =>
                    setNewSupplement({
                      ...newSupplement,
                      title: e.target.value,
                    })
                  }
                  className="w-full border p-2 rounded-lg text-sm bg-white text-black focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="مثال: الحجم، الصلصة..."
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">
                  نوع الاختيار
                </label>
                <select
                  value={newSupplement.chose}
                  onChange={(e) =>
                    setNewSupplement({
                      ...newSupplement,
                      chose: e.target.value,
                    })
                  }
                  className="w-full border p-2 rounded-lg text-sm bg-white text-black focus:ring-2 focus:ring-orange-500 outline-none"
                >
                  <option value="choix">اختياري (Choix)</option>
                  <option value="requis">إجباري (Required)</option>
                </select>
              </div>

              <div className="border p-2.5 rounded-xl bg-white shadow-sm">
                <p className="text-[11px] font-bold text-gray-700 mb-2">
                  إضافة خيار فرعي وسعره
                </p>
                <div className="grid grid-cols-1 gap-2 mb-2">
                  <input
                    type="text"
                    value={supItem.name}
                    onChange={(e) =>
                      setSupItem({ ...supItem, name: e.target.value })
                    }
                    className="border p-2 rounded-lg text-xs text-black w-full"
                    placeholder="الاسم (مثال: جبن مضاعف)"
                  />
                  <input
                    type="number"
                    value={supItem.plusPrice}
                    onChange={(e) =>
                      setSupItem({ ...supItem, plusPrice: e.target.value })
                    }
                    className="border p-2 rounded-lg text-xs text-black w-full"
                    placeholder="السعر الزائد (+50)"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddSubItemToSupplement}
                  className="w-full bg-gray-800 text-white font-bold text-[11px] py-2 rounded-lg hover:bg-gray-900 transition shadow-sm"
                >
                  درج الخيار بالقائمة الفرعية
                </button>

                {/* القائمة المدرجة مع إظهار العنوان وإمكانية الترتيب والحذف المباشر */}
                {newSupplement.data.length > 0 && (
                  <div className="mt-3 border-t pt-2">
                    <div className="flex justify-between items-center mb-1.5 px-0.5">
                      <span className="text-[10px] text-gray-400 font-bold">
                        الخيارات الحالية مرتبة:
                      </span>
                      <span className="text-[10px] text-gray-700 font-black bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                        {newSupplement.title || "بدون عنوان حالياً"}
                      </span>
                    </div>

                    <div className="space-y-1.5 max-h-32 overflow-y-auto layout-scrollbar">
                      {newSupplement.data.map((item, idx) => (
                        <div
                          key={item._id || idx}
                          className="flex justify-between items-center text-[11px] text-gray-600 bg-gray-50 p-1.5 rounded-md border border-gray-100"
                        >
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            {/* رقم الترتيب الصغير */}
                            <span className="text-[9px] font-bold bg-gray-200 text-gray-600 w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <div className="flex items-center gap-1 truncate">
                              <span className="font-medium text-gray-800 truncate">
                                {item.name}
                              </span>
                              <span className="font-bold text-orange-600 shrink-0">
                                +{item.plusPrice} DZD
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-0.5 shrink-0">
                            {/* سهم نقل للأعلى */}
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => {
                                if (idx === 0) return;
                                setNewSupplement((prev) => {
                                  const newData = [...prev.data];
                                  const temp = newData[idx];
                                  newData[idx] = newData[idx - 1];
                                  newData[idx - 1] = temp;
                                  return { ...prev, data: newData };
                                });
                              }}
                              className={`p-0.5 rounded transition ${
                                idx === 0
                                  ? "text-gray-200 cursor-not-allowed"
                                  : "text-gray-400 hover:text-orange-500 hover:bg-white"
                              }`}
                            >
                              <ArrowUp size={11} />
                            </button>

                            {/* سهم نقل للأسفل */}
                            <button
                              type="button"
                              disabled={idx === newSupplement.data.length - 1}
                              onClick={() => {
                                if (idx === newSupplement.data.length - 1)
                                  return;
                                setNewSupplement((prev) => {
                                  const newData = [...prev.data];
                                  const temp = newData[idx];
                                  newData[idx] = newData[idx + 1];
                                  newData[idx + 1] = temp;
                                  return { ...prev, data: newData };
                                });
                              }}
                              className={`p-0.5 rounded transition ${
                                idx === newSupplement.data.length - 1
                                  ? "text-gray-200 cursor-not-allowed"
                                  : "text-gray-400 hover:text-orange-500 hover:bg-white"
                              }`}
                            >
                              <ArrowDown size={11} />
                            </button>

                            {/* فاصل خطي رفيع */}
                            <span className="w-[1px] h-3 bg-gray-200 mx-0.5" />

                            {/* زر الحذف الفردي */}
                            <button
                              type="button"
                              onClick={() => {
                                setNewSupplement((prev) => ({
                                  ...prev,
                                  data: prev.data.filter((_, i) => i !== idx),
                                }));
                              }}
                              className="text-gray-400 hover:text-red-500 p-0.5 rounded transition-colors"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* زر الحفظ السفلي الثابت */}
            <div className="p-3 border-t bg-white shrink-0 rounded-b-3xl">
              <button
                onClick={handleAddSupplementToProduct}
                disabled={
                  !newSupplement.title || newSupplement.data.length === 0
                }
                className={`w-full py-2.5 rounded-xl font-bold text-white text-xs transition ${
                  newSupplement.title && newSupplement.data.length > 0
                    ? "bg-orange-500 hover:bg-orange-600 shadow-sm active:scale-[0.99]"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
              >
                تأكيد وإدراج بالمجموعة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
