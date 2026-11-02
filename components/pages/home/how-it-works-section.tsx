"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  UserPlus,
  Search,
  Trophy,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HowItWorksSection() {
  const steps = [
    {
      title: "Créez votre compte",
      description:
        "Rejoignez la communauté en quelques secondes. Personnalisez votre profil et votre identité gaming.",
      icon: <UserPlus className="w-6 h-6" />,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Explorez l'écosystème",
      description:
        "Découvrez des tournois, parcourez le marketplace ou rejoignez des groupes thématiques.",
      icon: <Search className="w-6 h-6" />,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      title: "Participez ou Organisez",
      description:
        "Inscrivez-vous à des compétitions ou lancez vos propres événements et boutiques.",
      icon: <Trophy className="w-6 h-6" />,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
    },
    {
      title: "Gagnez & Développez",
      description:
        "Remportez des cashprizes, vendez vos services et faites croître votre influence.",
      icon: <TrendingUp className="w-6 h-6" />,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
  ];

  return (
    <section className="py-24 relative overflow-hidden bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <Badge
            variant="outline"
            className="mb-4 text-primary border-primary/20 bg-primary/5"
          >
            DÉMARRAGE RAPIDE
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
            Votre voyage gaming commence{" "}
            <span className="text-primary italic">ici</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Suivez ces étapes simples pour tirer le meilleur parti de
            l'infrastructure Games-Trafics.
          </p>
        </div>

        <div className="relative">
          {/* Subtle connecting line - Desktop only */}
          <div className="hidden lg:block absolute top-1/2 left-0 w-full h-px bg-border/50 -translate-y-1/2 z-0" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex flex-col items-center text-center p-8 rounded-3xl bg-card border border-border/50 hover:border-primary/30 transition-all group"
              >
                <div
                  className={`w-16 h-16 rounded-full ${step.bg} ${step.color} flex items-center justify-center mb-6 border-4 border-background shadow-lg transition-transform group-hover:scale-110`}
                >
                  {step.icon}
                </div>

                <div className="relative mb-4">
                  <span className="absolute -top-10 left-1/2 -translate-x-1/2 text-4xl font-black opacity-5 group-hover:opacity-10 transition-opacity">
                    0{index + 1}
                  </span>
                  <h3 className="text-xl font-bold">{step.title}</h3>
                </div>

                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Why Choice Gamers Trafics Summary */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Sécurité Garantie",
              desc: "Transactions et données protégées.",
              icon: <ShieldCheck className="w-5 h-5" />,
            },
            {
              title: "Communauté Active",
              desc: "Des milliers de joueurs quotidiens.",
              icon: <Users className="w-5 h-5" />,
            },
            {
              title: "Support Dédié",
              desc: "Assistance technique 24h/24.",
              icon: <CheckCircle2 className="w-5 h-5" />,
            },
          ].map((item, id) => (
            <div
              key={id}
              className="flex items-center gap-4 p-6 rounded-2xl bg-secondary/5 border border-border/30"
            >
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                {item.icon}
              </div>
              <div>
                <h4 className="font-bold text-sm uppercase tracking-tight">
                  {item.title}
                </h4>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Button
            size="lg"
            className="rounded-xl h-14 px-8 font-bold gap-2 group"
            asChild
          >
            <Link href="/sign-up">
              Créer mon compte
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
