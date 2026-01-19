"use client";

import { getToken } from "firebase/messaging";
import { getClientMessaging } from "@/firebase/firebase";

export async function getFcmToken() {
  try {
    const messaging = await getClientMessaging();
    if (!messaging) return "m";
        


    const permission = await Notification.requestPermission();
    if (permission !== "granted") return "p";

    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });

    

    return token ?? 't';
  } catch (error) {
    //console.log("FCM Token Error:", error);
    return "e";
  }
}
