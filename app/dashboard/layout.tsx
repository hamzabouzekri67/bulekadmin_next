import Drawer from "./components/Drawer";
import { OrdersProvider } from "../context/UserOrdersContext";
import SocketProvider from "../context/SocketProvider";



export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      
      <SocketProvider>
        <OrdersProvider>
          {/* Drawer + App Bar */}
          
          <Drawer /> 

          {/* Main content */}
          <main className="ml-0 md:ml-64 pt-16 md:pt-6 h-screen overflow-auto">
            {children}
          </main>
        </OrdersProvider>
      </SocketProvider>

     
    </>
  );
}