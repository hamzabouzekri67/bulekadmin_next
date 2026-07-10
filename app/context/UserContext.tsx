"use client";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { getFcmToken } from "../components/providers";
import { useRouter } from "next/navigation";
import {
  isMobile,
  isAndroid,
  isIOS,
  isDesktop,
  isTablet,
} from "react-device-detect";
import { Preferences } from "@capacitor/preferences";

export type User = {
  id: string;
  userName: string;
  role: string;
  status: string;
  country: string;
  ville: string;
  notificationsToken: string;
  balance: number;
  currency: string;
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
      const { value: token } = await Preferences.get({ key: "token" });
      const tokenFcm = await getFcmToken();

      let deviceType = "web"; // القيمة الافتراضية للكمبيوتر

      if (isMobile || isTablet) {
        if (isAndroid) {
          deviceType = "android";
        } else if (isIOS) {
          deviceType = "ios";
        }
      } else if (isDesktop) {
        deviceType = "web"; 
      }

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
       // credentials: "include",
        body: JSON.stringify({ tokenFcm: tokenFcm, deviceType: deviceType }),
      });

      if (res.ok) {
        const data = await res.json();

        console.log(data);
        if (!data.status) {
        //  localStorage.removeItem("token");
         // router.replace("/login");
          setUser(null);

          return;
        }
        setUser(data.result);
      } else {
        setUser(null);
       // localStorage.removeItem("token");
       // router.replace("/login");
        //  window.location.href = "/login";
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
    <UserContext.Provider
      value={{ user, setUser, loading, refreshUser, logout }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within UserProvider");
  return context;
};
