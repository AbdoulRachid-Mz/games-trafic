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
import { getWalletTransactions, getTransactionStats } from "@/actions/wallets";
import { type WalletTransaction } from "@/database/schema";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useUserProfile } from "@/hooks/use-profile";

export default function WalletPage() {
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

      // Charger les statistiques via actions
      const statsData = await getTransactionStats({ walletId: wallet.id });
      setStats({
        totalTransactions: statsData.total || 0,
        totalAmount: parseFloat(statsData.totalAmount?.toString() || "0"),
        monthlyChange: 0, // TODO: Calculate monthly change
        pendingTransactions: statsData.pending || 0,
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
          user={user}
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

      {/* Onglets principaux */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid grid-cols-4 gap-2">
          <TabsTrigger value="overview" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Aperçu
          </TabsTrigger>
          <TabsTrigger value="transactions" className="gap-2">
            <History className="h-4 w-4" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="cards" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Cartes
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Sécurité
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <Typography variant="h4" weight="semibold">
                  Activité Récente
                </Typography>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab("transactions")}
                >
                  Voir tout
                </Button>
              </div>
              <TransactionList
                transactions={transactions.slice(0, 5)}
                walletId={wallet.id}
                compact
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <Typography variant="h4" weight="semibold" className="mb-4">
                  Revenus Mensuels
                </Typography>
                <div className="space-y-2">
                  <Typography variant="h3" weight="bold" gradient>
                    +{stats.totalAmount.toLocaleString()} GTC
                  </Typography>
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                    <Typography variant="body-sm" theme="success">
                      {stats.monthlyChange > 0 ? "+" : ""}
                      {stats.monthlyChange}% ce mois-ci
                    </Typography>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <Typography variant="h4" weight="semibold" className="mb-4">
                  En Attente
                </Typography>
                <div className="space-y-2">
                  <Typography variant="h3" weight="bold">
                    {stats.pendingTransactions}
                  </Typography>
                  <Typography variant="body-sm" theme="muted">
                    Transactions en attente de traitement
                  </Typography>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions">
          <TransactionList
            transactions={transactions}
            walletId={wallet.id}
            showFilters
          />
        </TabsContent>

        <TabsContent value="cards">
          <Card>
            <CardContent className="p-6">
              <Typography variant="h4" weight="semibold" className="mb-6">
                Cartes Associées
              </Typography>
              <div className="text-center py-12">
                <CreditCard className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <Typography variant="body-lg" theme="muted" className="mb-4">
                  Aucune carte associée
                </Typography>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Ajouter une Carte
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardContent className="p-6 space-y-6">
              <Typography variant="h4" weight="semibold">
                Paramètres de Sécurité
              </Typography>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-green-500" />
                    <div>
                      <Typography variant="body-sm" weight="medium">
                        Authentification à 2 facteurs
                      </Typography>
                      <Typography variant="caption2" theme="muted">
                        Protection supplémentaire pour votre compte
                      </Typography>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Activer
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-blue-500" />
                    <div>
                      <Typography variant="body-sm" weight="medium">
                        Notifications de sécurité
                      </Typography>
                      <Typography variant="caption2" theme="muted">
                        Soyez alerté des activités suspectes
                      </Typography>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700"
                  >
                    Activé
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Lock className="h-5 w-5 text-orange-500" />
                    <div>
                      <Typography variant="body-sm" weight="medium">
                        Verrouillage automatique
                      </Typography>
                      <Typography variant="caption2" theme="muted">
                        Verrouille après 15 minutes d'inactivité
                      </Typography>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Configurer
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button variant="destructive" size="sm">
                  Déconnecter tous les appareils
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
