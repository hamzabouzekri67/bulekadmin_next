"use client";
import AppBar from "./components/Navbar";
import { OrdersProvider } from "../context/UserOrdersContext";
import SocketProvider from "../context/SocketProvider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SocketProvider>
      <OrdersProvider>
        <div className="min-h-screen bg-gray-50 flex">
          {/* الـ Drawer الأصلي الخاص بك (يعمل بزر المنفذ الخاص به) */}
          {/* <Drawer /> */}

          <div className="flex-1 flex flex-col min-w-0 md:ml-64">
            {/* الـ AppBar العلوي */}
            <AppBar />

            <main className="flex-1 p-4 md:p-8 overflow-y-auto">
              {children}
            </main>
          </div>
        </div>
      </OrdersProvider>
    </SocketProvider>
  );
}
