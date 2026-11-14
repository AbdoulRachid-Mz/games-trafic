import { getServices } from "@/actions/services";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Sparkles, Shield, Trophy, ShoppingBag, HelpCircle, BookOpen } from "lucide-react";
import { ServiceCard } from "@/components/cards/service-card";
import Link from "next/link";

export default async function ServicesPage() {
  let result: Awaited<ReturnType<typeof getServices>>;
  try {
    result = await getServices({
      pagination: { page: 1, limit: 100 },
      filters: { isActive: true },
      options: { includeDeleted: false },
    });
  } catch {
    result = {
      data: [],
      pagination: { page: 1, limit: 100, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
    };
  }

  const services = result.data;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section Premium */}
      <section className="relative pt-16 pb-16 md:pt-24 md:pb-20 overflow-hidden border-b border-border/40">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Prestations & Accompagnement</span>
            </div>

            <Typography
              variant="h1"
              className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tight uppercase leading-[1.05]"
            >
              Services Officiels <br />
              <span className="bg-gradient-to-r from-primary via-purple-400 to-blue-500 bg-clip-text text-transparent italic">
                Games-Trafics
              </span>
            </Typography>

            <Typography
              variant="lead"
              className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            >
              Bénéficiez de l'accompagnement officiel de notre équipe pour vos tournois, vos boutiques, votre compte ou vos intégrations techniques.
            </Typography>

            {/* Piliers des services réels */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-left">
              {[
                { icon: Trophy, label: "Tournois E-Sport", desc: "Organisation & Brackets" },
                { icon: ShoppingBag, label: "Boutiques", desc: "Création & Certification" },
                { icon: Shield, label: "Sécurité & Wallet", desc: "Assistance GTC & PIN" },
                { icon: HelpCircle, label: "Support Pro", desc: "Assistance technique" },
              ].map((pil, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-card/60 border border-border/60 space-y-1">
                  <pil.icon className="h-4 w-4 text-primary" />
                  <p className="text-xs font-bold leading-tight">{pil.label}</p>
                  <p className="text-[10px] text-muted-foreground">{pil.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Grille des Prestations */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <Typography variant="h2" className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
              Toutes nos prestations
            </Typography>
            <p className="text-xs text-muted-foreground mt-0.5">
              {services.length} prestation{services.length > 1 ? "s" : ""} disponible{services.length > 1 ? "s" : ""} sur la plateforme
            </p>
          </div>

          <Button variant="outline" size="sm" asChild className="rounded-xl gap-2 text-xs font-bold">
            <Link href="/docs">
              <BookOpen className="w-3.5 h-3.5 text-primary" />
              Consulter la documentation
            </Link>
          </Button>
        </div>

        {services.length === 0 ? (
          <div className="text-center py-16 px-4 bg-muted/20 rounded-3xl border border-dashed border-border/60 max-w-md mx-auto space-y-4">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto text-2xl">
              ✨
            </div>
            <Typography variant="h4" className="font-bold text-lg">
              Aucune prestation active pour le moment
            </Typography>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Nos équipes préparent les prochaines offres d'accompagnement. Vous pouvez contacter le support pour toute demande particulière.
            </p>
            <Button size="sm" asChild className="rounded-xl text-xs font-bold">
              <Link href="/support">Contacter le support</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                item={service}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
