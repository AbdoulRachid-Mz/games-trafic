// @/docs/page.tsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Book, 
  Shield, 
  Database, 
  Sparkles,
  Rocket,
  Users,
  Trophy,
  ShoppingBag,
  Wallet,
  GamepadIcon,
  Palette,
  ArrowRight,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const categories = [
  {
    title: "Démarrage",
    description: "Tout ce qu'il faut savoir pour bien débuter sur la plateforme",
    icon: Rocket,
    href: "/docs/getting-started",
    color: "from-emerald-500 to-teal-500",
    badge: "Essentiel",
  },
  {
    title: "Transactions",
    description: "Gestion du Wallet GTC, dépôts et retraits sécurisés",
    icon: Wallet,
    href: "/docs/transactions/overview",
    color: "from-blue-500 to-indigo-500",
    badge: "Finances",
  },
  {
    title: "Tournois",
    description: "Organisation de compétitions et gestion des matches",
    icon: Trophy,
    href: "/docs/tournaments/overview",
    color: "from-amber-500 to-orange-500",
    badge: "E-sport",
  },
  {
    title: "Boutiques",
    description: "Vente de produits et services sur la Marketplace",
    icon: ShoppingBag,
    href: "/docs/shops/overview",
    color: "from-pink-500 to-rose-500",
    badge: "Commerce",
  },
  {
    title: "Support",
    description: "Aide, FAQ et assistance technique 7j/7",
    icon: HelpCircle,
    href: "/support",
    color: "from-cyan-500 to-blue-500",
    badge: "Assistance",
  },
];

import { HelpCircle } from "lucide-react";

const features = [
  {
    icon: Wallet,
    title: "Transactions sécurisées",
    description: "Paiements et transferts protégés par notre système GTC",
  },
  {
    icon: Trophy,
    title: "Tournois compétitifs",
    description: "Organisez et participez à des tournois avec lots à gagner",
  },
  {
    icon: ShoppingBag,
    title: "Marketplace",
    description: "Achetez et vendez des produits gaming en toute confiance",
  },
  {
    icon: GamepadIcon,
    title: "Items de jeu",
    description: "Obtenez des skins, crédits et équipements pour vos jeux",
  },
  {
    icon: Palette,
    title: "Personnalisation",
    description: "Créez et personnalisez votre espace avec des thèmes uniques",
  },
  {
    icon: Star,
    title: "Programme VIP",
    description: "Accédez à des avantages exclusifs avec l'abonnement VIP",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function DocsPage() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Badge variant="secondary" className="mb-4 px-3 py-1">
            <Sparkles className="h-3 w-3 mr-1" />
            Documentation
          </Badge>
          <h1 className="scroll-m-20 text-5xl font-extrabold tracking-tight lg:text-6xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Bienvenue sur Games Trafic
          </h1>
          <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
            Votre plateforme tout-en-un pour le gaming, les transactions et les compétitions.
            Découvrez comment tirer le meilleur parti de notre écosystème.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex flex-wrap justify-center gap-4"
        >
          <Button size="lg" className="gap-2" asChild>
            <Link href="/docs/guides">
              Explorer les guides
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="gap-2" asChild>
            <Link href="/docs/legal/terms">
              Conditions d'utilisation
            </Link>
          </Button>
        </motion.div>
      </section>

      {/* Categories Section */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Documentation par catégorie</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={category.href}>
                  <Card className="group h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border-2 hover:border-primary/50">
                    <CardHeader>
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="flex items-center justify-between">
                        {category.title}
                        {category.badge && (
                          <Badge variant="outline" className="text-xs">
                            {category.badge}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        Voir la documentation
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Features Section */}
      <section>
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Fonctionnalités clés</h2>
          <p className="text-muted-foreground">
            Découvrez tout ce que Games Trafic peut vous offrir
          </p>
        </div>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div key={feature.title} variants={itemVariants}>
                <Card className="h-full bg-gradient-to-br from-background to-muted/30 border-muted/50">
                  <CardHeader>
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* Quick Start Section */}
      <section className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-2xl p-8 border border-primary/20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-center md:text-left">
            <Badge variant="secondary" className="inline-flex">
              <Rocket className="h-3 w-3 mr-1" />
              Démarrage rapide
            </Badge>
            <h3 className="text-2xl font-bold">Prêt à commencer ?</h3>
            <p className="text-muted-foreground max-w-md">
              Suivez notre guide de démarrage pour créer votre compte et effectuer votre première transaction.
            </p>
          </div>
          <Button size="lg" className="gap-2 shrink-0" asChild>
            <Link href="/docs/guides?category=débutant">
              Commencer maintenant
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}