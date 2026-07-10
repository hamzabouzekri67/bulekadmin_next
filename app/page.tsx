"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Preferences } from '@capacitor/preferences';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      // الحصول على التوكن من Capacitor Preferences
      const { value: token } = await Preferences.get({ key: 'token' });

      if (token) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    };

    checkAuth();
  }, [router]);

  return null; // أو شاشة تحميل
}