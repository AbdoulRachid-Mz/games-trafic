// @/components/pages/games/games-hero.tsx
'use client';

import React from 'react';
import { Search, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Typography } from '@/components/ui/typography';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GamesHeroProps {
  searchQuery: string;
  onSearch: (value: string) => void;
}

export function GamesHero({ searchQuery, onSearch }: GamesHeroProps) {
  return (
    <div className="relative w-full overflow-hidden bg-background py-20 md:py-32 border-b border-border/40">
      {/* Background with animated gradients - adapts to light/dark mode */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -right-1/4 w-3/4 h-full bg-primary/20 blur-[130px] rounded-full animate-pulse" />
        <div className="absolute -bottom-1/4 -left-1/4 w-3/4 h-full bg-purple-600/10 blur-[130px] rounded-full animate-pulse delay-700" />

        {/* Subtle grid pattern - subtle in both modes */}
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      <div className="container relative mx-auto px-4 z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="space-y-8 max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/15 border border-primary/20 text-primary mb-2 shadow-[0_0_20px_rgba(var(--primary),0.1)]">
            <Sparkles className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Marché de jeux & Items</span>
          </div>

          <Typography variant="h1" className="text-4xl md:text-7xl font-black leading-[1.1] tracking-tighter">
            Dominez vos mondes <br />
            <span className="bg-gradient-to-r from-primary via-blue-400 to-purple-500 bg-clip-text text-transparent italic drop-shadow-sm">Favoris</span>
          </Typography>

          <Typography className="text-muted-foreground max-w-2xl mx-auto text-lg md:text-xl font-medium leading-relaxed">
            Équipez-vous du meilleur : monnaies, skins et items rares livrés instantanément.
          </Typography>

          <div className="relative max-w-2xl mx-auto mt-12 group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
            <div className="relative flex items-center bg-background/60 backdrop-blur-2xl border border-border p-2 rounded-2xl shadow-2xl">
              <div className="flex-1 flex items-center px-4">
                <Search className="h-6 w-6 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Rechercher FC 25, GTA, Robux..."
                  className="border-none focus-visible:ring-0 text-lg h-12 bg-transparent placeholder:text-muted-foreground/60 font-medium"
                  value={searchQuery}
                  onChange={(e) => onSearch(e.target.value)}
                />
              </div>
              <Button size="lg" className="rounded-lg px-6 h-10 font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all">
                Rechercher
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 mt-12">
            {[
              { label: "+50 Jeux", color: "bg-green-500" },
              { label: "Livraison < 1h", color: "bg-blue-500" },
              { label: "100% Sécurisé", color: "bg-primary" }
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={cn("h-2 w-2 rounded-full", stat.color, "shadow-[0_0_10px_currentColor]")} />
                <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
