// @/docs/page.tsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Shield, 
  Sparkles,
  Rocket,
  Users,
  Trophy,
  ShoppingBag,
  Wallet,
  GamepadIcon,
  ArrowRight,
  Star,
  MessageSquare,
  HelpCircle,
  Lock,
  Zap,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const categories = [
  {
    title: "Démarrage Rapide",
    description: "Guide essentiel en 5 étapes pour configurer son compte et découvrir la plateforme.",
    icon: Rocket,
    href: "/docs/getting-started",
    gradient: "from-emerald-500/20 via-teal-500/10 to-transparent",
    iconBg: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    badge: "Essentiel",
    badgeColor: "border-emerald-500/30 text-emerald-500 bg-emerald-500/5",
  },
  {
    title: "Compte & Sécurité",
    description: "Profils joueurs, rôles système, vérification KYC et authentification par Passkeys biométriques.",
    icon: Shield,
    href: "/docs/account/overview",
    gradient: "from-violet-500/20 via-purple-500/10 to-transparent",
    iconBg: "bg-violet-500/10 text-violet-500 border-violet-500/20",
    badge: "Sécurité",
    badgeColor: "border-violet-500/30 text-violet-500 bg-violet-500/5",
  },
  {
    title: "Wallet GTC & Finances",
    description: "Gestion du solde GTC, dépôts, retraits, transferts P2P, code PIN et statuts de transactions.",
    icon: Wallet,
    href: "/docs/wallet/overview",
    gradient: "from-blue-500/20 via-indigo-500/10 to-transparent",
    iconBg: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    badge: "Finances",
    badgeColor: "border-blue-500/30 text-blue-500 bg-blue-500/5",
  },
  {
    title: "Catalogue de Jeux & Items",
    description: "Monnaies eFootball Coins, FC Points, passes saisonniers, skins et équipements officiels.",
    icon: GamepadIcon,
    href: "/docs/games/overview",
    gradient: "from-rose-500/20 via-red-500/10 to-transparent",
    iconBg: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    badge: "Jeux",
    badgeColor: "border-rose-500/30 text-rose-500 bg-rose-500/5",
  },
  {
    title: "Tournois & Compétitions",
    description: "Création d'éditions, formats Round-Robin, Simple/Double élimination et gestion des brackets.",
    icon: Trophy,
    href: "/docs/tournaments/overview",
    gradient: "from-amber-500/20 via-orange-500/10 to-transparent",
    iconBg: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    badge: "E-Sport",
    badgeColor: "border-amber-500/30 text-amber-500 bg-amber-500/5",
  },
  {
    title: "Boutiques & Marketplace",
    description: "Vente d'articles certifiés, gestion des stocks, expédition et encaissement sécurisé par Escrow.",
    icon: ShoppingBag,
    href: "/docs/shops/overview",
    gradient: "from-pink-500/20 via-fuchsia-500/10 to-transparent",
    iconBg: "bg-pink-500/10 text-pink-500 border-pink-500/20",
    badge: "Commerce",
    badgeColor: "border-pink-500/30 text-pink-500 bg-pink-500/5",
  },
  {
    title: "Équipes & Rôles E-Sport",
    description: "Création de rosters, attribution des rôles capitaine/joueur/coach et inscriptions collectives.",
    icon: Users,
    href: "/docs/teams/overview",
    gradient: "from-cyan-500/20 via-teal-500/10 to-transparent",
    iconBg: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
    badge: "Rosters",
    badgeColor: "border-cyan-500/30 text-cyan-500 bg-cyan-500/5",
  },
  {
    title: "Communauté & Clips",
    description: "Partage d'extraits vidéo de gameplay, messagerie instantanée directe et en groupe.",
    icon: MessageSquare,
    href: "/docs/community/overview",
    gradient: "from-sky-500/20 via-blue-500/10 to-transparent",
    iconBg: "bg-sky-500/10 text-sky-500 border-sky-500/20",
    badge: "Social",
    badgeColor: "border-sky-500/30 text-sky-500 bg-sky-500/5",
  },
  {
    title: "Programme Membre VIP",
    description: "Avantages de commissions allégées, badge de prestige doré et accès prioritaire aux tournois.",
    icon: Star,
    href: "/docs/vip/overview",
    gradient: "from-yellow-500/20 via-amber-500/10 to-transparent",
    iconBg: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    badge: "Premium",
    badgeColor: "border-yellow-500/30 text-yellow-500 bg-yellow-500/5",
  },
  {
    title: "Support & Signalements",
    description: "Accompagnement par notre équipe technique, FAQ, résolution de litiges et suivi d'anomalies.",
    icon: HelpCircle,
    href: "/support",
    gradient: "from-emerald-500/20 via-green-500/10 to-transparent",
    iconBg: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    badge: "Assistance",
    badgeColor: "border-emerald-500/30 text-emerald-500 bg-emerald-500/5",
  },
];

const platformPillars = [
  {
    icon: Lock,
    title: "Sécurité & PIN Wallet",
    description: "Toutes les opérations sensibles sont validées par un code PIN secret et chiffrées selon les standards bancaires.",
  },
  {
    icon: Trophy,
    title: "Brackets Automatisés",
    description: "Génération dynamique d'arbres compétitifs, gestion des poules Round-Robin et attribution automatique des récompenses.",
  },
  {
    icon: ShoppingBag,
    title: "Protection Séquestre (Escrow)",
    description: "Les fonds d'achat restent protégés en compte séquestre tant que la conformité de la livraison n'est pas validée.",
  },
  {
    icon: Zap,
    title: "Temps Réel & Passkeys",
    description: "Synchronisation instantanée des scores, messagerie en direct et authentification biométrique sans mot de passe.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function DocsPage() {
  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section Immersive & Pro */}
      <section className="relative pt-6 pb-12 sm:pt-10 sm:pb-16 rounded-[2.5rem] bg-gradient-to-b from-card/80 via-card/40 to-transparent border border-border/50 p-6 sm:p-10 overflow-hidden shadow-2xl">
        {/* Glow ambient background lights */}
        <div className="absolute -top-24 right-1/4 w-96 h-96 bg-primary/15 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-12 w-80 h-80 bg-blue-500/10 rounded-full blur-[110px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6 text-start">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Centre de Documentation Officiel</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight leading-[1.08] bg-gradient-to-r from-foreground via-foreground/90 to-foreground/60 bg-clip-text text-transparent">
              Tout comprendre sur <br />
              <span className="bg-gradient-to-r from-primary via-purple-400 to-blue-500 bg-clip-text text-transparent italic">
                Games-Trafics
              </span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl font-normal">
              Consultez les guides techniques, les règles de tournois, l'architecture du Wallet GTC et les procédures officielles pour tirer le meilleur parti de l'écosystème.
            </p>
          </div>

          {/* Quick CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button size="lg" className="rounded-xl h-11 px-6 font-bold text-xs uppercase tracking-wider gap-2 shadow-lg shadow-primary/25" asChild>
              <Link href="/docs/getting-started">
                <Rocket className="h-4 w-4" />
                Guide de Démarrage
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-xl h-11 px-6 font-bold text-xs gap-2 border-border/60 hover:bg-muted/50" asChild>
              <Link href="/docs/guides">
                <Sparkles className="h-4 w-4 text-primary" />
                Guides Interactifs
              </Link>
            </Button>
            <Button size="lg" variant="ghost" className="rounded-xl h-11 px-5 font-bold text-xs gap-2 text-muted-foreground hover:text-foreground" asChild>
              <Link href="/signals">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Signaler une anomalie
              </Link>
            </Button>
          </div>

          {/* Micro Stats Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-border/40">
            {[
              { val: "10 Modules", label: "Documentation exhaustive" },
              { val: "Wallet GTC", label: "Finances & Transactions" },
              { val: "Passkeys", label: "Sécurité biométrique" },
              { val: "Tournois", label: "Brackets automatisés" },
            ].map((stat, i) => (
              <div key={i} className="space-y-0.5">
                <p className="text-xs font-black uppercase text-foreground tracking-tight">{stat.val}</p>
                <p className="text-[11px] text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Grid Section */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-foreground">
              Documentation par Catégorie
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sélectionnez un domaine pour explorer les explications détaillées et règles métier.
            </p>
          </div>
          <Badge variant="outline" className="self-start sm:self-auto text-xs font-bold px-3 py-1 rounded-full border-border/60">
            {categories.length} Sections Disponibles
          </Badge>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <motion.div key={category.title} variants={itemVariants}>
                <Link href={category.href} className="block h-full group">
                  <Card className="relative h-full overflow-hidden border-border/60 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 rounded-3xl flex flex-col justify-between">
                    {/* Subtle top glow */}
                    <div className={`absolute top-0 left-0 right-0 h-24 bg-gradient-to-b ${category.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                    <CardHeader className="relative z-10 p-5 pb-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-md ${category.iconBg}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <Badge variant="outline" className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${category.badgeColor}`}>
                          {category.badge}
                        </Badge>
                      </div>

                      <div className="space-y-1">
                        <CardTitle className="text-base font-black tracking-tight uppercase group-hover:text-primary transition-colors">
                          {category.title}
                        </CardTitle>
                        <CardDescription className="text-xs leading-relaxed text-muted-foreground line-clamp-2 font-normal">
                          {category.description}
                        </CardDescription>
                      </div>
                    </CardHeader>

                    <CardContent className="relative z-10 px-5 pb-4 pt-0">
                      <div className="flex items-center text-xs font-bold text-primary gap-1 group-hover:gap-2 transition-all">
                        <span>Explorer ce module</span>
                        <ArrowRight className="h-3.5 w-3.5 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* Platform Architecture & Guarantees */}
      <section className="space-y-6 pt-4">
        <div className="text-start">
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-foreground">
            Principes d'Ingénierie & Sécurité
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            L'architecture de Games-Trafics repose sur 4 garanties fondamentales.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {platformPillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="p-5 rounded-3xl bg-card/40 border border-border/60 backdrop-blur-sm space-y-2.5 hover:border-primary/30 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-black uppercase tracking-tight text-foreground">
                  {pillar.title}
                </h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Fast Help & Support Banner */}
      <section className="rounded-3xl p-6 sm:p-8 border border-border/60 bg-gradient-to-r from-card via-card/70 to-card flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
        <div className="space-y-2 text-start">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Assistance Dédiée</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
            Vous ne trouvez pas la réponse à votre question ?
          </h3>
          <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
            Notre équipe d'assistance et de modération répond à vos demandes techniques, questions de tournois ou vérification de compte.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Button size="lg" className="rounded-xl h-11 px-6 font-bold text-xs uppercase tracking-wider gap-2 shadow-md" asChild>
            <Link href="/support">
              <HelpCircle className="w-4 h-4" />
              Contacter le support
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="rounded-xl h-11 px-6 font-bold text-xs gap-2 border-border/60" asChild>
            <Link href="/signals">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Signaler un bug
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
