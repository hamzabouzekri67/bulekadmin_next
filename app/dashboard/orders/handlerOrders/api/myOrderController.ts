"use client";
import { useEffect } from "react";
import { useUser } from "@/app/context/UserContext";
import { Order } from "../../../../types/Orders";
import { useOrders } from "../../../../context/UserOrdersContext";
import { GetOrdersPending } from "../../pickOrders/api/FetchOrderPending";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const FETCH_ORDER = process.env.NEXT_PUBLIC_FETCH_ORDER;

export function MyDetailesOrders() {
  const url = `${API_URL}${FETCH_ORDER}`;
  const { myOrders, setmyOrders } = useOrders();
  const { user } = useUser();

  useEffect(() => {
    if (!user) return;

    const fetchOrders = async () => {
      const orders = await GetOrdersPending(url, user);

      if (!orders || !orders.result.orders) return null;
      const pendingOrders: Order[] = [];

      for (const key in orders.result.orders) {
        const order: Order = orders.result.orders[key];
        if (order.claimId === user.id) {
          pendingOrders.push(order);
        }
      }
      setmyOrders(pendingOrders);
    };
    fetchOrders();
  }, [setmyOrders, url, user]);

  return {
    myOrders,
    setmyOrders,
    user,
  };
}
