"use client";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";
import { Order } from "../types/Orders";

type OrderContextType = {
  newOrders: Order[];
  myOrders: Order[];
  orderEnCours: Order[];
  orderEnRoute: Order[];
  newAutoOrders: Order[];
  setNewOrders: Dispatch<SetStateAction<Order[]>>;
  setmyOrders: Dispatch<SetStateAction<Order[]>>;
  setOrderEnCours: Dispatch<SetStateAction<Order[]>>;
  setOrderEnRoute: Dispatch<SetStateAction<Order[]>>;
  setnewAutoOrders: Dispatch<SetStateAction<Order[]>>;
};

const OrdersContext = createContext<OrderContextType | null>(null);

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [newOrders, setNewOrders] = useState<Order[]>([]);
  const [myOrders, setmyOrders] = useState<Order[]>([]);
  const [orderEnCours, setOrderEnCours] = useState<Order[]>([]);
  const [orderEnRoute, setOrderEnRoute] = useState<Order[]>([]);
  const [newAutoOrders, setnewAutoOrders] = useState<Order[]>([]);

  return (
    <OrdersContext.Provider
      value={{
        newOrders,
        myOrders,
        orderEnCours,
        orderEnRoute,
        newAutoOrders,
        setNewOrders,
        setmyOrders,
        setOrderEnCours,
        setOrderEnRoute,
        setnewAutoOrders
      }}
    >
      {children}
    </OrdersContext.Provider>
  );
}

export const useOrders = () => {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders must be used inside OrdersProvider");
  return ctx;
};
