import React, { Suspense } from "react";
import { Metadata } from "next";
import { db } from "@/lib/db";
import { appSettings } from "@/database/schema";
import { VipPageContent } from "@/components/pages/vip/vip-page-content";
import { Typography } from "@/components/ui/typography";
import { Sparkles, Crown } from "lucide-react";

export const metadata: Metadata = {
  title: "Devenir VIP | GT-V2",
  description:
    "Débloquez tout le potentiel de GT-V2 avec nos abonnements VIP exclusifs.",
};

async function getVipPrices() {
  try {
    const settings = await db.select().from(appSettings).limit(1);
    const config = settings[0];

    return {
      monthly: config?.vipMonthlyPrice ? parseInt(config.vipMonthlyPrice) : 999,
      yearly: config?.vipYearlyPrice ? parseInt(config.vipYearlyPrice) : 9999,
      lifetime: 25000, // Prix fixe ou à ajouter dans la DB plus tard
    };
  } catch (error) {
    console.error("Failed to fetch VIP prices:", error);
    return {
      monthly: 999,
      yearly: 9999,
      lifetime: 25000,
    };
  }
}

export default async function VipPage() {
  const prices = await getVipPrices();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/5 via-background to-background -z-10" />
      <div className="absolute top-20 right-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute top-40 left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10" />

      <main className="container mx-auto py-16 px-4 relative">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-6">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 px-4 py-1.5 rounded-full text-yellow-600 dark:text-yellow-400 font-medium text-sm animate-fade-in">
            <Crown className="h-4 w-4" />
            <span>Passez au niveau supérieur</span>
          </div>

          <Typography
            variant="h1"
            className="text-5xl md:text-7xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/50"
          >
            Devenez <span className="text-primary">VIP</span>
          </Typography>

          <Typography
            variant="h3"
            className="text-xl md:text-2xl text-muted-foreground font-light"
          >
            Débloquez des fonctionnalités exclusives, gagnez plus de récompenses
            et dominez la compétition.
          </Typography>
        </div>

        {/* Pricing Cards & Assistant */}
        <Suspense
          fallback={
            <div className="h-96 flex items-center justify-center">
              Chargement des tarifs...
            </div>
          }
        >
          <VipPageContent prices={prices} />
        </Suspense>

        {/* FAQ Section */}
        <div className="mt-24 text-center space-y-8">
          <Typography variant="h2" className="text-2xl font-bold">
            Pourquoi devenir VIP ?
          </Typography>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto text-left">
            <div className="p-6 rounded-2xl bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors">
              <div className="h-10 w-10 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="h-5 w-5 text-blue-500" />
              </div>
              <h3 className="font-bold text-lg mb-2">Visibilité Maximale</h3>
              <p className="text-sm text-muted-foreground">
                Votre profil et vos boutiques sont mis en avant, attirant plus
                de visiteurs et de clients potentiels.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors">
              <div className="h-10 w-10 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                <Crown className="h-5 w-5 text-purple-500" />
              </div>
              <h3 className="font-bold text-lg mb-2">Statut Exclusif</h3>
              <p className="text-sm text-muted-foreground">
                Affichez votre badge VIP unique. Montrez à la communauté que
                vous faites partie de l'élite.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors">
              <div className="h-10 w-10 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                <Typography variant="h4" className="text-green-500 font-bold">
                  $
                </Typography>
              </div>
              <h3 className="font-bold text-lg mb-2">Économies Réelles</h3>
              <p className="text-sm text-muted-foreground">
                Réduisez vos frais de transaction et accédez à des contenus
                premium gratuitement.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
