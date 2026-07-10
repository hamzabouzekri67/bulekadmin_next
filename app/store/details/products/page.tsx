"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// 1. المكون الداخلي الذي يحتوي على منطق الـ Hooks
function ProductsStoreContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  return (
    <div className="p-4">
      <h1>متجر رقم: {id}</h1>
      {/* ضع هنا منطق عرض المنتجات الخاص بك */}
    </div>
  );
}

// 2. المكون الرئيسي الذي يُصدر للخارج (يغلف المحتوى بـ Suspense)
export default function ProductsStore() {
  return (
    <Suspense fallback={<div>جاري تحميل المنتجات...</div>}>
      <ProductsStoreContent />
    </Suspense>
  );
}
