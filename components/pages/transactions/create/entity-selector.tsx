"use client";

import React, { useState, useEffect } from "react";
import { Typography } from "@/components/ui/typography";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Search,
  ArrowLeft,
  Palette,
  ShoppingCart,
  Trophy,
  GamepadIcon,
  Star,
  Filter,
} from "lucide-react";
import { TransactionType } from "@/types/transaction-types";
import { cn } from "@/lib/utils";

interface TransactionEntity {
  id: string;
  name: string;
  description?: string;
  price?: number;
  currency?: string;
  image?: string;
  metadata?: Record<string, any>;
}

interface TransactionEntitySelectorProps {
  type: TransactionType;
  onSelect: (entity: TransactionEntity) => void;
  onBack: () => void;
}

export function TransactionEntitySelector({
  type,
  onSelect,
  onBack,
}: TransactionEntitySelectorProps) {
  const [search, setSearch] = useState("");
  const [entities, setEntities] = useState<TransactionEntity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEntities();
  }, [type]);

  const fetchEntities = async () => {
    setLoading(true);
    try {
      let endpoint = "";
      const params = new URLSearchParams();

      switch (type) {
        case "THEME_PURCHASE":
          endpoint = "/api/themes";
          params.append("public", "true");
          params.append("isPremium", "true");
          break;
        case "PRODUCT_PURCHASE":
          endpoint = "/api/products";
          params.append("available", "true");
          params.append("status", "NON_VENDU");
          break;
        case "TOURNAMENT_PARTICIPATION":
          endpoint = "/api/tournaments";
          params.append("upcoming", "true");
          params.append("registrationOpen", "true");
          break;
        case "GAME_ITEM_PURCHASE":
          endpoint = "/api/game-items";
          params.append("available", "true");
          params.append("isActive", "true");
          break;
        default:
          setEntities([]);
          return;
      }

      const response = await fetch(`${endpoint}?${params.toString()}`);
      const data = await response.json();
      setEntities(data.data || []);
    } catch (error) {
      console.error("Error fetching entities:", error);
    } finally {
      setLoading(false);
    }
  };

  const getEntityIcon = () => {
    switch (type) {
      case "THEME_PURCHASE":
        return Palette;
      case "PRODUCT_PURCHASE":
        return ShoppingCart;
      case "TOURNAMENT_PARTICIPATION":
        return Trophy;
      case "GAME_ITEM_PURCHASE":
        return GamepadIcon;
      default:
        return ShoppingCart;
    }
  };

  const getEntityLabel = () => {
    switch (type) {
      case "THEME_PURCHASE":
        return "thème";
      case "PRODUCT_PURCHASE":
        return "produit";
      case "TOURNAMENT_PARTICIPATION":
        return "tournoi";
      case "GAME_ITEM_PURCHASE":
        return "item";
      default:
        return "élément";
    }
  };

  const filteredEntities = entities.filter(
    (entity) =>
      entity.name?.toLowerCase().includes(search.toLowerCase()) ||
      entity.description?.toLowerCase().includes(search.toLowerCase())
  );

  const Icon = getEntityIcon();
  const entityLabel = getEntityLabel();

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <Typography variant="h3" weight="bold">
          Sélection
        </Typography>
        <Typography variant="body-base" theme="muted">
          Choisissez un {entityLabel} à acheter
        </Typography>
      </div>

      <Card className="bg-card/40 backdrop-blur-xl border-border/50 shadow-xl overflow-hidden">
        <CardContent className="p-0">
          <div className="p-6 space-y-6">
            {/* Header with Search */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder={`Rechercher un ${entityLabel}...`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-12 h-12 bg-background/50 border-input/50 focus:border-primary/50 focus:ring-primary/20 transition-all rounded-xl"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-xl shrink-0"
              >
                <Filter className="h-5 w-5 text-muted-foreground" />
              </Button>
            </div>

            <div className="flex items-center justify-between px-1">
              <Typography variant="body-sm" weight="medium" theme="muted">
                {filteredEntities.length} {entityLabel}
                {filteredEntities.length !== 1 ? "s" : ""} disponible
                {filteredEntities.length !== 1 ? "s" : ""}
              </Typography>
            </div>

            {/* List */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex gap-4 p-4 rounded-2xl border border-transparent bg-muted/20 animate-pulse"
                  >
                    <div className="w-16 h-16 rounded-xl bg-muted-foreground/10" />
                    <div className="flex-1 space-y-3">
                      <div className="h-5 w-2/3 bg-muted-foreground/10 rounded" />
                      <div className="h-4 w-full bg-muted-foreground/10 rounded" />
                    </div>
                  </div>
                ))
              ) : filteredEntities.length === 0 ? (
                <div className="text-center py-16 flex flex-col items-center justify-center">
                  <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mb-6">
                    <Icon className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <Typography variant="h4" weight="medium" className="mb-2">
                    Aucun {entityLabel}
                  </Typography>
                  <Typography variant="body-base" theme="muted">
                    {search
                      ? "Essayez avec d'autres mots clés"
                      : "Rien à afficher pour le moment"}
                  </Typography>
                  {search && (
                    <Button
                      variant="link"
                      onClick={() => setSearch("")}
                      className="mt-2 text-primary"
                    >
                      Effacer la recherche
                    </Button>
                  )}
                </div>
              ) : (
                filteredEntities.map((entity, index) => (
                  <motion.div
                    key={entity.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <button
                      onClick={() => onSelect(entity)}
                      disabled={
                        entity.metadata?.status &&
                        entity.metadata.status !== "NON_VENDU"
                      }
                      className={cn(
                        "w-full text-left p-4 rounded-2xl border transition-all duration-300 group relative overflow-hidden",
                        "hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 bg-background/30 hover:bg-background/60",
                        entity.metadata?.status &&
                          entity.metadata.status !== "NON_VENDU"
                          ? "opacity-60 grayscale cursor-not-allowed"
                          : ""
                      )}
                    >
                      <div className="relative z-10 flex items-start gap-4">
                        {/* Image/Icon Placeholder */}
                        <div
                          className={cn(
                            "w-16 h-16 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105",
                            "bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10"
                          )}
                        >
                          {entity.image ? (
                            <img
                              src={entity.image}
                              alt={entity.name}
                              className="w-full h-full object-cover rounded-xl"
                            />
                          ) : (
                            <Icon className="w-8 h-8 text-primary" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <Typography
                                variant="body-base"
                                weight="bold"
                                className="truncate group-hover:text-primary transition-colors"
                              >
                                {entity.name}
                              </Typography>
                            </div>
                            {entity.price !== undefined && (
                              <div className="text-right shrink-0">
                                <Typography
                                  variant="h5"
                                  weight="bold"
                                  className="text-primary truncate"
                                >
                                  {entity.price.toFixed(2)}{" "}
                                  <span className="text-xs opacity-70">
                                    GTC
                                  </span>
                                </Typography>
                              </div>
                            )}
                          </div>

                          <div className="mt-1 flex flex-wrap gap-2 items-center">
                            {entity.metadata?.isFeatured && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-200"
                              >
                                <Star className="h-3 w-3 mr-1 fill-current" />
                                Populaire
                              </Badge>
                            )}
                            {entity.metadata?.seller && (
                              <Typography
                                variant="caption1"
                                theme="muted"
                                className="flex items-center gap-1"
                              >
                                Par{" "}
                                <span className="font-medium text-foreground">
                                  {entity.metadata.seller}
                                </span>
                              </Typography>
                            )}
                          </div>

                          {entity.description && (
                            <Typography
                              variant="caption1"
                              theme="muted"
                              className="line-clamp-2 mt-2"
                            >
                              {entity.description}
                            </Typography>
                          )}
                        </div>
                      </div>
                    </button>
                  </motion.div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-border/50">
              <Button
                variant="outline"
                onClick={onBack}
                className="w-full h-12 rounded-xl font-bold"
              >
                Retour
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
