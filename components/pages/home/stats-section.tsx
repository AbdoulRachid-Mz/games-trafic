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

  const getStatDisplay = (value: number | undefined, label: string) => {
    if (isLoading) return <span className="inline-block w-16 h-8 bg-muted animate-pulse rounded" />;
    
    if (!value || value <= 50) {
      switch(label) {
        case "Membres Actifs": return "Une communauté vibrante";
        case "Boutiques Vérifiées": return "Commerçants de confiance";
        case "Tournois Organisés": return "Compétitions épiques";
        default: return "En cours...";
      }
    }
    
    if (value > 1000) {
      return `${(value / 1000).toFixed(1)}K+`;
    }
    
    return formatNumber(value);
  };

  const mainStats = [
    {
      label: "Membres Actifs",
      value: getStatDisplay(stats?.total_users, "Membres Actifs"),
      description: "Joueurs et créateurs passionnés",
      icon: <Users className="w-6 h-6" />,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Boutiques Vérifiées",
      value: getStatDisplay(stats?.total_shops, "Boutiques Vérifiées"),
      description: "Commerçants gaming de confiance",
      icon: <Briefcase className="w-6 h-6" />,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      label: "Tournois Organisés",
      value: getStatDisplay(stats?.total_tournaments, "Tournois Organisés"),
      description: "Compétitions épiques terminées",
      icon: <Trophy className="w-6 h-6" />,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
    },
    {
      label: "Volume d'Échange GTC",
      value: stats?.total_transaction_volume && Number(stats.total_transaction_volume) > 0 
        ? `${formatNumber(Number(stats.total_transaction_volume))} GTC`
        : "Croissance rapide",
      description: "L'économie interne de l'écosystème",
      icon: <Zap className="w-6 h-6" />,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-20">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/20 blur-[120px] rounded-full" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-500/20 blur-[120px] rounded-full" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <Badge
              variant="outline"
              className="mb-4 px-4 py-1 text-primary border-primary/20 bg-primary/5 font-bold uppercase tracking-widest"
            >
              TRANSPARENCE & CROISSANCE
            </Badge>
          </motion.div>
          <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter">
            Un écosystème en{" "}
            <span className="text-primary italic relative">
              expansion constante
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                <path d="M1 10C50 3 150 1 299 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
          </h2>
          <p className="text-lg text-muted-foreground font-medium">
            Nous construisons l'infrastructure de demain pour le gaming. Voici
            l'état actuel de notre plateforme propulsée par la communauté.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {mainStats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
              whileHover={{ y: -8 }}
              className="group relative p-8 rounded-3xl border border-border/40 bg-card/40 backdrop-blur-md hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500"
            >
              <div
                className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-8 shadow-inner group-hover:scale-110 transition-transform duration-500`}
              >
                {stat.icon}
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl md:text-3xl font-black tracking-tight leading-none group-hover:text-primary transition-colors duration-300">
                  {stat.value}
                </h3>
                <p className="font-bold text-xs uppercase tracking-widest text-muted-foreground/80">
                  {stat.label}
                </p>
              </div>

              <p className="mt-6 text-sm text-muted-foreground/70 leading-relaxed font-medium">
                {stat.description}
              </p>

              {/* Bottom accent bar */}
              <div className={`absolute bottom-0 left-8 right-8 h-1 ${stat.bg} scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left rounded-full`} />
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
