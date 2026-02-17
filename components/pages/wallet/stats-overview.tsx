"use client";

import React, { useEffect, useState } from "react";
import { Typography } from "@/components/ui/typography";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  CheckCircle,
  BarChart3,
  Activity,
  ArrowUpRight,
} from "lucide-react";
import { getWalletLedgerDailyFlow } from "@/actions/wallets";

interface StatsOverviewProps {
  stats: {
    totalTransactions: number;
    totalAmount: number;
    monthlyChange: number;
    pendingTransactions: number;
  };
  walletId: string;
}

export function StatsOverview({ stats, walletId }: StatsOverviewProps) {
  const [weeklyData, setWeeklyData] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await getWalletLedgerDailyFlow(walletId, 7);
        if (mounted) {
          setWeeklyData(data);
        }
      } catch (e) {
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const maxValue = Math.max(...weeklyData, 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 }}
          >
            <Card className="bg-card/40 backdrop-blur-xl border-border/50 shadow-lg relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardContent className="p-6 relative">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <Typography
                      variant="caption1"
                      className="text-muted-foreground uppercase tracking-wider font-bold"
                    >
                      Volume Total
                    </Typography>
                    <Typography
                      variant="h2"
                      className="mt-1 font-black tracking-tight"
                    >
                      {stats.totalAmount.toLocaleString()}{" "}
                      <span className="text-primary text-xl">GTC</span>
                    </Typography>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                    <DollarSign className="w-6 h-6" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                      stats.monthlyChange >= 0
                        ? "bg-green-500/10 text-green-500"
                        : "bg-red-500/10 text-red-500"
                    }`}
                  >
                    {stats.monthlyChange >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {stats.monthlyChange > 0 ? "+" : ""}
                    {stats.monthlyChange}%
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">
                    vs mois dernier
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-card/40 backdrop-blur-xl border-border/50 shadow-lg relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardContent className="p-6 relative">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <Typography
                      variant="caption1"
                      className="text-muted-foreground uppercase tracking-wider font-bold"
                    >
                      Transactions
                    </Typography>
                    <Typography
                      variant="h2"
                      className="mt-1 font-black tracking-tight"
                    >
                      {stats.totalTransactions}
                    </Typography>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-500">
                    <Activity className="w-6 h-6" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-500">
                    <Clock className="w-3 h-3" />
                    {stats.pendingTransactions} en attente
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <Card className="bg-card/40 backdrop-blur-xl border-border/50 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                <Typography variant="h5" className="font-bold">
                  Analyse des flux
                </Typography>
              </div>
              <Badge variant="secondary" className="font-mono">
                7 derniers jours
              </Badge>
            </div>

            <div className="h-48 flex items-end justify-between gap-2 md:gap-4 px-2">
              {isLoading
                ? Array(7)
                    .fill(0)
                    .map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-muted/20 rounded-t-lg h-full animate-pulse"
                      />
                    ))
                : weeklyData.map((value, index) => (
                    <div
                      key={index}
                      className="flex-1 flex flex-col items-center gap-2 group relative"
                    >
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${(value / maxValue) * 100}%` }}
                        transition={{
                          duration: 0.6,
                          ease: "easeOut",
                          delay: index * 0.05,
                        }}
                        className="w-full bg-gradient-to-t from-primary/40 to-primary rounded-t-lg relative hover:from-primary/60 hover:to-primary/90 transition-all cursor-pointer shadow-lg shadow-primary/5"
                      >
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-popover border border-border px-2 py-1 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-10 whitespace-nowrap">
                          <span className="text-xs font-bold">{value} GTC</span>
                        </div>
                      </motion.div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground/60">
                        {["L", "M", "M", "J", "V", "S", "D"][index]}
                      </span>
                    </div>
                  ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="bg-gradient-to-br from-primary to-purple-800 text-white border-0 shadow-2xl relative overflow-hidden h-full">
          <div className="absolute top-0 right-0 p-32 bg-white/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 p-24 bg-black/20 blur-[80px] rounded-full translate-y-1/2 -translate-x-1/2" />

          <CardContent className="p-8 h-full flex flex-col justify-between relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-6 opacity-80">
                <div className="p-1.5 bg-white/20 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-bold uppercase tracking-wider">
                  Santé du compte
                </span>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2 font-medium opacity-90">
                    <span>Score de confiance</span>
                    <span>98/100</span>
                  </div>
                  <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "98%" }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full bg-white rounded-full"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2 font-medium opacity-90">
                    <span>Limites d'envoi</span>
                    <span>15k / 20k GTC</span>
                  </div>
                  <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "75%" }}
                      transition={{ duration: 1, delay: 0.7 }}
                      className="h-full bg-green-400 rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest opacity-60 font-bold mb-1">
                    Status
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="font-bold">Vérifié & Actif</span>
                  </div>
                </div>
                <div className="bg-white/10 p-2 rounded-xl cursor-pointer hover:bg-white/20 transition-colors">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
