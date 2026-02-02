"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Users,
  Trophy,
  Wallet,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Star,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function GamingEcosystemSection() {
  const pillars = [
    {
      title: "Connecter",
      description:
        "Rejoignez des communautés, suivez vos influenceurs et partagez vos moments forts.",
      icon: <Users className="w-6 h-6" />,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      link: "/social",
      features: ["Posts & Stories", "Groupes privés", "Messagerie"],
    },
    {
      title: "Compéter",
      description:
        "Participez à des tournois professionnels avec gestion automatique des brackets.",
      icon: <Trophy className="w-6 h-6" />,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
      link: "/tournaments",
      features: ["Brackets dynamiques", "Cashprizes garantis", "Classements"],
    },
    {
      title: "Gagner",
      description:
        "Monétisez vos talents. Encaissez vos gains via votre portefeuille GTC sécurisé.",
      icon: <Wallet className="w-6 h-6" />,
      color: "text-green-500",
      bg: "bg-green-500/10",
      link: "/wallet",
      features: ["Portefeuille GTC", "Retraits rapides", "Historique"],
    },
    {
      title: "Trader",
      description:
        "Achetez et vendez des items, services et produits gaming sur le marketplace.",
      icon: <ShoppingBag className="w-6 h-6" />,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      link: "/marketplace",
      features: ["Boutiques pro", "Items de jeux", "Produits physiques"],
    },
  ];

  return (
    <section className="py-24 bg-secondary/5 border-y border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
          <div className="max-w-2xl">
            <Badge
              variant="outline"
              className="mb-4 text-primary border-primary/20 bg-primary/5"
            >
              L'ÉCOSYSTÈME COMPLET
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              Tout ce dont un <span className="text-primary">Gamer</span> a
              besoin, au même endroit
            </h2>
          </div>
          <p className="text-muted-foreground text-lg max-w-sm">
            Une infrastructure robuste conçue pour simplifier la vie des
            joueurs, des organisateurs et des marchands.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex flex-col p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all group"
            >
              <div
                className={`w-14 h-14 rounded-2xl ${pillar.bg} ${pillar.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
              >
                {pillar.icon}
              </div>

              <h3 className="text-2xl font-bold mb-3">{pillar.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-1">
                {pillar.description}
              </p>

              <ul className="space-y-3 mb-8">
                {pillar.features.map((feature, fIndex) => (
                  <li
                    key={fIndex}
                    className="flex items-center gap-2 text-xs font-semibold text-muted-foreground/80"
                  >
                    <Zap className="w-3 h-3 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={pillar.link}
                className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:gap-3 transition-all"
              >
                En savoir plus <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Security / Trust Bar */}
        <div className="mt-16 flex flex-wrap justify-center gap-10 opacity-60">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-sm font-bold uppercase tracking-wider">
              Sécurité Tier-1
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            <span className="text-sm font-bold uppercase tracking-wider">
              Support 24/7
            </span>
          </div>
          <div className="flex items-center gap-2 text-primary">
            <Zap className="w-5 h-5" />
            <span className="text-sm font-bold uppercase tracking-wider">
              Latence Minimale
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
