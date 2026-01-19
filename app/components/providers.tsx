"use client";

import { getToken } from "firebase/messaging";
import { getClientMessaging } from "@/firebase/firebase";

export async function getFcmToken() {
  try {
    const messaging = await getClientMessaging();
    if (!messaging) return "";
        


    const allowed = await requestNotificationPermission();
    if (!allowed) return "";

    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });

    

    return token ?? 't';
  } catch (error) {
    //console.log("FCM Token Error:", error);
    return "e";
  }
}


export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;

  const permission = Notification.permission;

  if (permission === "granted") return true;

  if (permission === "denied") {
    alert(
      "الإشعارات متوقفة.\n" +
      "اذهب إلى إعدادات التطبيق وفعّل الإشعارات."
    );
    return false;
  }

  const result = await Notification.requestPermission();
  return result === "granted";
}
