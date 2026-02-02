"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { StatCard } from "@/components/admin/stat-card";
// import { AdvancedChart } from "@/components/ui/advanced-chart"; // Removed
import {
  UsersGrowthChart,
  RevenueChart,
  NewUsersChart,
  SalesCategoryChart,
  TopShopsChart,
  FinanceEvolutionChart,
  TournamentStatsChart,
} from "@/components/admin/admin-charts";
import { Skeleton } from "@/components/ui/skeleton";
import { getGlobalStats } from "@/actions/stats";
import {
  Users,
  ShoppingBag,
  Package,
  Trophy,
  CreditCard,
  TrendingUp,
  Activity,
  Wallet,
  Award,
  Gamepad2,
} from "lucide-react";
import { motion } from "framer-motion";

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await getGlobalStats();
      setStats(data);
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div>
        <Typography variant="h1" weight="bold" className="mb-2">
          Vue d'ensemble
        </Typography>
        <Typography variant="body-base" theme="muted">
          Tableau de bord administrateur - Statistiques globales
        </Typography>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="commerce">Commerce</TabsTrigger>
          <TabsTrigger value="finances">Finances</TabsTrigger>
          <TabsTrigger value="tournaments">Tournois</TabsTrigger>
        </TabsList>

        {/* Tab: Vue Générale */}
        <TabsContent value="general" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Utilisateurs"
              value={stats?.total_users || 0}
              icon={Users}
              description={`${stats?.active_users || 0} actifs`}
              trend={{
                value: 12,
                label: "ce mois",
              }}
            />
            <StatCard
              title="Boutiques"
              value={stats?.total_shops || 0}
              icon={ShoppingBag}
              description={`${stats?.active_shops || 0} actives`}
              trend={{
                value: 8,
                label: "ce mois",
              }}
            />
            <StatCard
              title="Produits"
              value={stats?.total_products || 0}
              icon={Package}
              description={`${stats?.sold_products || 0} vendus`}
              trend={{
                value: 15,
                label: "ce mois",
              }}
            />
            <StatCard
              title="Transactions"
              value={stats?.total_transactions || 0}
              icon={CreditCard}
              description={`${
                stats?.total_transaction_volume?.toFixed(0) || 0
              } GTC`}
              trend={{
                value: 23,
                label: "ce mois",
              }}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card/40 backdrop-blur-xl border-border/50">
              <CardHeader>
                <CardTitle>Croissance Utilisateurs</CardTitle>
              </CardHeader>
              <CardContent>
                <UsersGrowthChart
                  data={[
                    { name: "Jan", Utilisateurs: 120 },
                    { name: "Fév", Utilisateurs: 150 },
                    { name: "Mar", Utilisateurs: 180 },
                    { name: "Avr", Utilisateurs: 220 },
                    { name: "Mai", Utilisateurs: 280 },
                    { name: "Juin", Utilisateurs: 350 },
                  ]}
                  height={300}
                />
              </CardContent>
            </Card>

            <Card className="bg-card/40 backdrop-blur-xl border-border/50">
              <CardHeader>
                <CardTitle>Revenus Mensuels</CardTitle>
              </CardHeader>
              <CardContent>
                <RevenueChart
                  data={[
                    { name: "Jan", "Revenus (GTC)": 15000 },
                    { name: "Fév", "Revenus (GTC)": 18000 },
                    { name: "Mar", "Revenus (GTC)": 22000 },
                    { name: "Avr", "Revenus (GTC)": 25000 },
                    { name: "Mai", "Revenus (GTC)": 30000 },
                    { name: "Juin", "Revenus (GTC)": 35000 },
                  ]}
                  height={300}
                />
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="bg-card/40 backdrop-blur-xl p-3 border-border/50">
            <CardHeader>
              <CardTitle>Activités Récentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Activity className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <Typography variant="body-sm" weight="semibold">
                        Nouvelle inscription
                      </Typography>
                      <Typography variant="caption2" theme="muted">
                        Il y a {i + 1} minute{i > 0 ? "s" : ""}
                      </Typography>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Utilisateurs */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Utilisateurs"
              value={stats?.total_users || 0}
              icon={Users}
              description="Tous les comptes"
            />
            <StatCard
              title="Utilisateurs Actifs"
              value={stats?.active_users || 0}
              icon={Activity}
              description="Connectés récemment"
            />
            <StatCard
              title="Utilisateurs VIP"
              value={stats?.vip_users || 0}
              icon={Award}
              description="Abonnements actifs"
            />
            <StatCard
              title="Administrateurs"
              value={stats?.admin_users || 0}
              icon={Users}
              description="Équipe admin"
            />
          </div>

          <Card className="bg-card/40 backdrop-blur-xl border-border/50">
            <CardHeader>
              <CardTitle>Évolution Utilisateurs</CardTitle>
            </CardHeader>
            <CardContent>
              <NewUsersChart
                data={[
                  { name: "Jan", "Nouveaux utilisateurs": 30 },
                  { name: "Fév", "Nouveaux utilisateurs": 45 },
                  { name: "Mar", "Nouveaux utilisateurs": 60 },
                  { name: "Avr", "Nouveaux utilisateurs": 75 },
                  { name: "Mai", "Nouveaux utilisateurs": 90 },
                  { name: "Juin", "Nouveaux utilisateurs": 120 },
                ]}
                height={400}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Commerce */}
        <TabsContent value="commerce" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Boutiques"
              value={stats?.total_shops || 0}
              icon={ShoppingBag}
              description={`${stats?.active_shops || 0} actives`}
            />
            <StatCard
              title="Produits"
              value={stats?.total_products || 0}
              icon={Package}
              description={`${stats?.active_products || 0} en vente`}
            />
            <StatCard
              title="Commandes"
              value={stats?.total_orders || 0}
              icon={CreditCard}
              description="Total commandes"
            />
            <StatCard
              title="Produits Vendus"
              value={stats?.sold_products || 0}
              icon={TrendingUp}
              description="Ventes réalisées"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card/40 backdrop-blur-xl border-border/50">
              <CardHeader>
                <CardTitle>Ventes par Catégorie</CardTitle>
              </CardHeader>
              <CardContent>
                <SalesCategoryChart
                  data={[
                    { name: "Gaming", value: 45 },
                    { name: "eSports", value: 25 },
                    { name: "Digital", value: 20 },
                    { name: "Collection", value: 10 },
                  ]}
                  height={300}
                />
              </CardContent>
            </Card>

            <Card className="bg-card/40 backdrop-blur-xl border-border/50">
              <CardHeader>
                <CardTitle>Top Boutiques</CardTitle>
              </CardHeader>
              <CardContent>
                <TopShopsChart
                  data={[
                    { name: "GameZone", Ventes: 85 },
                    { name: "ProShop", Ventes: 72 },
                    { name: "EliteGaming", Ventes: 65 },
                    { name: "TopGames", Ventes: 58 },
                    { name: "MegaStore", Ventes: 45 },
                  ]}
                  height={300}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Finances */}
        <TabsContent value="finances" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Volume Total"
              value={`${stats?.total_transaction_volume?.toFixed(0) || 0} GTC`}
              icon={Wallet}
              description="Toutes transactions"
            />
            <StatCard
              title="Transactions"
              value={stats?.total_transactions || 0}
              icon={CreditCard}
              description="Total opérations"
            />
            <StatCard
              title="Solde Wallets"
              value={`${stats?.total_wallet_balance?.toFixed(0) || 0} GTC`}
              icon={Wallet}
              description="Solde total"
            />
            <StatCard
              title="Abonnements VIP"
              value={stats?.active_vip_subscriptions || 0}
              icon={Award}
              description="Actifs"
            />
          </div>

          <Card className="bg-card/40 backdrop-blur-xl border-border/50">
            <CardHeader>
              <CardTitle>Évolution Financière</CardTitle>
            </CardHeader>
            <CardContent>
              <FinanceEvolutionChart
                data={[
                  {
                    name: "Jan",
                    "Revenus (GTC)": 15000,
                    "Dépenses (GTC)": 8000,
                  },
                  {
                    name: "Fév",
                    "Revenus (GTC)": 18000,
                    "Dépenses (GTC)": 9500,
                  },
                  {
                    name: "Mar",
                    "Revenus (GTC)": 22000,
                    "Dépenses (GTC)": 11000,
                  },
                  {
                    name: "Avr",
                    "Revenus (GTC)": 25000,
                    "Dépenses (GTC)": 13000,
                  },
                  {
                    name: "Mai",
                    "Revenus (GTC)": 30000,
                    "Dépenses (GTC)": 15000,
                  },
                  {
                    name: "Juin",
                    "Revenus (GTC)": 35000,
                    "Dépenses (GTC)": 17000,
                  },
                ]}
                height={400}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Tournois */}
        <TabsContent value="tournaments" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Tournois"
              value={stats?.total_tournaments || 0}
              icon={Trophy}
              description="Total tournois"
            />
            <StatCard
              title="En Cours"
              value={stats?.active_tournaments || 0}
              icon={Activity}
              description="Tournois actifs"
            />
            <StatCard
              title="Équipes"
              value={stats?.total_teams || 0}
              icon={Users}
              description={`${stats?.active_teams || 0} actives`}
            />
            <StatCard
              title="Matchs"
              value={stats?.total_matches || 0}
              icon={Gamepad2}
              description="Total matchs"
            />
          </div>

          <Card className="bg-card/40 backdrop-blur-xl border-border/50">
            <CardHeader>
              <CardTitle>Statistiques Tournois</CardTitle>
            </CardHeader>
            <CardContent>
              <TournamentStatsChart
                data={[
                  {
                    name: "À venir",
                    Tournois: stats?.upcoming_tournaments || 0,
                  },
                  {
                    name: "En cours",
                    Tournois: stats?.active_tournaments || 0,
                  },
                  {
                    name: "Terminés",
                    Tournois: stats?.completed_tournaments || 0,
                  },
                  { name: "Annulés", Tournois: 5 },
                ]}
                height={400}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
