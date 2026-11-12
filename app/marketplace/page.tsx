import { Metadata } from "next";
import { MarketplaceContent } from "@/components/pages/marketplace/marketplace-content";
import { getAppUrlEnv } from "@/utils/app-url";

export const metadata: Metadata = {
  title: "Marketplace Gaming | GT-V2 - Trouve ton compte parfait",
  metadataBase: new URL(getAppUrlEnv()),
  description: "Marketplace de comptes de jeu premium. Trouve des comptes vérifiés pour tous tes jeux préférés. Achat sécurisé, livraison instantanée.",
  openGraph: {
    title: "Marketplace Gaming | GT-V2",
    description: "L'ultime marketplace pour les gamers. Des milliers de comptes disponibles.",
    images: ["/og-marketplace.jpg"],
  },
};

export default function MarketplacePage() {
  return <MarketplaceContent />;
}