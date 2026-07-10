"use client";
import React, { Suspense } from "react";
import { useState, useEffect, useRef } from "react";
import { GetOrdersPending } from "./api/GetDetailesOrder";
import { useParams, useSearchParams } from "next/navigation";
import { useUser } from "@/app/context/UserContext";
import { Order, Driver, ListOrder } from "@/app/types/Orders";
import { PageShimmer } from "./components/shimmerPage";
import { SearchDriver } from "./api/SearchDriver";
import { useSocket } from "@/app/hooks/useSocket";
import {
  DiscountRow,
  getDistanceKm,
  handleOpenGoogleMaps,
} from "../handlerOrders/page";
import Link from "next/link";

function isValidObjectId(id: string) {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrderDetails />
    </Suspense>
  );
}

const OrderDetails = () => {
  //  const { orderId } = useParams();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("id");
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
    <div className="min-h-screen bg-gray-50 p-4 md:p-8" dir="ltr">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2 text-gray-800">
            Order #{detailesOrders?.TrackingId}{" "}
            <span className="text-xs md:text-sm font-normal px-2 py-1 bg-blue-100 text-blue-600 rounded-full">
              ⚡ Active
            </span>
          </h1>
          <p className="text-xs md:text-sm text-gray-500">
            Ordered via Website • {detailesOrders?.listOrder?.length || 0}{" "}
            Products • Delivery with Bulek Eats
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="w-full sm:w-auto px-4 py-2 border border-gray-300 bg-white rounded-lg flex items-center justify-center gap-2 text-sm text-gray-700 hover:bg-gray-100">
            Export
          </button>
          <button className="w-full sm:w-auto px-4 py-2 border border-gray-300 bg-white rounded-lg flex items-center justify-center gap-2 text-sm text-gray-700 hover:bg-gray-100">
            Print
          </button>
          {detailesOrders?.status === "prepare" && (
            <Link
              className="bg-gray-600 text-white text-sm py-2 px-4 rounded-md hover:bg-gray-700 transition-colors flex items-center justify-center"
              href={{
                pathname: `/store/details`,
                query: {
                  id: detailesOrders?.restaurantId?._id,
                  orderId: detailesOrders?._id || detailesOrders?.id,
                },
              }}
            >
              Mettre à jour
            </Link>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Restaurant Card */}
          <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold">
                RE
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">
                  {detailesOrders?.restaurantId?.nameEtabliss}
                </h3>
                <p className="text-xs md:text-sm text-gray-400">
                  {detailesOrders?.restaurantId?.typeEtabliss}
                </p>
              </div>
            </div>
            <div className="w-full sm:w-auto">
              <button className="px-3 py-1.5 border border-gray-200 bg-gray-50 rounded-md text-sm w-full sm:w-auto text-gray-700 hover:bg-gray-100">
                <a href={`tel:+${detailesOrders?.restaurantId?.phoneNumber}`}>
                  +{detailesOrders?.restaurantId?.phoneNumber}
                </a>
              </button>
            </div>
          </div>

          {/* Customer Card */}
          <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                CL
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">
                  {detailesOrders?.send?.firstName}{" "}
                  {detailesOrders?.send?.lastName}
                </h3>
                <p className="text-xs md:text-sm text-gray-400">
                  Individual Customer
                </p>
              </div>
            </div>
            <div className="w-full sm:w-auto">
              <button className="px-3 py-1.5 border border-gray-200 bg-gray-50 rounded-md text-sm w-full sm:w-auto text-gray-700 hover:bg-gray-100">
                <a href={`tel:+${detailesOrders?.send?.phoneNumber}`}>
                  +{detailesOrders?.send?.phoneNumber}
                </a>
              </button>
            </div>
          </div>

          {/* Customer Card with Map Link */}
          <div
            onClick={() => {
              const lat = detailesOrders?.postionsClient?.coordinates[1];
              const lng = detailesOrders?.postionsClient?.coordinates[0];
              if (lat && lng) {
                window.open(
                  `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
                  "_blank",
                );
              }
            }}
            className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-start gap-4 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all duration-200 group"
          >
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
                MP
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-400 flex items-center gap-1 group-hover:text-blue-500 transition-colors">
                  🗺️ Distance (Click to view on Map)
                </p>
              </div>
            </div>

            <div className="w-full sm:w-auto bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 font-semibold text-gray-700 flex items-center justify-center">
              {detailesOrders?.restaurantId?.postionsEtabliss?.coordinates &&
              detailesOrders?.postionsClient?.coordinates ? (
                <span>
                  {getDistanceKm(
                    detailesOrders.restaurantId.postionsEtabliss.coordinates[0],
                    detailesOrders.postionsClient.coordinates[0],
                    detailesOrders.restaurantId.postionsEtabliss.coordinates[1],
                    detailesOrders.postionsClient.coordinates[1],
                  )}{" "}
                </span>
              ) : (
                <span className="text-xs text-gray-400 font-normal">N/A</span>
              )}
            </div>
          </div>

          {/* Product Rent Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 md:p-6 border-b border-gray-100">
              <h3 className="font-bold text-gray-800 text-sm md:text-base">
                Product Details ({detailesOrders?.listOrder?.length || 0})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[500px]">
                <thead className="bg-gray-50 text-xs md:text-sm uppercase text-gray-500">
                  <tr>
                    <th className="p-2 md:p-4">Item Details</th>
                    <th className="p-2 md:p-4">Quantity</th>
                    <th className="p-2 md:p-4">Charge</th>
                    <th className="p-2 md:p-4">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {detailesOrders?.listOrder?.map(
                    (product: ListOrder, index: number) => (
                      <ProductRow
                        key={index}
                        name={product.category}
                        sku={product.title}
                        qty={product.qentity}
                        charge={product.originalPrice}
                        total={product.totalprice}
                        currency={detailesOrders.currency}
                      />
                    ),
                  )}

                  {(!detailesOrders?.listOrder ||
                    detailesOrders.listOrder.length === 0) && (
                    <tr>
                      <td
                        colSpan={4}
                        className="p-4 text-center text-gray-500 text-sm"
                      >
                        Aucun produit trouvé
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals Section */}
            <div className="p-4 md:p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
              <div className="w-full max-w-xs space-y-3 text-sm md:text-base">
                <div>
                  <p className="text-md font-semibold text-gray-800 mb-2 border-b pb-1">
                    Détail du paiement
                  </p>

                  {/* 1. Prix des articles */}
                  <div className="flex justify-between py-0.5 text-sm">
                    <p className="text-gray-500">Prix articles</p>
                    <p className="font-medium text-gray-700">
                      {detailesOrders?.totalOrderPrice}{" "}
                      {detailesOrders?.currency}
                    </p>
                  </div>

                  {/* 2. Frais de livraison Base */}
                  <div className="flex justify-between py-0.5 text-sm">
                    <p className="text-gray-500">Frais livraison de base</p>
                    <p className="font-medium text-gray-700">
                      {detailesOrders?.feedelivery} {detailesOrders?.currency}
                    </p>
                  </div>

                  {/* 3. تفاصيل وحالات التوصيل المجاني والتخفيضات */}
                  {detailesOrders!.offerfee >=
                    Number.parseInt(detailesOrders?.feedelivery || "0") ||
                  detailesOrders?.deliverySettings?.hasFreeDeliveryThreshold ? (
                    /* حالة التوصيل المجاني بالكامل */
                    <div className="bg-green-50 p-2 rounded mt-1 mb-2 space-y-1 border border-green-200">
                      <div className="flex justify-between text-xs text-green-800 font-semibold">
                        <span>Statut livraison:</span>
                        <span className="uppercase">Gratuite</span>
                      </div>
                      {detailesOrders?.deliverySettings
                        ?.hasFreeDeliveryThreshold && (
                        <p className="text-[11px] text-green-600 italic">
                          * Offert par la boutique (Seuil atteint)
                        </p>
                      )}
                      {detailesOrders!.offerfee >=
                        Number.parseInt(detailesOrders?.feedelivery || "0") &&
                        !detailesOrders?.deliverySettings
                          ?.hasFreeDeliveryThreshold && (
                          <p className="text-[11px] text-green-600 italic">
                            * Offert via remise directe (-
                            {detailesOrders?.offerfee}{" "}
                            {detailesOrders?.currency})
                          </p>
                        )}
                    </div>
                  ) : (
                    /* حالة التخفيض الجزئي على التوصيل */
                    detailesOrders!.offerfee > 0 && (
                      <div className="bg-amber-50 p-2 rounded mt-1 mb-2 space-y-1 border border-amber-200 text-xs">
                        <div className="flex justify-between text-amber-800 font-medium">
                          <span>Remise sur livraison:</span>
                          <span className="text-red-600">
                            -{detailesOrders?.offerfee}{" "}
                            {detailesOrders?.currency}
                          </span>
                        </div>
                        <div className="flex justify-between text-gray-700 pt-1 border-t border-amber-200/60 font-semibold">
                          <span>Reste à payer livraison:</span>
                          <span>
                            {Number.parseInt(
                              detailesOrders?.feedelivery || "0",
                            ) - detailesOrders!.offerfee}{" "}
                            {detailesOrders?.currency}
                          </span>
                        </div>
                      </div>
                    )
                  )}

                  {/* 4. الضرائب والفوائد */}
                  <div className="flex justify-between py-0.5 text-sm">
                    <p className="text-gray-500">Taxe</p>
                    <p className="font-medium text-gray-700">
                      {detailesOrders?.orderTax} %
                    </p>
                  </div>
                  <div className="flex justify-between py-0.5 text-sm">
                    <p className="text-gray-500">Bénéfice (Taxe)</p>
                    <p className="font-medium text-red-600">
                      -{detailesOrders?.taxAmount} {detailesOrders?.currency}
                    </p>
                  </div>

                  {/* 5. التفاصيل الكاملة للكود الترويجي إن وجد */}
                  {detailesOrders?.promoCodes && (
                    <div className="mt-2 border-t pt-2 space-y-1 bg-gray-100/60 p-2 rounded border border-gray-200">
                      <div className="flex justify-between pb-1 border-b border-gray-200">
                        <p className="text-xs font-bold text-gray-600 uppercase">
                          Code utilisé
                        </p>
                        <p className="text-xs font-bold text-blue-600 px-1.5 py-0.5 bg-blue-50 rounded">
                          {detailesOrders?.promoCodes?.promoCode}
                        </p>
                      </div>

                      <div className="pt-1 space-y-0.5 text-xs">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          Détails remises
                        </p>
                        <DiscountRow
                          label="Remise repas (App)"
                          value={detailesOrders?.appFoodpromo}
                          currency={detailesOrders?.currency}
                        />
                        <DiscountRow
                          label="Remise livraison (App)"
                          value={detailesOrders?.appDeliverypromo}
                          currency={detailesOrders?.currency}
                        />
                        <DiscountRow
                          label="Remise totale (Boutique)"
                          value={detailesOrders?.storTotalpromo}
                          currency={detailesOrders?.currency}
                        />
                        <DiscountRow
                          label="Remise livraison (Boutique)"
                          value={detailesOrders?.storeDeliverypromo}
                          currency={detailesOrders?.currency}
                        />
                      </div>

                      <div className="flex justify-between mt-1 pt-1 border-t border-dashed border-gray-300 text-xs font-bold">
                        <span className="text-gray-700">
                          Total déduit (Boutique)
                        </span>
                        <span className="text-red-600">
                          -{detailesOrders?.storTotalpromo}{" "}
                          {detailesOrders?.currency}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Config des remises directes du restaurant */}
                  {detailesOrders!.discountSettings?.hasOrderDiscount && (
                    <div className="bg-gray-50 border border-gray-200 rounded p-3 my-2 space-y-2">
                      <p className="font-semibold text-gray-700 text-xs uppercase tracking-wider">
                        ⚙️ Paramètres de remise
                      </p>

                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Type de remise:</span>
                        <span>
                          {detailesOrders!.discountSettings.discountType ===
                          "percentage"
                            ? "Pourcentage (%)"
                            : "Montant fixe"}
                        </span>
                      </div>

                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Valeur de la remise:</span>
                        <span className="font-bold text-red-600">
                          {detailesOrders!.discountSettings.discountValue}{" "}
                          {detailesOrders!.discountSettings.discountType ===
                          "percentage"
                            ? "%"
                            : detailesOrders!.currency}
                        </span>
                      </div>

                      {/* حسابات التوزيع وعرض السعر قبل وبعد الخصم */}
                      {(() => {
                        const totalDiscount =
                          detailesOrders!.discountAmount || 0;
                        const restSharePercent =
                          detailesOrders!.discountSettings.sponsoredBy
                            ?.restaurantShare || 0;
                        const platSharePercent =
                          detailesOrders!.discountSettings.sponsoredBy
                            ?.platformShare || 0;

                        // المبالغ المستقطعة من كل طرف
                        const restDeduction =
                          (totalDiscount * restSharePercent) / 100;
                        const platDeduction =
                          (totalDiscount * platSharePercent) / 100;

                        // السعر المبدئي للمتجر قبل خصم هذا العرض específico
                        const netBeforeThisDiscount =
                          detailesOrders!.restaurantNetAmount -
                          detailesOrders!.storTotalpromo;

                        // السعر النهائي للمتجر بعد تحمل حصته من الخصم
                        const netAfterThisDiscount =
                          netBeforeThisDiscount - restDeduction;

                        return (
                          <div className="space-y-2 pt-2 border-t border-gray-200">
                            {/* 1. السعر قبل الخصم */}
                            <div className="flex justify-between text-xs text-gray-500 italic">
                              <span>Prix avant cette remise:</span>
                              <span className="line-through">
                                {netBeforeThisDiscount.toFixed(2)}{" "}
                                {detailesOrders?.currency}
                              </span>
                            </div>

                            {/* 2. تفاصيل اقتطاع الأطراف */}
                            <div className="bg-white p-2 rounded border border-gray-100 space-y-1 text-xs">
                              <p className="font-medium text-gray-400 text-[10px] uppercase">
                                Répartition du rabais :
                              </p>
                              <div className="flex justify-between text-gray-600 pl-1">
                                <span>
                                  Prélevé du Restaurant ({restSharePercent}%) :
                                </span>
                                <span className="font-semibold text-red-500">
                                  -{restDeduction.toFixed(2)}{" "}
                                  {detailesOrders?.currency}
                                </span>
                              </div>
                              <div className="flex justify-between text-gray-600 pl-1">
                                <span>
                                  Prélevé de la Plateforme ({platSharePercent}%)
                                  :
                                </span>
                                <span className="font-semibold text-red-500">
                                  -{platDeduction.toFixed(2)}{" "}
                                  {detailesOrders?.currency}
                                </span>
                              </div>
                            </div>

                            {/* 3. نص توضيحي ديناميكي للمسؤولية */}
                            <p className="text-[11px] text-blue-600 font-medium italic bg-blue-50 p-1.5 rounded border border-blue-100">
                              * Le restaurant prend en charge{" "}
                              {restDeduction.toFixed(2)}{" "}
                              {detailesOrders?.currency} de ce montant.
                            </p>

                            {/* 4. السعر النهائي الصافي للمتجر */}
                            <div className="flex justify-between border-t border-dashed border-gray-300 pt-2 mt-1 text-sm font-bold">
                              <span className="text-gray-800">
                                Prix final (Net après remise) :
                              </span>
                              <span className="text-green-700 text-base">
                                {netAfterThisDiscount.toFixed(2)}{" "}
                                {detailesOrders?.currency}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* السعر النهائي الكلي أسفل الفاتورة لتوثيق الصافي الإجمالي */}
                  <div className="flex justify-between border-t border-gray-300 mt-2 pt-2 text-md font-bold">
                    <p className="text-gray-900">Prix final (Net Global)</p>
                    <p className="text-green-700 text-lg">
                      {detailesOrders
                        ? (
                            detailesOrders.restaurantNetAmount -
                            detailesOrders.storTotalpromo -
                            (detailesOrders.discountAmount *
                              (detailesOrders.discountSettings?.sponsoredBy
                                ?.restaurantShare || 0)) /
                              100
                          ).toFixed(2)
                        : 0}{" "}
                      {detailesOrders?.currency}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Driver Info Section) */}
        <div className="space-y-4">
          {currentDriver && currentDriver.length > 0 ? (
            <div className="space-y-4">
              {currentDriver.map((drv: Driver) => (
                <div
                  key={drv.id}
                  className="flex flex-col items-center gap-3 py-6 bg-white rounded-xl shadow-sm border border-gray-200 w-full max-w-sm mx-auto animate-fadeIn"
                >
                  <div
                    className="w-20 h-20 text-white rounded-full flex items-center justify-center text-2xl font-bold animate-pulse"
                    style={{
                      backgroundColor: `#${drv.color?.code?.split("0xff")[1] || "AE19F3"}`,
                    }}
                  >
                    {drv.firstName?.[0]?.toUpperCase() || "?"}
                    {drv.lastName?.[0]?.toUpperCase() || "?"}
                  </div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    {drv.firstName} {drv.lastName}
                  </h2>
                  <p className="text-gray-600 text-sm">
                    🚲{" "}
                    {drv.color?.name ||
                      drv.color?.code?.split("0xff")[1] ||
                      "N/A"}
                  </p>
                  <p className="text-xs text-orange-500 font-medium">
                    Le client sonne chez ce chauffeur maintenant...
                  </p>
                </div>
              ))}
            </div>
          ) : driver ? (
            <div className="space-y-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-2 border-b pb-1">
                <h3 className="font-bold text-sm md:text-base text-gray-800">
                  Driver Info
                </h3>
                <span className="text-xs md:text-sm bg-green-50 text-green-600 px-2 py-0.5 rounded font-medium">
                  Assigned
                </span>
              </div>
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 font-medium">Name:</span>
                  <span className="font-semibold text-gray-800">
                    {driver.firstName} {driver.lastName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 font-medium">Phone:</span>
                  <a
                    href={`tel:+${driver.phoneNumber}`}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    {driver.phoneNumber}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 font-medium">Vehicle:</span>
                  <span className="text-gray-800">
                    {driver.Model || "Standard Bike"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 font-medium">Color:</span>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-4 h-4 rounded-full border"
                      style={{
                        backgroundColor: `#${driver.color?.code?.split("0xff")[1] || "000000"}`,
                      }}
                    />
                    <span className="text-gray-800">
                      {driver.color?.name || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-6 bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <p className="text-gray-500 text-sm md:text-base text-center">
                Aucun chauffeur assigné pour le moment.
              </p>
              <button
                onClick={async () => {
                  if (!detailesOrders) return;
                  await SearchDriver(detailesOrders);
                }}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition"
              >
                Search for Driver
              </button>
            </div>
          )}
        </div>
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
