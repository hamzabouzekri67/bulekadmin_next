"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Preferences } from "@capacitor/preferences";
import { useUser } from "../context/UserContext"; // عدّل المسار حسب مكان الملف

// ===== إعدادات المسارات =====
const PUBLIC_ROUTES = ["/login"];

const ROLE_HOME: Record<string, string> = {
  store_owner: "/dashboard/store-owner/recharge",
  admin: "/dashboard/orders",
  super_admin: "/dashboard/orders",
};

// المسارات المسموحة لكل دور (أي مسار غير مذكور = ممنوع)
const ROLE_ROUTES: Record<string, string[]> = {
  store_owner: ["/dashboard/store-owner"],
  admin: [
    "/dashboard/orders", // تشمل /dashboard/orders/history
    "/dashboard/drivers",
    "/dashboard/storelist",
    "/dashboard/offers",
    "/store",
  ],
  super_admin: ["/dashboard", "/store"],
};

// مسارات ممنوعة حتى لو دخلت تحت مسار مسموح
const ROLE_BLOCKED: Record<string, string[]> = {
  super_admin: ["/dashboard/store-owner"],
};

const USER_LOAD_TIMEOUT_MS = 8000;

const matches = (path: string, base: string) =>
  path === base || path.startsWith(base + "/");

const isAllowed = (role: string | undefined, path: string) => {
  if (!role) return false;
  if ((ROLE_BLOCKED[role] ?? []).some((p) => matches(path, p))) return false;
  return (ROLE_ROUTES[role] ?? []).some((p) => matches(path, p));
};

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || "";
  const { user } = useUser();

  // null = لم يُفحص بعد. نُبقي القيمة القديمة أثناء إعادة الفحص
  // حتى لا تُفكَّك الصفحة (وهذا ما كان يسبب الريفريش ورجوع scroll)
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  const isPublic = PUBLIC_ROUTES.some((p) => matches(pathname, p));
  const isRoot = pathname === "/";
  const role = user?.role;

  // 1) فحص الـ token عند كل تغيير مسار، والتوجيه إلى /login فقط بعد قراءة حديثة
  useEffect(() => {
    let cancelled = false;
    Preferences.get({ key: "token" }).then(({ value }) => {
      if (cancelled) return;
      setHasToken(!!value);
      if (!value && !isPublic) router.replace("/login");
    });
    return () => {
      cancelled = true;
    };
  }, [pathname, isPublic, router]);

  // 2) الوجهة حسب الدور (تُحسب أثناء الرسم لمنع وميض الصفحات الممنوعة)
  let redirectTo: string | null = null;
  if (hasToken && role) {
    if (isPublic || isRoot || !isAllowed(role, pathname)) {
      redirectTo = ROLE_HOME[role] ?? "/login";
    }
  }

  useEffect(() => {
    if (redirectTo && redirectTo !== pathname) router.replace(redirectTo);
  }, [redirectTo, pathname, router]);

  // 3) token موجود لكن المستخدم لم يُحمَّل (token منتهٍ أو فشل الـ API)
  useEffect(() => {
    if (!hasToken || role || isPublic) return;
    const t = setTimeout(async () => {
      await Preferences.remove({ key: "token" });
      router.replace("/login");
    }, USER_LOAD_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [hasToken, role, isPublic, router]);

  // 4) متى نعرض الصفحة؟
  let canRender = false;
  if (hasToken === null) canRender = false;
  else if (!hasToken) canRender = isPublic;
  else canRender = !!role && !redirectTo;

  if (!canRender) {
    return (
      <div className="flex h-screen items-center justify-center bg-white text-[#e91818] font-bold">
        <p>Bulek Eats - Chargement...</p>
      </div>
    );
  }

  return <>{children}</>;
}