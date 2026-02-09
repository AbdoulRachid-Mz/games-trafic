// @/components/pages/games/game-item-card.tsx
"use client";

import React from "react";
import {
  Package,
  Coins,
  Shield,
  Clock,
  ShoppingCart,
  Gamepad2,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GameItemWithRelations } from "@/database/schema";
import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Typography } from "@/components/ui/typography";
import { TransactionQRCode } from "@/components/shared/qr-code";
import { encodeTransactionQR } from "@/utils/qr-utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { QrCode } from "lucide-react";

interface GameItemCardProps {
  item: GameItemWithRelations;
}

export function GameItemCard({ item }: GameItemCardProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "COIN":
        return <Coins className="h-4 w-4" />;
      case "ITEM":
        return <Package className="h-4 w-4" />;
      case "SKIN":
        return <Shield className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case "COIN": return "Monnaie";
      case "ITEM": return "Objet";
      case "SKIN": return "Skin";
      default: return "Pack";
    }
  };

  const typeColorClasses = {
    COIN: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    ITEM: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    SKIN: "text-purple-500 bg-purple-500/10 border-purple-500/20"
  } as any;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="h-full"
    >
      <Card className="h-full overflow-hidden border-border/60 bg-card/40 backdrop-blur-xl transition-all duration-300 shadow-sm hover:shadow-2xl hover:shadow-primary/10 rounded-[2rem] flex flex-col group">
        <CardContent className="p-0 flex-1">
          {/* Media Section */}
          <div className="relative aspect-[4/3] overflow-hidden bg-muted/30">
            {item.icon ? (
              <img
                src={item.icon}
                alt={item.name}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-purple-500/10">
                <Package className="h-14 w-14 text-muted-foreground/20" />
              </div>
            )}

            {/* Price Overlay */}
            <div className="absolute bottom-3 left-3">
              <div className="bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2 shadow-xl">
                <Coins className="h-3.5 w-3.5 text-primary" />
                <span className="text-sm font-black text-white leading-none">
                  {item.priceGtc} <span className="text-[10px] text-primary/80 ml-0.5">GTC</span>
                </span>
              </div>
            </div>

            {/* Availability Badge */}
            <div className="absolute top-3 right-3">
              <Badge
                className={cn(
                  "backdrop-blur-md border-none px-2 py-1 h-auto text-[9px] font-black uppercase tracking-widest",
                  item.availability === "AVAILABLE"
                    ? "bg-green-500/80 text-white"
                    : "bg-red-500/80 text-white"
                )}
              >
                {item.availability === "AVAILABLE" ? "Prêt" : "Out"}
              </Badge>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Header: Title & Type */}
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <Typography variant="h4" className="font-black text-lg tracking-tight truncate leading-none">
                  {item.name}
                </Typography>
                <div className="flex items-center gap-1.5">
                  <div className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-wider", typeColorClasses[item.type] || "bg-muted text-muted-foreground border-border")}>
                    {getTypeIcon(item.type)}
                    {getTypeText(item.type)}
                  </div>
                </div>
              </div>
              <Avatar className="h-10 w-10 rounded-xl border-2 border-background shadow-md">
                <AvatarImage src={item.game?.profileImage || ""} />
                <AvatarFallback className="bg-muted text-muted-foreground text-[10px] font-bold">
                  <Gamepad2 className="h-4 w-4 opacity-50" />
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Description */}
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-medium h-8">
              {item.description ||
                `Optimisez votre build avec cet item exclusif pour ${item.game?.name}.`}
            </p>

            {/* Meta Info */}
            <div className="flex items-center justify-between pt-4 border-t border-border/50">
              <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                <Clock className="h-3 w-3 text-primary/50" />
                <span>~{item.processingTime || "Instant"}</span>
              </div>

              <div className="flex items-center gap-3">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-xl bg-primary/5 hover:bg-primary/10 text-primary border border-primary/10 transition-all"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <QrCode className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-border/50 rounded-[2.5rem] p-0 overflow-hidden">
                    <div className="p-8">
                      <DialogHeader className="mb-6">
                        <DialogTitle className="font-black italic uppercase tracking-tighter text-2xl">QR de l'item</DialogTitle>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Scannez pour acheter directement</p>
                      </DialogHeader>
                      <div className="flex justify-center">
                        <TransactionQRCode
                          data={encodeTransactionQR({
                            t: "GAME_ITEM_PURCHASE",
                            id: item.id,
                            a: parseFloat(item.priceGtc),
                            m: { name: item.name }
                          })}
                          label={item.name}
                          className="shadow-none border-none p-0 bg-transparent"
                        />
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Link
                  href={`/games/${item.gameId}`}
                  className="text-[10px] font-black text-primary hover:text-primary/80 flex items-center gap-1 uppercase tracking-widest transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {item.game?.name?.split(' ')[0]} <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-6 pt-0">
          <Button
            asChild
            variant={item.availability === "AVAILABLE" ? "default" : "secondary"}
            className={cn(
              "w-full rounded-2xl h-12 font-black uppercase tracking-[0.15em] text-[10px] transition-all group",
              item.availability === "AVAILABLE"
                ? "shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02]"
                : "opacity-50 cursor-not-allowed"
            )}
            disabled={item.availability !== "AVAILABLE"}
          >
            <Link
              href={item.availability === "AVAILABLE" ? `/wallet/transactions/create?type=GAME_ITEM_PURCHASE&itemId=${item.id}` : "#"}
            >
              Récupérer l'item
              <ShoppingCart className="ml-2.5 h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
