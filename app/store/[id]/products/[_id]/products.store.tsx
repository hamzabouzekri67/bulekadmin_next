/* eslint-disable @next/next/no-img-element */
import { useCategories } from "@/app/context/CategoryContext";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useMemo } from "react";
import { updateProducts, updateStatusProducts } from "./api/UpdateOrder"; // تأكد أن هذه الدالة ترسل الـ FormData للسيرفر بشكل صحيح
import {
  Edit2,
  MoreVertical,
  Pause,
  Play,
  PlusCircle,
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

export default function ProductsStore() {
  const { _id, id } = useParams();
  const { user } = useUser();
  const { categories, order, cartItems, fetchCategories } = useCategories();
  const category = categories.find((c) => c._id === _id);
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

  const SearchParams = useSearchParams();
  const orderId = SearchParams?.get("orderId");
  const validOrderId = id as string;

 // console.log(orderId);
  

  useEffect(() => {
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
      supplements: [],
    });
    setImagePreview("");
    setSelectedFile(null);
    setShowProductModal(true);
  };

  // ✏️ دالة لفتح المودال وتعبئة البيانات في وضع التعديل
  const handleOpenEditModal = (product: Product) => {
    setProductModalMode("edit");
    setEditingProductId(product._id);
    setNewProduct({
      title: product.title,
      price: String(product.price),
      image: product.image || "",
      description: product.desc || "",
      supplements: (product.supplements as NewSupplementType[]) || [],
    });
    setImagePreview(product.image || "");
    setSelectedFile(null);
    setOpenMenuId(null); // إغلاق قائمة الخيارات الثلاثة
    setShowProductModal(true);
  };

  // 🔄 دالة لتفعيل أو إيقاف منتج مؤقتاً مباشرة من القائمة الجانبية للمنتج
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

      const response = await updateStatusProducts(product._id,nextStatus);

      if (response && response.status === true) {
        if (typeof fetchCategories === "function") {
          fetchCategories(validOrderId, orderId);
        }
      } else {
        // إذا فشل الطلب في السيرفر، نعيد الحالة القديمة كحماية للبيانات
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
    // استخدام setNewProduct بدلاً من newProduct
    setNewProduct((prev) => ({
      ...prev,
      supplements: prev.supplements.filter((s) => s._id !== id),
    }));
  };

  const existingSupplements = useMemo(() => {
    const map = new Map<string, Supplement>();
    localProducts.forEach((p) => {
      if (p.supplements && Array.isArray(p.supplements)) {
        p.supplements.forEach((s: Supplement) => {
          if (s && s.title) {
            const key = s.title.trim().toLowerCase();
            if (!map.has(key)) {
              map.set(key, s);
            }
          }
        });
      }
    });
    return Array.from(map.values()) as NewSupplementType[];
  }, [localProducts]);

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
    setImagePreview(""); // إلغاء معاينة الصورة في الواجهة
    setSelectedFile(null); // إلغاء الملف المجهز للرفع

    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // تصغير حقل الإدخال ليعود فارغاً
    }

    // مضافة: تفريغ حقل الصورة داخل حالة المنتج لتصبح null
    setNewProduct((prev) => ({
      ...prev,
      image: "", // أو "" حسب هيكلة الـ State لديك، ويفضل null
    }));
  };

  // دالة الحفظ الموحدة (للإضافة والتعديل)
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
      formData.append("supplements", JSON.stringify(newProduct.supplements));

      const response = await updateProducts(formData);

      console.log(Object.fromEntries(formData.entries()));

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

        if (productModalMode === "add") {
          // إضافة للمصفوفة المحلية
          setLocalProducts((prevProducts) => [
            ...prevProducts,
            finalProductToInject,
          ]);
        } else {
          // استبدال وتعديل داخل المصفوفة المحلية فوراً
          setLocalProducts((prevProducts) =>
            prevProducts.map((p) =>
              p._id === editingProductId ? finalProductToInject : p,
            ),
          );
        }

        if (typeof fetchCategories === "function") {
          fetchCategories(validOrderId, orderId);
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

  return (
    <div className="max-w-4xl mx-auto p-4" dir="rtl">
      {/* زر إضافة منتج */}
      {order?.id === undefined && (
        <div className="mb-6 flex justify-end">
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-black px-5 py-3 rounded-2xl shadow-md transition-all active:scale-95"
          >
            <PlusCircle size={20} />
            <span>إضافة منتج جديد</span>
          </button>
        </div>
      )}

      <div className="grid gap-4">
        {localProducts.map((e, index) => (
          <div
            key={e._id || index}
            className={`bg-white p-4 rounded-2xl border hover:shadow-md transition group ${
              e.status === "pause"
                ? "opacity-60 border-dashed bg-gray-50/50"
                : ""
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 shrink-0 shadow-sm border border-gray-100 rounded-xl overflow-hidden">
                {!!e.image ? (
                  <Image
                    src={e.image}
                    alt={e.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-300 text-xs">
                    لا توجد صورة
                  </div>
                )}
                {e.status === "pause" && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-[10px] font-bold text-white">
                    موقوف مؤقتاً
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                {category?.offer && (
                  <span className="inline-block text-[10px] bg-red-50 text-red-600 font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider mb-1">
                    Best Seller
                  </span>
                )}
                <h4
                  className={`font-black text-gray-800 text-base md:text-lg truncate ${e.status === "pause" ? "line-through text-gray-400" : ""}`}
                >
                  {e.title}
                </h4>
                {!!e.desc && (
                  <p className="text-xs text-gray-400 font-medium mt-0.5 line-clamp-2 leading-relaxed pl-2">
                    {e.desc}
                  </p>
                )}
                <p className="text-orange-600 font-black text-lg md:text-xl mt-1.5 flex items-center gap-1">
                  <span>{e.price}</span>
                  <span className="text-xs font-bold text-gray-500">
                    {e.currency || user?.currency}
                  </span>
                </p>
              </div>

              {!!orderId ? (
                <div className="flex justify-center items-center">
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
                <div className="relative flex justify-center items-center">
                  <button
                    onClick={() => toggleMenu(e._id)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
                  >
                    <MoreVertical size={20} className="text-gray-500" />
                  </button>

                  {openMenuId === e._id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpenMenuId(null)}
                      />

                      <div className="absolute right-0 top-10 w-44 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-20">
                        {/* ✏️ زر تعديل المنتج */}
                        <button
                          onClick={() => handleOpenEditModal(e)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-right font-medium"
                        >
                          <Edit2 size={16} className="text-blue-500" />
                          <span>تعديل المنتج</span>
                        </button>

                        <hr className="border-gray-100 my-1" />

                        {/* 🔄 زر التفعيل والايقاف المؤقت اللحظي */}
                        {e.status === "public" ? (
                          <button
                            onClick={() => handleToggleProductStatus(e)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 text-right font-medium"
                          >
                            <Pause size={16} />
                            <span>إيقاف مؤقت (Pause)</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleProductStatus(e)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-600 hover:bg-green-50 text-right font-medium"
                          >
                            <Play size={16} />
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

      {/* ==================== نافذة إضافة/تعديل المنتج الرئيسي ==================== */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="font-black text-xl text-gray-800">
                {productModalMode === "add"
                  ? "إضافة منتج جديد"
                  : "تعديل تفاصيل المنتج"}
              </h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="text-gray-500 hover:text-gray-800"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  اسم المنتج *
                </label>
                <input
                  type="text"
                  value={newProduct.title}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, title: e.target.value })
                  }
                  className="w-full border p-2.5 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-black"
                  placeholder="مثال: بيتزا مارغريتا"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  السعر *
                </label>
                <input
                  type="number"
                  value={newProduct.price}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, price: e.target.value })
                  }
                  className="w-full border p-2.5 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-black"
                  placeholder="السعر بالـ DZD"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  محتوى أو وصف المنتج
                </label>
                <textarea
                  rows={4}
                  value={newProduct.description}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      description: e.target.value,
                    })
                  }
                  className="w-full border p-2.5 rounded-xl focus:ring-2 focus:ring-green-500 outline-none resize-none text-black"
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
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed rounded-xl font-medium text-sm transition border-gray-300 hover:bg-gray-50 text-gray-600"
                >
                  <Upload size={18} />
                  <span>تغيير أو اختيار صورة</span>
                </button>
                {imagePreview && (
                  <div className="mt-4 text-center flex flex-col items-center justify-center">
                    <div className="relative w-32 h-32 border-2 border-gray-200 rounded-xl bg-gray-50 shadow-sm">
                      <img
                        src={imagePreview}
                        alt="Product Preview"
                        className="w-full h-full object-cover rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={handleClearImage}
                        className="absolute -top-2 -left-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md transition"
                        title="حذف الصورة"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* الإضافات الخاصة بالمنتج */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-bold text-gray-700">
                    الإضافات (Supplements)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setNewSupplement({ title: "", chose: "choix", data: [] });
                      setShowSupplementModal(true);
                    }}
                    className="text-xs bg-orange-100 text-orange-600 font-bold px-2.5 py-1.5 rounded-lg hover:bg-orange-200 transition"
                  >
                    + إضافة Supplement جديد
                  </button>
                </div>

                {existingSupplements.length > 0 && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-gray-50 rounded-xl border border-dashed">
                      {existingSupplements.map((sup, sIdx) => (
                        <button
                          key={sup._id || sIdx}
                          type="button"
                          onClick={() => {
                            const isAlreadyAdded = newProduct.supplements.some(
                              (s) => s.title === sup.title,
                            );
                            if (!isAlreadyAdded) {
                              setNewProduct((prev) => ({
                                ...prev,
                                supplements: [
                                  ...prev.supplements,
                                  { ...sup, _id: Date.now().toString() + sIdx },
                                ],
                              }));
                            }
                          }}
                          className="text-xs bg-gray-200 hover:bg-orange-500 hover:text-white text-gray-700 font-medium px-2 py-1 rounded-lg transition"
                        >
                          + {sup.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {newProduct.supplements.length > 0 ? (
                  <div className="space-y-2 bg-gray-50 p-3 rounded-xl border">
                    {newProduct.supplements.map((s, idx) => (
                      <div
                        key={s._id || idx}
                        className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-sm text-gray-800">
                            {s.title}
                          </span>
                          <span className="text-[11px] text-gray-500 font-medium">
                            {s.chose === "requis" ? "⚠️ إجباري" : "⚙️ اختياري"}{" "}
                            • {s.data.length} عناصر
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleEditSupplement(s)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveSupplement(s._id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded-xl border border-dashed text-center">
                    لا توجد إضافات مضافة لهذا المنتج بعد.
                  </p>
                )}
              </div>

              <button
                onClick={handleSaveProduct}
                disabled={!newProduct.title || !newProduct.price}
                className={`w-full py-3 rounded-xl font-black text-white shadow transition-all mt-4 ${
                  newProduct.title && newProduct.price
                    ? "bg-green-600 hover:bg-green-700"
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

      {/* ==================== نافذة إضافة الـ Supplement الفرعية ==================== */}
      {showSupplementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl">
            <div className="flex justify-between items-center mb-3 border-b pb-1">
              <h4 className="font-black text-lg text-gray-800">
                تفاصيل الـ Supplement
              </h4>
              <button
                onClick={() => setShowSupplementModal(false)}
                className="text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
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
                  className="w-full border p-2 rounded-lg text-sm text-black"
                  placeholder="مثال: الحجم، الصلصة..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
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
                  className="w-full border p-2 rounded-lg text-sm bg-white text-black"
                >
                  <option value="choix">اختياري (Choix)</option>
                  <option value="requis">إجباري (Required)</option>
                </select>
              </div>

              <div className="border p-3 rounded-xl bg-gray-50">
                <p className="text-xs font-bold text-gray-700 mb-2">
                  إضافة خيار فرعي وسعره
                </p>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input
                    type="text"
                    value={supItem.name}
                    onChange={(e) =>
                      setSupItem({ ...supItem, name: e.target.value })
                    }
                    className="border p-2 rounded-lg text-xs text-black"
                    placeholder="اسم الخيار (جبن مضاعف)"
                  />
                  <input
                    type="number"
                    value={supItem.plusPrice}
                    onChange={(e) =>
                      setSupItem({ ...supItem, plusPrice: e.target.value })
                    }
                    className="border p-2 rounded-lg text-xs text-black"
                    placeholder="السعر الزائد (+50)"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddSubItemToSupplement}
                  className="w-full bg-gray-800 text-white font-bold text-xs py-1.5 rounded-lg hover:bg-gray-900"
                >
                  درج الخيار بالقائمة الفرعية
                </button>

                {newSupplement.data.length > 0 && (
                  <div className="mt-3 space-y-1 max-h-24 overflow-y-auto border-t pt-2">
                    {newSupplement.data.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between text-[11px] text-gray-600"
                      >
                        <span>{item.name}</span>
                        <span>+{item.plusPrice} DZD</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleAddSupplementToProduct}
                disabled={
                  !newSupplement.title || newSupplement.data.length === 0
                }
                className={`w-full py-2.5 rounded-xl font-bold text-white text-sm ${
                  newSupplement.title && newSupplement.data.length > 0
                    ? "bg-orange-500 hover:bg-orange-600"
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
