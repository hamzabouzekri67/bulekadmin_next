"use client";
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { getFcmToken } from "../components/providers";
import { useRouter } from "next/navigation"; // استيراد الموجّه

export type User = {
  id: string;
  userName: string;
  role: string;
  status: string;
  country: string;
  ville: string;
  notificationsToken: string;
  balance: number;
};

type UserContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>; // إضافة دالة logout للنوع
};

const UserContext = createContext<UserContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const LOGIN_CHECK = process.env.NEXT_PUBLIC_LOGIN_CHECK;
const LOGOUT_API = "/auth/logout"; // افترضت هذا المسار، قم بتغييره حسب الـ API لديك

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = async () => {
    try {
      setLoading(true);
      const url = `${API_URL}${LOGIN_CHECK}`;
      const tokenFcm = await getFcmToken();

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tokenFcm: tokenFcm }),
      });

      if (res.ok) {
        const data = await res.json();
        if (!data.status) {
          setUser(null);
          return;
        }
        setUser(data.result);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // --- دالة تسجيل الخروج الجديدة ---
  const logout = async () => {
    try {
      // 1. طلب الـ API لمسح الكوكيز من السيرفر
      await fetch(`${API_URL}${LOGOUT_API}`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout request failed", error);
    } finally {
      // 2. مسح بيانات المستخدم من الـ State محلياً مهما كانت النتيجة
      setUser(null);
      // 3. توجيه المستخدم لصفحة تسجيل الدخول
      router.push("/login");
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, loading, refreshUser, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within UserProvider");
  return context;
};