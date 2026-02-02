import { getServiceById } from "@/actions/services";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";

export default async function ServiceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const service = await getServiceById(params.id);

  if (!service || service.isDeleted || !service.isActive) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-background py-24">
        <div className="container mx-auto px-4">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux services
          </Link>

          <div className="max-w-4xl">
            {service.icon && (
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-5xl mb-6">
                {service.icon}
              </div>
            )}

            <Typography variant="h1" weight="bold" className="mb-6 text-5xl">
              {service.title}
            </Typography>

            <Typography
              variant="lead"
              className="text-xl text-muted-foreground"
            >
              {service.description}
            </Typography>
          </div>
        </div>
      </section>

      {/* Images Gallery */}
      {service.images && service.images.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {service.images.map((imageUrl, idx) => (
              <Card key={idx} className="overflow-hidden group">
                <div className="relative aspect-video">
                  <Image
                    src={imageUrl}
                    alt={`${service.title} - Image ${idx + 1}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <Typography variant="h2" weight="bold" className="mb-12 text-center">
            Caractéristiques principales
          </Typography>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              "Service professionnel et fiable",
              "Support client disponible 24/7",
              "Résultats garantis",
              "Tarifs compétitifs",
              "Équipe d'experts qualifiés",
              "Satisfaction client prioritaire",
            ].map((feature, idx) => (
              <Card key={idx} className="border-2">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </div>
                  <Typography variant="body-base" className="pt-2">
                    {feature}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-2">
          <CardContent className="p-12 text-center">
            <Typography variant="h2" weight="bold" className="mb-4">
              Intéressé par ce service ?
            </Typography>
            <Typography
              variant="lead"
              theme="muted"
              className="mb-8 max-w-2xl mx-auto"
            >
              Contactez-nous dès maintenant pour obtenir plus d'informations ou
              demander un devis personnalisé
            </Typography>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8">
                Demander un devis
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8">
                Nous contacter
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
