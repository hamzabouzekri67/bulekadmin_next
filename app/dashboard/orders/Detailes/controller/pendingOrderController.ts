/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { useEffect } from "react";
import { useUser } from "@/app/context/UserContext";
import { Order } from "../../../../types/Orders";
import { useOrders } from "../../../../context/UserOrdersContext";
import { useSocket } from "../../../../hooks/useSocket";
import { GetOrdersPending } from "../api/FetchOrderPending";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const FETCH_ORDER = process.env.NEXT_PUBLIC_FETCH_ORDER;

export function FetchPendingOrders() {
  const url = `${API_URL}${FETCH_ORDER}`;
  const { newOrders, setNewOrders } = useOrders();
  const { user, setUser } = useUser();
  const { socket, ready } = useSocket();

  const handleNewOrder = (order: Order) => {
    setNewOrders((prev) => {
      if (prev.find((o) => o.id === order._id)) {
        return prev;
      }
      return [order, ...prev];
    });
  };

  useEffect(() => {
    if (!user) return;
    if (ready && socket) {
      console.log("e");

      socket?.off("receive_order");
      socket?.on("receive_order", (e) => {
        // console.log(e);
        const order: Order = e;
        handleNewOrder(order);
      });
    }

    const fetchOrders = async () => {
      const orders = await GetOrdersPending(url, user);

      if (!orders || !orders.result.orders) return null;
      const pendingOrders: Order[] = [];

      for (const key in orders.result.orders) {
        const order: Order = orders.result.orders[key];
        if (order.claimId === null || order.claimId === undefined) {
          pendingOrders.push(order);
        }
      }
      setNewOrders(pendingOrders);
    };
    fetchOrders();
  }, [ready, setNewOrders, socket, url, user]);

  return {
    newOrders,
    setNewOrders,
    user,
  };
}
