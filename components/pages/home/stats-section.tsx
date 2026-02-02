"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Users,
  Trophy,
  Zap,
  TrendingUp,
  Globe,
  Briefcase,
  Gamepad2,
} from "lucide-react";
import { useGlobalStats } from "@/hooks/use-stats";
import { formatNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function StatsSection() {
  const { data: stats, isLoading } = useGlobalStats();

  const mainStats = [
    {
      label: "Membres Actifs",
      value: stats?.total_users ? formatNumber(stats.total_users) : "25K+",
      description: "Joueurs et créateurs passionnés",
      icon: <Users className="w-6 h-6" />,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Boutiques Vérifiées",
      value: stats?.total_shops ? formatNumber(stats.total_shops) : "1,800+",
      description: "Commerçants gaming de confiance",
      icon: <Briefcase className="w-6 h-6" />,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      label: "Tournois Organisés",
      value: stats?.total_tournaments
        ? formatNumber(stats.total_tournaments)
        : "1,200+",
      description: "Compétitions épiques terminées",
      icon: <Trophy className="w-6 h-6" />,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
    },
    {
      label: "Volume d'Échange GTC",
      value: "95M+",
      description: "L'économie interne en pleine croissance",
      icon: <Zap className="w-6 h-6" />,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge
            variant="outline"
            className="mb-4 px-4 py-1 text-primary border-primary/20 bg-primary/5"
          >
            TRANSPARENCE & CROISSANCE
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
            Un écosystème en{" "}
            <span className="text-primary italic">expansion constante</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Nous construisons l'infrastructure de demain pour le gaming. Voici
            l'état actuel de notre plateforme propulsée par la communauté.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {mainStats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative p-8 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300"
            >
              <div
                className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-6`}
              >
                {stat.icon}
              </div>

              <div className="space-y-1">
                <h3 className="text-4xl font-extrabold tracking-tight">
                  {isLoading ? (
                    <span className="inline-block w-16 h-8 bg-muted animate-pulse rounded" />
                  ) : (
                    stat.value
                  )}
                </h3>
                <p className="font-bold text-sm uppercase tracking-wider text-muted-foreground">
                  {stat.label}
                </p>
              </div>

              <p className="mt-4 text-sm text-muted-foreground/80 leading-relaxed font-medium">
                {stat.description}
              </p>

              {/* Subtle hover indicator */}
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <TrendingUp className={`w-4 h-4 ${stat.color}`} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Global Reach Highlight */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-16 p-8 rounded-3xl border border-primary/10 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 flex flex-col md:flex-row items-center justify-between gap-8"
        >
          <div className="flex items-center gap-6">
            <div className="p-4 rounded-2xl bg-primary/10 text-primary">
              <Globe className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xl font-bold">Infrastucture Mondiale</h4>
              <p className="text-muted-foreground">
                Serveurs optimisés et sécurisés dans plus de 20 régions.
              </p>
            </div>
          </div>
          <div className="flex -space-x-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="w-12 h-12 rounded-full border-4 border-background bg-secondary flex items-center justify-center text-[10px] font-bold"
              >
                {i === 5 ? "+50" : <Gamepad2 className="w-4 h-4 opacity-50" />}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
