// components/pages/shops/shop-card-list.tsx
"use client";

import { motion } from "framer-motion";
import { Store, MapPin, Users, TrendingUp, Shield, Award, ChevronRight } from "lucide-react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Shop } from "@/database/schema";

interface ShopCardListProps {
  shop: Shop;
  viewMode: "grid" | "list";
  onView: () => void;
}

export function ShopCardList({ shop, viewMode, onView }: ShopCardListProps) {
  return (
    <motion.div
      whileHover={{ x: 4 }}
      className="group cursor-pointer"
      onClick={onView}
    >
      <Card className="border-2 border-transparent hover:border-primary/20 transition-all duration-300">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Photo de profil */}
            <div className="relative flex-shrink-0">
              {shop.profileImage ? (
                <Image
                  src={shop.profileImage}
                  alt={shop.name}
                  width={80}
                  height={80}
                  className="rounded-lg border-2 border-background object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-lg border-2 border-background bg-primary/10 flex items-center justify-center">
                  <Store className="h-10 w-10 text-primary" />
                </div>
              )}
              {/* Badges */}
              <div className="absolute -top-2 -right-2 flex flex-col gap-1">
                {shop.verified && (
                  <Badge className="bg-green-500 gap-1 h-5">
                    <Shield className="h-3 w-3" />
                  </Badge>
                )}
              </div>
            </div>

            {/* Infos */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Typography variant="body-base" weight="bold" className="truncate">
                      {shop.name}
                    </Typography>
                    {shop.featured && (
                      <Badge variant="outline" className="gap-1">
                        <Award className="h-3 w-3" />
                        Vedette
                      </Badge>
                    )}
                  </div>
                  {shop.country && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                      <MapPin className="h-3 w-3" />
                      {shop.country}
                    </div>
                  )}
                  {shop.description && (
                    <Typography variant="body-sm" theme="muted" className="line-clamp-1 mb-2">
                      {shop.description}
                    </Typography>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-sm">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="font-semibold">{shop.productCount || 0}</span>
                  <span className="text-muted-foreground">produits</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="font-semibold">{shop.viewCount || 0}</span>
                  <span className="text-muted-foreground">vues</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <span className="font-semibold">4.5</span>
                  <span className="text-muted-foreground">/5</span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onView();
                }}
              >
                Visiter
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}