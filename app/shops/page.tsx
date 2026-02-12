import { Suspense } from "react";
import {  ShopsSkeleton, ShopsContent } from "./client-page";

// mise en cache
export const revalidate = 60; // 60 secondes

// Page principale avec Suspense
export default function ShopsPage() {
  return (
    <Suspense fallback={<ShopsSkeleton />}>
      <ShopsContent />
    </Suspense>
  );
}