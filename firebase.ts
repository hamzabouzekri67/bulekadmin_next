// lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyDhQzleEYaDfmFqgmNvGyjOAkB_knLx0QY",
  authDomain: "veni-eats.firebaseapp.com",
  projectId: "veni-eats",
  storageBucket: "veni-eats.firebasestorage.app",
  messagingSenderId: "760966248764",
  appId: "1:760966248764:web:7382d50ee2a4764f9b4639",
};

const app = initializeApp(firebaseConfig);

export const messaging =
  typeof window !== "undefined" ? getMessaging(app) : null;
