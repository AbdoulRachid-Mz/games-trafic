"use client";

import { motion } from "framer-motion";
import { Gamepad2, Search, Sparkles, Trophy, Swords, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";

interface MarketplaceHeroProps {
  searchQuery: string;
  isFilterOpen: boolean;
  toggleFilter: () => void;
  onSearch: (value: string) => void;
}

export function MarketplaceHero({ searchQuery, isFilterOpen, toggleFilter, onSearch }: MarketplaceHeroProps) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background py-12 md:py-20">
      {/* Effets visuels gaming */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto text-center space-y-6"
        >
          {/* Badge gaming */}
          <Badge className="gap-2 bg-primary/10 text-primary border border-primary/30 px-4 py-2">
            <Swords className="h-3 w-3" />
            L'ultime marketplace gaming
          </Badge>

          {/* Titre avec effet gaming */}
          <Typography variant="h1" weight="bold" className="text-4xl md:text-6xl">
            Trouve ton{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/80">
              compte parfait
            </span>
          </Typography>

          {/* Description */}
          <Typography variant="body-lg" className="text-muted-foreground max-w-2xl mx-auto">
            Explore des milliers de comptes de jeu premium, vérifiés et sécurisés. 
            Rejoins la communauté des gamers les plus passionnés.
          </Typography>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-6 pt-4">
            <div className="text-center">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                <Typography variant="h4" weight="bold">
                  10K+
                </Typography>
              </div>
              <Typography variant="caption1" className="text-muted-foreground">
                Comptes vendus
              </Typography>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <Typography variant="h4" weight="bold">
                  500+
                </Typography>
              </div>
              <Typography variant="caption1" className="text-muted-foreground">
                Boutiques vérifiées
              </Typography>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-2">
                <Gamepad2 className="h-5 w-5 text-primary" />
                <Typography variant="h4" weight="bold">
                  50+
                </Typography>
              </div>
              <Typography variant="caption1" className="text-muted-foreground">
                Jeux supportés
              </Typography>
            </div>
          </div>

          {/* Barre de recherche gaming */}
          <div className="max-w-2xl mx-auto pt-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="relative"
            >
              <div className="relative bg-card border rounded-2xl p-2">
                <div className="flex items-center gap-2">
                  <Search className="ml-4 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un jeu, un rang, une plateforme..."
                    value={searchQuery}
                    onChange={(e) => onSearch(e.target.value)}
                    className="flex-1 border-0 bg-transparent placeholder:text-muted-foreground focus:ring-0 focus-visible:ring-0 text-lg h-12"
                  />
                  <Button className="h-12 px-2 rounded-xl">
                    Rechercher
                  </Button>
                  <Button
                    onClick={toggleFilter}
                    variant="outline"
                    className="h-12 p-3 flex justify-center items-center rounded-xl sm:hidden"
                  >
                    <Filter className="h-5 w-5 mr-2" />
                    {/* Filtrer */}
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Quick filters */}
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {["Valorant", "League of Legends", "Fortnite", "CS:GO", "Apex Legends", "Tous"].map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="cursor-pointer hover:border-primary hover:text-primary transition-colors"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
