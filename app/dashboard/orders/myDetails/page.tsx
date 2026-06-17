"use client";
import { ListOrder, Order, UnavailableProduct } from "@/app/types/Orders";
import OrderTimeDialog from "../Detailes/components/OrderTimeDialog";
import Link from "next/link";
import { useState } from "react";
import { RejectedOrders } from "../Detailes/api/HandleOrders";
import { MyDetailesOrders } from "./api/myOrderController";

export function getDistanceKm(
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

export const handleOpenGoogleMaps = (order: Order) => {
    const originLat = order.restaurantId.postionsEtabliss.coordinates[1];
    const originLng = order.restaurantId.postionsEtabliss.coordinates[0];
    const destLat = order.postionsClient.coordinates[1];
    const destLng = order.postionsClient.coordinates[0];

    const navigationLink = `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}&travelmode=driving`;
    window.open(navigationLink, "_blank");
  };
export default function Detailes() {
  const { myOrders, setmyOrders, user } = MyDetailesOrders();

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
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

  const toggleProduct = (product: UnavailableProduct) => {
    setUnavailableProducts((prev) => {
      if (prev.some((p) => p.id === product.id)) {
        return prev.filter((p) => p.id !== product.id);
      }
      return [...prev, product];
    });
  };

  const handleConfirm = (order: Order | null) => {
    if (!order) return;
    if (!reason) {
      alert("يرجى اختيار سبب الرفض");
      return;
    }
    if (reason === "المنتج غير متوفر" && unavailableProducts.length === 0) {
      alert("يرجى اختيار المنتجات الغير متوفرة");
      return;
    }

    // console.log(order._id);

    RejectedOrders({
      order,
      unavailableProducts,
      user,
      indexMessage,
      setmyOrders,
    });

    setSelectedOrder(null);
    setReason("");
    setUnavailableProducts([]);
  };

 

  return (
    <div className="p-6 bg-gray-50 min-h-screen" dir="ltr">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Nouvelles Commandes
      </h1>

      <div className="flex flex-col gap-4 max-w-3xl mx-auto text-left">
        {myOrders.map((order, index) => (
          <div
            key={order.id || index}
            className="bg-white rounded-xl p-5 flex flex-col gap-4 border border-gray-300 shadow-sm"
          >
            {/* Header: Order ID & Date */}
            <div className="flex justify-between items-center border-b pb-2 border-gray-200">
              <p className="text-md font-bold text-gray-800">
                Commande # {index + 1}
              </p>
              <p className="text-sm text-gray-500">
                {order.createdAt
                  ? new Intl.DateTimeFormat("fr-FR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(order.createdAt))
                  : "Date inconnue"}
              </p>
            </div>

            {/* Client Details */}
            <div className="space-y-1 text-sm">
              <p className="font-semibold text-gray-800">Détails du client</p>
              <div className="flex justify-between text-gray-600">
                {order.send && (
                  <span>
                    {order.send.firstName} {order.send.lastName}
                  </span>
                )}
                <a
                  href={`tel:+${order.send.phoneNumber}`}
                  className="text-blue-600 hover:underline"
                >
                  +{order.send.phoneNumber}
                </a>
              </div>

              <div
                className="flex justify-between cursor-pointer text-blue-600"
                onClick={() => handleOpenGoogleMaps(order)}
              >
                <span>Distance (Click for Map)</span>
                <span className="font-semibold">
                  {getDistanceKm(
                    order.restaurantId.postionsEtabliss.coordinates[0],
                    order.postionsClient.coordinates[0],
                    order.restaurantId.postionsEtabliss.coordinates[1],
                    order.postionsClient.coordinates[1],
                  )}
                </span>
              </div>

              <div className="flex justify-between text-gray-500 text-xs pt-1">
                <span>Total commandes complétées</span>
                <span>{order.orderCompleted}</span>
              </div>
            </div>

            {/* Shop Details */}
            <div className="text-sm border-t pt-2 border-gray-100">
              <p className="font-semibold text-gray-800">
                Détails de la boutique
              </p>
              <div className="flex justify-between text-gray-600">
                <span>{order.restaurantId.nameEtabliss}</span>
                <a
                  href={`tel:+${order.restaurantId.phoneNumber}`}
                  className="text-blue-600 hover:underline"
                >
                  +{order.restaurantId.phoneNumber}
                </a>
              </div>
            </div>

            {/* Delivery Details */}
            <div className="space-y-1 text-sm border-t pt-2 border-gray-100">
              <p className="font-semibold text-gray-800">
                Détails de livraison
              </p>

              {/* حالة التوصيل المجاني (سواء من العرض أو من إعدادات عتبة التوصيل المجاني) */}
              {order.offerfee >= Number.parseInt(order.feedelivery) ||
              order.deliverySettings?.hasFreeDeliveryThreshold ? (
                <div className="flex justify-between text-gray-600">
                  <span>Frais de livraison</span>
                  <div className="flex gap-2">
                    <span className="line-through text-gray-400">
                      {order.feedelivery} {order.currency}
                    </span>
                    <span className="font-bold text-green-600">Gratuit</span>
                  </div>
                </div>
              ) : (
                /* الحالة العادية: لا يوجد توصيل مجاني كامل */
                <>
                  <div className="flex justify-between text-gray-600">
                    <span>Frais de livraison</span>
                    <span>
                      {order.feedelivery} {order.currency}
                    </span>
                  </div>

                  {/* يظهر التخفيض الجزئي فقط إن وجد */}
                  {order.offerfee > 0 &&
                    order.offerfee < Number.parseInt(order.feedelivery) && (
                      <>
                        <div className="flex justify-between text-gray-600">
                          <span>Remise livraison</span>
                          <span className="text-red-500">
                            -{order.offerfee} {order.currency}
                          </span>
                        </div>
                        <div className="flex justify-between font-semibold text-gray-700 bg-gray-50 p-1.5 rounded">
                          <span>Livraison après remise</span>
                          <span>
                            {Number.parseInt(order.feedelivery) -
                              order.offerfee}{" "}
                            {order.currency}
                          </span>
                        </div>
                      </>
                    )}
                </>
              )}
            </div>

            {/* Order Items */}
            <div className="space-y-1 text-sm border-t pt-2 border-gray-100">
              <p className="font-semibold text-gray-800">
                Contenu de la commande
              </p>
              <div className="bg-gray-50 rounded p-2 border border-gray-200 space-y-2">
                {order.listOrder.map((listprod, indexProd) => (
                  <div
                    key={indexProd}
                    className="border-b border-gray-200 pb-2 last:border-0 last:pb-0"
                  >
                    <span className="text-xs text-gray-400 block font-medium uppercase">
                      {listprod.category}
                    </span>
                    <div className="flex justify-between font-medium text-gray-700">
                      <span>
                        {listprod.title} (x{listprod.qentity})
                      </span>
                      <span>
                        {listprod.totalprice} {order.currency}
                      </span>
                    </div>
                    {listprod.listSuplement?.map((c) => (
                      <div
                        key={c.id}
                        className="text-xs text-gray-500 italic pl-2"
                      >
                        + {c.title} (x{c.qty}) - {Number(c.price) * c.qty}{" "}
                        {order.currency}
                      </div>
                    ))}
                    {listprod.messageOrder && (
                      <div className="text-xs text-amber-700 bg-amber-50 p-1 rounded mt-1">
                        Note: {listprod.messageOrder}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Payment & Discounts */}
            <div className="space-y-1 text-sm border-t pt-2 border-gray-100">
              <p className="font-semibold text-gray-800">Détails du paiement</p>
              <div className="flex justify-between text-gray-600">
                <span>Prix des articles</span>
                <span>
                  {order.totalOrderPrice} {order.currency}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Taxe</span>
                <span>{order.orderTax} %</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Montant Taxe</span>
                <span className="text-red-500">
                  -{order.taxAmount} {order.currency}
                </span>
              </div>

              {/* Config des remises directes du restaurant */}
              {order.discountSettings?.hasOrderDiscount && (
                <div className="bg-gray-50 border border-gray-200 rounded p-3 my-2 space-y-2">
                  <p className="font-semibold text-gray-700 text-xs">
                    ⚙️ Paramètres de remise
                  </p>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Type de remise:</span>
                    <span>
                      {order.discountSettings.discountType === "percentage"
                        ? "Pourcentage (%)"
                        : "Montant fixe"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Valeur de la remise:</span>
                    <span className="font-bold text-red-600">
                      {order.discountSettings.discountValue}{" "}
                      {order.discountSettings.discountType === "percentage"
                        ? "%"
                        : "DZD"}
                    </span>
                  </div>

                  <div className="flex justify-between text-xs text-gray-600">
                    <span>prix de la remise:</span>
                    <span className="font-bold text-red-600">
                      {order.discountAmount} {"DZD"}
                    </span>
                  </div>

                  {order.discountSettings.sponsoredBy && (
                    <div className="text-xs space-y-1 pt-1 border-t border-gray-200">
                      <p className="font-medium text-gray-500">
                        Prise en charge du rabais :
                      </p>
                      <div className="flex justify-between pl-2">
                        <span>Part Restaurant :</span>
                        <span className="font-semibold">
                          {order.discountSettings.sponsoredBy.restaurantShare}%
                        </span>
                      </div>
                      <div className="flex justify-between pl-2">
                        <span>Part Plateforme (App) :</span>
                        <span className="font-semibold">
                          {order.discountSettings.sponsoredBy.platformShare}%
                        </span>
                      </div>
                      <p className="text-[11px] text-red-600 font-medium italic mt-1">
                        * Le restaurant prend en charge 100% de cette remise.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Promo Codes Section */}
              {order.promoCodes && (
                <div className="bg-gray-50 rounded p-2 border border-gray-200 space-y-1 text-xs">
                  <div className="flex justify-between font-semibold border-b pb-1">
                    <span>Code Promo utilizado</span>
                    <span className="text-blue-600">
                      {order.promoCodes.promoCode}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Remise repas (App)</span>
                    <span>
                      {order.appFoodpromo} {order.currency}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Remise livraison (App)</span>
                    <span>
                      {order.appDeliverypromo} {order.currency}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Remise totale (Boutique)</span>
                    <span>
                      {order.storTotalpromo} {order.currency}
                    </span>
                  </div>

                  <div className="flex justify-between font-semibold text-red-600 pt-1 border-t border-dashed">
                    <span>Total remise appliquée</span>
                    <span>
                      -{order.storTotalpromo} {order.currency}
                    </span>
                  </div>
                </div>
              )}

              {/* Total Final */}
              <div className="flex justify-between font-bold text-base pt-2 border-t text-gray-900">
                <span>Net à payer Boutique</span>
                <span>
                  {order.restaurantNetAmount - order.storTotalpromo}{" "}
                  {order.currency}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 mt-2">
              <button
                className="bg-red-600 text-white text-xs py-2 px-4 rounded hover:bg-red-700"
                onClick={() => setSelectedOrder(order)}
              >
                Rejeter
              </button>
              <Link
                className="bg-gray-600 text-white text-xs py-2 px-4 rounded hover:bg-gray-700 flex items-center"
                href={{
                  pathname: `/store/${order.restaurantId._id}`,
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

      {/* Reject Modal / Bottom Sheet */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            onClick={() => setSelectedOrder(null)}
            className="absolute inset-0 bg-black/40"
          />
          <div
            className="relative w-full max-w-md bg-white rounded-t-2xl p-5 shadow-xl z-10 text-left"
            dir="ltr"
          >
            <h3 className="text-md font-bold mb-4 text-gray-800">
              Raison du refus pour la commande #{selectedOrder.TrackingId}
            </h3>

            <div className="space-y-2">
              {reasons.map((r, i) => (
                <label
                  key={r}
                  className={`flex items-center gap-2 p-2.5 rounded border cursor-pointer ${
                    reason === r
                      ? "border-red-500 bg-red-50 text-red-900"
                      : "border-gray-200 text-gray-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
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
                  <p className="text-xs font-semibold text-gray-400 mb-1">
                    Sélectionner les produits indisponibles:
                  </p>
                  {selectedOrder.listOrder.map((product) => (
                    <label
                      key={product.idproducts}
                      className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50 cursor-pointer"
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
                      <span className="text-sm text-gray-700">
                        {product.title}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 mt-4">
              <button
                onClick={() => handleConfirm(selectedOrder)}
                className="w-full bg-red-600 text-white py-2.5 rounded font-bold text-sm hover:bg-red-700"
              >
                Confirmer le refus
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-full bg-gray-100 text-gray-600 py-2.5 rounded font-bold text-sm hover:bg-gray-200"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface DiscountRowProps {
  label: string;
  value: number;
  currency: string;
}

export function DiscountRow({ label, value, currency }: DiscountRowProps) {
  if (!value || value == 0) return null;
  return (
    <div className="flex justify-between">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-sm text-green-700">
        {value} {currency}
      </p>
    </div>
  );
}
