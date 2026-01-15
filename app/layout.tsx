import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// import Drawer from "./dashboard/components/Drawer"; 
import { UserProvider } from "./context/UserContext";


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
      <body className="h-screen overflow-hidden">
        {/* <Drawer /> */}
        <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
