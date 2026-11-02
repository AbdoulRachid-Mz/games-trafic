"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, ShoppingBag, Users, Wallet, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useGlobalStats } from "@/hooks/use-stats";
import { formatNumber } from "@/lib/utils";

export default function HeroSection() {
  const { data: stats } = useGlobalStats();

  // Statistics tailored to the application's core concept
  const heroStats = [
    {
      label: "Utilisateurs",
      value: stats?.total_users ? formatNumber(stats.total_users) : "25K+",
      icon: <Users className="w-4 h-4 text-primary" />,
    },
    {
      label: "Tournois",
      value: stats?.total_tournaments
        ? formatNumber(stats.total_tournaments)
        : "1,200+",
      icon: <Trophy className="w-4 h-4 text-yellow-500" />,
    },
    {
      label: "Économie GTC",
      value: "95M+",
      icon: <Wallet className="w-4 h-4 text-green-500" />,
    },
  ];

  return (
    <div className="relative overflow-hidden pt-20 pb-12 md:pt-32 md:pb-24">
      {/* Background Subtle Gradient */}
      <div className="absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

      <div className="container relative z-10 mx-auto px-4">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Top Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <Badge
              variant="outline"
              className="px-4 py-1.5 border-primary/20 bg-primary/5 text-primary text-sm font-semibold tracking-wide flex items-center gap-2"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              L&apos;ÉCOSYSTÈME GAMING NOUVELLE GÉNÉRATION
            </Badge>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-4"
          >
            Joue, échange, <span className="text-primary">domine</span>
          </motion.h1>

          {/* Slogan */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-xl md:text-2xl font-semibold text-primary/90 mb-6"
          >
            L&apos;infini du gaming commence ici.
          </motion.p>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl leading-relaxed"
          >
            Games-Trafics réunit compétition e-sport, marketplace sécurisée et communauté gaming.
            Participez à des tournois professionnels, gérez vos actifs GTC et
            rejoignez le marché gaming le plus dynamique.
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 mb-16"
          >
            <Button
              size="lg"
              className="h-14 px-8 text-lg font-bold group rounded-xl shadow-lg shadow-primary/20"
              asChild
            >
              <Link href="/tournaments">
                Explorer l&apos;Arène
                <Trophy className="ml-2 w-5 h-5 group-hover:rotate-12 transition-transform" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-8 text-lg font-bold rounded-xl border-2"
              asChild
            >
              <Link href="/marketplace">
                Accéder au Marché
                <ShoppingBag className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </motion.div>

          {/* Stats Preview Bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full border-y border-border/50 py-8"
          >
            {heroStats.map((stat, index) => (
              <div
                key={index}
                className="flex items-center gap-4 px-6 md:border-r last:border-0 border-border/30"
              >
                <div className="p-2.5 rounded-lg bg-secondary/50">
                  {stat.icon}
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                    {stat.label}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Subtle bottom decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </div>
  );
}
