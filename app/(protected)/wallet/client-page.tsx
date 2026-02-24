"use client";

import React, { useState, useEffect } from "react";
import { useAuthContext } from "@/contexts/auth-context";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowDownLeft,
  History,
  TrendingUp,
  CreditCard,
  QrCode,
  RefreshCw,
  Plus,
  Filter,
  Download,
  Lock,
  Eye,
  EyeOff,
  Shield,
  Bell,
} from "lucide-react";
import { AdvancedUserCard } from "@/components/pages/wallet/advanced-user-card";
import { TransactionList } from "@/components/pages/wallet/transaction-list";
import { QuickActions } from "@/components/pages/wallet/quick-actions";
import { StatsOverview } from "@/components/pages/wallet/stats-overview";
import { getWalletTransactions, getWalletLedgerStats } from "@/actions/wallets";
import { type WalletTransaction } from "@/database/schema";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useUserProfile } from "@/hooks/use-profile";

export default function ClientWalletPage() {
  const { user, refreshUser } = useAuthContext();
  const { data: completeData } = useUserProfile();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [showBalance, setShowBalance] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalAmount: 0,
    income: 0,
    expense: 0,
    monthlyChange: 0,
    pendingTransactions: 0,
  });

  const wallet = completeData?.wallet;

  // Charger les données initiales
  useEffect(() => {
    if (wallet?.id) {
      loadWalletData();
    }
  }, [wallet?.id]);

  const loadWalletData = async () => {
    try {
      if (!wallet?.id) return;

      // Charger les transactions via actions
      const transactionsData = await getWalletTransactions({
        filters: { walletId: wallet.id },
        pagination: { page: 1, limit: 10 },
        options: { sortBy: "createdAt", sortOrder: "desc" },
      });

      setTransactions(transactionsData.data || []);

      // Charger les statistiques via ledger
      const statsData = await getWalletLedgerStats({ walletId: wallet.id });
      setStats({
        totalTransactions: statsData.total,
        totalAmount: statsData.income,
        income: statsData.income,
        expense: statsData.expense,
        monthlyChange: 0,
        pendingTransactions: statsData.pending,
      });
    } catch (error) {
      console.error("Error loading wallet data:", error);
      toast.error("Erreur lors du chargement des données");
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refreshUser(), loadWalletData()]);
      toast.success("Données actualisées");
    } catch (error) {
      toast.error("Erreur lors de l'actualisation");
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!wallet) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec actions */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <Typography variant="h1" weight="bold" animated>
            Mon Portefeuille
          </Typography>
          <Typography variant="body-base" theme="muted" className="mt-1">
            Gérez vos finances en toute sécurité
          </Typography>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBalance(!showBalance)}
            className="gap-2"
          >
            {showBalance ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            {showBalance ? "Masquer" : "Afficher"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Actualiser
          </Button>
        </div>
      </motion.div>

      {/* Carte wallet principale */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <AdvancedUserCard
          wallet={wallet}
          user={user!}
          showBalance={showBalance}
          onRefresh={handleRefresh}
        />
      </motion.div>

      {/* Actions rapides */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <QuickActions walletId={wallet.id} />
      </motion.div>

      {/* Statistiques */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <StatsOverview stats={stats} walletId={wallet.id} />
      </motion.div>

      {/* Revenus / Dépenses */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-card/40 backdrop-blur-xl border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <ArrowDownLeft className="h-5 w-5 text-green-600" />
                  </div>
                  <Typography variant="h4" weight="semibold">
                    Revenus
                  </Typography>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Typography variant="h2" weight="bold" className="text-green-600">
                  {stats.income.toFixed(2)} GTC
                </Typography>
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                  Total
                </Badge>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/40 backdrop-blur-xl border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <ArrowUpRight className="h-5 w-5 text-red-600" />
                  </div>
                  <Typography variant="h4" weight="semibold">
                    Dépenses
                  </Typography>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Typography variant="h2" weight="bold" className="text-red-600">
                  {stats.expense.toFixed(2)} GTC
                </Typography>
                <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
                  Total
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Onglets principaux - Simplifié pour ne garder que l'aperçu global */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-card/40 backdrop-blur-xl border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <History className="h-5 w-5 text-primary" />
                  </div>
                  <Typography variant="h4" weight="semibold">
                    Activité Récente
                  </Typography>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/wallet/transactions")}
                  className="gap-2"
                >
                  Voir tout
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </div>
              <TransactionList
                transactions={transactions.slice(0, 5)}
                walletId={wallet.id}
                compact
              />
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="bg-card/40 backdrop-blur-xl border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  </div>
                  <Typography variant="h4" weight="semibold">
                    Analyse des Flux
                  </Typography>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                    <Typography variant="body-sm" theme="muted">Revenus ce mois</Typography>
                    <Typography variant="body-base" weight="bold" className="text-green-500">
                      +{stats.totalAmount.toLocaleString()} GTC
                    </Typography>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                    <Typography variant="body-sm" theme="muted">Transactions en attente</Typography>
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                      {stats.pendingTransactions}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full gap-2 mt-2"
                    onClick={() => router.push("/wallet/transactions/history")}
                  >
                    <History className="h-4 w-4" />
                    Historique complet
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/40 backdrop-blur-xl border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Shield className="h-5 w-5 text-blue-500" />
                  </div>
                  <Typography variant="h4" weight="semibold">
                    Sécurité & Accès
                  </Typography>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="secondary"
                    className="justify-start gap-3"
                    onClick={() => router.push("/wallet/settings")}
                  >
                    <Lock className="h-4 w-4" />
                    Paramètres de sécurité
                  </Button>
                  <Button
                    variant="secondary"
                    className="justify-start gap-3"
                    onClick={() => router.push("/wallet/claims")}
                  >
                    <Bell className="h-4 w-4" />
                    Réclamations
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
