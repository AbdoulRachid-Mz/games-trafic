import { Suspense } from "react";
import {  ShopsSkeleton, ShopsContent } from "./client-page";
import { getAppUrlEnv } from "@/utils/app-url";
import { Metadata } from "next";


export const metadata: Metadata = {
  title: "Boutiques | Games-Trafics - Trouvez des boutiques en ligne",
  metadataBase: new URL(getAppUrlEnv()),
  keywords: "shops gaming,  boutiques, shopping, jeux vidéo, boutiques en ligne",
  description: "Boutiques en ligne. Trouve des boutiques en ligne pour tous tes jeux préférés. Achat sécurisé, livraison instantanée.",
  openGraph: {
    title: "Boutiques Gaming | Games-Trafics",
    description: "L'ultime boutiques pour les gamers.",
    images: ["/icons/shop.png"],
  },
  icons: {
    icon: "/icons/shop.png",
    shortcut: "/icons/shop.png",
  },
};


// Page principale avec Suspense
export default function ShopsPage() {
  return (
    <Suspense fallback={<ShopsSkeleton />}>
      <ShopsContent />
    </Suspense>
  );
}