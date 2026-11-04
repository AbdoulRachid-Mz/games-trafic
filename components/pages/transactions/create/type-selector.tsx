"use client";

import React from "react";
import { Typography } from "@/components/ui/typography";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  Palette,
  Star,
  ShoppingCart,
  Trophy,
  GamepadIcon,
  Wallet,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TransactionType,
  TRANSACTION_CONFIGS,
} from "@/types/transaction-types";

interface TransactionTypeSelectorProps {
  onSelect: (type: TransactionType) => void;
}

const transactionTypes = [
  {
    id: "DEPOSIT" as TransactionType,
    label: "Dépôt",
    icon: ArrowDownLeft,
    description: "Ajouter des fonds",
    color: "from-emerald-500 to-green-600",
    iconColor: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    id: "WITHDRAWAL" as TransactionType,
    label: "Retrait",
    icon: ArrowUpRight,
    description: "Vers compte externe",
    color: "from-rose-500 to-red-600",
    iconColor: "text-rose-400",
    bg: "bg-rose-500/10",
  },
  {
    id: "TRANSFER" as TransactionType,
    label: "Transfert P2P",
    icon: Zap,
    description: "Vers un ami",
    color: "from-blue-500 to-indigo-600",
    iconColor: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    id: "VIP_SUBSCRIPTION" as TransactionType,
    label: "Abonnement VIP",
    icon: Star,
    description: "Avantages exclusifs",
    color: "from-amber-400 to-orange-600",
    iconColor: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    id: "THEME_PURCHASE" as TransactionType,
    label: "Thèmes & Skins",
    icon: Palette,
    description: "Personnalisation",
    color: "from-purple-500 to-violet-600",
    iconColor: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    id: "TOURNAMENT_PARTICIPATION" as TransactionType,
    label: "Tournois",
    icon: Trophy,
    description: "Frais d'entrée",
    color: "from-yellow-500 to-amber-600",
    iconColor: "text-yellow-400",
    bg: "bg-yellow-500/10",
  },
  {
    id: "GAME_ITEM_PURCHASE" as TransactionType,
    label: "Items de Jeu",
    icon: GamepadIcon,
    description: "Achats in-game",
    color: "from-cyan-500 to-blue-600",
    iconColor: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  {
    id: "ORDER_PURCHASE" as TransactionType,
    label: "Boutique",
    icon: ShoppingCart,
    description: "Produits physiques",
    color: "from-pink-500 to-rose-600",
    iconColor: "text-pink-400",
    bg: "bg-pink-500/10",
  },
  {
    id: "QR_SCAN" as any,
    label: "Scanner QR",
    icon: CreditCard,
    description: "Scanner pour payer",
    color: "from-cyan-400 to-blue-500",
    iconColor: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
];

export function TransactionTypeSelector({
  onSelect,
}: TransactionTypeSelectorProps) {
  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="text-center mb-10">
        <Typography variant="h2" weight="bold" className="mb-3 tracking-tight">
          Nouvelle Transaction
        </Typography>
        <Typography
          variant="body-base"
          theme="muted"
          className="max-w-lg mx-auto"
        >
          Sélectionnez le type d'opération que vous souhaitez effectuer
          aujourd'hui.
        </Typography>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {transactionTypes.map((type, index) => {
          const config = TRANSACTION_CONFIGS[type.id as TransactionType];
          return (
            <motion.button
              key={type.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(type.id)}
              className="group relative flex flex-col items-center p-6 h-48 rounded-2xl bg-card/30 border border-border/50 hover:border-primary/50 transition-all duration-300 overflow-hidden text-center"
            >
              {/* Background Gradient on Hover */}
              <div
                className={cn(
                  "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br",
                  type.color
                )}
              />

              <div
                className={cn(
                  "relative mb-4 p-4 rounded-2xl transition-all duration-300 group-hover:scale-110 shadow-lg",
                  type.bg
                )}
              >
                <type.icon className={cn("h-7 w-7", type.iconColor)} />
              </div>

              <div className="relative z-10">
                <h3 className="font-bold text-base mb-1 group-hover:text-primary transition-colors">
                  {type.label}
                </h3>
                <p className="text-xs font-medium text-muted-foreground/80 group-hover:text-muted-foreground">
                  {type.description}
                </p>
              </div>

              {config?.isAdminAction && (
                <div className="absolute top-3 right-3">
                  <ShieldCheck className="w-4 h-4 text-muted-foreground/50" />
                </div>
              )}

              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/0 to-transparent group-hover:via-primary/50 transition-all duration-500 transform scale-x-0 group-hover:scale-x-100" />
            </motion.button>
          );
        })}
      </div>

      <div className="mt-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/30 border border-border/50">
          <ShieldCheck className="w-4 h-4 text-green-500" />
          <span className="text-xs font-bold text-muted-foreground">
            Transactions chiffrées de bout en bout et sécurisées par GTC-Secure
          </span>
        </div>
      </div>
    </div>
  );
}
