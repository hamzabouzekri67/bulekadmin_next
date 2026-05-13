"use client";
import { ListOrder, Order, UnavailableProduct } from "@/app/types/Orders";
import OrderTimeDialog from "../Detailes/components/OrderTimeDialog";
import Link from "next/link";
import { useState } from "react";
import { RejectedOrders } from "../Detailes/api/HandleOrders";
import { MyDetailesOrders } from "./api/myOrderController";

export default function Detailes() {
  const { myOrders,setmyOrders, user } = MyDetailesOrders();

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
    if (!order) return;
    if (!reason) {
      alert("يرجى اختيار سبب الرفض");
      return;
    }
    if (reason === "المنتج غير متوفر" && unavailableProducts.length === 0) {
      alert("يرجى اختيار المنتجات الغير متوفرة");
      return;
    }

    console.log(order._id);

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

  const handleOpenGoogleMaps = (order: Order) => {
    const originLat = order.restaurantId.postionsEtabliss.coordinates[1];
    const originLng = order.restaurantId.postionsEtabliss.coordinates[0];
    const destLat = order.postionsClient.coordinates[1];
    const destLng = order.postionsClient.coordinates[0];

    const navigationLink = `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}&travelmode=driving`;
    window.open(navigationLink, "_blank");
  };

  return (
    <div className="p-9">
      <h1 className="text-2xl font-bold mb-4">طلبات جديدة</h1>

      <div className="flex flex-col gap-4">
        {myOrders.map((order, index) => (
          <div
            key={order.id || index}
            className="bg-white shadow-lg rounded-xl p-4 flex flex-col gap-3 border border-gray-300"
          >
            {/* Header: Order ID & Date */}
            <div className="flex justify-between">
              <p className="text-md font-semibold text-gray-800">
                Order# {index + 1}
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
                className="flex justify-between cursor-pointer text-blue-600"
                onClick={() => handleOpenGoogleMaps(order)}
              >
                <p className="text-sm">Distance (Click to Map)</p>
                <p className="text-sm">
                  {getDistanceKm(
                    order.restaurantId.postionsEtabliss.coordinates[0],
                    order.postionsClient.coordinates[0],
                    order.restaurantId.postionsEtabliss.coordinates[1],
                    order.postionsClient.coordinates[1],
                  )}
                </p>
              </div>
              <div className="flex justify-between">
                <p className="text-sm text-gray-500">Total commande complète</p>
                <p className="text-sm text-gray-500">{order.orderCompleted}</p>
              </div>
            </div>

            {/* Shop Details */}
            <div>
              <p className="text-md font-semibold text-gray-800">
                Détails de la boutique
              </p>
              <div className="flex justify-between">
                <p className="text-md text-gray-500">
                  {order.restaurantId.nameEtabliss}
                </p>
                <a
                  href={`tel:+${order.restaurantId.phoneNumber}`}
                  className="text-sm text-gray-500"
                >
                  +{order.restaurantId.phoneNumber}
                </a>
              </div>
            </div>

            {/* Delivery Details */}
            <div>
              <p className="text-md font-semibold text-gray-800">
                Détails de livraison
              </p>
              <div className="flex justify-between">
                <p className="text-md text-gray-500">Prix livraison</p>
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
                <p className="text-md text-gray-500">Prix après remise</p>
                <p className="text-md text-gray-500">
                  {Number.parseInt(order.feedelivery) - order.offerfee}{" "}
                  {order.currency}
                </p>
              </div>
            </div>

            {/* Order Items */}
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
                  <div className="flex justify-between items-center py-1">
                    <span className="font-bold">
                      {listprod.title} (x{listprod.qentity})
                    </span>
                    <span className="font-semibold text-green-700">
                      {listprod.totalprice} {order.currency}
                    </span>
                  </div>
                  {listprod.listSuplement?.map((c) => (
                    <div key={c.id} className="text-xs text-gray-500 italic">
                      {c.title} (x{c.qty}) - {Number(c.price) * c.qty}{" "}
                      {order.currency}
                    </div>
                  ))}
                  {listprod.messageOrder && (
                    <div className="text-xs text-gray-500 italic mt-1">
                      Message: {listprod.messageOrder}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Payment Details */}
            <div>
              <p className="text-md font-semibold text-gray-800">
                Détail du paiement
              </p>
              <div className="flex justify-between">
                <p className="text-md text-gray-500">Prix total</p>
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
              {/* <div className="flex justify-between">
                <p className="text-md text-gray-500">Rabais</p>
                <p className="text-md text-red-500">
                  - {order.diffDiscounted} {order.currency}
                </p>
              </div> */}

              {order.promoCodes && (
                <div className="mt-2 border-t pt-2 space-y-1">
                  {/* رمز العرض */}
                  <div className="flex justify-between pb-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-700">
                      Code promo
                    </p>
                    <p className="text-sm font-bold">
                      {order.promoCodes.promoCode}
                    </p>
                  </div>

                  {/* خصومات التطبيق */}
                  <div className="pt-1">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Remises Application
                    </p>
                    <DiscountRow
                      label="Remise sur repas (App)"
                      value={order.appFoodpromo}
                      currency={order.currency}
                    />
                    <DiscountRow
                      label="Remise livraison (App)"
                      value={order.appDeliverypromo}
                      currency={order.currency}
                    />
                    <DiscountRow
                      label="Total remise (App)"
                      value={order.appTotalpromo}
                      currency={order.currency}
                    />
                  </div>

                  {/* خصومات المتجر */}
                  <div className="pt-1">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Remises Boutique
                    </p>
                    <DiscountRow
                      label="Remise totale (Boutique)"
                      value={order.storTotalpromo}
                      currency={order.currency}
                    />
                    <DiscountRow
                      label="Remise livraison (Boutique)"
                      value={order.storeDeliverypromo}
                      currency={order.currency}
                    />
                  </div>

                  {/* المجموع الكلي للخصم */}
                  <div className="flex justify-between mt-2 pt-2 border-t border-dashed border-gray-300">
                    <p className="text-sm font-bold text-gray-800">
                      Total remise
                    </p>
                    <p className="text-sm font-bold text-red-600">
                      -{order.storTotalpromo} {order.currency}
                    </p>
                  </div>
                </div>
              )}

              {/* {order.diffDiscounted > 0 && (
                <p className="text-xs text-amber-600 mt-1 italic">
                  Rabais هذا الخصم تتحمّله إدارة التطبيق بالكامل.
                </p>
              )} */}

              <div className="flex justify-between border-t mt-2 pt-2">
                <p className="text-md font-bold text-gray-800">Prix final</p>
                <p className="text-md font-bold text-gray-800">
                  {order.restaurantNetAmount - order.storTotalpromo}{" "}
                  {order.currency}
                </p>
              </div>
            </div>

            {/* Actions Buttons */}
            <div className="flex justify-end space-x-2 mt-4">
              <button
                className="bg-red-600 text-white text-sm py-2 px-4 rounded-md hover:bg-red-700"
                onClick={() => setSelectedOrder(order)}
              >
                Rejeter
              </button>
              <Link
                className="bg-gray-600 text-white text-sm py-2 px-4 rounded-md hover:bg-gray-700"
                href={{
                  pathname: `/store/${order.restaurantId._id}`,
                  query: { orderId: order.id},
                }}
              >
                Mettre à jour
              </Link>
              <OrderTimeDialog orders={order} user={user} />
            </div>
          </div>
        ))}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            onClick={() => setSelectedOrder(null)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-md bg-white rounded-t-3xl p-5 shadow-2xl animate-sheetUp z-10">
            <h3 className="text-lg font-bold text-center mb-4">
              سبب رفض الطلب #{selectedOrder.TrackingId}
            </h3>
            <div className="space-y-2">
              {reasons.map((r, i) => (
                <label
                  key={r}
                  className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer ${reason === r ? "border-red-500 bg-red-50" : "border-gray-200"}`}
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
                  <p className="text-xs font-bold text-gray-400 mb-2">
                    اختر المنتجات:
                  </p>
                  {selectedOrder.listOrder.map((product) => (
                    <label
                      key={product.idproducts}
                      className="flex items-center gap-2 p-2 border rounded-lg hover:bg-gray-50"
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
              onClick={() => handleConfirm(selectedOrder)}
              className="mt-4 w-full bg-orange-500 text-white py-3 rounded-xl font-bold"
            >
              تأكيد الرفض
            </button>
            <button
              onClick={() => setSelectedOrder(null)}
              className="mt-2 w-full bg-gray-100 text-gray-600 py-3 rounded-xl font-bold"
            >
              إلغاء
            </button>
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
