"use client";

import { useRouter } from "next/navigation";
import React from "react";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  QrCode,
  Send,
  Gift,
  Settings,
  Shield,
  Zap,
  ShoppingBag,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionsProps {
  walletId: string;
}
interface QuickAction {
  id: string;
  icon: React.ComponentType<{ className?: string }>; label: string;
  path?: string;
  description: string;
  color: string;
  iconColor: string;
  variant: "default" | "outline";
}

const actions: QuickAction[] = [
  {
    id: "deposit",
    icon: ArrowDownLeft,
    label: "Dépôt",
    path: "/wallet/transactions/create?type=DEPOSIT",
    description: "Recharger",
    color: "from-green-500 to-emerald-700",
    iconColor: "text-green-400",
    variant: "default" as const,
  },
  {
    id: "withdraw",
    icon: ArrowUpRight,
    label: "Retrait",
    path: "/wallet/transactions/create?type=WITHDRAWAL",
    description: "Vers compte",
    color: "from-red-500 to-rose-700",
    iconColor: "text-red-400",
    variant: "outline" as const,
  },
  {
    id: "transfer",
    icon: Send,
    label: "Envoi",
    path: "/wallet/transactions/create?type=TRANSFER",
    description: "P2P Rapide",
    color: "from-blue-500 to-indigo-700",
    iconColor: "text-blue-400",
    variant: "outline" as const,
  },
  {
    id: "Achat comptes",
    icon: ShoppingBag,
    label: "Achat de comptes",
    path: "/wallet/transactions/create?type=PRODUCT_PURCHASE",
    description: "Achat de comptes ",
    color: "from-purple-500 to-violet-700",
    iconColor: "text-purple-400",
    variant: "outline" as const,
  },
  {
    id: "scan",
    icon: QrCode,
    label: "Scanner",
    path: "/wallet/transactions/create?type=QR_SCAN",
    description: "Via QR Code",
    color: "from-amber-500 to-orange-700",
    iconColor: "text-amber-400",
    variant: "outline" as const,
  },
  {
    id: "bonus",
    icon: Gift,
    label: "Rewards",
    description: "Mes gains",
    color: "from-pink-500 to-fuchsia-700",
    path: "/wallet/transactions",
    iconColor: "text-pink-400",
    variant: "outline" as const,
  },
];

export function QuickActions({ walletId }: QuickActionsProps) {
  const router = useRouter();

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-purple-500/5 rounded-3xl blur-3xl" />
      <Card className="relative bg-card/40 backdrop-blur-xl border-border/50 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/5 pointer-events-none" />
        <CardContent className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <Typography variant="h4" className="font-bold tracking-tight">
                  Opérations Rapides
                </Typography>
                <Typography
                  variant="caption1"
                  className="text-muted-foreground font-medium"
                >
                  Gérez vos actifs en un clic
                </Typography>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {actions.map((action, index) => (
              <motion.button
                key={action.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => action.path && router.push(action.path)}
                className="group relative flex flex-col items-center justify-center p-4 h-32 rounded-2xl bg-gradient-to-b from-white/5 to-white/0 border border-white/5 hover:border-white/10 transition-all duration-300 overflow-hidden"
              >
                {/* Hover Gradient Background */}
                <div
                  className={cn(
                    "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 bg-gradient-to-br",
                    action.color
                  )}
                />

                <div
                  className={cn(
                    "relative mb-3 p-3 rounded-2xl bg-background/50 backdrop-blur-md shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:scale-110",
                    "border border-white/5 group-hover:border-white/20"
                  )}
                >
                  {(() => {
                    const Icon = action.icon;
                    return <Icon className={cn("w-6 h-6", action.iconColor)} />;
                  })()}
                </div>


                <div className="relative text-center z-10">
                  <span className="block text-sm font-bold text-foreground/90 group-hover:text-foreground transition-colors">
                    {action.label}
                  </span>
                  <span className="block text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wide mt-1 group-hover:text-muted-foreground transition-colors">
                    {action.description}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>

          <div className="flex items-center justify-between pt-6 mt-6 border-t border-white/5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
              <Shield className="h-3.5 w-3.5 text-green-500" />
              <span className="text-xs max-md:text-sm font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">
                Sécurisé par GTC-Guard™
              </span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/wallet/settings")}
              className="text-xs font-medium text-muted-foreground hover:text-primary gap-2"
            >
              <Settings className="h-3.5 w-3.5" />
              Paramètres avancés
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
