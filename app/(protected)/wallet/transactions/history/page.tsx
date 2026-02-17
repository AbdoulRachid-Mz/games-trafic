"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/auth-context";
import { useUserProfile } from "@/hooks/use-profile";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  History,
  ArrowLeft,
  Download,
  Filter,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Activity
} from "lucide-react";
import { motion } from "framer-motion";
import { TransactionList } from "@/components/pages/wallet/transaction-list";
import { getWalletTransactions } from "@/actions/wallets";
import { type WalletTransaction } from "@/database/schema";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { getWalletLedgerStats } from "@/actions/wallets";

export default function TransactionHistoryPage() {
  const router = useRouter();
  const { user } = useAuthContext();
  const { data: completeData } = useUserProfile();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ledgerTotals, setLedgerTotals] = useState<{ income: number; expense: number }>({ income: 0, expense: 0 });

  const wallet = completeData?.wallet;

  useEffect(() => {
    if (wallet?.id) {
      loadHistory();
    }
  }, [wallet?.id]);

  const loadHistory = async () => {
    try {
      if (!wallet?.id) return;
      setIsLoading(true);

      const transactionsData = await getWalletTransactions({
        filters: { walletId: wallet.id },
        pagination: { page: 1, limit: 50 },
        options: { sortBy: "createdAt", sortOrder: "desc" },
      });

      setTransactions(transactionsData.data || []);
      const stats = await getWalletLedgerStats({ walletId: wallet.id });
      setLedgerTotals({ income: stats.income, expense: stats.expense });
    } catch (error) {
      console.error("Error loading history:", error);
      toast.error("Erreur lors du chargement de l'historique");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/wallet")}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <Typography variant="h1" weight="bold">
              Historique & Activité
            </Typography>
            <Typography variant="body-base" theme="muted" className="mt-1">
              Suivi détaillé de vos opérations financières
            </Typography>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button variant="outline" className="flex-1 md:flex-none gap-2">
            <Download className="h-4 w-4" />
            Exporter
          </Button>
          <Button variant="outline" className="flex-1 md:flex-none gap-2" onClick={loadHistory}>
            <Activity className="h-4 w-4" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Detailed Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card/40 backdrop-blur-xl border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Journal d'activité
                </CardTitle>
                <CardDescription>
                  Toutes vos transactions par ordre chronologique
                </CardDescription>
              </div>
              <Badge variant="outline" className="px-3">
                {transactions.length} opérations
              </Badge>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-xl" />
                  ))}
                </div>
              ) : transactions.length > 0 ? (
                <TransactionList
                  transactions={transactions}
                  walletId={wallet?.id || ""}
                  showFilters
                />
              ) : (
                <div className="text-center py-20 grayscale opacity-50">
                  <History className="h-20 w-20 mx-auto mb-4" />
                  <Typography variant="h4">Aucune activité</Typography>
                  <Typography variant="body-sm">C'est bien calme par ici...</Typography>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Quick Stats & Insights */}
        <div className="space-y-6">
          <Card className="bg-card/40 backdrop-blur-xl border-border/50 overflow-hidden">
            <div className="h-2 bg-primary w-full" />
            <CardHeader>
              <CardTitle className="text-lg">Résumé de la période</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-2xl bg-green-500/5 border border-green-500/10">
                <div className="flex items-center justify-between mb-2">
                  <Typography variant="caption1" className="text-green-600 uppercase tracking-wider">Entrées (Total)</Typography>
                  <ArrowDownLeft className="h-4 w-4 text-green-500" />
                </div>
                <Typography variant="h3" weight="bold" className="text-green-600">
                  {ledgerTotals.income.toLocaleString()} GTC
                </Typography>
              </div>

              <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10">
                <div className="flex items-center justify-between mb-2">
                  <Typography variant="caption1" className="text-red-600 uppercase tracking-wider">Sorties (Total)</Typography>
                  <ArrowUpRight className="h-4 w-4 text-red-500" />
                </div>
                <Typography variant="h3" weight="bold" className="text-red-600">
                  {ledgerTotals.expense.toLocaleString()} GTC
                </Typography>
              </div>

              <Separator className="my-4 opacity-50" />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Typography variant="body-sm" theme="muted">Transactions réussies</Typography>
                  <Typography variant="body-sm" weight="medium">
                    {transactions.filter(t => t.status === 'COMPLETED').length}
                  </Typography>
                </div>
                <div className="flex items-center justify-between">
                  <Typography variant="body-sm" theme="muted">Moyenne / Opération</Typography>
                  <Typography variant="body-sm" weight="medium">
                    {transactions.length > 0
                      ? (transactions.reduce((acc, t) => acc + parseFloat(t.amount), 0) / transactions.length).toFixed(1)
                      : 0} GTC
                  </Typography>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/40 backdrop-blur-xl border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Filtrage Temporel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Typography variant="body-sm" theme="muted" className="text-center py-4 italic">
                Options de filtrage avancées bientôt disponibles
              </Typography>
              <Button variant="secondary" className="w-full mt-2" disabled>
                Sélectionner une date
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
