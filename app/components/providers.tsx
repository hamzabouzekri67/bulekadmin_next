"use client";

import { getToken } from "firebase/messaging";
import { getClientMessaging } from "@/firebase/firebase";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";

// دالة موحدة لجلب التوكن
export async function getFcmToken(): Promise<string> {
  try {
    // 1. إذا كان التطبيق يعمل على أندرويد
    if (Capacitor.getPlatform() === "android") {
      // التأكد من الصلاحية والتسجيل
      const result = await PushNotifications.requestPermissions();
      if (result.receive !== "granted") return "";

      await PushNotifications.register();

      // انتظر حتى يتم الحصول على التوكن
      return new Promise((resolve) => {
        PushNotifications.addListener("registration", (token) => {
          console.log(token);
          
          resolve(token.value);
        });
      });
    }

    // 2. إذا كان التطبيق يعمل على الويب
    const messaging = await getClientMessaging();
    if (!messaging || Notification.permission !== "granted") return "";

    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });

    return token ?? "";
  } catch (error) {
    console.error("Error in getFcmToken:", error);
    return "";
  }
}

// دالة طلب الإذن الموحدة
export async function requestNotificationPermission(): Promise<boolean> {
  // أندرويد
  if (Capacitor.getPlatform() === "android") {
    const status = await PushNotifications.requestPermissions();
    return status.receive === "granted";
  }

  // ويب
  if (!("Notification" in window)) return false;
  const permission = Notification.permission;
  if (permission === "granted") return true;
  if (permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}