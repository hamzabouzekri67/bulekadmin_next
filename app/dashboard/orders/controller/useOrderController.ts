/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import {useEffect ,useRef ,useState  } from "react";
import { useUser ,User} from "../../../context/UserContext";
import { Order } from "../../../types/Orders";
import { useOrders } from "../../../context/UserOrdersContext";
import {useSocket} from "../../../hooks/useSocket";
import { useRouter } from "next/navigation";



const API_URL = process.env.NEXT_PUBLIC_API_URL; 
const FETCH_ORDER = process.env.NEXT_PUBLIC_FETCH_ORDER; 


export  function useOrderDetails() {
     const url = `${API_URL}${FETCH_ORDER}`;
     const router = useRouter();
     const { user  } = useUser();
     const { newOrders ,setNewOrders,orderEnCours ,setOrderEnCours ,orderEnRoute,setOrderEnRoute  } = useOrders();
     const {socket ,ready} = useSocket()
     const didFetch = useRef(false);



    useEffect(()=>{
     if (!user) return;
   
     if (ready && socket) {
     socket?.off("sendOrderToRestaurant")
     socket?.on("sendOrderToRestaurant" ,(e) =>{
          const order: Order = e

           setNewOrders((prevOrders: Order[]) => {
            if (!prevOrders.find(o => o.id === order.id)) {
              return [order, ...prevOrders];
            }
            return prevOrders;
          });
      })

       socket?.off("driverconfirmation")
       socket?.on("driverconfirmation" ,(e) =>{
          const orderId: string = e.orderId;

          setOrderEnCours(prevEnCours => {
          const orderToMove = prevEnCours.find(o => o.id === orderId);
          if (!orderToMove) return prevEnCours;

          const updatedEnCours = prevEnCours.filter(o => o.id !== orderId);

          setOrderEnRoute(prevEnRoute => {
            if (prevEnRoute.find(o => o.id === orderId)) return prevEnRoute;
            return [orderToMove, ...prevEnRoute];
          });

          return updatedEnCours;
         });
      })

      //completed
       socket?.off("completed")
       socket?.on("completed" ,(e) =>{
        setOrderEnRoute(prevEnRoute => {
           return prevEnRoute.filter(o => o.id !== e.orderId);
         });
      })

    };

    if (didFetch.current) return
      didFetch.current = true;
     fetchOrders(url, user, setNewOrders,setOrderEnCours ,setOrderEnRoute,router);

    }
    ,[ready, setNewOrders,socket, url, user])
    return {
     newOrders,
     orderEnCours,
     orderEnRoute
    }
}

const fetchOrders = async (url: string, user: User, setNewOrders: (val: Order[]) => void, setOrderEnCours: (val: Order[]) => void, setOrderEnRoute: (val: Order[]) => void, router: ReturnType<typeof useRouter>,) => {
         const orders = await GET(url,user);

          if (orders.message === "Invalid Token") {
                 //setUser(null); 
                 router.push("/login");
                 return
            }
         
         if (!orders || !orders.result.orders) return null

         const pending = orders.result.orders.filter((o: Order) => o.status === "pending");
         const enCours = orders.result.orders.filter((o: Order) => o.status === "prepare" || o.status === "ready");
         const enRoute = orders.result.orders.filter((o: Order) => o.status === "delivery");


         setNewOrders(pending)
         setOrderEnCours(enCours)
         setOrderEnRoute(enRoute)
  };

export async function GET(url: string, user: User) {
    try {
       const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({"ville": user?.ville, "id": user?.id}),
        });
        if (res.ok) {        
         return await res.json();   
        }
        return null
        
    } catch (error) {
        //console.log(error);
        return null
    }
 
}