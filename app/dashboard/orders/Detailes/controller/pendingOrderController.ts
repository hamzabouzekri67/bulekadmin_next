/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import {useEffect } from "react";
import { useUser   } from "@/app/context/UserContext";
import { Order } from "../../../../types/Orders";
import { useOrders } from "../../../../context/UserOrdersContext";
import {useSocket} from "../../../../hooks/useSocket";
import {GetOrdersPending} from "../api/FetchOrderPending";



const API_URL = process.env.NEXT_PUBLIC_API_URL; 
const FETCH_ORDER = process.env.NEXT_PUBLIC_FETCH_ORDER; 

export function FetchPendingOrders() {
    const url = `${API_URL}${FETCH_ORDER}`;
    const { newOrders , setNewOrders } = useOrders();
    const { user ,setUser} = useUser();
    const {socket ,ready} = useSocket()

    const handleNewOrder = (order: Order) => {

         setNewOrders(prev => {
         if (prev.find(o => o.id === order.id)) {
         return prev;
         }
         return [order, ...prev];
      });
     };


     useEffect(()=>{
         if (!user) return;
         if (ready && socket) {

         socket?.on("sendOrderToRestaurant" ,(e) =>{
             const order: Order = e
            handleNewOrder(order)
         })
        };
        
        const fetchOrders = async () => {
         
            const orders = await GetOrdersPending(url,user);
            //console.log(orders);
            
            
             if (!orders || !orders.result.orders) return null
             const pendingOrders: Order[] = [];
    
             for (const key in orders.result.orders) {
                const order: Order = orders.result.orders[key];
                pendingOrders.push(order);
             }
             setNewOrders(pendingOrders)
        };
        fetchOrders();
        }
        ,[ready, setNewOrders, socket, url, user])

        return {
           newOrders,
           setNewOrders,
           user
        }
    
}

