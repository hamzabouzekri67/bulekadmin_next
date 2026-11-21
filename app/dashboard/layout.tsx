"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import AppBar from "./components/Navbar";
import { OrdersProvider } from "../context/UserOrdersContext";
import SocketProvider from "../context/SocketProvider";
import { useUser } from "../context/UserContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  const isStoreOwner = user?.role === "store_owner";
  const insideStoreOwnerArea = pathname?.startsWith("/dashboard/store-owner");
  const mustRedirect = isStoreOwner && !insideStoreOwnerArea;

  useEffect(() => {
    if (mustRedirect) {
      router.replace("/dashboard/store-owner/recharge");
    }
  }, [mustRedirect, router]);

  return (
    <SocketProvider>
      <OrdersProvider>
        <div className="min-h-screen bg-gray-50 flex">
          <div className="flex-1 flex flex-col min-w-0 md:ml-64">
            {/* الـ AppBar العلوي */}
            <AppBar />

            <main className="flex-1 p-4 md:p-8 overflow-y-auto">
              {/* لا نعرض الصفحة الممنوعة لصاحب المتجر أثناء إعادة التوجيه */}
              {mustRedirect ? null : children}
            </main>
          </div>
        </div>
      </OrdersProvider>
    </SocketProvider>
  );
}