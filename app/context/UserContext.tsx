"use client";
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { getFcmToken } from "../components/providers";
import { json } from "stream/consumers";

export type User = {
  id: string;
  userName: string;
  role: string;
  status: string;
  country: string;
  ville: string;
  notificationsToken: string;
};

type UserContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
  refreshUser: () => Promise<void>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL
const LOGIN_CHECK =process.env.NEXT_PUBLIC_LOGIN_CHECK

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // دالة لجلب بيانات المستخدم من API
  const refreshUser = async () => {
    try {
        setLoading(true);
         const url = `${API_URL}${LOGIN_CHECK}`  
         const tokenFcm = await getFcmToken()             
   
          const res = await fetch(url, {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           credentials: "include",
           body:JSON.stringify({'tokenFcm': tokenFcm}),
          
           });
      if (res.ok) {
        const data = await res.json();
        //console.log(data);
        if (!data.status) return

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

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, loading, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within UserProvider");
  return context;
};
