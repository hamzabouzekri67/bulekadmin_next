"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useUser } from "../../context/UserContext";
import { Menu, List, Users ,Gift, Home } from "lucide-react";
import { usePathname } from "next/navigation";


export default function Drawer() {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [ready, setReady] = useState(false);
  const { user } = useUser();
  const pathname = usePathname();

  const links = [
    { href: "/dashboard/orders", label: "Ordres", icon: <List size={20} /> },
    { href: "/dashboard/drivers", label: "Conductrices", icon: <Users size={20} /> },
    { href: "/dashboard/storelist", label: "Magasin de listes", icon: <Home size={20} /> },
  ];

  
  
 useEffect(() => {
  if (!user)return
  const handleResize = () => {
    const mobile = window.innerWidth < 768;
    setIsMobile(mobile);
   if (!mobile) setOpen(true);  
    setOpen(false);         
    setReady(true);              
  };

  handleResize();
  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, [ready,user]);
  const isDrawerOpen = isMobile ? open : true;

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
              bg-red-600 text-white
              transform transition-transform duration-300
              ${isDrawerOpen ? "translate-x-0" : "-translate-x-full"}
             
      `}
      >
        {/* User Info */}
        <div className="flex items-center gap-3 p-4 border-b border-white/20">
        {/* حاوية الصورة */}
        <div className="w-10 h-10 relative overflow-hidden rounded-full">
          {/* <Image
            src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png"
            alt="User avatar"
            fill
            className="object-cover"
          /> */}
        </div>

        {/* الاسم والـ ID */}
        <div className="leading-tight">
          <p className="font-semibold">@{user?.userName.split("@")[0]}</p>
          <p className="text-sm text-white/70">{user?.ville} / {user?.country}</p>
        </div>
        </div>

      <nav className="flex flex-col gap-4 p-4">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`
                  flex items-center gap-2 p-2 rounded transition-colors
                  ${isActive ? "bg-white text-red-600" : "text-white hover:bg-red-500"}
                `}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            );
          })}
       </nav>
      </aside>
    

      )}
      
    
    </>
  );
}
