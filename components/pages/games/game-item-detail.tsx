// @/components/pages/games/game-item-detail.tsx
"use client";

import React from "react";
import { 
  Coins, 
  Package, 
  Shield, 
  Clock, 
  ShoppingCart, 
  Gamepad2, 
  ArrowLeft,
  Share2,
  TrendingUp,
  ChevronRight,
  QrCode
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Typography } from "@/components/ui/typography";
import { GameItemWithRelations } from "@/database/schema";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { TransactionQRCode } from "@/components/shared/qr-code";
import { encodeTransactionQR } from "@/utils/qr-utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface GameItemDetailProps {
  item: GameItemWithRelations;
}

export function GameItemDetail({ item }: GameItemDetailProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "COIN": return <Coins className="h-5 w-5" />;
      case "ITEM": return <Package className="h-5 w-5" />;
      case "SKIN": return <Shield className="h-5 w-5" />;
      default: return <Package className="h-5 w-5" />;
    }
  };

  const typeColorClasses = {
    COIN: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    ITEM: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    SKIN: "text-purple-500 bg-purple-500/10 border-purple-500/20"
  } as any;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header / Navigation */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild className="rounded-full gap-2">
            <Link href="/games">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Retour aux items</span>
            </Link>
          </Button>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Share2 className="h-4 w-4" />
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <QrCode className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-border/50 rounded-[2.5rem] p-0 overflow-hidden">
                <div className="p-8">
                  <DialogHeader className="mb-6">
                    <DialogTitle className="font-black italic uppercase tracking-tighter text-2xl text-center">QR de l'item</DialogTitle>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-center">Scannez pour acheter directement</p>
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
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Visual section */}
          <div className="lg:col-span-7 space-y-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative aspect-square sm:aspect-[4/3] rounded-[3rem] overflow-hidden bg-muted/30 border border-border/50 shadow-2xl group"
            >
              {item.icon ? (
                <Image
                  src={item.icon}
                  fill
                  alt={item.name}
                  className="object-cover transition-transform duration-1000 group-hover:scale-105"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/5 to-purple-500/10">
                  <Package className="h-24 w-24 text-muted-foreground/20" />
                </div>
              )}
              
              <div className="absolute top-6 right-6">
                <Badge variant="secondary" className="bg-black/60 backdrop-blur-md text-white border-white/10 px-4 py-2 rounded-2xl font-black uppercase tracking-widest text-[10px]">
                  {item.availability === "AVAILABLE" ? "Disponible" : "Indisponible"}
                </Badge>
              </div>
            </motion.div>

            {/* Screenshots / Gallerie (Placeholders if no gallery) */}
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-video rounded-2xl bg-muted/20 border border-border/50 overflow-hidden cursor-pointer hover:border-primary/50 transition-colors">
                   <div className="h-full w-full flex items-center justify-center">
                      <Image 
                        src={item.game?.profileImage || ""} 
                        width={100} 
                        height={100} 
                        alt="detail" 
                        className="opacity-10 grayscale"
                      />
                   </div>
                </div>
              ))}
            </div>
          </div>

          {/* Info section */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-[0.2em]", typeColorClasses[item.type] || "bg-muted text-muted-foreground border-border")}
              >
                {getTypeIcon(item.type)}
                {item.type}
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl sm:text-5xl font-black italic tracking-tighter uppercase leading-[0.9]"
              >
                {item.name}
              </motion.h1>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="flex items-center gap-4"
              >
                <div className="flex items-center gap-3 bg-muted/30 px-4 py-2 rounded-2xl border border-border/50 shadow-sm">
                  <Avatar className="h-10 w-10 border-2 border-background shadow-md">
                    <AvatarImage src={item.game?.profileImage || ""} />
                    <AvatarFallback><Gamepad2 className="h-5 w-5 opacity-50" /></AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Pour le jeu</p>
                    <p className="text-sm font-black uppercase">{item.game?.name || "Jeu inconnu"}</p>
                  </div>
                </div>
              </motion.div>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-8 rounded-[2.5rem] bg-card border border-border/50 shadow-xl relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Coins className="h-32 w-32 rotate-12" />
              </div>

              <div className="relative space-y-6">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mb-2">Prix de l'item</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-black italic tracking-tighter text-primary">{item.priceGtc}</span>
                    <span className="text-xl font-black italic text-primary/50 tracking-tighter uppercase">GTC</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-3xl bg-background/50 border border-border/50">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Délai</span>
                    </div>
                    <span className="text-sm font-black uppercase">~{item.processingTime || "Instant"}</span>
                  </div>
                  <div className="p-4 rounded-3xl bg-green-500/5 border border-green-500/10">
                    <div className="flex items-center gap-2 text-green-600/60 mb-1">
                      <TrendingUp className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Populaire</span>
                    </div>
                    <span className="text-sm font-black uppercase">Top #{item.popularity || 0}</span>
                  </div>
                </div>

                <Button 
                  asChild
                  size="lg" 
                  className={cn(
                    "w-full rounded-[1.5rem] h-16 font-black uppercase tracking-[0.2em] text-xs transition-all shadow-lg shadow-primary/20",
                    item.availability !== "AVAILABLE" && "opacity-50 grayscale cursor-not-allowed"
                  )}
                  disabled={item.availability !== "AVAILABLE"}
                >
                  <Link href={item.availability === "AVAILABLE" ? `/wallet/transactions/create?type=GAME_ITEM_PURCHASE&itemId=${item.id}` : "#"}>
                    <ShoppingCart className="mr-3 h-5 w-5" />
                    Récupérer l'item
                  </Link>
                </Button>
                
                <p className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Transaction sécurisée par escrow system
                </p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2">
                <Typography variant="h4" className="font-black italic uppercase tracking-tighter">Description</Typography>
                <div className="h-px flex-1 bg-border/50" />
              </div>
              <p className="text-muted-foreground leading-relaxed font-medium">
                {item.description || "Aucune description détaillée disponible pour cet item. Cet objet de jeu exclusif a été vérifié et certifié par notre plateforme pour garantir la meilleure expérience utilisateur."}
              </p>
              
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="rounded-full border-border/50 px-3 py-1 font-bold">#Gaming</Badge>
                <Badge variant="outline" className="rounded-full border-border/50 px-3 py-1 font-bold">#{item.game?.name?.replace(/\s+/g, '')}</Badge>
                <Badge variant="outline" className="rounded-full border-border/50 px-3 py-1 font-bold">#Verified</Badge>
              </div>
            </motion.div>

            {/* Related/Shop Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="rounded-[2.5rem] border-border/50 bg-muted/10 overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Gamepad2 className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Découvrir plus de</p>
                        <p className="font-black uppercase">{item.game?.name}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild className="rounded-xl font-bold gap-2">
                      <Link href={`/games?gameId=${item.gameId}`}>
                        Voir tout
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
