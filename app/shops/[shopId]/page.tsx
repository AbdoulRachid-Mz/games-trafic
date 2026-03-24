import { Suspense, lazy } from "react";
import { ShopSkeleton } from "./client-page";

// mise en cache de la page


// Lazy-load the client component to avoid SSR issues
const ShopPageContent = lazy(() => import("./client-page").then(mod => ({ default: mod.ShopPageContent })));

// Page principale avec Suspense
export default function ShopPage() {
  return (
    <Suspense fallback={<ShopSkeleton />}>
      <ShopPageContent />
    </Suspense>
  );
}