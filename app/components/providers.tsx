"use client";

import { getToken } from "firebase/messaging";
import { getClientMessaging } from "@/firebase/firebase";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { FirebaseMessaging } from "@capacitor-firebase/messaging"; 

// دالة موحدة لجلب التوكن
export async function getFcmToken(): Promise<string> {
  try {
    // 1. إذا كان التطبيق يعمل على الهاتف (iOS / Android) 
    if (Capacitor.isNativePlatform()) {
      // التأكد من الصلاحية
      let permStatus = await PushNotifications.checkPermissions();
      if (permStatus.receive === "prompt") {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== "granted") {
        console.warn("Push notification permissions not granted!");
        return "";
      }

      // جلب الـ FCM Token الحقيقي مباشرة من حزمة فايربيس الخاصة بكاباسيتور
      const result = await FirebaseMessaging.getToken();
      console.log(">>> REAL FCM Token received:", result.token);
      return result.token ?? "";
    }

    // 2. إذا كان التطبيق يعمل على المتصفح (Web)
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
  // الهواتف (Native)
  if (Capacitor.isNativePlatform()) {
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