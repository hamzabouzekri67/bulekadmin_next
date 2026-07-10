import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UserProvider } from "./context/UserContext";
import AuthGuard from "./components/AuthGuard";
import BackButtonHandler from "@/components/BackButtonHandler"; // 1. استورد المكون هنا
import Navbar from "./components/Navbar.";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bulek Admin Dashboard",
  description: "لوحة التحكم لإدارة تطبيق Bulek Eats",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/public/logo.png",
    apple: "/public/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet-draw@0.4.12/dist/leaflet.draw.css"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased`}
      >
        <UserProvider>
          <AuthGuard>
            {/* 2. قم بإضافة المكون هنا ليعمل في كافة الصفحات المحمية */}
            <BackButtonHandler />
            
            {children}
          </AuthGuard>
        </UserProvider>
      </body>
    </html>
  );
}
