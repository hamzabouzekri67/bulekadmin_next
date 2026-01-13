import Drawer from "./components/Drawer";
import { CategoryProvider } from "@/app/context/CategoryContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <>
      <CategoryProvider>
        
        <Drawer /> 
        <main className="ml-0 md:ml-64 pt-16 md:pt-6 h-screen overflow-auto">
            {children}
        </main>

      </CategoryProvider>
      
      </>
  );
}