"use client";

import { useEffect } from "react";
import { App } from "@capacitor/app";
import { useRouter, usePathname } from "next/navigation";
import { Capacitor, PluginListenerHandle } from "@capacitor/core";

export default function BackButtonHandler() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // زر الرجوع الخاص بـ Capacitor يعمل أساساً على الأندرويد (الهواتف الذكية)
    // لتجنب الأخطاء على الآيفون أو متصفح الويب، نتأكد أننا على منصة أصلية وأن الإضافة مدعومة
    if (!Capacitor.isNativePlatform()) return;

    let listener: Promise<PluginListenerHandle> | null = null;

    const setupBackButton = async () => {
      try {
        listener = App.addListener("backButton", () => {
          console.log("Current path:", pathname);
          
          // إذا كنت في الصفحة الرئيسية، أغلق التطبيق
          if (pathname === "/home" || pathname === "/") {
            App.exitApp();
          } else {
            // إذا كنت في أي صفحة أخرى، ارجع للخلف
            router.back();
          }
        });
      } catch (e) {
        console.log("Back button not supported on this platform", e);
      }
    };

    setupBackButton();

    // تنظيف المستمع عند إلغاء المكون
    return () => {
      if (listener) {
        listener.then((h: PluginListenerHandle) => h.remove());
      }
    };
  }, [pathname, router]);

  return null;
}