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

// export default function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   return (
//     <html lang="en">
//       <body className="h-screen overflow-hidden">
//         {/* <Drawer /> */}
//         <UserProvider>
//           {children}
//         </UserProvider>
//       </body>
//     </html>
//   );
// }

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* إضافة ملفات التنسيق الأصلية لضمان عمل أيقونات الرسم والخرائط */}
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
      {/* قمت بإزالة overflow-hidden أو استبداله بـ overflow-auto للسماح بالرسم */}
      <body className="min-h-screen">
        <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  );
}


