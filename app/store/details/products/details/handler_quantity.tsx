import { CartItem, useCategories } from "@/app/context/CategoryContext";
import {
  Category,
  ListOrder,
  Order,
  Product,
  SuplementChoice,
  Supplement,
  SupplementItem,
} from "@/app/types/Orders";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { UpdateOrder } from "./api/UpdateOrder";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

interface QuantitySelectorProps {
  order: Order | null;
  product: Product;
  cartItems: CartItem[];
  openedProductId: string | null;
  setOpenedProductId: (id: string | null) => void;
  category: Category;
}

export function QuantitySelector({
  order,
  product,
  cartItems,
  setOpenedProductId,
  openedProductId,
  category,
}: QuantitySelectorProps) {
  const { updateCart } = useCategories();

  const listProducts = cartItems?.find(
    (item) => item.idproducts === product._id,
  );
  const initialQuantity = listProducts ? listProducts.qentity || 0 : 0;

  const menuRef = useRef<HTMLDivElement>(null);
  const isOpen = openedProductId === product._id;

  const [supplementQty, setSupplementQty] = useState<Record<string, number>>(
    {},
  );
  const hasInitRef = useRef(false);
  const [isRequis, setIsRequis] = useState(false);
  const [defaultSupplementQty, setDefaultSupplementQty] = useState<
    Record<string, number>
  >({});
  const [defaultQuantity, setDefaultQuantity] = useState(0);
  const [defaultChooseList, setDefaultChooseList] = useState<SuplementChoice[]>(
    [],
  );
  const [chooseList, setChooseList] = useState<SuplementChoice[]>([]);
  const [showTotal, setshowTotal] = useState<number>(0);
  const [quantity, setQuantity] = useState(0);

  // 1. قفل التمرير الخلفي لمنع تداخل القوائم على الهاتف
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // 2. تحديث الحالات الأساسية عند مزامنة السلة أو فتح الـ Bottom Sheet
  useEffect(() => {
    setQuantity(initialQuantity);

    let currentChooseList: SuplementChoice[] = [];
    if (listProducts?.listSuplement) {
      currentChooseList = JSON.parse(
        JSON.stringify(listProducts.listSuplement),
      );
    }
    setChooseList(currentChooseList);

    const supplementsPrice = currentChooseList.reduce(
      (sum, sup) => sum + Number(sup.price) * (sup.qty || 0),
      0,
    );
    setshowTotal(product.total * initialQuantity + supplementsPrice);
  }, [initialQuantity, listProducts, product.total]);

  // 3. معالجة فتح القائمة وحفظ النسخة الاحتياطية (Backup)
  useEffect(() => {
    if (isOpen) {
      setDefaultSupplementQty({ ...supplementQty });
      setDefaultQuantity(quantity);
      setDefaultChooseList(JSON.parse(JSON.stringify(chooseList)));

      const hasRequis = product.supplements.some(
        (element) => element.chose === "requis",
      );
      if (!hasRequis && quantity > 0) {
        setIsRequis(true);
      } else {
        const totalRequisQty = chooseList
          .filter((s) => s.status === "requis")
          .reduce((sum, s) => sum + (s.qty || 0), 0);
        setIsRequis(totalRequisQty === quantity && quantity > 0);
      }
    }
  }, [isOpen]);

  // 4. جلب الإضافات من الطلب الأصلي القديم (مرة واحدة فقط عند التأسيس)
  useEffect(() => {
    if (hasInitRef.current || !order || !product.supplements.length) return;

    const qtyInit: Record<string, number> = {};
    product.supplements.forEach((sup) => {
      const related =
        order?.listOrder?.filter((o) =>
          o.listSuplement?.some((c) =>
            sup.data.some((item) => item._id.toString() === c._id.toString()),
          ),
        ) || [];

      sup.data.forEach((item: SupplementItem) => {
        const foundOrder = related.find((o: ListOrder) =>
          o.listSuplement?.some(
            (c) => c._id.toString() === item._id.toString(),
          ),
        );

        const foundSupplement = foundOrder?.listSuplement?.find(
          (c) => c._id.toString() === item._id.toString(),
        );

        qtyInit[item._id] = foundSupplement ? foundSupplement.qty || 0 : 0;
      });
    });

    setSupplementQty(qtyInit);
    hasInitRef.current = true;
  }, [order, product.supplements]);

  // 5. إغلاق القائمة عند الضغط خارجها
 useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        if (isOpen) {
          // استبدل setOpenedProductId(null) بـ handleCloseBottomSheet لضمان الرجوع للقيمة الأصلية
          handleCloseBottomSheet();
        }
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, defaultSupplementQty, defaultQuantity, defaultChooseList]);

  const handleOuterClick = (isMinus: boolean) => {
    if (isMinus) {
      if (quantity <= 1) {
        handleUpdate(0, true);
      } else {
        setOpenedProductId(product._id);
      }
    } else {
      setOpenedProductId(product._id);
    }
  };

  const handleUpdate = (newQty: number, isdec: boolean) => {
    if (newQty < 0) return;

    const hasRequis = product.supplements.some(
      (element) => element.chose === "requis",
    );

    if (newQty === 0) {
      const resetSupplements: Record<string, number> = {};
      product.supplements.forEach((sup) => {
        sup.data.forEach((item) => {
          resetSupplements[item._id] = 0;
        });
      });

      setIsRequis(false);
      updateCart(product._id, 0, product, [], category);
      setSupplementQty(resetSupplements);
      setOpenedProductId(null);
      return;
    }

    let updatedChooseList = [...chooseList];

    if (isdec) {
      const qtyInit = { ...supplementQty };
      updatedChooseList = chooseList.map((element) => {
        if (element.status === "requis") {
          return element;
        }
        if ((element.qty || 0) > newQty) {
          qtyInit[element._id] = newQty;
          return { ...element, qty: newQty };
        }
        return element;
      });
      setSupplementQty(qtyInit);
      setChooseList(updatedChooseList);
    }

    if (!hasRequis) {
      setIsRequis(true);
    } else {
      const totalRequisQty = updatedChooseList
        .filter((s) => s.status === "requis")
        .reduce((sum, s) => sum + (s.qty || 0), 0);
      setIsRequis(totalRequisQty === newQty);
    }

    const supplementsPrice = updatedChooseList.reduce(
      (sum, sup) => sum + Number(sup.price) * (sup.qty || 0),
      0,
    );
    setshowTotal(product.total * newQty + supplementsPrice);
    setQuantity(newQty);
  };

  const increaseSupplement = (item: SupplementItem, chose: string) => {
    if (quantity === 0) return;
    if ((supplementQty[item._id] || 0) >= quantity) return;

    const listrequis = chooseList?.filter((sup) => sup.status === "requis");
    const totalQty = listrequis?.reduce((sum, sup) => sum + (sup.qty || 0), 0);

    if (chose === "requis" && totalQty >= quantity) return;

    const index = chooseList.findIndex((e) => e._id === item._id);
    const newList = [...chooseList];

    if (index !== -1) {
      newList[index] = {
        ...newList[index],
        qty: (newList[index].qty || 0) + 1,
      };
    } else {
      newList.push({
        id: item.id,
        price: item.plusPrice,
        title: item.name,
        _id: item._id,
        qty: 1,
        status: chose,
      });
    }

    setChooseList(newList);
    setSupplementQty((prev) => ({
      ...prev,
      [item._id]: (prev[item._id] || 0) + 1,
    }));

    const supplementsPrice = newList.reduce(
      (sum, sup) => sum + Number(sup.price) * (sup.qty || 0),
      0,
    );
    setshowTotal(product.total * quantity + supplementsPrice);

    if (chose === "requis") {
      const totalRequisQty = newList
        .filter((s) => s.status === "requis")
        .reduce((sum, s) => sum + (s.qty || 0), 0);
      setIsRequis(totalRequisQty === quantity);
    }
  };

  const decreaseSupplement = (item: SupplementItem, chose: string) => {
    if ((supplementQty[item._id] || 0) <= 0) return;

    const newList = chooseList.map((s) => ({ ...s }));
    const index = newList.findIndex((e) => e._id === item._id);
    if (index === -1) return;

    newList[index].qty = (newList[index].qty || 0) - 1;
    if (newList[index].qty === 0) {
      newList.splice(index, 1);
    }

    setChooseList(newList);
    setSupplementQty((prev) => ({
      ...prev,
      [item._id]: Math.max((prev[item._id] || 1) - 1, 0),
    }));

    const supplementsPrice = newList.reduce(
      (sum, sup) => sum + Number(sup.price) * (sup.qty || 0),
      0,
    );
    setshowTotal(product.total * quantity + supplementsPrice);

    if (chose === "requis") {
      const totalRequisQty = newList
        .filter((s) => s.status === "requis")
        .reduce((sum, s) => sum + (s.qty || 0), 0);
      setIsRequis(totalRequisQty === quantity);
    }
  };

const handleCloseBottomSheet = () => {
    // إعادة كل المتغيرات إلى قيمتها الاحتياطية الأصلية قبل الفتح
    setSupplementQty(defaultSupplementQty);
    setQuantity(defaultQuantity); // <-- هذا السطر يرجع الرقم تماماً لما كان عليه في السلة
    setChooseList(JSON.parse(JSON.stringify(defaultChooseList)));
    
    // حساب السعر الإجمالي القديم بناءً على القيمة الأصلية
    const supplementsPrice = defaultChooseList.reduce(
      (sum, sup) => sum + Number(sup.price) * (sup.qty || 0),
      0,
    );
    setshowTotal(product.total * defaultQuantity + supplementsPrice);

    // إغلاق القائمة
    setOpenedProductId(null);
  };

  return (
    <div className="flex items-center gap-1.5 bg-gray-200 rounded-full p-1 w-[105px] justify-between shadow-inner shrink-0">
      <button
        onClick={() => handleOuterClick(false)}
        className={`p-1 rounded-full transition-all active:scale-95 ${
          quantity > 0
            ? "bg-white text-red-600 shadow-sm"
            : "text-gray-400 cursor-not-allowed"
        }`}
        disabled={quantity === 0}
      >
        <Minus size={15} strokeWidth={3} />
      </button>

      <span className="font-black text-sm w-5 text-center select-none text-gray-800">
        {quantity}
      </span>

      <button
        onClick={() => handleOuterClick(false)}
        className="p-1 rounded-full bg-red-500 text-white shadow-sm hover:bg-red-600 transition-all active:scale-90"
      >
        <Plus size={15} strokeWidth={3} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[100] backdrop-blur-sm"
            onClick={handleCloseBottomSheet}
          />

          <div
            ref={menuRef}
            className="fixed bottom-0 left-0 right-0 max-h-[82vh] bg-white z-[101]
                 shadow-2xl rounded-t-3xl transform transition-transform duration-300
                 flex flex-col overflow-hidden pb-safe"
          >
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-2.5 mb-1 shrink-0" />

            <div className="flex items-center justify-between px-5 py-3 border-b shrink-0">
              <h2 className="text-base font-black text-gray-800">
                اختر الإضافات
              </h2>
              <button
                onClick={handleCloseBottomSheet}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* تم حل مشكلة الاسم الطويل هنا عبر إعطاء النص flex-1 مع line-clamp وحماية وحدة التحكم بـ shrink-0 */}
            <div className="flex items-center justify-between gap-4 px-5 py-3 border-b bg-gray-50 shrink-0">
              <div className="text-right flex-1 min-w-0">
                <h2 className="text-sm font-black text-gray-800 line-clamp-1 break-all">
                  {category.category} / {product.title}
                </h2>
                <h2 className="text-sm font-bold text-red-600 mt-0.5">
                  {product.price} {product.currency}
                </h2>
              </div>

              <div className="flex items-center gap-2 bg-gray-200 rounded-full p-1 min-w-[105px] justify-between shadow-inner shrink-0">
                <button
                  onClick={() => handleUpdate(quantity - 1, true)}
                  className={`p-1.5 rounded-full transition-all ${
                    quantity > 0
                      ? "bg-white text-red-600 shadow-sm"
                      : "text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <Minus size={15} strokeWidth={3} />
                </button>

                <span className="font-black text-sm w-5 text-center select-none text-gray-800">
                  {quantity}
                </span>

                <button
                  onClick={() => handleUpdate(quantity + 1, false)}
                  className="p-1.5 rounded-full bg-red-500 text-white shadow-md hover:bg-red-600 transition-all active:scale-90"
                >
                  <Plus size={15} strokeWidth={3} />
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-4 touch-pan-y bg-gray-50">
              {product.supplements && product.supplements.length > 0 ? (
                product.supplements.map((sup: Supplement, i: number) => (
                  <div
                    key={i}
                    className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm space-y-3"
                  >
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                      <p className="font-black text-sm text-gray-800">
                        {sup.title}
                      </p>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          sup.chose === "requis"
                            ? "bg-red-50 text-red-500"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {sup.chose === "requis" ? "إجباري" : "اختياري"}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {sup.data?.map((item: SupplementItem) => (
                        <div
                          key={item._id}
                          className="flex items-center justify-between gap-3 p-2.5 border rounded-xl bg-gray-50 hover:bg-gray-100/70 transition-colors"
                        >
                          <div className="text-right flex-1 min-w-0">
                            <p className="font-bold text-sm text-gray-800 line-clamp-1">
                              {item.name}
                            </p>
                            <span className="text-xs font-bold text-red-600">
                              {Number(item.plusPrice) > 0
                                ? `+${item.plusPrice} ${product.currency}`
                                : "مجاني"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 bg-white rounded-full px-2 py-1 shadow-sm border shrink-0">
                            <button
                              onClick={() =>
                                decreaseSupplement(item, sup.chose)
                              }
                              className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-700 font-bold active:scale-90 transition-transform"
                            >
                              −
                            </button>

                            <span className="w-4 text-center font-black text-sm text-gray-800">
                              {supplementQty[item._id] || 0}
                            </span>

                            <button
                              onClick={() =>
                                increaseSupplement(item, sup.chose)
                              }
                              className="w-7 h-7 flex items-center justify-center rounded-full bg-red-500 text-white font-bold active:scale-90 transition-transform"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-sm text-gray-400 font-medium">
                  لا توجد إضافات متوفرة لهذا المنتج
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-white shrink-0">
              <button
                onClick={
                  isRequis
                    ? () => {
                        updateCart(
                          product._id,
                          quantity,
                          product,
                          chooseList,
                          category,
                        );
                        setOpenedProductId(null);
                      }
                    : undefined
                }
                className={`w-full font-black py-3 rounded-xl shadow-md transition-all text-sm ${
                  isRequis
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {isRequis
                  ? `تحديث السلة (${showTotal.toLocaleString()} ${product.currency})`
                  : "يرجى تحديد الخيارات الإجبارية"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export interface FloatingCartProps {
  cartItems: CartItem[];
  order: unknown | null;
}

export function FloatingCart({ cartItems, order }: FloatingCartProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  const totalItems = cartItems.reduce(
    (a: number, i: CartItem) => a + (i.qentity || 0),
    0,
  );
  const totalPrice = cartItems.reduce(
    (a: number, i: CartItem) => a + (i.totalprice || 0),
    0,
  );

  if (totalItems === 0) return null;

  return (
    <>
      {/* شريط السلة العائم مع ترك مسافة آمنة للشاشات */}
      <div className="fixed bottom-4 left-0 right-0 mx-auto w-[92%] max-w-md z-[90] pb-safe pointer-events-auto">
        <div className="bg-gray-900 text-white p-3 rounded-2xl shadow-2xl flex justify-between items-center backdrop-blur-md bg-opacity-95 border border-gray-800">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="relative bg-red-600 p-2.5 rounded-xl shrink-0">
              <ShoppingBag size={18} />
              <span className="absolute -top-1.5 -right-1.5 bg-white text-red-600 text-[10px] font-black rounded-full min-w-4 h-4 px-1 flex items-center justify-center shadow-sm">
                {totalItems}
              </span>
            </div>
            <div className="text-right min-w-0 flex-1">
              <p className="text-[9px] uppercase opacity-55 font-black tracking-wider">
                إجمالي الطلب
              </p>
              <p className="font-black text-base text-red-400 truncate">
                {totalPrice.toLocaleString()} DZD
              </p>
            </div>
          </div>

          <button
            onClick={() => setOpen(true)}
            className="bg-red-500 hover:bg-red-600 px-[18px] py-2.5 rounded-xl font-black text-xs shadow-lg transition-all active:scale-95 shrink-0"
          >
            عرض السلة
          </button>
        </div>
      </div>

      {/* نافذة تفاصيل السلة المنبثقة (Modal) */}
      {open && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center">
          <div
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
          />
          <div className="relative w-full max-w-md bg-white rounded-t-3xl p-4 flex flex-col max-h-[82vh] pb-safe shadow-2xl z-10">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-2 shrink-0" />

            <div className="flex justify-between items-center pb-3 border-b shrink-0">
              <h2 className="font-black text-base text-gray-800">
                تفاصيل الطلب
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 font-bold p-1 hover:bg-gray-100 rounded-full"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 py-3 space-y-2.5 touch-pan-y">
              {cartItems.map((item: CartItem, index: number) => {
                const sups = item.listSuplement || [];
                return (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-xl p-3 border border-gray-100"
                  >
                    <div className="flex justify-between gap-4 font-black text-sm text-gray-800">
                      <span className="flex-1 text-right line-clamp-1 min-w-0">
                        {item.title}{" "}
                        <span className="text-red-500">
                          × {item.qentity}
                        </span>
                      </span>
                      <span className="text-gray-700 shrink-0">
                        {(item.totalprice || 0).toLocaleString()} DZD
                      </span>
                    </div>

                    {sups.length > 0 && (
                      <div className="mt-2 pr-2 border-r-2 border-red-200 space-y-1 text-xs text-gray-600 text-right">
                        {sups.map((sup, i) => {
                          const lineTotal = Number(sup.price) * (sup.qty || 0);
                          return (
                            <div
                              key={i}
                              className="flex justify-between items-center gap-2"
                            >
                              <span className="line-clamp-1 flex-1">
                                • {sup.title}{" "}
                                <span className="font-black text-gray-800">
                                  ({sup.qty})
                                </span>
                              </span>
                              <span className="font-semibold text-gray-500 shrink-0">
                                +{lineTotal.toLocaleString()} DZD
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t bg-white shrink-0 space-y-3">
              <div className="flex justify-between font-black text-base text-gray-900 px-1">
                <span>المجموع الإجمالي</span>
                <span className="text-red-600">
                  {totalPrice.toLocaleString()} DZD
                </span>
              </div>

              <button
                onClick={() =>
                  UpdateOrder({
                    order: order as Order | null,
                    cartItems,
                    router,
                  })
                }
                className="w-full bg-red-500 hover:bg-red-600 text-white py-3.5 rounded-xl font-black text-sm shadow-md transition-all active:scale-[0.98]"
              >
                تأكيد الطلب
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
