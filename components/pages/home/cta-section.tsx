"use client";

import React from "react";
import { ArrowRight, Rocket, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function CtaSection() {
  
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto p-12 md:p-20 rounded-[40px] bg-primary relative overflow-hidden shadow-2xl shadow-primary/20">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 blur-[80px] rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-20 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-4xl md:text-6xl font-extrabold text-primary-foreground tracking-tighter mb-6">
                Prêt à dominer <br /> l'écosystème ?
              </h2>
              <p className="text-xl text-primary-foreground/80 font-medium mb-10 max-w-lg">
                Rejoignez la plateforme qui transforme votre passion en une
                carrière professionnelle sécurisée et lucrative.
              </p>

              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <Button
                  size="lg"
                  variant="secondary"
                  className="h-16 px-10 rounded-2xl text-lg font-bold shadow-xl hover:scale-105 transition-all gap-2"
                  asChild
                >
                  <Link href="/sign-up">
                    Démarrer gratuitement <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-16 px-10 rounded-2xl text-lg font-bold border-white/20 text-white hover:bg-white/10 transition-all"
                  asChild
                >
                  <Link href="/ecosystem">En savoir plus</Link>
                </Button>
              </div>
            </div>

            <div className="flex-shrink-0 grid grid-cols-1 gap-6">
              {[
                {
                  icon: <ShieldCheck className="w-5 h-5" />,
                  text: "Sécurité Tier-1",
                },
                {
                  icon: <Zap className="w-5 h-5" />,
                  text: "Infrastructure Cloud",
                },
                {
                  icon: <Rocket className="w-5 h-5" />,
                  text: "Croissance Illimitée",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 py-3 px-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 text-white font-bold text-sm"
                >
                  <div className="p-1 rounded bg-white/20">{item.icon}</div>
                  {item.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
