// components/pages/shops/shops-hero.tsx
"use client";

import { motion } from "framer-motion";
import { Store, Sparkles, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { User } from "@/database/schema";

interface ShopsHeroProps {
  searchQuery: string;
  onSearch: (value: string) => void;
  onCreateShop: () => void;
  user: User | null;
}

export function ShopsHero({ searchQuery, onSearch, onCreateShop, user }: ShopsHeroProps) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-purple-500/10 py-12 md:py-16">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto text-center space-y-6"
        >
          {/* Badge */}
          <Badge className="gap-1 bg-primary/20 text-primary hover:bg-primary/30 mb-2">
            <Sparkles className="h-3 w-3" />
            Découvrez les meilleures boutiques gaming
          </Badge>

          {/* Titre */}
          <Typography variant="h1" weight="bold" className="text-3xl md:text-5xl">
            Explorez un univers de{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">
              boutiques premium
            </span>
          </Typography>

          {/* Description */}
          <Typography variant="body-lg" theme="muted" className="max-w-2xl mx-auto">
            Trouvez les meilleures boutiques de jeux, d'items rares et de services gaming. 
            Vendeurs vérifiés, produits authentiques, expérience garantie.
          </Typography>

          {/* Barre de recherche */}
          <div className="max-w-2xl mx-auto pt-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher une boutique, une catégorie..."
                value={searchQuery}
                onChange={(e) => onSearch(e.target.value)}
                className="pl-12 h-14 text-base md:text-lg rounded-xl border-2 focus:border-primary bg-background/95 backdrop-blur-sm"
              />
              <Button className="absolute right-2 top-2 bottom-2 py-5 px-4 md:px-6 rounded-lg">
                Rechercher
              </Button>
            </div>
          </div>

          {/* CTA pour utilisateurs connectés */}
          {user && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="pt-4"
            >
              <Button
                variant="outline"
                className="gap-2"
                onClick={onCreateShop}
              >
                <Store className="h-4 w-4" />
                Créer ma boutique
              </Button>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Éléments décoratifs */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl" />
    </div>
  );
}