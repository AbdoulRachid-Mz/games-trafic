// @/app/partners/page.tsx
import { Metadata } from "next";
import { getPartners } from "@/actions/partners";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, ExternalLink, Mail, Phone, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { PartnerCard } from "@/components/cards/partner-card";

//mise en cache des partenaires


// La page dépend de données dynamiques et d'un rendu non déterministe :
// on force le rendu dynamique pour éviter l'erreur de prerendering.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Nos Partenaires | Plateforme de Tournois Gaming",
  description: "Découvrez nos partenaires de confiance dans le gaming et l'esport",
};

export default async function PartnersPage() {
  const result = await getPartners({
    isActive: true,
    isVisible: true,
    verified: true,
    status: "ACTIVE",
    limit: 100,
    offset: 0,
    sortBy: "name",
    sortOrder: "asc",
  });

  const partners = result.data || [];

  // Regrouper les partenaires par type
  const partnersByType = partners.reduce(
    (acc, partner) => {
      if (!acc[partner.type]) {
        acc[partner.type] = [];
      }
      acc[partner.type].push(partner);
      return acc;
    },
    {} as Record<string, typeof partners>,
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Section Héroïque */}
      <section className="py-20 bg-gradient-to-b from-primary/10 to-background">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Nos Partenaires
            </h1>
            <p className="text-lg text-muted-foreground">
              Nous sommes fiers de collaborer avec des marques leaders du gaming, de l'esport
              et de la technologie pour vous offrir la meilleure expérience de tournoi.
            </p>
          </div>
        </div>
      </section>

      {/* Grille des Partenaires */}
      <section className="py-16">
        <div className="container">
          {Object.entries(partnersByType).map(([type, typePartners]) => (
            <div key={type} className="mb-16">
              <h2 className="text-2xl font-bold mb-8 capitalize">
                Partenaires {type.toLowerCase().replace(/_/g, " ")}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {typePartners.map((partner) => (
                  <PartnerCard
                    key={partner.id}
                    item={partner}
                    viewMode="grid"
                    showActions
                    showBadge
                    showDescription
                    showContactInfo
                    showWebsite
                    variant="default"
                    className="h-full"
                  />
                ))}
              </div>
            </div>
          ))}

          {partners.length === 0 && (
            <div className="text-center py-16">
              <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Aucun Partenaire pour l'instant</h3>
              <p className="text-muted-foreground">
                Nous sommes en train de construire des partenariats. Revenez bientôt !
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
