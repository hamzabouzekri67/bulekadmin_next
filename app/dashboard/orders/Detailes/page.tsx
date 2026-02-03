"use client";
import { ListOrder, Order, UnavailableProduct } from "@/app/types/Orders";
import { FetchPendingOrders } from "../Detailes/controller/pendingOrderController";
import OrderTimeDialog from "./components/OrderTimeDialog";
import Link from "next/link";
import { useState } from "react";
import { RejectedOrders } from "./api/HandleOrders";

export default function Detailes() {
  const { newOrders, setNewOrders, user } = FetchPendingOrders();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [unavailableProducts, setUnavailableProducts] = useState<
    UnavailableProduct[]
  >([]);
  const [indexMessage, setIndexMessage] = useState(-1);

  const reasons = [
    "المنتج غير متوفر",
    "المطعم مزدحم جدًا",
    "لا يمكن التوصيل الآن",
    "خارج وقت العمل",
    "حدث تأخير غير متوقع أدى للإلغاء",
    "الطلبية تحتوي على خطأ في التفاصيل",
  ];

  function getDistanceKm(
    lat1: number,
    lat2: number,
    lon1: number,
    lon2: number,
  ) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;
    const distanceM = distanceKm * 1000;
    return distanceKm < 1
      ? distanceM.toFixed(0) + " M "
      : distanceKm.toFixed(0) + " km ";
  }

  const toggleProduct = (product: UnavailableProduct) => {
    setUnavailableProducts((prev) => {
      if (prev.some((p) => p.id === product.id)) {
        return prev.filter((p) => p.id !== product.id);
      }
      return [...prev, product];
    });
  };

  const handleConfirm = (order: Order | null) => {
    if (!reason) {
      alert("يرجى اختيار سبب الرفض");
      return;
    }

    if (reason === "المنتج غير متوفر" && unavailableProducts.length === 0) {
      alert("يرجى اختيار المنتجات الغير متوفرة");
      return;
    }

    //console.log("Reject order:", order?.id, "Reason:", indexMessage);

    // if (unavailableProducts.length > 0) {
    //console.log("Unavailable products:", unavailableProducts);

    // }
    RejectedOrders({
      order,
      unavailableProducts,
      user,
      indexMessage,
      setNewOrders,
    });

    setOpen(false);
    setReason("");
    setUnavailableProducts([]);
  };

  const handleOpenGoogleMaps = (order: Order) => {
    const originLat = order.restaurant.postionsEtabliss.coordinates[1];
    const originLng = order.restaurant.postionsEtabliss.coordinates[0];

    const destLat = order.postionsClient.coordinates[1];
    const destLng = order.postionsClient.coordinates[0];

    const navigationLink =
      `https://www.google.com/maps/dir/?api=1` +
      `&origin=${originLat},${originLng}` +
      `&destination=${destLat},${destLng}` +
      `&travelmode=driving`;

    window.open(navigationLink, "_blank");
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-2">طلبات جديدة</h1>

      <div className="flex flex-col gap-4">
        {newOrders.map((order, index) => (
          <div
            key={index}
            className="bg-white shadow-lg rounded-xl p-4 flex flex-col gap-3 border border-gray-300"
          >
            <div className="flex justify-between">
              <p className="text-md font-semibold text-gray-800">
                Order# {index + 1}
              </p>

              <p className="text-sm text-gray-500">
                {new Intl.DateTimeFormat("fr-FR", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(order.timeOrder))}
              </p>
            </div>

            <div>
              <p className="text-md font-semibold text-gray-800">
                Détails du client
              </p>

              <div className="flex justify-between">
                {order.send && (
                  <p className="text-sm text-gray-500">
                    {order.send.firstName} {order.send.lastName}
                  </p>
                )}

                <a
                  href={`tel:+${order.send.phoneNumber}`}
                  className="text-sm text-gray-500"
                >
                  +{order.send.phoneNumber}
                </a>
              </div>

              <div
                className="flex justify-between"
                onClick={() => handleOpenGoogleMaps(order)}
              >
                <p className="text-sm text-gray-500">Distance</p>

                <p className="text-sm text-gray-500">
                  {getDistanceKm(
                    order.restaurant.postionsEtabliss.coordinates[0],
                    order.postionsClient.coordinates[0],
                    order.restaurant.postionsEtabliss.coordinates[1],
                    order.postionsClient.coordinates[1],
                  )}
                </p>
              </div>

              <div className="flex justify-between">
                <p className="text-sm text-gray-500">Total commend complete</p>

                <p className="text-sm text-gray-500">{order.orderCompleted}</p>
              </div>
            </div>

            <div>
              <p className="text-md font-semibold text-gray-800">
                Détails de la boutique
              </p>

              <div className="flex justify-between">
                <p className="text-md text-gray-500">
                  {order.restaurant.nameEtabliss}
                </p>

                <a
                  href={`tel:+${order.restaurant.phoneNumber}`}
                  className="text-sm text-gray-500"
                >
                  +{order.restaurant.phoneNumber}
                </a>
              </div>
            </div>

            <div>
              <p className="text-md font-semibold text-gray-800">
                Détails de livraison
              </p>

              <div className="flex justify-between">
                <p className="text-md text-gray-500">Prix ​​de livraison</p>

                <p className="text-md text-gray-500">
                  {order.feedelivery} {order.currency}
                </p>
              </div>
              <div className="flex justify-between">
                <p className="text-md text-gray-500">Mémorisation</p>

                <p className="text-md text-red-500">
                  {order.offerfee} {order.currency}
                </p>
              </div>
              <div className="flex justify-between">
                <p className="text-md text-gray-500">Prix ​​après remise</p>

                <p className="text-md text-gray-500">
                  {Number.parseInt(order.feedelivery) - order.offerfee}{" "}
                  {order.currency}
                </p>
              </div>
            </div>

            <div>
              <p className="text-md font-semibold text-gray-800">
                Détails de la commande
              </p>
            </div>
            <div className="bg-white rounded-md p-2 border text-sm text-gray-600 break-all">
              {order.listOrder.map((listprod, indexProd) => (
                <div
                  key={indexProd}
                  className="mb-3 border-b pb-2 last:border-b-0 last:pb-0"
                >
                  <h4 className="text-gray-700 font-semibold mb-1">
                    {listprod.category}
                  </h4>

                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 py-1">
                    <span className="text-sm sm:text-base font-bold">
                      {listprod.title} (x{listprod.qentity})
                    </span>

                    <span className="text-sm sm:text-base font-semibold text-green-700">
                      {listprod.totalprice} {order.currency}
                    </span>
                  </div>

                  {listprod.listSuplement &&
                    listprod.listSuplement.length > 0 &&
                    listprod.listSuplement.map((c) => (
                      <div
                        key={c.id}
                        className="text-xs sm:text-sm text-gray-500 italic"
                      >
                        {c.title} (x{c.qty}) - {Number(c.price) * c.qty}{" "}
                        {order.currency}
                      </div>
                    ))}
                  {listprod.messageOrder && (
                    <div className="text-xs sm:text-sm text-gray-500 italic mt-1">
                      Message: {listprod.messageOrder}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div>
              <p className="text-md font-semibold text-gray-800">
                Détail du paiement
              </p>

              <div className="flex justify-between">
                <p className="text-md text-gray-500">Prix ​​total</p>

                <p className="text-md text-gray-500">
                  {order.totalOrderPrice} {order.currency}
                </p>
              </div>
              <div className="flex justify-between">
                <p className="text-md text-gray-500">Tax</p>

                <p className="text-md text-gray-500">{order.orderTax} %</p>
              </div>

              <div className="flex justify-between">
                <p className="text-md text-gray-500">Bénéfice</p>

                <p className="text-md text-red-600">
                  -{order.taxAmount} {order.currency}
                </p>
              </div>

              <div className="flex justify-between">
                <p className="text-md text-gray-500">Rabais</p>
                <p className="text-md text-red-500">
                  - {order.diffDiscounted} {order.currency}
                </p>
              </div>

              {order.promoCodes && (
                <>
                  <div className="flex justify-between">
                    <p className="text-md text-gray-500">Code promo</p>
                    <p className="text-md text-black">
                      {order.promoCodes.content}
                    </p>
                  </div>

                  <div className="flex justify-between">
                    <p className="text-md text-gray-500">Remise magasin</p>
                    <p className="text-md text-green-900">
                      {order.promoCodes.storePercent} % (
                      {(order.promoCodes.storePercent / 100) *
                        order.totalOrderPrice} {order.currency}
                      )
                    </p>
                  </div>

                  <div className="flex justify-between">
                    <p className="text-md text-gray-500">Remise application</p>
                    <p className="text-md text-green-900">
                      {order.promoCodes.defaultPercent} % (
                      {(order.promoCodes.defaultPercent / 100) *
                        order.totalOrderPrice} {order.currency}
                      )
                    </p>
                  </div>

                  <div className="flex justify-between">
                    <p className="text-md text-gray-500">Remise totale</p>
                    <p className="text-md text-red-600">
                      -{order.diffPromoCode} {order.currency}
                    </p>
                  </div>
                </>
              )}

              {order.diffDiscounted > 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  Rabais هذا الخصم تتحمّله إدارة التطبيق بالكامل.
                </p>
              )}

              <div className="flex justify-between">
                <p className="text-md text-gray-500">prix final</p>
                <p className="text-md text-gray-500">
                  {order.restaurantNetAmount -
                    order.diffDiscounted -
                    order.diffPromoCode}{" "}
                  {order.currency}
                </p>
              </div>

              {open && (
                <div className="fixed inset-0 z-50 flex items-end justify-center">
                  {/* خلفية مع Blur */}
                  <div
                    onClick={() => setOpen(false)}
                    className="absolute inset-0 bg-black/40 animate-fadeBlur"
                  />

                  {/* Bottom Sheet */}
                  <div className="relative w-full max-w-md bg-white rounded-t-3xl p-4 animate-sheetUp">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-semibold text-center mb-3">
                        سبب رفض الطلب
                      </h3>
                      <button
                        onClick={() => setOpen(false)}
                        className="text-gray-500 font-bold"
                      >
                        ✕
                      </button>
                    </div>

                    {/* قائمة الطلبات */}
                    <div className="space-y-2">
                      {reasons.map((r, i) => (
                        <label
                          key={r}
                          className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer
                      ${reason === r ? "border-black bg-red-50" : "border-gray-200"}`}
                        >
                          <input
                            type="radio"
                            name="reason"
                            value={r}
                            checked={reason === r}
                            onChange={() => {
                              setIndexMessage(i);
                              setReason(r);
                            }}
                          />
                          <span className="text-sm">{r}</span>
                        </label>
                      ))}

                      {reason === "المنتج غير متوفر" && (
                        <div className="mt-3 space-y-1 max-h-40 overflow-y-auto border-t pt-2">
                          <h3 className="text-lg font-semibold text-center mb-3">
                            المنتج غير متوفر
                          </h3>
                          {order.listOrder.map((product) => (
                            <label
                              key={product.idproducts}
                              className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-red-50"
                            >
                              <input
                                type="checkbox"
                                checked={unavailableProducts.some(
                                  (p) => p.id === product.idproducts,
                                )}
                                onChange={() =>
                                  toggleProduct({
                                    id: product.idproducts,
                                    title: product.title,
                                    category: product.category || "",
                                  })
                                }
                              />
                              <span className="text-sm">{product.title}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleConfirm(order)}
                      className="mt-4 w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-black transition-all active:scale-95"
                    >
                      تأكيد الطلب
                    </button>
                    <button
                      onClick={() => setOpen(false)}
                      className="mt-4 w-full bg-gray-200 hover:bg-gray-300 text-black py-3 rounded-xl font-black transition-all active:scale-95"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <button
                className="bg-red-600 text-white text-sm py-1 rounded-md hover:bg-red-700 transition p-4"
                onClick={() => setOpen(true)}
              >
                Rejeter
              </button>

              <Link
                className="bg-gray-600 text-white text-sm py-1 rounded-md hover:bg-gray-700 transition p-4"
                href={{
                  pathname: `/store/${order.restaurant._id}`,
                  query: { orderId: order.id },
                }}
              >
                Mettre à jour
              </Link>

              <OrderTimeDialog orders={order} user={user} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
