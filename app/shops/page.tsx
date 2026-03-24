import { Suspense } from "react";
import {  ShopsSkeleton, ShopsContent } from "./client-page";


// Page principale avec Suspense
export default function ShopsPage() {
  return (
    <Suspense fallback={<ShopsSkeleton />}>
      <ShopsContent />
    </Suspense>
  );
}