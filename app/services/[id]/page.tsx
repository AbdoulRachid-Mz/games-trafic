import { getServiceById } from "@/actions/services";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import {
  ArrowLeft,
  Shield,
  MessageSquare,
  Sparkles,
  BookOpen,
  HelpCircle,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

function resolveServiceDocLink(title: string, description: string): { title: string; href: string; summary: string } {
  const t = (title + " " + description).toLowerCase();

  if (t.includes("tournoi") || t.includes("compétition") || t.includes("bracket")) {
    return {
      title: "Documentation officielle des Tournois",
      href: "/docs/tournaments/overview",
      summary: "Découvrez comment fonctionnent les tournois, les phases, les inscriptions et la gestion des résultats sur Games-Trafics.",
    };
  }
  if (t.includes("boutique") || t.includes("vendeur") || t.includes("produit") || t.includes("commande")) {
    return {
      title: "Documentation officielle des Boutiques & Marketplace",
      href: "/docs/shops/overview",
      summary: "Consultez le guide complet sur la création de boutique, la publication de produits et le traitement des commandes.",
    };
  }
  if (t.includes("wallet") || t.includes("finance") || t.includes("gtc") || t.includes("paiement") || t.includes("retrait")) {
    return {
      title: "Documentation officielle du Wallet GTC & Finances",
      href: "/docs/transactions/overview",
      summary: "Apprenez tout sur la gestion de votre solde GTC, les dépôts, transferts et la sécurisation par code PIN.",
    };
  }
  if (t.includes("item") || t.includes("jeu") || t.includes("skin") || t.includes("coin")) {
    return {
      title: "Documentation officielle des Game Items",
      href: "/docs/games/overview",
      summary: "Comprenez le catalogue de jeux, les types d'items disponibles (coins, skins, équipements) et les commandes.",
    };
  }
  return {
    title: "Centre de documentation Games-Trafics",
    href: "/docs",
    summary: "Explorez l'ensemble des fonctionnalités et règles de fonctionnement de la plateforme Games-Trafics.",
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const service = await getServiceById(id);

  if (!service || service.isDeleted || !service.isActive) {
    notFound();
  }

  const relatedDoc = resolveServiceDocLink(service.title, service.description);

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Hero Section */}
      <section className="relative py-8 md:py-12 overflow-hidden border-b border-border/40">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-secondary/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <Link
            href="/services"
            className="group inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors text-xs font-bold uppercase tracking-wider"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span>Retour aux services</span>
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Colonne gauche : Informations de la prestation */}
            <div className="lg:col-span-7 space-y-6 text-start">
              <div className="flex flex-wrap gap-2 items-center">
                <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Prestation Officielle
                </Badge>
                <Badge variant="outline" className="px-3 py-1 rounded-full text-xs font-semibold border-border/60">
                  Games-Trafics Assistance
                </Badge>
              </div>

              <div className="space-y-3">
                <Typography variant="h1" className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight leading-tight">
                  {service.title}
                </Typography>
                <div className="h-1.5 w-20 bg-primary rounded-full" />
              </div>

              <Typography variant="lead" className="text-base sm:text-lg text-muted-foreground leading-relaxed font-normal">
                {service.description}
              </Typography>

              {/* Points clés vérifiés */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-card border border-border/50">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <Typography variant="caption1" className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Accompagnement</Typography>
                    <Typography variant="body-sm" className="font-bold">Par équipe Games-Trafics</Typography>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-card border border-border/50">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <Typography variant="caption1" className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Étude sur mesure</Typography>
                    <Typography variant="body-sm" className="font-bold">Selon vos besoins réels</Typography>
                  </div>
                </div>
              </div>

              {/* CTA Transparent & Réel (Prise de contact / Support) */}
              <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Button size="lg" asChild className="rounded-xl px-6 h-12 text-sm font-black uppercase tracking-wider shadow-lg shadow-primary/20 gap-2">
                  <Link href="/support">
                    <MessageSquare className="w-4 h-4" />
                    Contacter notre équipe
                  </Link>
                </Button>

                <Button size="lg" variant="outline" asChild className="rounded-xl px-6 h-12 text-sm font-bold gap-2 border-border/60">
                  <Link href={relatedDoc.href}>
                    <BookOpen className="w-4 h-4 text-primary" />
                    Consulter la doc officielle
                  </Link>
                </Button>
              </div>
            </div>

            {/* Colonne droite : Visuel de la prestation & Section documentaire */}
            <div className="lg:col-span-5 space-y-6">
              <div className="relative aspect-video sm:aspect-[4/3] rounded-3xl overflow-hidden border border-border/60 bg-card/60 backdrop-blur-sm p-4 shadow-xl flex items-center justify-center">
                {service.images && service.images[0] ? (
                  <Image
                    src={service.images[0]}
                    alt={service.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 text-center p-6">
                    <div className="h-20 w-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-4xl shadow-md">
                      {service.icon || "✨"}
                    </div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Prestation Games-Trafics
                    </p>
                  </div>
                )}
              </div>

              {/* Section EXPLICITE obligatoire : Comprendre la fonctionnalité */}
              <Card className="rounded-2xl border-primary/30 bg-primary/5 backdrop-blur-sm overflow-hidden text-start">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-2 text-primary font-black uppercase tracking-wider text-xs">
                    <BookOpen className="h-4 w-4" />
                    <span>Comprendre la fonctionnalité</span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {relatedDoc.summary}
                  </p>

                  <div className="pt-2">
                    <Button
                      variant="link"
                      asChild
                      className="p-0 h-auto font-black text-xs text-primary hover:text-primary/80 uppercase tracking-wider inline-flex items-center gap-1.5"
                    >
                      <Link href={relatedDoc.href}>
                        {relatedDoc.title}
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Galerie optionnelle si images supplémentaires */}
      {service.images && service.images.length > 1 && (
        <section className="container mx-auto px-4 pt-12">
          <div className="flex items-center gap-3 mb-6">
            <Typography variant="h3" className="text-xl font-bold uppercase tracking-tight">
              Aperçus du service
            </Typography>
            <div className="h-px flex-1 bg-border/50" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {service.images.slice(1).map((imageUrl, idx) => (
              <div key={idx} className="relative aspect-video rounded-2xl overflow-hidden border border-border/50 bg-card">
                <Image
                  src={imageUrl}
                  alt={`${service.title} - ${idx + 2}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
