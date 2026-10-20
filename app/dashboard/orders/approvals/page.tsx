"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/app/context/UserContext";

import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  Utensils,
  Layers,
  AlertCircle,
  CheckCheck,
  X,
  Eye,
  Store,
  Package,
} from "lucide-react";
import {
  AcceptedAllProducts,
  approveCategoryWithProducts,
  fetchPending,
  handleProductApprovalAction,
  rejectCategoryHandler,
} from "./api/approvals_Products";

interface PendingDataDetails {
  title?: string;
  category?: string;
  price?: string | number;
  image?: string;
}

interface PendingItem {
  _id: string;
  categoryId?: string | { toString(): string };
  approvalStatus: "pending_creation" | "pending_update";
  category?: string;
  title?: string;
  price?: string | number;
  image?: string;
  pendingData?: PendingDataDetails | string;
  restaurantInfo?: {
    name: string;
    nameEtabliss?: string;
    ville: string;
  };
}

export default function MenuApprovalsPage() {
  const { user } = useUser();
  const router = useRouter();
  const [pendingCategories, setPendingCategories] = useState<PendingItem[]>([]);
  const [pendingProducts, setPendingProducts] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fetchPendingData = async () => {
    try {
      const responseData = await fetchPending(user);
      if (responseData && responseData.status) {
        setPendingCategories(responseData.result?.pendingCategories || []);
        setPendingProducts(responseData.result?.pendingProducts || []);
      }
    } catch (error) {
      console.error("Error fetching approvals:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchPendingData();
  }, [user]);

  const handleApproveCategoryWithProducts = async (categoryId: string) => {
    try {
      setActionLoadingId(categoryId);
      const res = await approveCategoryWithProducts(categoryId);

      if (res.status) {
        setPendingCategories((prev) =>
          prev.filter((item) => String(item._id) !== String(categoryId)),
        );
        setPendingProducts((prev) =>
          prev.filter((item) => String(item.categoryId) !== String(categoryId)),
        );
      }
    } catch (error) {
      console.error("Error approving category with products:", error);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleApproveAll = async () => {
    if (
      !confirm(
        "هل أنت متأكد من قبول جميع الطلبات والتعديلات المعلقة دفعة واحدة؟",
      )
    )
      return;

    try {
      setIsBulkLoading(true);
      const res = await AcceptedAllProducts();

      if (res.status) {
        setPendingCategories([]);
        setPendingProducts([]);
      }
    } catch (error) {
      console.error("Error processing bulk approval:", error);
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleRejectCategory = async (categoryId: string) => {
    const reason = prompt("الرجاء إدخال سبب رفض هذا التصنيف:");
    if (reason === null) return;

    try {
      setActionLoadingId(categoryId);
      const res = await rejectCategoryHandler(categoryId, reason);

      if (res.status) {
        setPendingCategories((prev) =>
          prev.filter((item) => String(item._id) !== String(categoryId)),
        );
      }
    } catch (error) {
      console.error("Error rejecting category:", error);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleProductAction = async (
    productId: string,
    action: "approve" | "reject",
  ) => {
    let rejectionReason = "";
    if (action === "reject") {
      const reason = prompt("الرجاء إدخال سبب رفض هذا المنتج:");
      if (reason === null) return;
      rejectionReason = reason;
    }

    try {
      setActionLoadingId(productId);
      const res = await handleProductApprovalAction(
        productId,
        action,
        rejectionReason,
      );

      if (res.status) {
        setPendingProducts((prev) =>
          prev.filter((item) => String(item._id) !== String(productId)),
        );
      }
    } catch (error) {
      console.error(`Error processing product ${action}:`, error);
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const totalPending = pendingCategories.length + pendingProducts.length;

  const unlinkedProducts = pendingProducts.filter((prod) => {
    return !pendingCategories.some((cat) => {
      const catName =
        typeof cat.pendingData === "string"
          ? cat.pendingData
          : typeof cat.pendingData === "object" && cat.pendingData !== null
            ? cat.pendingData.category
            : cat.category;

      const matchesId =
        prod.categoryId &&
        String(prod.categoryId).trim() === String(cat._id).trim();
      const matchesName =
        catName &&
        prod.category &&
        prod.category.trim().toLowerCase() === catName.trim().toLowerCase();

      return matchesId || matchesName;
    });
  });

  return (
    <div
      className="p-4 sm:p-6 lg:p-10 bg-gray-100 min-h-screen font-sans text-gray-900"
      dir="rtl"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-6 border-b border-gray-300 gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-3 bg-white rounded-2xl shadow-sm border border-gray-200 hover:bg-gray-50 transition active:scale-95 cursor-pointer"
          >
            <ArrowRight size={20} className="text-gray-700" />
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900">
              مراجعة تعديلات القائمة
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              اعتماد وتحديث منتجات وتصنيفات المطاعم بمرونة واحترافية
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between w-full sm:w-auto gap-3">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-200/80 text-gray-800 font-bold text-xs rounded-2xl border border-gray-300 shadow-sm">
            <AlertCircle size={16} className="text-red-600 animate-pulse" />
            <span>{totalPending} طلب معلق</span>
          </div>

          {totalPending > 0 && (
            <button
              disabled={isBulkLoading}
              onClick={handleApproveAll}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-2xl shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isBulkLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <CheckCheck size={16} />
              )}
              <span>قبول الكل دفعة واحدة</span>
            </button>
          )}
        </div>
      </div>

      {totalPending === 0 ? (
        <div className="flex flex-col items-center justify-center bg-white rounded-3xl p-16 shadow-sm border border-gray-200 text-center space-y-4">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-600 mb-2">
            <Utensils size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-800">كل شيء محدث!</h3>
          <p className="text-gray-400 text-sm max-w-sm">
            لا توجد أي تعديلات أو منتجات معلقة بانتظار المراجعة حالياً.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {pendingCategories.map((cat) => {
            const catName =
              typeof cat.pendingData === "string"
                ? cat.pendingData
                : typeof cat.pendingData === "object" &&
                    cat.pendingData !== null
                  ? cat.pendingData.category
                  : cat.category;

            const catProducts = pendingProducts.filter((p: PendingItem) => {
              const matchesId =
                p.categoryId &&
                String(p.categoryId).trim() === String(cat._id).trim();
              const matchesName =
                catName &&
                p.category &&
                p.category.trim().toLowerCase() ===
                  catName.trim().toLowerCase();
              return matchesId || matchesName;
            });

            const isCatCreation = cat.approvalStatus === "pending_creation";

            return (
              <div
                key={cat._id}
                className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden transition hover:shadow-md"
              >
                <div className="p-5 sm:px-8 sm:py-5 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-gray-200 flex items-center justify-center text-red-600 shrink-0">
                      <Layers size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        {isCatCreation ? (
                          <span className="font-black text-gray-900 text-base">
                            {cat.category}
                          </span>
                        ) : (
                          <div className="flex items-center gap-2 text-sm sm:text-base">
                            <span className="line-through text-gray-400 font-bold">
                              {cat.category || "بدون اسم"}
                            </span>
                            <span className="text-red-600 font-black">←</span>
                            <span className="font-black text-red-600">
                              {catName || cat.category}
                            </span>
                          </div>
                        )}
                        <span
                          className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${isCatCreation ? "bg-gray-200 text-gray-800 border border-gray-300" : "bg-red-50 text-red-700 border border-red-200"}`}
                        >
                          {isCatCreation
                            ? "تصنيف جديد مع منتجاته"
                            : "تعديل اسم التصنيف"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                        <Store size={14} className="text-gray-400" />
                        <span>مطعم:</span>
                        <strong className="text-gray-800 font-bold">
                          {cat.restaurantInfo?.name ||
                            cat.restaurantInfo?.nameEtabliss}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-200">
                    <button
                      disabled={actionLoadingId === cat._id}
                      onClick={() => handleApproveCategoryWithProducts(cat._id)}
                      className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={15} /> قبول التصنيف ومنتجاته
                    </button>
                    <button
                      disabled={actionLoadingId === cat._id}
                      onClick={() => handleRejectCategory(cat._id)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <XCircle size={15} /> رفض
                    </button>
                  </div>
                </div>

                {catProducts.length > 0 && (
                  <div className="p-4 sm:p-6 bg-white">
                    <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-4 px-2">
                      المنتجات الخاصة بهذا التصنيف ({catProducts.length})
                    </p>

                    <div className="space-y-3">
                      {catProducts.map((prod: PendingItem) => {
                        const isProdCreation =
                          prod.approvalStatus === "pending_creation";
                        const pendingObj =
                          typeof prod.pendingData === "object" &&
                          prod.pendingData !== null
                            ? prod.pendingData
                            : null;

                        const imageUrl =
                          pendingObj?.image || prod.image || "/placeholder.png";
                        const displayTitle = pendingObj?.title || prod.title;

                        // تحديد ما تم تعديله بدقة
                        const hasImageChanged =
                          pendingObj?.image && pendingObj.image !== prod.image;
                        const hasTitleChanged =
                          pendingObj?.title && pendingObj.title !== prod.title;
                        const hasPriceChanged =
                          pendingObj?.price !== undefined &&
                          pendingObj.price !== prod.price;

                        return (
                          <div
                            key={prod._id}
                            className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50/80 hover:bg-gray-100/60 border border-gray-200/80 rounded-2xl gap-4 transition"
                          >
                            <div className="flex items-center gap-3.5 w-full sm:w-auto">
                              <div
                                onClick={() => setPreviewImage(imageUrl)}
                                className="relative group cursor-pointer w-14 h-14 rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm shrink-0"
                              >
                                <img
                                  src={imageUrl}
                                  alt=""
                                  className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                                  <Eye size={16} />
                                </div>
                                {hasImageChanged && (
                                  <span className="absolute top-0 right-0 bg-red-600 text-white text-[9px] px-1 rounded-bl font-bold">
                                    صورة جديدة
                                  </span>
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-bold text-gray-900 text-sm">
                                    {displayTitle}
                                  </h4>
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isProdCreation ? "bg-gray-200 text-gray-800" : "bg-red-50 text-red-700 border border-red-200"}`}
                                  >
                                    {isProdCreation ? "منتج جديد" : "تعديل"}
                                  </span>

                                  {!isProdCreation && (
                                    <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                      <span>نوع التعديل:</span>
                                      {hasImageChanged && <span>[صورة]</span>}
                                      {hasTitleChanged && <span>[اسم]</span>}
                                      {hasPriceChanged && <span>[سعر]</span>}
                                    </div>
                                  )}
                                </div>
                                {!isProdCreation && hasTitleChanged && (
                                  <p className="text-xs text-gray-400 line-through mt-0.5">
                                    الاسم القديم: {prod.title}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-200">
                              <div className="text-left">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={
                                      hasPriceChanged
                                        ? "line-through text-gray-400 text-xs"
                                        : "font-extrabold text-gray-900 text-sm"
                                    }
                                  >
                                    {prod.price} د.ج
                                  </span>
                                  {hasPriceChanged && (
                                    <span className="font-black text-red-600 text-sm">
                                      {pendingObj?.price} د.ج
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  disabled={actionLoadingId === prod._id}
                                  onClick={() =>
                                    handleProductAction(prod._id, "approve")
                                  }
                                  className="px-3.5 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
                                >
                                  قبول
                                </button>
                                <button
                                  disabled={actionLoadingId === prod._id}
                                  onClick={() =>
                                    handleProductAction(prod._id, "reject")
                                  }
                                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
                                >
                                  رفض
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {unlinkedProducts.length > 0 && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 space-y-4">
              <h3 className="text-sm font-extrabold text-gray-700 flex items-center gap-2">
                <Package size={18} className="text-red-600" />
                <span>
                  المنتجات المعلقة المنفصلة ({unlinkedProducts.length})
                </span>
              </h3>

              <div className="space-y-3">
                {unlinkedProducts.map((prod: PendingItem) => {
                  const isProdCreation =
                    prod.approvalStatus === "pending_creation";
                  const pendingObj =
                    typeof prod.pendingData === "object" &&
                    prod.pendingData !== null
                      ? prod.pendingData
                      : null;

                  const imageUrl =
                    pendingObj?.image || prod.image || "/placeholder.png";
                  const displayTitle = pendingObj?.title || prod.title;

                  const hasImageChanged =
                    pendingObj?.image && pendingObj.image !== prod.image;
                  const hasTitleChanged =
                    pendingObj?.title && pendingObj.title !== prod.title;
                  const hasPriceChanged =
                    pendingObj?.price !== undefined &&
                    pendingObj.price !== prod.price;

                  return (
                    <div
                      key={prod._id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50/85 border border-gray-200 rounded-2xl gap-4"
                    >
                      <div className="flex items-center gap-3.5 w-full sm:w-auto">
                        <div
                          onClick={() => setPreviewImage(imageUrl)}
                          className="relative group cursor-pointer w-14 h-14 rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm shrink-0"
                        >
                          <img
                            src={imageUrl}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                            <Eye size={16} />
                          </div>
                          {hasImageChanged && (
                            <span className="absolute top-0 right-0 bg-red-600 text-white text-[9px] px-1 rounded-bl font-bold">
                              صورة جديدة
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-gray-900 text-sm">
                              {displayTitle}
                            </h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-800">
                              {isProdCreation ? "منتج جديد" : "تعديل"}
                            </span>

                            {!isProdCreation && (
                              <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                <span>نوع التعديل:</span>
                                {hasImageChanged && <span>[صورة]</span>}
                                {hasTitleChanged && <span>[اسم]</span>}
                                {hasPriceChanged && <span>[سعر]</span>}
                              </div>
                            )}
                          </div>
                          {!isProdCreation && hasTitleChanged && (
                            <p className="text-xs text-gray-400 line-through mt-0.5">
                              الاسم القديم: {prod.title}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-200">
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <span
                              className={
                                hasPriceChanged
                                  ? "line-through text-gray-400 text-xs"
                                  : "font-extrabold text-gray-900 text-sm"
                              }
                            >
                              {prod.price} د.ج
                            </span>
                            {hasPriceChanged && (
                              <span className="font-black text-red-600 text-sm">
                                {pendingObj?.price} د.ج
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            disabled={actionLoadingId === prod._id}
                            onClick={() =>
                              handleProductAction(prod._id, "approve")
                            }
                            className="px-3.5 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
                          >
                            قبول
                          </button>
                          <button
                            disabled={actionLoadingId === prod._id}
                            onClick={() =>
                              handleProductAction(prod._id, "reject")
                            }
                            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
                          >
                            رفض
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            className="relative max-w-lg w-full bg-white rounded-3xl overflow-hidden shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 left-4 p-2 bg-black/60 hover:bg-black text-white rounded-full transition cursor-pointer z-10"
            >
              <X size={18} />
            </button>
            <img
              src={previewImage}
              alt="Preview"
              className="w-full max-h-[75vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
