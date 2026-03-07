import { getServiceById } from "@/actions/services";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { CheckCircle, ArrowLeft, Star, Shield, Zap, MessageSquare, Clock, Sparkles } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

//revalidate
export const revalidate = 60;

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params
  const service = await getServiceById(id);

  if (!service || service.isDeleted || !service.isActive) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Premium Hero Section */}
      <section className="relative py-10 overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[100px] -ml-32 -mb-32" />

        <div className="container mx-auto px-4 relative z-10">
          <Link
            href="/services"
            className="group inline-flex items-center gap-2 text-primary hover:text-primary dark:hover:text-secondary mb-6 md:mb-10 transition-all duration-300 bg-primary/20 px-4 py-2 rounded-full border border-border/50"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Retour aux services</span>
          </Link>

          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <div className="flex flex-wrap gap-3">
                <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1 rounded-full gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Service Premium
                </Badge>
                <Badge variant="outline" className="px-3 py-1 rounded-full gap-1.5 border-amber-500/20 text-amber-500 bg-amber-500/5">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  5.0 Rating
                </Badge>
              </div>

              <div className="space-y-4">
                <Typography variant="h2" weight="bold" className="text-3xl lg:text-5xl tracking-tighter italic uppercase leading-tight">
                  {service.title}
                </Typography>
                <div className="h-1.5 w-24 bg-primary rounded-full" />
              </div>

              <Typography
                variant="lead"
                className="text-xl text-muted-foreground leading-relaxed max-w-xl"
              >
                {service.description}
              </Typography>

              <div className="flex flex-wrap gap-4 pt-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-muted/30 flex items-center justify-center border border-border/50">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <Typography variant="caption1" theme="muted" className="uppercase tracking-widest font-bold">Sécurité</Typography>
                    <Typography variant="body-sm" weight="semibold">Garanti 100%</Typography>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-muted/30 flex items-center justify-center border border-border/50">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <Typography variant="caption1" theme="muted" className="uppercase tracking-widest font-bold">Livraison</Typography>
                    <Typography variant="body-sm" weight="semibold">Ultra Rapide</Typography>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-muted/30 flex items-center justify-center border border-border/50">
                    <Clock className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <Typography variant="caption1" theme="muted" className="uppercase tracking-widest font-bold">Dispo</Typography>
                    <Typography variant="body-sm" weight="semibold">24h / 7j</Typography>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button size="lg" className="rounded-xl md:rounded-2xl px-6 md:p-8 h-14 text-lg shadow-xl shadow-primary/20 gap-2">
                  Commander Maintenant
                  <Zap className="w-5 h-5 fill-current" />
                </Button>
                <Button size="lg" variant="outline" className="rounded-xl md:rounded-2xl px-6 md:px-8 h-14 text-lg gap-2">
                  <MessageSquare className="w-5 h-5" />
                  En savoir plus
                </Button>
              </div>
            </div>

            {/* Visual Hero Element */}
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-[3rem] blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative aspect-square rounded-[2rem] md:rounded-[2.5rem] overflow-hidden border border-border/50 bg-card/50 backdrop-blur-sm p-2 shadow-2xl">
                {service.images && service.images[0] ? (
                  <Image
                    src={service.images[0]}
                    alt={service.title}
                    fill
                    className="object-cover rounded-[2rem] md:rounded-[2.5rem]"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted/20">
                    <Typography variant="h1" className="text-9xl opacity-20">{service.icon || "✨"}</Typography>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section if more than 1 image */}
      {service.images && service.images.length > 1 && (
        <section className="py-10 bg-muted/10">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-4 mb-12">
              <Typography variant="h2" weight="bold" className="text-3xl tracking-tight">Gallerie</Typography>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {service.images.slice(1).map((imageUrl, idx) => (
                <div key={idx} className="relative aspect-video rounded-3xl overflow-hidden border border-border/50 group shadow-lg">
                  <Image
                    src={imageUrl}
                    alt={`${service.title} - Image ${idx + 2}`}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features Showcase */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-10 md:mb-16 space-y-4">
            <Typography variant="h2" weight="bold" className="text-4xl lg:text-5xl tracking-tighter italic uppercase">
              Pourquoi nous choisir ?
            </Typography>
            <Typography theme="muted" className="text-lg">
              Nous offrons une qualité de service inégalée avec des garanties solides pour votre tranquillité d'esprit.
            </Typography>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: "Expertise de Haut Niveau", desc: "Nos intervenants sont des experts reconnus dans le milieu e-sportif." },
              { title: "Sécurité Maximale", desc: "Protocoles de sécurité stricts pour la protection de vos données et comptes." },
              { title: "Support Dédié", desc: "Une équipe à votre écoute pour répondre à toutes vos questions en temps réel." },
              { title: "Confidentialité", desc: "Discrétion totale garantie pour l'ensemble de nos interventions." },
              { title: "Résultats Immédiats", desc: "Travail efficace pour des résultats visibles dès les premières heures." },
              { title: "Garantie Satisfaction", desc: "Si vous n'êtes pas satisfait, nous nous engageons à corriger le tir." },
            ].map((feature, idx) => (
              <Card key={idx} className="group border-border/50 bg-card/50 hover:border-primary/50 transition-all duration-500 rounded-[1rem] md:rounded-[1.5rem] lg:rounded-[2rem] overflow-hidden">
                <CardContent className="p-4 md:p-6 lg:p-8 space-y-4 max-md:space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-lg group-hover:shadow-primary/30">
                    <CheckCircle className="h-7 w-7" />
                  </div>
                  <Typography variant="h3" weight="bold" className="text-xl pt-2">{feature.title}</Typography>
                  <Typography theme="muted" className="leading-relaxed">{feature.desc}</Typography>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="container mx-auto px-4 py-10">
        <Card className="relative rounded-[3rem] md:rounded-[4rem] overflow-hidden border-none shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-blue-900" />
          <CardContent className="relative z-10 p-8 lg:p-16 text-center">
            <div className="max-w-3xl mx-auto space-y-6">
              <Typography variant="h2" weight="bold" className="text-3xl lg:text-5xl text-white tracking-tighter uppercase italic">
                Prêt à passer au niveau supérieur ?
              </Typography>
              <Typography variant="lead" className="text-white/80 text-xl font-medium">
                Contactez-nous aujourd'hui pour une consultation gratuite ou un devis personnalisé adapté à vos ambitions.
              </Typography>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 rounded-[2rem] px-12 h-14 text-lg shadow-2xl transition-all hover:scale-105">
                  Démarrer Maintenant
                </Button>
                <Button size="lg" variant="outline" className="border-white/20 hover:bg-white/10 rounded-[2rem] px-12 h-14 text-lg">
                  Nous Contacter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
