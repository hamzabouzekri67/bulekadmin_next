"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "../../context/UserContext";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { Preferences } from "@capacitor/preferences";
import {
  Menu,
  List,
  Users,
  Home,
  Bell,
  LogOut,
  ShieldCheck,
  X,
  CreditCard,
  Sparkles,
  Percent,
  History
} from "lucide-react";

export default function AppBar() {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  // الحصول على عنوان الصفحة الحالية للـ App Bar
  const getPageTitle = () => {
    if (!pathname) return "Dashboard";
    const parts = pathname.split("/");
    const lastPart = parts[parts.length - 1];
    return lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { value: token } = await Preferences.get({ key: "token" });
        if (!token) {
          await handleLogout();
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        await handleLogout();
      }
    };

    checkAuth();
    setMounted(true);

    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setOpen(true);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [pathname, router]);

  const handleLogout = async () => {
    try {
      await Preferences.remove({ key: "token" });
      localStorage.clear();
      router.replace("/login");
      window.location.reload();
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  if (!mounted) return null;

  const links = [
    { href: "/dashboard/orders", label: "Commandes", icon: <List size={20} /> },
    {
      href: "/dashboard/orders/history",
      label: "Historique",
      icon: <History size={20} />,
    },
    {
      href: "/dashboard/drivers",
      label: "Livreurs",
      icon: <Users size={20} />,
    },
    {
      href: "/dashboard/storelist",
      label: "Partenaires",
      icon: <Home size={20} />,
    },
  ];

  if (user?.role === "super_admin" || user?.role === "admin") {
    links.push({
      href: "/dashboard/offers",
      label: "Offres & Livraisons",
      icon: <Percent size={20} />,
    });
  }

  if (user?.role === "super_admin") {
    links.push(
      {
        href: "/dashboard/featured",
        label: "Sélectionnés (Featured)",
        icon: <Sparkles size={20} />,
      },
      {
        href: "/dashboard/notifications",
        label: "Notifications",
        icon: <Bell size={20} />,
      },
      {
        href: "/dashboard/admins",
        label: "Admins",
        icon: <ShieldCheck size={20} />,
      },
    );
  }

  return (
    <>
      {/* 1. الشريط العلوي (AppBar) */}
      <header className="ios-header bg-white border-b border-gray-100 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          {/* زر فتح القائمة على الموبايل */}
          <button
            onClick={() => setOpen(true)}
            className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-all active:scale-95 md:hidden"
          >
            <Menu size={20} />
          </button>

          <h1 className="text-base md:text-lg font-black text-gray-800 tracking-wide">
            {getPageTitle()}
          </h1>
        </div>
      </header>

      {/* 2. القائمة الجانبية (Drawer Code مدمج هنا) */}
      <aside
        className={`
          fixed top-0 left-0 h-screen w-64 z-50
          bg-[#e91818] text-white
          transition-transform duration-300 ease-in-out flex flex-col shadow-2xl
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="p-6 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-[#e91818] font-black text-xl italic">
                B
              </span>
            </div>
            <span className="text-xl font-bold tracking-tight">BULEK EATS</span>
          </div>
          {isMobile && (
            <button
              onClick={() => setOpen(false)}
              className="text-red-100 hover:text-white"
            >
              <X size={24} />
            </button>
          )}
        </div>

        {/* User Card */}
        <div className="px-4 py-6">
          <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center text-[#e91818] font-black text-xl">
                {user?.userName?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold truncate">
                  {user?.userName?.split("@")[0] || "User"}
                </p>
                <p className="text-[10px] text-red-200 font-medium uppercase tracking-wider">
                  {user?.role?.replace("_", " ") || "Role"}
                </p>
              </div>
            </div>

            {/* Solde Card */}
            {(user?.role === "admin" || user?.role === "super_admin") && (
              <div className="bg-black/10 rounded-xl p-3 flex items-center justify-between border border-white/5">
                <div className="flex items-center gap-2">
                  <CreditCard size={14} className="text-red-200" />
                  <span className="text-[11px] font-medium text-red-100">
                    Solde
                  </span>
                </div>
                <div className="text-right">
                  {user?.role === "super_admin" ? (
                    <span className="text-[12px] font-black text-white uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-md">
                      Unlimited
                    </span>
                  ) : (
                    <span className="text-sm font-black text-white">
                      {user?.balance || "0.00"}{" "}
                      <span className="text-[10px] font-normal text-red-100">
                        DZD
                      </span>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 mt-2 space-y-1 overflow-y-auto">
          <p className="px-4 text-[10px] font-bold text-red-200/50 uppercase tracking-[0.2em] mb-3">
            Menu Dashboard
          </p>
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => isMobile && setOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                  ${
                    isActive
                      ? "bg-white text-[#e91818] font-bold shadow-lg"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }
                `}
              >
                <span
                  className={`${
                    isActive
                      ? "text-[#e91818]"
                      : "text-red-200 group-hover:scale-110 transition-transform"
                  }`}
                >
                  {link.icon}
                </span>
                <span className="text-sm font-medium">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-3 w-full px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all font-bold text-sm active:scale-95"
          >
            <LogOut size={18} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Backdrop خلفية مظلمة عند فتح القائمة على الموبايل */}
      {isMobile && open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        />
      )}
    </>
  );
}
