"use client";
import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from "react";
import { Order } from "../types/Orders";

type OrderContextType = {
  newOrders: Order[];
  orderEnCours: Order[];
  orderEnRoute: Order[];
  setNewOrders: Dispatch<SetStateAction<Order[]>>;
  setOrderEnCours: Dispatch<SetStateAction<Order[]>>;
  setOrderEnRoute: Dispatch<SetStateAction<Order[]>>;
};

const OrdersContext = createContext<OrderContextType | null>(null);

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [newOrders, setNewOrders] = useState<Order[]>([]);
  const [orderEnCours, setOrderEnCours] = useState<Order[]>([]);
  const [orderEnRoute, setOrderEnRoute] = useState<Order[]>([]);

  return (
    <OrdersContext.Provider value={{
      newOrders,
      orderEnCours,
      orderEnRoute,
      setNewOrders,
      setOrderEnCours,
      setOrderEnRoute
    }}>
      {children}
    </OrdersContext.Provider>
  );
}

export const useOrders = () => {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders must be used inside OrdersProvider");
  return ctx;
};
