"use client";

import React from "react";
import { useState, useEffect, useRef } from "react";
import { GetOrdersPending } from "./api/GetDetailesOrder";
import { useParams } from "next/navigation";
import { useUser } from "@/app/context/UserContext";
import { Order, Driver } from "@/app/types/Orders";
import { PageShimmer } from "./components/shimmerPage";
import { SearchDriver } from "./api/SearchDriver";
import { useSocket } from "@/app/hooks/useSocket";
import { DiscountRow } from "../Detailes/page";

function isValidObjectId(id: string) {
  return /^[0-9a-fA-F]{24}$/.test(id);
}
const OrderDetails = () => {
  const { orderId } = useParams();
  const validOrderId = orderId as string;
  const { user } = useUser();
  const didFetch = useRef(false);
  const [detailesOrders, setDetailesOrders] = useState<Order | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const { socket, ready } = useSocket();
  const [currentDriver, setCurrentDriver] = useState<Driver[]>([]);

  //console.log(user);

  useEffect(() => {
    if (!user) return;
    if (!orderId || !isValidObjectId(validOrderId)) {
      //console.log("error");
      return;
    }
    setDriver(null);

    if (ready && socket) {
      socket?.off("timerUpdate");
      socket?.on("timerUpdate", (e) => {
        if (!e) return;
        if (e.orderId === validOrderId) {
          if (Array.isArray(e.driver)) {
            const formattedDrivers = e.driver.map((d: Driver) => ({
              ...d,
            }));
            setCurrentDriver(formattedDrivers);
          }
        }
      });

      socket?.off("searchExpired");
      socket?.on("searchExpired", (e) => {
        if (!e) return;
        setCurrentDriver([]);
      });
      //acceptedOrder_with_Driver
      socket?.off("send_admin");
      socket?.on("send_admin", (e) => {
        if (!e) return;
        const order: Order = e;
        if (order.driver && order._id === validOrderId) {
          order.driver.id = e.driver._id;
          setDriver(order.driver);
          setCurrentDriver([]);
        }
      });
    }

    didFetch.current = true;
    GetOrdersPending(
      user,
      validOrderId,
      setDetailesOrders,
      setLoading,
      setCurrentDriver,
      setDriver,
    );
  }, [user, ready, socket]);

  if (loading) return <PageShimmer />;
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            Order #{detailesOrders?.TrackingId}{" "}
            <span className="text-xs md:text-sm font-normal px-2 py-1 bg-blue-100 text-blue-600 rounded-full">
              ⚡ Active
            </span>
          </h1>
          <p className="text-xs md:text-sm text-gray-500">
            Ordered via Website • {detailesOrders?.listOrder.length} Products •
            Delivery with Bulek Eats
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="w-full sm:w-auto px-4 py-2 border rounded-lg flex items-center gap-2 hover:bg-gray-100">
            Export
          </button>
          <button className="w-full sm:w-auto px-4 py-2 border rounded-lg flex items-center gap-2 hover:bg-gray-100">
            Print
          </button>
          <button className="w-full sm:w-auto px-4 py-2 bg-black text-white rounded-lg flex items-center gap-2">
            Confirm Return
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Card */}
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold">
                BF
              </div>
              <div>
                <h3 className="font-semibold">
                  {detailesOrders?.restaurantId.nameEtabliss}
                </h3>
                <p className="text-xs md:text-sm text-gray-400">
                  {detailesOrders?.restaurantId.typeEtabliss}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="px-3 py-1.5 border rounded-md text-sm w-full sm:w-auto">
                <a href={`tel:+${detailesOrders?.restaurantId.phoneNumber}`}>
                  +{detailesOrders?.restaurantId.phoneNumber}
                </a>
              </button>
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold">
                BF
              </div>
              <div>
                <h3 className="font-semibold">
                  {detailesOrders?.send.firstName},
                  {detailesOrders?.send.lastName}
                </h3>
                <p className="text-xs md:text-sm text-gray-400">Individual</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="px-3 py-1.5 border rounded-md text-sm w-full sm:w-auto">
                <a href={`tel:+${detailesOrders?.send.phoneNumber}`}>
                  +{detailesOrders?.send.phoneNumber}
                </a>
              </button>
            </div>
          </div>

          {/* Product Rent Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 md:p-6 border-b">
              <h3 className="font-bold text-sm md:text-base">
                Product Rent ({detailesOrders?.listOrder.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-125">
                <thead className="bg-gray-50 text-xs md:text-sm uppercase text-gray-500">
                  <tr>
                    <th className="p-2 md:p-4">Item Details</th>
                    <th className="p-2 md:p-4">Quantity</th>
                    <th className="p-2 md:p-4">Charge</th>
                    <th className="p-2 md:p-4">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {detailesOrders?.listOrder?.map((product, index) => (
                    <ProductRow
                      key={index}
                      name={product.category}
                      sku={product.title}
                      qty={product.qentity}
                      charge={product.originalPrice}
                      total={product.totalprice}
                      currency={product.currency}
                    />
                  ))}

                  {/* إذا لم توجد منتجات */}
                  {(!detailesOrders?.listOrder ||
                    detailesOrders.listOrder.length === 0) && (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-gray-500">
                        No products found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals Section */}
            <div className="p-4 md:p-6 bg-gray-50 flex justify-end">
              <div className="w-full max-w-xs space-y-2 text-sm md:text-base">
                <div>
                  <p className="text-md font-semibold text-gray-800">
                    Détail du paiement
                  </p>
                  <div className="flex justify-between">
                    <p className="text-md text-gray-500">Prix total</p>
                    <p className="text-md text-gray-500">
                      {detailesOrders!.totalOrderPrice}{" "}
                      {detailesOrders!.currency}
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-md text-gray-500">Tax</p>
                    <p className="text-md text-gray-500">
                      {detailesOrders!.orderTax} %
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-md text-gray-500">Bénéfice</p>
                    <p className="text-md text-red-600">
                      -{detailesOrders!.taxAmount} {detailesOrders!.currency}
                    </p>
                  </div>
                  {/* <div className="flex justify-between">
                    <p className="text-md text-gray-500">Rabais</p>
                    <p className="text-md text-red-500">
                      - {detailesOrders!.diffDiscounted}{" "}
                      {detailesOrders!.currency}
                    </p>
                  </div> */}

                  {detailesOrders!.promoCodes && (
                    <div className="mt-2 border-t pt-2 space-y-1">
                      {/* رمز العرض */}
                      <div className="flex justify-between pb-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-700">
                          Code promo
                        </p>
                        <p className="text-sm font-bold">
                          {detailesOrders!.promoCodes.promoCode}
                        </p>
                      </div>

                      {/* خصومات التطبيق */}
                      <div className="pt-1">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                          Remises Application
                        </p>
                        <DiscountRow
                          label="Remise sur repas (App)"
                          value={detailesOrders!.appFoodpromo}
                          currency={detailesOrders!.currency}
                        />
                        <DiscountRow
                          label="Remise livraison (App)"
                          value={detailesOrders!.appDeliverypromo}
                          currency={detailesOrders!.currency}
                        />
                        <DiscountRow
                          label="Total remise (App)"
                          value={detailesOrders!.appTotalpromo}
                          currency={detailesOrders!.currency}
                        />
                      </div>

                      {/* خصومات المتجر */}
                      <div className="pt-1">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                          Remises Boutique
                        </p>
                        <DiscountRow
                          label="Remise totale (Boutique)"
                          value={detailesOrders!.storTotalpromo}
                          currency={detailesOrders!.currency}
                        />
                        <DiscountRow
                          label="Remise livraison (Boutique)"
                          value={detailesOrders!.storeDeliverypromo}
                          currency={detailesOrders!.currency}
                        />
                      </div>

                      {/* المجموع الكلي للخصم */}
                      <div className="flex justify-between mt-2 pt-2 border-t border-dashed border-gray-300">
                        <p className="text-sm font-bold text-gray-800">
                          Total remise
                        </p>
                        <p className="text-sm font-bold text-red-600">
                          -{detailesOrders!.storTotalpromo}{" "}
                          {detailesOrders!.currency}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* {detailesOrders!.diffDiscounted > 0 && (
                    <p className="text-xs text-amber-600 mt-1 italic">
                      Rabais هذا الخصم تتحمّله إدارة التطبيق بالكامل.
                    </p>
                  )} */}

                  <div className="flex justify-between border-t mt-2 pt-2">
                    <p className="text-md font-bold text-gray-800">
                      Prix final
                    </p>
                    <p className="text-md font-bold text-gray-800">
                      {detailesOrders!.restaurantNetAmount -
                      //  detailesOrders!.diffDiscounted -
                        detailesOrders!.storTotalpromo}{" "}
                      {detailesOrders!.currency}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Payments) */}
        {/* Right Column (Driver Info) */}
        {/* عرض قائمة السائقين الذين يتلقون الطلب حالياً */}
        {currentDriver && currentDriver.length > 0 ? (
          <div className="space-y-4">
            {currentDriver.map((driver) => (
              <div
                key={driver.id}
                className="flex flex-col items-center gap-3 py-6 bg-gray-50 rounded-lg shadow-md border w-full max-w-sm mx-auto animate-fadeIn"
              >
                {/* دائرة الحروف */}
                <div
                  className="w-20 h-20 text-white rounded-full flex items-center justify-center text-2xl font-bold animate-pulse"
                  style={{
                    backgroundColor: `#${driver.color?.code.split("0xff")[1] || "AE19F3"}`,
                  }}
                >
                  {driver.firstName?.[0]?.toUpperCase() || "?"}
                  {driver.lastName?.[0]?.toUpperCase() || "?"}
                </div>

                {/* اسم السائق */}
                <h2 className="text-lg font-semibold text-gray-800">
                  {driver.firstName} {driver.lastName}
                </h2>

                {/* نوع الدراجة */}
                <p className="text-gray-600 text-sm">
                  🚲 {driver.color?.code.split("0xff")[1] || "N/A"}
                </p>

                <p className="text-xs text-orange-500 font-medium">
                  الطلب يرن عند هذا السائق الآن...
                </p>
              </div>
            ))}
          </div>
        ) : driver ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-sm md:text-base">Driver Info</h3>
              <span className="text-xs md:text-sm bg-green-50 text-green-600 px-2 py-1 rounded">
                Assigned
              </span>
            </div>

            {/* بيانات السائق المعين */}
            <div className="flex flex-col gap-3">
              {/* الاسم الكامل */}
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm font-medium">Name:</span>
                <span className="text-sm md:text-base font-semibold text-gray-800">
                  {driver.firstName} {driver.lastName}
                </span>
              </div>

              {/* رقم الهاتف */}
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm font-medium">
                  Phone:
                </span>
                <a
                  href={`tel:+${driver.phoneNumber}`}
                  className="text-sm md:text-base text-blue-600 hover:underline"
                >
                  {driver.phoneNumber}
                </a>
              </div>

              {/* معلومات المركبة */}
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm font-medium">
                  Vehicle:
                </span>
                <span className="text-sm md:text-base text-gray-800">
                  {driver.Model || "Standard Bike"}
                </span>
              </div>

              {/* اللون */}
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm font-medium">
                  Color:
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full border"
                    style={{
                      backgroundColor: `#${driver.color?.code.split("0xff")[1] || "000000"}`,
                    }}
                  />
                  <span className="text-sm md:text-base text-gray-800">
                    {driver.color?.name || "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* زر البحث إذا لم يوجد سائق معين أو بحث نشط */
          <div className="flex flex-col items-center justify-center gap-4 py-6">
            <p className="text-gray-500 text-sm md:text-base">
              No driver assigned yet.
            </p>
            <button
              onClick={async () => {
                if (!detailesOrders) return;
                await SearchDriver(detailesOrders);
              }}
              className="w-full py-3 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition"
            >
              Search for Driver
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Product Row Component
interface DetailesOrder {
  name: string | undefined;
  sku: string;
  qty: number;
  charge: number;
  total: number;
  currency: string;
}

const ProductRow = ({
  name,
  sku,
  qty,
  charge,
  total,
  currency,
}: DetailesOrder) => (
  <tr>
    <td className="p-2 md:p-4">
      <div className="font-medium">{name}</div>
      <div className="text-xs md:text-sm text-gray-400">{sku}</div>
    </td>
    <td className="p-2 md:p-4 text-sm">{qty}</td>
    <td className="p-2 md:p-4 text-sm">{`${charge} ${currency}`}</td>
    <td className="p-2 md:p-4 text-sm font-bold">{`${total} ${currency}`}</td>
  </tr>
);

export default OrderDetails;
