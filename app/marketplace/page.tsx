import { Suspense } from "react";
import type { Metadata } from "next";
import { MarketplaceContent } from "@/components/pages/marketplace/marketplace-content";
import { getAppUrlEnv } from "@/utils/app-url";

export const metadata: Metadata = {
  title: "Marketplace Gaming | Games-Trafics - Trouve ton compte parfait",
  metadataBase: new URL(getAppUrlEnv()),
  keywords: "marketplace gaming, comptes jeux premium, achat jeux, jeux vidéo, jeux en ligne",
  description: "Marketplace de comptes de jeu premium. Trouve des comptes vérifiés pour tous tes jeux préférés. Achat sécurisé, livraison instantanée.",
  openGraph: {
    title: "Marketplace Gaming | Games-Trafics",
    description: "L'ultime marketplace pour les gamers. Des milliers de comptes disponibles.",
    images: ["/icons/marketplace-240.png"],
  },
  icons: {
    icon: "/icons/marketplace-240.png",
    shortcut: "/icons/marketplace-128.png",
  },
};

/**
 * `MarketplaceContent` lit l'URL via useSearchParams() : ce boundary garde un
 * static shell non vide conformément à Cache Components / instant navigation.
 */
function MarketplaceFallback() {
  return (
    <div className="min-h-screen bg-background" aria-busy="true">
      <div className="h-64 w-full animate-pulse bg-muted/40" />
      <div className="mx-auto grid gap-6 px-4 py-6 lg:grid-cols-4">
        <div className="hidden lg:block">
          <div className="h-96 rounded-xl border border-border/50 bg-card/40" />
        </div>
        <div className="space-y-4 lg:col-span-3">
          <div className="h-16 rounded-xl border border-border/50 bg-card/40" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <div
                key={index}
                className="h-72 rounded-xl border border-border/50 bg-card/40"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={<MarketplaceFallback />}>
      <MarketplaceContent />
    </Suspense>
  );
}
