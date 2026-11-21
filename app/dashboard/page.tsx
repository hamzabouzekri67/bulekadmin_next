"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/app/context/UserContext";

export default function Home() {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!user?.role) return; // ننتظر تحميل المستخدم

    if (user.role === "store_owner") {
      router.replace("/dashboard/store-owner/recharge");
    } else {
      router.replace("/dashboard/orders");
    }
  }, [user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#e91818] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}