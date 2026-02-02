// @/app/partners/page.tsx
import { Metadata } from "next";
import { getPartners } from "@/actions/partners";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, ExternalLink, Mail, Phone, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Our Partners | Gaming Tournament Platform",
  description: "Discover our trusted partners in gaming and esports",
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

  // Group partners by type
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
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-primary/10 to-background">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Our Partners
            </h1>
            <p className="text-lg text-muted-foreground">
              We're proud to collaborate with leading brands in gaming, esports,
              and technology to bring you the best tournament experience.
            </p>
          </div>
        </div>
      </section>

      {/* Partners Grid */}
      <section className="py-16">
        <div className="container">
          {Object.entries(partnersByType).map(([type, typePartners]) => (
            <div key={type} className="mb-16">
              <h2 className="text-2xl font-bold mb-8 capitalize">
                {type.toLowerCase().replace(/_/g, " ")} Partners
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {typePartners.map((partner) => (
                  <Card
                    key={partner.id}
                    className="p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex flex-col h-full">
                      {/* Logo */}
                      <div className="aspect-video relative mb-4 bg-muted rounded-lg overflow-hidden">
                        {partner.logo ? (
                          <Image
                            src={partner.logo}
                            alt={partner.name}
                            fill
                            className="object-contain p-4"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Building2 className="w-16 h-16 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-xl font-semibold">
                            {partner.name}
                          </h3>
                        </div>

                        {partner.description && (
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                            {partner.description}
                          </p>
                        )}

                        {/* Contact Info */}
                        <div className="space-y-2 mb-4">
                          {partner.contactEmail && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="w-4 h-4" />
                              <a
                                href={`mailto:${partner.contactEmail}`}
                                className="hover:text-primary"
                              >
                                {partner.contactEmail}
                              </a>
                            </div>
                          )}
                          {partner.contactPhone && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="w-4 h-4" />
                              <span>{partner.contactPhone}</span>
                            </div>
                          )}
                          {(partner.city || partner.country) && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="w-4 h-4" />
                              <span>
                                {[partner.city, partner.country]
                                  .filter(Boolean)
                                  .join(", ")}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      {partner.website && (
                        <Button asChild className="w-full mt-auto">
                          <a
                            href={partner.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2"
                          >
                            Visit Website
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}

          {partners.length === 0 && (
            <div className="text-center py-16">
              <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Partners Yet</h3>
              <p className="text-muted-foreground">
                We're currently building partnerships. Check back soon!
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
