import Drawer from "./components/Drawer";
import { OrdersProvider } from "../context/UserOrdersContext";
import SocketProvider from "../context/SocketProvider";
import Navbar from "../components/Navbar.";



export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      
      <SocketProvider>
        <OrdersProvider>
          <Navbar />
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