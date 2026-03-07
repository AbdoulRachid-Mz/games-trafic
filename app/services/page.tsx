import { getServices } from "@/actions/services";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Search, SlidersHorizontal, Sparkles, Filter } from "lucide-react";
import { ServiceCard } from "@/components/cards/service-card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

//revalidate
export const revalidate = 60;

export default async function ServicesPage() {
  const result = await getServices({
    pagination: { page: 1, limit: 100 },
    filters: { isActive: true },
    options: { includeDeleted: false },
  });

  const services = result.data;

  return (
    <div className="min-h-screen bg-background/50">
      {/* Premium Hero Section */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-24 overflow-hidden">
        {/* Abstract Background Elemets */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -mr-64 -mt-64" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px] -ml-48 -mb-48" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-bold tracking-wider uppercase">Nos Solutions</span>
            </div>

            <Typography
              variant="h1"
              weight="bold"
              className="text-4xl md:text-5xl lg:text-6xl tracking-tighter italic uppercase animate-in fade-in slide-in-from-bottom-6 duration-1000"
            >
              Services <span className="text-primary">E-Sport</span> & Gaming
            </Typography>

            <Typography
              variant="lead"
              theme="muted"
              className="text-xl max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200"
            >
              Boostez votre expérience de jeu avec nos services professionnels.
              Du coaching intensif aux solutions techniques sur mesure.
            </Typography>

            {/* Quick Search/Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-4 max-w-2xl mx-auto pt-8 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un service..."
                  className="pl-12 h-14 rounded-[2rem] md:rounded-[2.5rem] bg-background/80 backdrop-blur-md border-border/50 shadow-xl"
                />
              </div>
              <Button size="lg" className="h-14 px-8 rounded-[2rem] md:rounded-[2.5rem] gap-2 w-full sm:w-auto shadow-lg shadow-primary/20">
                <Filter className="w-5 h-5" />
                Filtrer
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-3 pt-4 animate-in fade-in duration-1000 delay-500">
              {["Coaching", "Boost", "Design", "Account Management", "Technical Support"].map((tag) => (
                <Badge key={tag} variant="outline" className="px-4 py-1.5 rounded-full hover:bg-primary/5 cursor-pointer transition-colors border-border/50">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="flex items-center justify-between mb-12">
          <div>
            <Typography variant="h2" weight="bold" className="text-3xl tracking-tight">
              Tous nos services
            </Typography>
            <div className="h-1 w-20 bg-primary mt-2 rounded-full" />
          </div>
          <Typography variant="body-sm" theme="muted" className="hidden sm:block">
            Affiche <span className="text-foreground font-bold">{services.length}</span> services disponibles
          </Typography>
        </div>

        {!services || services.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 rounded-[2rem] md:rounded-[2.5rem] border border-dashed border-border">
            <Typography variant="h3" theme="muted">Aucun service disponible pour le moment</Typography>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}
      </section>

      {/* Premium CTA Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="relative rounded-[4rem] overflow-hidden bg-primary p-12 lg:p-20 text-center">
          {/* Animated background blobs */}
          <div className="absolute top-0 left-0 w-full h-full opacity-30">
            <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-white rounded-full blur-[150px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-secondary rounded-full blur-[120px]" />
          </div>

          <div className="relative z-10 max-w-3xl mx-auto space-y-8">
            <Typography variant="h2" weight="bold" className="text-4xl lg:text-6xl text-white tracking-tighter uppercase italic">
              Besoin d'une solution sur mesure ?
            </Typography>
            <Typography variant="lead" className="text-white/80 text-xl">
              Notre équipe d'experts est prête à répondre à vos besoins spécifiques.
              Parlons de votre projet dès aujourd'hui.
            </Typography>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 rounded-[2rem] md:rounded-[2.5rem] px-10 h-14 text-lg transition-transform hover:scale-105">
                Nous Contacter
              </Button>
              <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 rounded-[2rem] md:rounded-[2.5rem] px-10 h-14 text-lg">
                En savoir plus
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
