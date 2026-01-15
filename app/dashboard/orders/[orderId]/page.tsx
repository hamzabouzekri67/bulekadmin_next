"use client";

import React from "react";
import {useState,useEffect,useRef  } from "react";
import {GetOrdersPending} from './api/GetDetailesOrder'
import { useParams } from "next/navigation";
import { useUser  } from "@/app/context/UserContext";
import { Order ,Driver } from "@/app/types/Orders";
import {PageShimmer} from "./components/shimmerPage"
import {SearchDriver} from "./api/SearchDriver"
import {useSocket} from "@/app/hooks/useSocket";



function isValidObjectId(id: string) {
  return /^[0-9a-fA-F]{24}$/.test(id);
}
const OrderDetails = () => {
   const { orderId } = useParams();
   const validOrderId = orderId as string;
   const { user } = useUser();
   const didFetch = useRef(false);
   const [detailesOrders, setDetailesOrders] = useState< Order| null>(null);
   const [driver, setDriver] = useState<Driver | null>(null);
   const [loading, setLoading] = useState(true);
   const {socket ,ready} = useSocket()
   const [currentDriver, setCurrentDriver] = useState<Driver | null>(null);

    //console.log(user);


  
   useEffect(() => {    
     if (!user) return
     if (!orderId || !isValidObjectId(validOrderId)) {
       //console.log("error");
       return;
    }
       setDriver(null);

        if (ready && socket) {
          socket?.off("timerUpdate")
          socket?.on("timerUpdate" ,(e) =>{
            if (!e) return
            if (e.orderId === validOrderId) {
              setCurrentDriver(e)
            }

            
        })

        //searchExpired
          socket?.off("searchExpired")
          socket?.on("searchExpired" ,(e) =>{
          if (!e) return  
          setCurrentDriver(null)
        })
         //acceptedOrder_with_Driver
          socket?.off("acceptedOrder")
          socket?.on("acceptedOrder" ,(e) =>{
          if (!e) return  
          const order: Order =e
          //console.log("driverAccepted",e);
          if (order.driver) {
             order.driver.id =e.driverId
             setDriver(order.driver)
             setCurrentDriver(null)
          }
        
          })

        }

        
        
      didFetch.current = true;
      GetOrdersPending(user,validOrderId,setDetailesOrders ,setLoading,setCurrentDriver,setDriver)
  }, [user,ready,socket]);

  if (loading) return <PageShimmer />
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
            Ordered via Website • {detailesOrders?.listOrder.length} Products • Delivery with Bulek Eats
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
                <h3 className="font-semibold">{detailesOrders?.restaurant.nameEtabliss}</h3>
                <p className="text-xs md:text-sm text-gray-400">{detailesOrders?.restaurant.typeEtabliss}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="px-3 py-1.5 border rounded-md text-sm w-full sm:w-auto">
                <a href={`tel:+${detailesOrders?.restaurant.phoneNumber}`}>
                  +{detailesOrders?.restaurant.phoneNumber} 
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
                <h3 className="font-semibold">{detailesOrders?.send.firstName},{detailesOrders?.send.lastName}</h3>
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
              <h3 className="font-bold text-sm md:text-base">Product Rent ({detailesOrders?.listOrder.length})</h3>
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
                              currency = {product.currency}
                            />
                          ))}

                          {/* إذا لم توجد منتجات */}
                          {(!detailesOrders?.listOrder || detailesOrders.listOrder.length === 0) && (
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
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{detailesOrders?.totalOrderPrice} {detailesOrders?.currency}</span>
                </div>
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Tax ({detailesOrders?.orderTax}%)</span>
                  <span>-{detailesOrders?.taxAmount} {detailesOrders?.currency}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total Net</span>
                  <span>${detailesOrders?.restaurantNetAmount} {detailesOrders?.currency}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Payments) */}
       {/* Right Column (Driver Info) */}
  <div className="space-y-6">
  <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border-t-4 border-orange-500">
    {currentDriver ? (
            <div className="flex flex-col items-center gap-3 py-6 bg-gray-50 rounded-lg shadow-md border w-full max-w-sm mx-auto">
          
          {/* دائرة الحروف */} 
        <div
            key={currentDriver?.id}
            className="w-20 h-20 text-white rounded-full flex items-center justify-center text-2xl font-bold animate-pulse opacity-0 animate-fadeIn"
            style={{
              backgroundColor: `#${currentDriver?.color?.code.split('0xff')[1] || "AE19F3"}`,
              animation: "fadeIn 0.5s forwards"
            }}
            >
            {(currentDriver?.firstName?.[0]?.toUpperCase() || "?")}{(currentDriver?.lastName?.[0]?.toUpperCase() || "?")}
        </div>


          {/* اسم السائق */}
          <h2 className="text-lg font-semibold text-gray-800">
            {currentDriver.firstName} {currentDriver.lastName}
          </h2>

          {/* نوع الدراجة */}
          <p className="text-gray-600 text-sm">
            🚲 {currentDriver.color?.code.split('0xff')[1]}
          </p>

          <p className="text-xs text-gray-500">
            الطلب يرن عند هذا السائق الآن...
          </p>
          </div>
         ) : driver ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-sm md:text-base">Driver Info</h3>
                <span className="text-xs md:text-sm bg-green-50 text-green-600 px-2 py-1 rounded">
                  Assigned
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="text-sm md:text-base">
                  <span className="font-semibold">Name: </span> {driver.firstName} {driver.lastName}
                </div>
                <div className="text-sm md:text-base">
                  <span className="font-semibold">Phone: </span> {driver.phoneNumber}
                </div>
                <div className="text-sm md:text-base">
                  <span className="font-semibold">Vehicle: </span> {driver.Model}
                </div>
                <div className="text-sm md:text-base">
                  <span className="font-semibold">Color: </span> {driver.color?.name}
                </div>
              </div>
            </div>
             )  
             :(
              <div className="flex flex-col items-center justify-center gap-4 py-6">
                <p className="text-gray-500 text-sm md:text-base">No driver assigned yet.</p>
                <button onClick={()=>{
                  if(!detailesOrders) return
                  SearchDriver(detailesOrders)
                }} className="w-full py-3 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition">
                  Search for Driver
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

// Product Row Component
interface DetailesOrder {
  name: string |undefined;
  sku: string;
  qty: number;
  charge: number;
  total: number;
  currency:string
}

const ProductRow = ({ name, sku, qty, charge, total ,currency}: DetailesOrder) => (
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
