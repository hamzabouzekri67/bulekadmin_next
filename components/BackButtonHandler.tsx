"use client";

import { useEffect } from "react";
import { App } from "@capacitor/app";
import { useRouter, usePathname } from "next/navigation";

import { PluginListenerHandle } from "@capacitor/core"; // استورد هذا النوع

export default function BackButtonHandler() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handler = App.addListener("backButton", () => {

        console.log(pathname);
        
      // إذا كنت في الصفحة الرئيسية، أغلق التطبيق
      if (pathname === "/home") {
        App.exitApp();
      } else {
        // إذا كنت في أي صفحة أخرى، ارجع للخلف
        router.back();
      }
    });

    // تنظيف المستمع عند إلغاء المكون
    return () => {
      handler.then((h:PluginListenerHandle) => h.remove());
    };
  }, [pathname, router]);

  return null;
}
