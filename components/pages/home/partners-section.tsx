// @/components/pages/home/partners-section.tsx
"use client";

import { useFeaturedPartners } from "@/hooks/use-partners";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Building2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function PartnersSection() {
  const { data: partners, isLoading } = useFeaturedPartners();

  if (isLoading) {
    return (
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Partners</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Trusted by leading brands in gaming and esports
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
          <h2 className="text-3xl font-bold mb-4">Our Partners</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Trusted by leading brands in gaming and esports
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
          {partners.map((partner) => (
            <Link
              key={partner.id}
              href={
                partner.website || `/partners/${partner.slug || partner.id}`
              }
              target={partner.website ? "_blank" : undefined}
              rel={partner.website ? "noopener noreferrer" : undefined}
            >
              <Card className="group p-6 hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer">
                <div className="aspect-square relative flex items-center justify-center">
                  {partner.logo ? (
                    <Image
                      src={partner.logo}
                      alt={partner.name}
                      fill
                      className="object-contain p-2 grayscale group-hover:grayscale-0 transition-all"
                    />
                  ) : (
                    <Building2 className="w-12 h-12 text-muted-foreground" />
                  )}
                </div>
                <div className="mt-4 text-center">
                  <p className="font-medium text-sm truncate">{partner.name}</p>
                  {partner.verified && (
                    <Badge variant="secondary" className="mt-2 text-xs">
                      Verified
                    </Badge>
                  )}
                </div>
                {partner.website && (
                  <ExternalLink className="absolute top-2 right-2 w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </Card>
            </Link>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/partners"
            className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
          >
            View all partners
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
