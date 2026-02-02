import { getServices } from "@/actions/services";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Settings, ArrowRight, CheckCircle } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ServicesPage() {
  const result = await getServices({
    pagination: { page: 1, limit: 100 },
    filters: { isActive: true },
    options: { includeDeleted: false },
  });

  const services = result.data;

  if (!services || services.length === 0) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-background py-24 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <Typography
              variant="h1"
              weight="bold"
              className="mb-6 text-5xl lg:text-6xl"
            >
              Nos Services
            </Typography>
            <Typography variant="lead" theme="muted" className="text-xl">
              Découvrez notre gamme complète de services conçus pour répondre à
              tous vos besoins
            </Typography>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => (
            <Card
              key={service.id}
              className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-1"
            >
              <CardContent className="p-6 space-y-4">
                {/* Icon */}
                {service.icon && (
                  <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                    {service.icon}
                  </div>
                )}

                {/* Title */}
                <Typography variant="h3" weight="bold" className="text-2xl">
                  {service.title}
                </Typography>

                {/* Description */}
                <Typography
                  variant="body-base"
                  theme="muted"
                  className="line-clamp-3"
                >
                  {service.description}
                </Typography>

                {/* Features Preview (if images array has items) */}
                {service.images && service.images.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {service.images.slice(0, 3).map((_, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1 text-sm text-muted-foreground"
                      >
                        <CheckCircle className="h-4 w-4 text-primary" />
                        <span>Feature {idx + 1}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* CTA */}
                <Link href={`/services/${service.id}`} className="block">
                  <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground">
                    En savoir plus
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-16">
        <div className="container mx-auto px-4 text-center">
          <Typography variant="h2" weight="bold" className="mb-4">
            Besoin d'un service personnalisé ?
          </Typography>
          <Typography
            variant="lead"
            theme="muted"
            className="mb-8 max-w-2xl mx-auto"
          >
            Contactez-nous pour discuter de vos besoins spécifiques et obtenir
            une solution sur mesure
          </Typography>
          <Button size="lg" className="text-lg px-8">
            Nous contacter
          </Button>
        </div>
      </section>
    </div>
  );
}
