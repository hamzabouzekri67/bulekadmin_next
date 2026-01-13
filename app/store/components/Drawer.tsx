"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useParams ,useSearchParams} from "next/navigation";
import { useCategories } from "@/app/context/CategoryContext";



export default function Drawer() {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [ready, setReady] = useState(false);
  const pathname = usePathname();
  const { id } = useParams();
  const SearchParams = useSearchParams()
  const orderId = SearchParams?.get('orderId');
  const validOrderId = id as string;

  const { categories, loading, fetchCategories ,order} = useCategories();
  
  //const [isMobile, setIsMobile] = useState(false);


 
 useEffect(() => {
  const handleResize = () => {
    const mobile = window.innerWidth < 768;
    setIsMobile(mobile);
   if (!mobile) setOpen(true);  
    setOpen(false);         
    setReady(true);    
      };

  handleResize();
  fetchCategories(validOrderId,orderId)
  window.addEventListener("resize", handleResize);

  return () => window.removeEventListener("resize", handleResize);
}, [ready]);
  const isDrawerOpen = isMobile ? open : true;
   
  if (loading) return  <div className="p-4 flex justify-center items-center h-full w-full text-gray-600">
      ⏳ Chargement...
    </div>
  return (
    <>
      {/* زر الموبايل فقط */}
      {isMobile && (
        <button
          onClick={() => setOpen(true)}
          className={`fixed top-4 left-4 z-50 bg-white p-2 rounded-full shadow transition-opacity duration-200
          ${open ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        >
          <Menu size={24} className="text-red-600" />
        </button>
      )}

      {/* Overlay للموبايل */}
      {isMobile && isDrawerOpen && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/40 z-10"
        />
      )}

      {/* Drawer */}
      {ready && (
        <aside
       className={`
              fixed top-0 left-0 h-screen w-64 z-30
              bg-gray-300 text-black
              transform transition-transform duration-300
              ${isDrawerOpen ? "translate-x-0" : "-translate-x-full"}
             
      `}
      >
      
      <nav className="flex flex-col gap-4 p-4">
         {categories.map((cat) => {
        
              const isMatched = order?.listOrder.some(
                (item) => item.category === cat.category 
              );

              return (
                <Link
                  key={cat._id}
                  href={{
                    pathname: `/store/${id}/products/${cat._id}`,
                    query: { orderId: orderId },
                  }}
                  className={`block w-full text-left py-2 px-2 rounded transition ${
                    isMatched 
                      ? "bg-orange-100 text-orange-700 font-bold border-r-4 border-orange-500" 
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span>{cat.category}</span>
                    
                    {isMatched && (
                      <span className="text-[10px] bg-orange-500 text-white px-2 py-0.5 rounded-full">
                        selected
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
       </nav>
      </aside>
      )}
      
    
    </>
  );
}
