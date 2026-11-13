// app/(main)/shops/[shopId]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Package,
  ShoppingBag,
  Users,
  DollarSign,
  Eye,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  BarChart3,
  PieChart,
  Download,
  Filter,
  MoreVertical,
  TrendingDown,
} from "lucide-react";
import { StatsCarousel } from "@/components/shared/stats-carousel";
import { StatCard } from "@/components/admin/stat-card";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getShopStatsById, getShopLedgerStats } from "@/actions/shops";
import { getShopOrderStats } from "@/actions/orders";
import { getProductStats } from "@/actions/products";
import { AdvancedChart } from "@/components/ui/advanced-chart";
import { ShopExportButton } from "@/components/pages/shops/shop-export-button";
import { useAuthContext } from "@/contexts/auth-context";
import { Input } from "@/components/ui/input";
import { transferBetweenIdentities } from "@/actions/wallets";
import { toast } from "sonner";

// Données pour les charts
const salesData = [
  { month: "Jan", ventes: 4000, commandes: 24, visiteurs: 2400 },
  { month: "Fév", ventes: 3000, commandes: 19, visiteurs: 2210 },
  { month: "Mar", ventes: 5000, commandes: 28, visiteurs: 2290 },
  { month: "Avr", ventes: 2780, commandes: 15, visiteurs: 2000 },
  { month: "Mai", ventes: 3890, commandes: 22, visiteurs: 2181 },
  { month: "Juin", ventes: 4390, commandes: 26, visiteurs: 2500 },
  { month: "Juil", ventes: 3490, commandes: 21, visiteurs: 2100 },
];

const categoryData = [
  { name: "Comptes", value: 35, color: "#8884d8" },
  { name: "Items", value: 25, color: "#82ca9d" },
  { name: "Skins", value: 20, color: "#ffc658" },
  { name: "Services", value: 15, color: "#ff8042" },
  { name: "Autres", value: 5, color: "#0088FE" },
];

const revenueData = [
  { day: "Lun", revenu: 400, objectif: 500 },
  { day: "Mar", revenu: 600, objectif: 500 },
  { day: "Mer", revenu: 300, objectif: 500 },
  { day: "Jeu", revenu: 800, objectif: 500 },
  { day: "Ven", revenu: 700, objectif: 500 },
  { day: "Sam", revenu: 900, objectif: 500 },
  { day: "Dim", revenu: 600, objectif: 500 },
];

export default function ShopOverviewPage() {
  const params = useParams();
  const { user } = useAuthContext();
  const [timeRange, setTimeRange] = useState("7j");
  const [loading, setLoading] = useState(true);
  const [transferAmount, setTransferAmount] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [stats, setStats] = useState({
    revenue: { current: 0, change: 0 },
    expenses: { current: 0, change: 0 },
    orders: { current: 0, change: 0 },
    products: { current: 0, change: 0 },
    visitors: { current: 0, change: 0 },
  });
  const [shopBalance, setShopBalance] = useState(0);

  useEffect(() => {
    loadStats();
  }, [timeRange]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const days = timeRange === "24h" ? 1 : timeRange === "7j" ? 7 : timeRange === "30j" ? 30 : 90;
      const currentStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      const previousStart = new Date(now.getTime() - days * 2 * 24 * 60 * 60 * 1000);
      const previousEnd = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

      const [shopStats, orderStats, productStats, ledgerStats, previousLedgerStats] = await Promise.all([
        getShopStatsById(params.shopId as string),
        getShopOrderStats(params.shopId as string),
        getProductStats({ shopId: params.shopId as string }),
        getShopLedgerStats(params.shopId as string, {
          startDate: currentStart.toISOString(),
          endDate: now.toISOString(),
        }),
        getShopLedgerStats(params.shopId as string, {
          startDate: previousStart.toISOString(),
          endDate: previousEnd.toISOString(),
        }),
      ]);

// ... (omitted similar replacements found by tool)
// I will use AllowMultiple: true to catch all params.id in this file
// Actually, I should check if there are other params.id that are valid.
// In [shopId]/dashboard/page.tsx, params.shopId is the correct name.


      const revenueChange = previousLedgerStats.income
        ? ((ledgerStats.income - previousLedgerStats.income) / previousLedgerStats.income) * 100
        : ledgerStats.income > 0
          ? 100
          : 0;
      const expenseChange = previousLedgerStats.expense
        ? ((ledgerStats.expense - previousLedgerStats.expense) / previousLedgerStats.expense) * 100
        : ledgerStats.expense > 0
          ? 100
          : 0;

      setStats({
        revenue: { current: ledgerStats?.income || 0, change: Number(revenueChange.toFixed(1)) },
        expenses: { current: ledgerStats?.expense || 0, change: Number(expenseChange.toFixed(1)) },
        orders: { current: orderStats?.total || 0, change: 0 },
        products: { current: productStats?.total || 0, change: 0 },
        visitors: { current: 0, change: 0 },
      });
      setShopBalance(parseFloat(shopStats?.balance || "0"));
    } catch (error) {
      console.error("Erreur chargement stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <OverviewSkeleton />;
  }

  const handleTransfer = async () => {
    if (!user?.id) return;
    const amount = parseFloat(transferAmount || "0");
    if (!amount || amount <= 0) {
      toast.error("Montant invalide");
      return;
    }
    if (amount > shopBalance) {
      toast.error("Solde insuffisant");
      return;
    }
    setIsTransferring(true);
    try {
      const res = await transferBetweenIdentities({
        fromIdentityId: params.shopId as string,
        fromType: "SHOP",
        toIdentityId: user.id,
        toType: "USER",
        amount,
        description: "Virement des revenus boutique vers wallet",
      });
      if (!res.success) {
        toast.error(res.error || "Erreur lors du virement");
        return;
      }
      toast.success("Virement effectué vers votre wallet");
      setTransferAmount("");
      loadStats();
    } catch {
      toast.error("Erreur lors du virement");
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Typography variant="h2" weight="bold" className="mb-1">
            Tableau de bord
          </Typography>
          <Typography variant="body-base" theme="muted">
            Performance et statistiques de votre boutique
          </Typography>
        </div>

        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24 dernières heures</SelectItem>
              <SelectItem value="7j">7 derniers jours</SelectItem>
              <SelectItem value="30j">30 derniers jours</SelectItem>
              <SelectItem value="90j">90 derniers jours</SelectItem>
            </SelectContent>
          </Select>

          <ShopExportButton shopId={params.shopId as string} />

          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filtres
          </Button>
        </div>
      </div>

      {/* Stats principales */}
      <StatsCarousel mode="auto">
        <StatCard
          title="Revenus totaux"
          value={`${stats.revenue.current} GTC`}
          trend={{ value: stats.revenue.change, label: "vs période précédente" }}
          icon={DollarSign}
          iconClassName="bg-green-500/10 text-green-500"
        />
        <StatCard
          title="Dépenses totales"
          value={`${stats.expenses.current} GTC`}
          trend={{ value: stats.expenses.change, label: "vs période précédente" }}
          icon={TrendingDown}
          iconClassName="bg-red-500/10 text-red-500"
        />
        <StatCard
          title="Commandes"
          value={stats.orders.current}
          trend={{ value: stats.orders.change, label: "vs période précédente" }}
          icon={ShoppingBag}
          iconClassName="bg-blue-500/10 text-blue-500"
        />
        <StatCard
          title="Produits actifs"
          value={stats.products.current}
          trend={{ value: stats.products.change, label: "vs période précédente" }}
          icon={Package}
          iconClassName="bg-purple-500/10 text-purple-500"
        />
        <StatCard
          title="Visiteurs"
          value={stats.visitors.current}
          trend={{ value: stats.visitors.change, label: "vs période précédente" }}
          icon={Users}
          iconClassName="bg-amber-500/10 text-amber-500"
        />
      </StatsCarousel>

      <Card className="bg-card/40 backdrop-blur-xl border-border/50">
        <CardHeader>
          <CardTitle>Virement vers votre wallet</CardTitle>
          <CardDescription>
            Disponible: {shopBalance.toFixed(2)} GTC
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-3">
          <Input
            value={transferAmount}
            onChange={(e) => setTransferAmount(e.target.value)}
            placeholder="Montant en GTC"
            type="number"
            min="0"
            className="max-w-sm"
          />
          <Button
            onClick={handleTransfer}
            disabled={isTransferring || !transferAmount}
            className="gap-2"
          >
            {isTransferring ? "Traitement..." : "Virement vers mon wallet"}
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Onglets de performance */}
      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="sales" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Ventes
          </TabsTrigger>
          <TabsTrigger value="revenue" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Revenus
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <PieChart className="h-4 w-4" />
            Catégories
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-2">
            <Star className="h-4 w-4" />
            Performance
          </TabsTrigger>
        </TabsList>

        {/* Chart des ventes */}
        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Ventes mensuelles</CardTitle>
                  <CardDescription>
                    Performance des ventes sur la période
                  </CardDescription>
                </div>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <AdvancedChart
                data={salesData.map((d) => ({
                  name: d.month,
                  ventes: d.ventes,
                  commandes: d.commandes,
                }))}
                kind="bar"
                series={[
                  {
                    key: (r: any) => r["ventes"],
                    label: "Ventes (GTC)",
                    color: "hsl(var(--primary))",
                  },
                  {
                    key: (r: any) => r["commandes"],
                    label: "Commandes",
                    color: "hsl(var(--secondary))",
                  },
                ]}
                showLegend
                showTooltip
                height={350}
                title="Ventes mensuelles"
                description="Performance des ventes sur la période"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chart des revenus */}
        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Revenus hebdomadaires</CardTitle>
                  <CardDescription>
                    Suivi des revenus vs objectifs
                  </CardDescription>
                </div>
                <Badge variant="outline" className="gap-1">
                  <ArrowUpRight className="h-3 w-3" />
                  +12% vs semaine dernière
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <AdvancedChart
                data={revenueData.map((d) => ({
                  name: d.day,
                  revenu: d.revenu,
                  objectif: d.objectif,
                }))}
                kind="area"
                series={[
                  {
                    key: (r: any) => r["revenu"],
                    label: "Revenus réels",
                    color: "hsl(var(--primary))",
                  },
                  {
                    key: (r: any) => r["objectif"],
                    label: "Objectif",
                    color: "hsl(var(--secondary))",
                  },
                ]}
                showLegend
                showTooltip
                height={350}
                title="Revenus hebdomadaires"
                description="Suivi des revenus vs objectifs"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chart des catégories */}
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Répartition par catégorie</CardTitle>
                  <CardDescription>
                    Distribution des ventes par type de produit
                  </CardDescription>
                </div>
                <Badge variant="outline">Total: 100%</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="h-[350px]">
                  <AdvancedChart
                    data={categoryData}
                    kind="pie"
                    series={categoryData.map((c, i) => ({
                      key: (r: any) => r["value"],
                      label: i === 0 ? "value" : `value${i}`,
                      color: c.color,
                    }))}
                    showLegend={false}
                    showTooltip
                    height={350}
                    title="Répartition par catégorie"
                    description="Distribution des ventes par type de produit"
                  />
                </div>

                <div className="space-y-4">
                  <Typography variant="h4" weight="semibold" className="mb-4">
                    Détails par catégorie
                  </Typography>
                  {categoryData.map((category) => (
                    <div
                      key={category.name}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <Typography variant="body-sm" weight="medium">
                          {category.name}
                        </Typography>
                      </div>
                      <div className="text-right">
                        <Typography variant="body-sm" weight="bold">
                          {category.value}%
                        </Typography>
                        <Typography variant="caption2" theme="muted">
                          {Math.round(
                            (category.value / 100) * stats.revenue.current,
                          )}{" "}
                          GTC
                        </Typography>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chart de performance */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Performance des produits</CardTitle>
                  <CardDescription>
                    Top produits et taux de conversion
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  Voir le détail
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <AdvancedChart
                data={salesData.map((d) => ({
                  name: d.month,
                  visiteurs: d.visiteurs,
                  commandes: d.commandes,
                }))}
                kind="line"
                series={[
                  {
                    key: (r: any) => r["visiteurs"],
                    label: "Visiteurs",
                    color: "hsl(var(--primary))",
                  },
                  {
                    key: (r: any) => r["commandes"],
                    label: "Commandes",
                    color: "hsl(var(--secondary))",
                  },
                ]}
                showLegend
                showTooltip
                height={350}
                title="Performance des produits"
                description="Top produits et taux de conversion"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Insights et recommandations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Insights rapides */}
        <Card>
          <CardHeader>
            <CardTitle>Insights rapides</CardTitle>
            <CardDescription>
              Recommandations basées sur vos performances
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                title: "Boostez vos ventes",
                description:
                  "Ajoutez 3 nouveaux produits cette semaine pour augmenter vos revenus de 15%",
                icon: TrendingUp,
                color: "text-green-500",
              },
              {
                title: "Engagement clients",
                description:
                  "Répondez aux avis non lus dans les 24h pour améliorer votre note",
                icon: Star,
                color: "text-amber-500",
              },
              {
                title: "Optimisation SEO",
                description:
                  "Ajoutez des descriptions détaillées à 5 de vos meilleurs produits",
                icon: Eye,
                color: "text-blue-500",
              },
            ].map((insight, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/30"
              >
                <div
                  className={`p-2 rounded-lg ${insight.color} bg-opacity-10`}
                >
                  <insight.icon className={`h-5 w-5 ${insight.color}`} />
                </div>
                <div className="flex-1">
                  <Typography
                    variant="body-sm"
                    weight="semibold"
                    className="mb-1"
                  >
                    {insight.title}
                  </Typography>
                  <Typography variant="caption2" theme="muted">
                    {insight.description}
                  </Typography>
                </div>
                <Button size="sm" variant="ghost">
                  Appliquer
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Activité récente */}
        <Card>
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
            <CardDescription>
              Dernières actions dans votre boutique
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  action: "Nouvelle commande",
                  details: "Commande #ORD-482",
                  time: "Il y a 2 minutes",
                  color: "bg-green-500",
                },
                {
                  action: "Produit ajouté",
                  details: "Compte Fortnite Level 200",
                  time: "Il y a 15 minutes",
                  color: "bg-blue-500",
                },
                {
                  action: "Avis reçu",
                  details: "⭐️⭐️⭐️⭐️⭐️ - Excellent service",
                  time: "Il y a 1 heure",
                  color: "bg-amber-500",
                },
                {
                  action: "Paramètres mis à jour",
                  details: "Informations de paiement",
                  time: "Il y a 3 heures",
                  color: "bg-purple-500",
                },
              ].map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className={`w-2 h-2 rounded-full ${activity.color}`} />
                  <div className="flex-1">
                    <Typography variant="body-sm" weight="medium">
                      {activity.action}
                    </Typography>
                    <Typography variant="caption2" theme="muted">
                      {activity.details}
                    </Typography>
                  </div>
                  <Typography variant="caption2" theme="muted">
                    {activity.time}
                  </Typography>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              Voir toute l'activité
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-40" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>

      <Skeleton className="h-[400px] rounded-xl" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}
