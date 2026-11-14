// @/components/pages/games/games-hero.tsx
'use client';

import React from 'react';
import { Search, Zap, Shield, Trophy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface GamesHeroProps {
  searchQuery: string;
  onSearch: (value: string) => void;
}

const UNIVERSES = [
  { label: 'Football', emoji: '⚽', color: 'from-green-500/20 to-emerald-500/10', accent: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20' },
  { label: 'FPS / COD', emoji: '🎯', color: 'from-red-500/20 to-orange-500/10', accent: 'text-orange-400 border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20' },
  { label: 'Battle Royale', emoji: '🪂', color: 'from-blue-500/20 to-cyan-500/10', accent: 'text-blue-400 border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20' },
  { label: 'Racing', emoji: '🏎️', color: 'from-yellow-500/20 to-amber-500/10', accent: 'text-amber-400 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20' },
];

export function GamesHero({ searchQuery, onSearch }: GamesHeroProps) {
  return (
    <div className="relative w-full overflow-hidden bg-background border-b border-border/40">
      {/* Animated ambient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/3 -right-1/4 w-3/4 h-full bg-primary/15 blur-[160px] rounded-full animate-pulse" />
        <div className="absolute -bottom-1/3 -left-1/4 w-3/4 h-full bg-purple-600/10 blur-[160px] rounded-full animate-pulse delay-700" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 bg-blue-500/5 blur-[120px] rounded-full" />
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.025] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      <div className="container relative mx-auto px-4 py-16 md:py-28 z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="max-w-4xl mx-auto text-center space-y-8"
        >
          {/* GT Logo + Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-full blur-2xl bg-primary/20 scale-150" />
              <div className="relative h-16 w-16 rounded-2xl bg-background/80 backdrop-blur-sm border border-border/50 shadow-2xl flex items-center justify-center overflow-hidden">
                <Image
                  src="/icons/gt-primary.png"
                  alt="Games Trafics"
                  width={48}
                  height={48}
                  className="object-contain"
                />
              </div>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/15 border border-primary/20 text-primary shadow-[0_0_20px_rgba(var(--primary),0.1)]">
              <Zap className="h-3.5 w-3.5" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Marché Gaming Premium</span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-4xl md:text-7xl font-black leading-[1.05] tracking-tighter">
              Dominez chaque{' '}
              <span className="bg-gradient-to-r from-primary via-blue-400 to-purple-500 bg-clip-text text-transparent italic">
                univers
              </span>
            </h1>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto text-base md:text-xl font-medium leading-relaxed">
              Monnaies, skins et items rares pour tous vos jeux favoris — livrés en moins d'une heure.
            </p>
          </motion.div>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative max-w-2xl mx-auto group"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
            <div className="relative flex items-center bg-background/70 backdrop-blur-2xl border border-border/60 p-2 rounded-2xl shadow-2xl">
              <div className="flex-1 flex items-center px-4">
                <Search className="h-5 w-5 text-muted-foreground shrink-0" />
                <Input
                  type="text"
                  placeholder="FC 25, COD Points, V-Bucks, Nitro..."
                  className="border-none focus-visible:ring-0 text-base h-11 bg-transparent placeholder:text-muted-foreground/50 font-medium ml-2"
                  value={searchQuery}
                  onChange={(e) => onSearch(e.target.value)}
                />
              </div>
              <Button
                size="lg"
                className="rounded-xl px-6 h-10 font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Trouver
              </Button>
            </div>
          </motion.div>

          {/* Universe quick-access pills */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            {UNIVERSES.map((u) => (
              <button
                key={u.label}
                onClick={() => onSearch(u.label.split('/')[0].trim())}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-black uppercase tracking-widest transition-all duration-200 hover:scale-105 active:scale-95',
                  u.accent
                )}
              >
                <span>{u.emoji}</span>
                <span>{u.label}</span>
              </button>
            ))}
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 pt-2"
          >
            {[
              { icon: Trophy, label: '+50 Jeux couverts', color: 'text-amber-500' },
              { icon: Zap, label: 'Livraison < 1h', color: 'text-blue-400' },
              { icon: Shield, label: '100% Sécurisé', color: 'text-emerald-400' },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-2">
                <stat.icon className={cn('h-3.5 w-3.5', stat.color)} />
                <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-muted-foreground">
                  {stat.label}
                </span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
