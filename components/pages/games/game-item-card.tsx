"use client";

import React from "react";
import {
  Package,
  Coins,
  Shield,
  Clock,
  ShoppingCart,
  ArrowRight,
  TrendingUp,
  Gamepad2,
} from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GameItemWithRelations } from "@/database/schema";
import { motion } from "framer-motion";
import Link from "next/link";

interface GameItemCardProps {
  item: GameItemWithRelations;
}

export function GameItemCard({ item }: GameItemCardProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "COIN":
        return <Coins className="h-4 w-4 text-yellow-500" />;
      case "ITEM":
        return <Package className="h-4 w-4 text-blue-500" />;
      case "SKIN":
        return <Shield className="h-4 w-4 text-purple-500" />;
      default:
        return <Package className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
      <Card className="h-full overflow-hidden border-primary/10 hover:border-primary/30 transition-all shadow-sm hover:shadow-md bg-card/50 backdrop-blur-sm">
        <CardContent className="p-0">
          <div className="relative aspect-square sm:aspect-video overflow-hidden bg-muted group">
            {item.icon ? (
              <img
                src={item.icon}
                alt={item.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-purple-500/5">
                <Package className="h-12 w-12 text-muted-foreground/30" />
              </div>
            )}
            <div className="absolute top-2 right-2">
              <Badge
                variant="secondary"
                className="backdrop-blur-md bg-background/80 flex items-center gap-1 font-bold"
              >
                {item.priceGtc} GTC
              </Badge>
            </div>
            {item.featured && (
              <div className="absolute top-2 left-2">
                <Badge className="bg-yellow-500 text-white border-none text-[10px] uppercase font-bold">
                  Populaire
                </Badge>
              </div>
            )}
          </div>

          <div className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <h3 className="font-bold text-lg leading-tight line-clamp-1">
                  {item.name}
                </h3>
                <div className="flex items-center gap-1.5">
                  <Avatar className="h-4 w-4 rounded-full">
                    <AvatarImage src={item.game?.profileImage || ""} />
                    <AvatarFallback>
                      <Gamepad2 className="h-2 w-2" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground font-medium">
                    {item.game?.name}
                  </span>
                </div>
              </div>
              <div className="p-1.5 rounded-lg bg-primary/5">
                {getTypeIcon(item.type)}
              </div>
            </div>

            <p className="text-xs text-muted-foreground line-clamp-2 min-h-[32px]">
              {item.description ||
                `Achetez ${item.name} pour booster votre expérience de jeu sur ${item.game?.name}.`}
            </p>

            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Livraison: ~{item.processingTime || "24h"}</span>
              </div>
              <Badge
                variant="outline"
                className={`text-[10px] border-none p-0 ${
                  item.availability === "AVAILABLE"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {item.availability === "AVAILABLE" ? "En stock" : "Épuisé"}
              </Badge>
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <Button
            asChild
            className="w-full group shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95 transition-all"
            disabled={item.availability !== "AVAILABLE"}
          >
            <Link
              href={`/transactions/create?type=GAME_ITEM_PURCHASE&itemId=${item.id}`}
            >
              Acheter maintenant
              <ShoppingCart className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
