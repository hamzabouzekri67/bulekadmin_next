// lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyAkZRkOLzG1VPD4vyfhtJeJb48y4XKmbaU",
  authDomain: "bulekprojects.firebaseapp.com",
  projectId: "bulekprojects",
  storageBucket: "bulekprojects.firebasestorage.app",
  messagingSenderId: "430277466208",
  appId: "1:430277466208:web:6f603fa73ef24c0bff8b05",
  measurementId: "G-5H8QKN0V6Y"
};

const app = initializeApp(firebaseConfig);

export const messaging =
  typeof window !== "undefined" ? getMessaging(app) : null;
