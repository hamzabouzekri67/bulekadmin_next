"use client";

import { Suspense } from "react";
import ProductsStore from "./products.store"; // المكون الذي يحتوي على المنطق

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductsStore />
    </Suspense>
  );
}