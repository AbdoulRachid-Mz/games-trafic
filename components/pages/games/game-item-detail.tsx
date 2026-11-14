// @/components/pages/games/game-item-detail.tsx
"use client";

import React, { useState } from "react";
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
  QrCode,
  Sparkles,
  Zap,
  Crown,
  Gem,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Typography } from "@/components/ui/typography";
import { GameItemWithRelations } from "@/database/schema";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { TransactionQRCode } from "@/components/shared/qr-code";
import { encodeTransactionQR } from "@/utils/qr-utils";
import { gameItemTypeLabel } from "@/utils/types-label";
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

// Type-based theme configuration
const typeThemes: Record<string, {
  gradient: string;
  glow: string;
  accent: string;
  accentBg: string;
  icon: React.ElementType;
  border: string;
  badgeBg: string;
  particleColor: string;
}> = {
  COIN: {
    gradient: "from-amber-500/20 via-yellow-500/10 to-orange-500/5",
    glow: "shadow-amber-500/20",
    accent: "text-amber-400",
    accentBg: "bg-amber-500/10 border-amber-500/20",
    icon: Coins,
    border: "border-amber-500/30",
    badgeBg: "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border-amber-500/30",
    particleColor: "bg-amber-400",
  },
  ITEM: {
    gradient: "from-blue-500/20 via-cyan-500/10 to-indigo-500/5",
    glow: "shadow-blue-500/20",
    accent: "text-blue-400",
    accentBg: "bg-blue-500/10 border-blue-500/20",
    icon: Package,
    border: "border-blue-500/30",
    badgeBg: "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border-blue-500/30",
    particleColor: "bg-blue-400",
  },
  SKIN: {
    gradient: "from-purple-500/20 via-violet-500/10 to-fuchsia-500/5",
    glow: "shadow-purple-500/20",
    accent: "text-purple-400",
    accentBg: "bg-purple-500/10 border-purple-500/20",
    icon: Shield,
    border: "border-purple-500/30",
    badgeBg: "bg-gradient-to-r from-purple-500/20 to-violet-500/20 text-purple-300 border-purple-500/30",
    particleColor: "bg-purple-400",
  },
  EQUIPMENT: {
    gradient: "from-emerald-500/20 via-green-500/10 to-teal-500/5",
    glow: "shadow-emerald-500/20",
    accent: "text-emerald-400",
    accentBg: "bg-emerald-500/10 border-emerald-500/20",
    icon: Zap,
    border: "border-emerald-500/30",
    badgeBg: "bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-300 border-emerald-500/30",
    particleColor: "bg-emerald-400",
  },
  CURRENCY: {
    gradient: "from-rose-500/20 via-pink-500/10 to-red-500/5",
    glow: "shadow-rose-500/20",
    accent: "text-rose-400",
    accentBg: "bg-rose-500/10 border-rose-500/20",
    icon: Gem,
    border: "border-rose-500/30",
    badgeBg: "bg-gradient-to-r from-rose-500/20 to-pink-500/20 text-rose-300 border-rose-500/30",
    particleColor: "bg-rose-400",
  },
};

const defaultTheme = typeThemes.ITEM;

// Floating particle component for ambient effect
function FloatingParticle({ color, delay, size }: { color: string; delay: number; size: number }) {
  return (
    <motion.div
      className={cn("absolute rounded-full opacity-20 blur-sm", color)}
      style={{ width: size, height: size }}
      initial={{ y: 0, x: 0, opacity: 0 }}
      animate={{
        y: [-20, -60, -20],
        x: [0, 15, -10, 0],
        opacity: [0, 0.3, 0],
      }}
      transition={{
        duration: 4,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

export function GameItemDetail({ item }: GameItemDetailProps) {
  const [imageHovered, setImageHovered] = useState(false);
  const theme = typeThemes[item.type] || defaultTheme;
  const TypeIcon = theme.icon;

  return (
    <div className="min-h-screen bg-background pb-20 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className={cn(
        "fixed inset-0 bg-gradient-to-br opacity-40 pointer-events-none transition-opacity duration-1000",
        theme.gradient
      )} />
      <div className="fixed top-1/4 left-1/4 w-[600px] h-[600px] rounded-full blur-[160px] opacity-10 pointer-events-none"
        style={{
          background: item.type === "COIN" ? "radial-gradient(circle, rgba(245,158,11,0.3), transparent)"
            : item.type === "SKIN" ? "radial-gradient(circle, rgba(168,85,247,0.3), transparent)"
            : item.type === "EQUIPMENT" ? "radial-gradient(circle, rgba(16,185,129,0.3), transparent)"
            : "radial-gradient(circle, rgba(59,130,246,0.3), transparent)"
        }}
      />

      {/* Header / Navigation */}
      <div className="sticky top-0 z-40 bg-background/60 backdrop-blur-xl border-b border-border/30">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild className="rounded-full gap-2 hover:bg-white/5">
            <Link href="/games">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Retour</span>
            </Link>
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/5">
              <Share2 className="h-4 w-4" />
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/5">
                  <QrCode className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-border/50 rounded-[2.5rem] p-0 overflow-hidden">
                <div className="p-8">
                  <DialogHeader className="mb-6">
                    <DialogTitle className="font-black italic uppercase tracking-tighter text-2xl text-center">QR de l&apos;item</DialogTitle>
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

      <div className="container mx-auto px-4 pt-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* Visual section */}
          <div className="lg:col-span-7 space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "relative aspect-square sm:aspect-[4/3] rounded-[3rem] overflow-hidden border shadow-2xl group cursor-crosshair",
                theme.border,
                theme.glow
              )}
              onMouseEnter={() => setImageHovered(true)}
              onMouseLeave={() => setImageHovered(false)}
            >
              {/* Inner glow overlay */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 transition-opacity duration-500",
                imageHovered ? "opacity-30" : "opacity-60"
              )} />

              {/* Animated grid lines */}
              <div className="absolute inset-0 z-[5] opacity-[0.03] pointer-events-none"
                style={{
                  backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                  backgroundSize: '40px 40px'
                }}
              />

              {item.icon ? (
                <motion.div
                  animate={{
                    scale: imageHovered ? 1.05 : 1,
                    rotateY: imageHovered ? 3 : 0,
                    rotateX: imageHovered ? -2 : 0,
                  }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 flex items-center justify-center p-8"
                  style={{ perspective: 1000 }}
                >
                  <Image
                    src={item.icon}
                    fill
                    alt={item.name}
                    className="object-contain p-8"
                    priority
                  />
                </motion.div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/5 to-purple-500/10">
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <TypeIcon className="h-32 w-32 text-muted-foreground/10" />
                  </motion.div>
                </div>
              )}

              {/* Bottom info bar inside image */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="absolute bottom-0 left-0 right-0 z-20 p-6 flex items-end justify-between"
              >
                <div className="flex items-center gap-3">
                  <Badge className={cn("px-4 py-2 rounded-2xl font-black uppercase tracking-widest text-[10px] border backdrop-blur-md", theme.badgeBg)}>
                    <TypeIcon className="h-3 w-3 mr-1.5" />
                    {gameItemTypeLabel(item.type)}
                  </Badge>
                </div>
                <Badge variant="secondary" className="bg-black/50 backdrop-blur-md text-white border-white/10 px-4 py-2 rounded-2xl font-black uppercase tracking-widest text-[10px]">
                  {item.availability === "AVAILABLE" ? (
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      Disponible
                    </span>
                  ) : "Indisponible"}
                </Badge>
              </motion.div>

              {/* Corner sparkle effect */}
              <div className="absolute top-6 left-6 z-20">
                <motion.div
                  animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className={cn("h-5 w-5 opacity-40", theme.accent)} />
                </motion.div>
              </div>

              {/* Floating particles */}
              <div className="absolute bottom-20 left-10 z-20">
                <FloatingParticle color={theme.particleColor} delay={0} size={6} />
              </div>
              <div className="absolute bottom-32 right-20 z-20">
                <FloatingParticle color={theme.particleColor} delay={1.5} size={4} />
              </div>
              <div className="absolute top-20 right-16 z-20">
                <FloatingParticle color={theme.particleColor} delay={3} size={5} />
              </div>
            </motion.div>

            {/* Game banner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-4 p-5 rounded-3xl bg-card/50 backdrop-blur-sm border border-border/30"
            >
              <Avatar className="h-14 w-14 border-2 border-background shadow-lg ring-2 ring-primary/10">
                <AvatarImage src={item.game?.profileImage || ""} />
                <AvatarFallback className="bg-primary/10"><Gamepad2 className="h-6 w-6 text-primary/50" /></AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-0.5">Jeu</p>
                <p className="text-lg font-black uppercase tracking-tight">{item.game?.name || "Jeu inconnu"}</p>
              </div>
              <Button variant="outline" size="sm" asChild className="rounded-xl font-bold gap-2 border-border/50 hover:border-primary/30">
                <Link href={`/games?gameId=${item.gameId}`}>
                  Tous les items
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          </div>

          {/* Info section */}
          <div className="lg:col-span-5 space-y-8">
            {/* Title & Type */}
            <div className="space-y-4">
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="text-4xl sm:text-5xl font-black italic tracking-tighter uppercase leading-[0.9]"
              >
                {item.name}
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-3"
              >
                {item.featured && (
                  <Badge className="px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-[10px] font-black uppercase tracking-widest">
                    ⭐ Mis en avant
                  </Badge>
                )}
                <Badge variant="outline" className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border", theme.accentBg)}>
                  {item.type}
                </Badge>
              </motion.div>
            </div>

            {/* Price Card - Premium */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className={cn(
                "relative p-8 rounded-[2.5rem] bg-card/80 backdrop-blur-sm border shadow-2xl overflow-hidden group",
                theme.border,
                theme.glow
              )}
            >
              {/* Animated background pattern */}
              <div className="absolute inset-0 opacity-[0.02]"
                style={{
                  backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
                  backgroundSize: '24px 24px'
                }}
              />

              {/* Corner icon */}
              <div className="absolute top-4 right-4 opacity-5">
                <TypeIcon className="h-28 w-28 rotate-12" />
              </div>

              <div className="relative space-y-6">
                {/* Price display */}
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mb-3">Prix de l&apos;item</p>
                  <div className="flex items-baseline gap-3">
                    <motion.span
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                      className={cn("text-6xl font-black italic tracking-tighter", theme.accent)}
                    >
                      {item.priceGtc}
                    </motion.span>
                    <span className={cn("text-xl font-black italic tracking-tighter opacity-50", theme.accent)}>GTC</span>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className={cn("p-4 rounded-2xl border", theme.accentBg)}>
                    <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      <span className="text-[9px] font-black uppercase tracking-[0.2em]">Délai</span>
                    </div>
                    <span className="text-sm font-black uppercase">~{item.processingTime || "Instant"}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-green-500/5 border border-green-500/10">
                    <div className="flex items-center gap-2 text-green-500/60 mb-1.5">
                      <TrendingUp className="h-3.5 w-3.5" />
                      <span className="text-[9px] font-black uppercase tracking-[0.2em]">Rang</span>
                    </div>
                    <span className="text-sm font-black uppercase">
                      {item.popularity ? `Top #${item.popularity}` : "Nouveau"}
                    </span>
                  </div>
                </div>

                {/* CTA Button with glow */}
                <div className="space-y-3">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative"
                  >
                    {/* Glow effect behind button */}
                    {item.availability === "AVAILABLE" && (
                      <div className={cn(
                        "absolute inset-0 rounded-[1.5rem] blur-xl opacity-40 transition-opacity duration-300",
                        item.type === "COIN" ? "bg-amber-500/30" : item.type === "SKIN" ? "bg-purple-500/30" : "bg-blue-500/30"
                      )} />
                    )}
                    <Button
                      asChild
                      size="lg"
                      className={cn(
                        "relative w-full rounded-[1.5rem] h-16 font-black uppercase tracking-[0.2em] text-xs transition-all",
                        item.availability !== "AVAILABLE" && "opacity-40 grayscale cursor-not-allowed"
                      )}
                      disabled={item.availability !== "AVAILABLE"}
                    >
                      <Link href={item.availability === "AVAILABLE" ? `/wallet/transactions/create?type=GAME_ITEM_PURCHASE&itemId=${item.id}` : "#"}>
                        <ShoppingCart className="mr-3 h-5 w-5" />
                        Récupérer l&apos;item
                      </Link>
                    </Button>
                  </motion.div>

                  <p className="text-center text-[9px] font-bold text-muted-foreground/50 uppercase tracking-[0.2em]">
                    Transaction sécurisée par escrow system
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3">
                <Typography variant="h4" className="font-black italic uppercase tracking-tighter">Description</Typography>
                <div className="h-px flex-1 bg-border/30" />
              </div>
              <p className="text-muted-foreground leading-relaxed font-medium text-sm">
                {item.description || "Aucune description détaillée disponible pour cet item. Cet objet de jeu exclusif a été vérifié et certifié par notre plateforme pour garantir la meilleure expérience utilisateur."}
              </p>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="rounded-full border-border/30 px-3 py-1 font-bold text-xs bg-card/50">
                  #Gaming
                </Badge>
                {item.game?.name && (
                  <Badge variant="outline" className="rounded-full border-border/30 px-3 py-1 font-bold text-xs bg-card/50">
                    #{item.game.name.replace(/\s+/g, '')}
                  </Badge>
                )}
                <Badge variant="outline" className={cn("rounded-full px-3 py-1 font-bold text-xs", theme.accentBg)}>
                  #{gameItemTypeLabel(item.type)}
                </Badge>
              </div>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="grid grid-cols-3 gap-3"
            >
              {[
                { icon: Shield, label: "Certifié", desc: "100%" },
                { icon: Zap, label: "Livraison", desc: "Rapide" },
                { icon: Crown, label: "Premium", desc: "Qualité" },
              ].map((trust, i) => (
                <div key={i} className="text-center p-4 rounded-2xl bg-card/30 border border-border/20">
                  <trust.icon className={cn("h-5 w-5 mx-auto mb-2 opacity-60", theme.accent)} />
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">{trust.label}</p>
                  <p className="text-xs font-bold mt-0.5">{trust.desc}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
