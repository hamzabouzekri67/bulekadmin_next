"use client";
import { useState } from "react";
import { isMobile, isTablet, isDesktop } from "react-device-detect";
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const LOGIN_PATH = process.env.NEXT_PUBLIC_LOGIN_PATH;

import { useRouter } from "next/navigation";
import { getFcmToken } from "../../components/providers";
import { useUser } from "../../context/UserContext";

export function useLoginController() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isValid, setIsValid] = useState(false);

  const [password, setPassword] = useState("");
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user, setUser } = useUser();

  const handleEmailChange = (value: string) => {
    setEmail(value);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsValid(emailRegex.test(value));
  };
  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setIsPasswordValid(value !== "");
  };

  const handleLogin = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    setError("");
    const url = `${API_URL}${LOGIN_PATH}`;

    if (!isValid || !isPasswordValid) {
      setError("الرجاء إدخال Email و Password صحيحين");
      return;
    }
    const tokenFcm = await getFcmToken();

    setIsLoading(true);
    try {
      let deviceType = "unknown";
      if (isMobile) deviceType = "mobile";
      else if (isTablet) deviceType = "tablet";
      else if (isDesktop) deviceType = "desktop";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userName: email, password, tokenFcm,deviceType }),
      });

      if (res.ok) {
        const data = await res.json();

        if (data.status === true) {
          setUser(data.result);
          router.push("./dashboard");
          console.log(data);
          return;
        }

        if (data.message === "invalid_credentials") {
          setError("Email أو Password غير صحيح");
        } else {
          setError(data.messaging);
        }
      } else {
        setError("Email أو Password غير صحيح");
      }
    } catch (e) {
      console.error("Error in Client:", e);

      setError("فشل الاتصال بالسيرفر");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    email,
    isValid,
    handleEmailChange,
    password,
    isPasswordValid,
    handlePasswordChange,
    handleLogin,
    error,
    isLoading,
    user,
  };
}
