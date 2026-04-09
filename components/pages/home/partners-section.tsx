// @/components/pages/home/partners-section.tsx
"use client";

import { useFeaturedPartners } from "@/hooks/use-partners";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Building2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { PartnerCard } from "@/components/cards/partner-card";

export function PartnersSection() {
  const { data: partners, isLoading } = useFeaturedPartners();

  if (isLoading) {
    return (
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Nos Partenaires</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Reconnus par les plus grandes marques du gaming et de l'esport
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="aspect-square bg-muted rounded-lg" />
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!partners || partners.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-muted/30">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Nos Partenaires</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Reconnus par les plus grandes marques du gaming et de l'esport
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
          {partners.map((partner) => (
            <PartnerCard
              key={partner.id}
              partner={partner}
              viewMode="grid"
              showActions={false}
              showBadge={partner.verified ?? false}
              showDescription={false}
              showContactInfo={false}
              showWebsite={false}
              variant="default"
              className="cursor-pointer hover:scale-105 transition-transform duration-300"
            />
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/partners"
            className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
          >
            Voir tous les partenaires
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
