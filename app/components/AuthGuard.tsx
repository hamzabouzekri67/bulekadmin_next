"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Preferences } from "@capacitor/preferences";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const { value: token } = await Preferences.get({ key: "token" });

      const isLoginPage = pathname === "/login";
      const isRootPage = pathname === "/";

      if (token && (isLoginPage || isRootPage)) {
        router.replace("/dashboard/orders");
      } else if (
        !token &&
        (pathname.startsWith("/dashboard") ||
          pathname.startsWith("/store") ||
          isRootPage)
      ) {
        if (!isLoginPage) {
          router.replace("/login");
        } else {
          setIsReady(true);
        }
      } else {
        setIsReady(true);
      }
    }

    checkAuth();
  }, [pathname, router]);

  // شاشة التحميل
  if (!isReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-white text-[#e91818] font-bold">
        <p>Bulek Eats - Chargement...</p>
      </div>
    );
  }

  return <>{children}</>;
}
