'use client';

import React from 'react';
import { Search, Gamepad2, Sparkles, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Typography } from '@/components/ui/typography';
import { motion } from 'framer-motion';

interface GamesHeroProps {
  searchQuery: string;
  onSearch: (value: string) => void;
}

export function GamesHero({ searchQuery, onSearch }: GamesHeroProps) {
  return (
    <div className="relative w-full overflow-hidden bg-[#0a0a0b] py-16 md:py-24">
      {/* Background with animated gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -right-1/4 w-1/2 h-full bg-blue-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-full bg-purple-500/10 blur-[120px] rounded-full animate-pulse delay-700" />
      </div>

      <div className="container relative mx-auto px-4 z-10 text-center">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5 }}
           className="space-y-6 max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="text-xs font-bold uppercase tracking-wider">Marché de jeux et d'items</span>
          </div>

          <Typography variant="h1" weight="bold" className="text-4xl md:text-6xl text-white">
            Boostez votre expérience de <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Gaming</span>
          </Typography>

          <Typography variant="lead" theme="muted" className="text-gray-400 max-w-2xl mx-auto text-lg">
            Achetez des monnaies de jeu, des skins et des items rares pour vos titres préférés. Rapide, sécurisé et au meilleur prix.
          </Typography>

          <div className="relative max-w-2xl mx-auto mt-8 group">
            <div className="absolute inset-0 bg-primary/20 blur-xl group-hover:bg-primary/30 transition-all rounded-2xl" />
            <div className="relative flex items-center bg-background/80 backdrop-blur-xl border border-white/10 p-1.5 rounded-2xl shadow-2xl">
              <div className="flex-1 flex items-center px-4">
                <Search className="h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Rechercher un jeu ou un item (ex: FC 24, Gems...)"
                  className="border-none focus-visible:ring-0 text-lg h-12 bg-transparent placeholder:text-muted-foreground/50"
                  value={searchQuery}
                  onChange={(e) => onSearch(e.target.value)}
                />
              </div>
              <Button size="lg" className="rounded-xl px-8 h-12 font-bold shadow-lg shadow-primary/20">
                Explorer
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-gray-400">
            <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                <span>+50 Jeux supportés</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                <span>Livraison en moins de 1h</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
                <span>Paiements sécurisés</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
