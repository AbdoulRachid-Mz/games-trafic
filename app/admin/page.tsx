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
  StatusDistributionChart,
  EntityGrowthChart,
  TypeDistributionBarChart,
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
  LayoutDashboard,
  MoreHorizontal,
  Handshake,
  Wrench,
  FileText,
  Video,
  Sword,
  ShoppingCart,
  BookOpen,
  AlertCircle,
  Bell,
  MessageCircle,
  Mail,
  FileQuestion,
  Store,
  Megaphone,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useScreenSize } from "@/hooks/use-screen";

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("general");
  const { screenSize } = useScreenSize();

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

  // Définir les tabs
  const allTabs = [
    { value: "general", label: "Général", icon: LayoutDashboard },
    { value: "users", label: "Utilisateurs", icon: Users },
    { value: "commerce", label: "Commerce", icon: ShoppingBag },
    { value: "finances", label: "Finances", icon: Wallet },
    { value: "tournaments", label: "Tournois", icon: Trophy },
    { value: "partners", label: "Partenaires", icon: Handshake },
    { value: "services", label: "Services", icon: Wrench },
    { value: "blogs", label: "Blogs", icon: FileText },
    { value: "products", label: "Produits", icon: Package },
    { value: "clips", label: "Clips", icon: Video },
    { value: "games", label: "Jeux", icon: Gamepad2 },
    { value: "game-items", label: "Items", icon: Sword },
    { value: "orders", label: "Commandes", icon: ShoppingCart },
    { value: "guides", label: "Guides", icon: BookOpen },
    { value: "claims", label: "Réclamations", icon: AlertCircle },
    { value: "notifications", label: "Notifications", icon: Bell },
    { value: "interactions", label: "Interactions", icon: MessageCircle },
    { value: "messages", label: "Messages", icon: Mail },
    { value: "requests", label: "Requêtes", icon: FileQuestion },
    { value: "shops", label: "Boutiques", icon: Store },
    { value: "announcements", label: "Annonces", icon: Megaphone },
  ];

  // Déterminer combien de tabs afficher
  const visibleCount =
    screenSize.width >= 1024 ? 8 : screenSize.width >= 768 ? 4 : 2;
  const visibleTabs = allTabs.slice(0, visibleCount);
  const dropdownTabs = allTabs.slice(visibleCount);

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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex items-center gap-2">
          <TabsList className="flex-1">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {dropdownTabs.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={dropdownTabs.some((t) => t.value === activeTab) ? "default" : "outline"}
                  size="icon"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {dropdownTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <DropdownMenuItem
                      key={tab.value}
                      onClick={() => setActiveTab(tab.value)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Tab: Partenaires */}
        <TabsContent value="partners" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Partenaires"
              value={stats?.total_partners || 0}
              icon={Handshake}
              description={`${stats?.active_partners || 0} actifs`}
            />
            <StatCard
              title="Vérifiés"
              value={stats?.verified_partners || 0}
              icon={Award}
              description="Partenaires certifiés"
            />
          </div>
          <Card className="bg-card/40 backdrop-blur-xl border-border/50">
            <CardHeader>
              <CardTitle>Distribution des Partenaires</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusDistributionChart
                data={[
                  { name: "Sponsor", value: 40 },
                  { name: "Media", value: 30 },
                  { name: "Tech", value: 20 },
                  { name: "Other", value: 10 },
                ]}
                config={{
                  sponsor: { label: "Sponsor", color: "hsl(var(--chart-1))" },
                  media: { label: "Media", color: "hsl(var(--chart-2))" },
                  tech: { label: "Tech", color: "hsl(var(--chart-3))" },
                  other: { label: "Other", color: "hsl(var(--chart-4))" },
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Services */}
        <TabsContent value="services" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Services"
              value={stats?.total_services || 0}
              icon={Wrench}
              description={`${stats?.active_services || 0} actifs`}
            />
          </div>
          <Card className="bg-card/40 backdrop-blur-xl border-border/50">
            <CardHeader>
              <CardTitle>Activité des Services</CardTitle>
            </CardHeader>
            <CardContent>
              <TypeDistributionBarChart
                data={[
                  { name: "Design", count: 24 },
                  { name: "Dev", count: 18 },
                  { name: "Coaching", count: 12 },
                  { name: "Marketing", count: 8 },
                ]}
                dataKey="count"
                label="Nombre de services"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Blogs */}
        <TabsContent value="blogs" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Articles"
              value={stats?.total_blogs || 0}
              icon={FileText}
              description={`${stats?.active_blogs || 0} publiés`}
            />
          </div>
          <Card className="bg-card/40 backdrop-blur-xl border-border/50">
            <CardHeader>
              <CardTitle>Vues des Articles</CardTitle>
            </CardHeader>
            <CardContent>
              <EntityGrowthChart
                data={[
                  { name: "Lun", vues: 1200 },
                  { name: "Mar", vues: 1500 },
                  { name: "Mer", vues: 1300 },
                  { name: "Jeu", vues: 1700 },
                  { name: "Ven", vues: 2200 },
                  { name: "Sam", vues: 2500 },
                  { name: "Dim", vues: 2100 },
                ]}
                dataKey="vues"
                label="Vues hebdomadaires"
                color="hsl(var(--chart-4))"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Produits */}
        <TabsContent value="products" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Produits"
              value={stats?.total_products || 0}
              icon={Package}
              description={`${stats?.active_products || 0} actifs`}
            />
            <StatCard
              title="Vendus"
              value={stats?.sold_products || 0}
              icon={TrendingUp}
              description="Total vendus"
            />
          </div>
          <Card className="bg-card/40 backdrop-blur-xl border-border/50">
            <CardHeader>
              <CardTitle>Inventaire par Catégorie</CardTitle>
            </CardHeader>
            <CardContent>
              <SalesCategoryChart
                data={[
                  { name: "Comptes", value: 150 },
                  { name: "Items", value: 300 },
                  { name: "Services", value: 80 },
                  { name: "Coaching", value: 40 },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Clips */}
        <TabsContent value="clips" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Clips"
              value={stats?.total_game_clips || 0}
              icon={Video}
              description="Clips partagés"
            />
            <StatCard
              title="Vues"
              value={stats?.total_clip_views || 0}
              icon={TrendingUp}
              description="Vues totales"
            />
            <StatCard
              title="Likes"
              value={stats?.total_clip_likes || 0}
              icon={Award}
              description="Interactions"
            />
          </div>
          <Card className="bg-card/40 backdrop-blur-xl border-border/50">
            <CardHeader>
              <CardTitle>Popularité des Clips</CardTitle>
            </CardHeader>
            <CardContent>
              <EntityGrowthChart
                data={[
                  { name: "Jan", clips: 50 },
                  { name: "Fév", clips: 80 },
                  { name: "Mar", clips: 120 },
                  { name: "Avr", clips: 150 },
                  { name: "Mai", clips: 200 },
                  { name: "Juin", clips: 250 },
                ]}
                dataKey="clips"
                label="Croissance clips"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Jeux */}
        <TabsContent value="games" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Jeux"
              value={stats?.total_games || 0}
              icon={Gamepad2}
              description="Jeux supportés"
            />
          </div>
          <Card className="bg-card/40 backdrop-blur-xl border-border/50">
            <CardHeader>
              <CardTitle>Joueurs par Jeu</CardTitle>
            </CardHeader>
            <CardContent>
              <TypeDistributionBarChart
                data={[
                  { name: "FIFA", count: 850 },
                  { name: "COD", count: 620 },
                  { name: "LoL", count: 450 },
                  { name: "Valorant", count: 380 },
                  { name: "Rocket", count: 210 },
                ]}
                dataKey="count"
                label="Joueurs actifs"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Items */}
        <TabsContent value="game-items" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Items"
              value={stats?.total_game_items || 0}
              icon={Sword}
              description="Items de jeu"
            />
            <StatCard
              title="Requêtes"
              value={stats?.total_game_item_requests || 0}
              icon={Activity}
              description="Demandes d'items"
            />
          </div>
          <Card className="bg-card/40 backdrop-blur-xl border-border/50">
            <CardHeader>
              <CardTitle>Items par Rareté</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusDistributionChart
                data={[
                  { name: "Common", value: 500 },
                  { name: "Rare", value: 200 },
                  { name: "Epic", value: 50 },
                  { name: "Legendary", value: 10 },
                ]}
                config={{
                  common: { label: "Commun", color: "hsl(var(--chart-1))" },
                  rare: { label: "Rare", color: "hsl(var(--chart-2))" },
                  epic: { label: "Épique", color: "hsl(var(--chart-3))" },
                  legendary: { label: "Légendaire", color: "hsl(var(--chart-4))" },
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Commandes */}
        <TabsContent value="orders" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Commandes"
              value={stats?.total_orders || 0}
              icon={ShoppingCart}
              description="Total historique"
            />
          </div>
          <Card className="bg-card/40 backdrop-blur-xl border-border/50">
            <CardHeader>
              <CardTitle>Volume des Commandes</CardTitle>
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
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Guides */}
        <TabsContent value="guides" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Guides"
              value={stats?.total_guides || 0}
              icon={BookOpen}
              description={`${stats?.active_guides || 0} actifs`}
            />
          </div>
          <Card className="bg-card/40 backdrop-blur-xl border-border/50">
            <CardHeader>
              <CardTitle>Vues des Guides</CardTitle>
            </CardHeader>
            <CardContent>
              <TypeDistributionBarChart
                data={[
                  { name: "Débutant", count: 450 },
                  { name: "Avancé", count: 280 },
                  { name: "Expert", count: 120 },
                  { name: "Commerce", count: 310 },
                ]}
                dataKey="count"
                label="Vues"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Réclamations */}
        <TabsContent value="claims" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Réclamations"
              value={stats?.total_claims || 0}
              icon={AlertCircle}
              description={`${stats?.pending_claims || 0} en attente`}
            />
          </div>
          <Card className="bg-card/40 backdrop-blur-xl border-border/50">
            <CardHeader>
              <CardTitle>Statut des Litiges</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusDistributionChart
                data={[
                  { name: "Pending", value: 15 },
                  { name: "Resolved", value: 45 },
                  { name: "Rejected", value: 10 },
                ]}
                config={{
                  pending: { label: "En attente", color: "hsl(var(--chart-1))" },
                  resolved: { label: "Résolu", color: "hsl(var(--chart-2))" },
                  rejected: { label: "Rejeté", color: "hsl(var(--chart-3))" },
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Envoyées"
              value={stats?.total_notifications || 0}
              icon={Bell}
              description="Notifications système"
            />
          </div>
          <Card className="bg-card/40 backdrop-blur-xl border-border/50">
            <CardHeader>
              <CardTitle>Types de Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusDistributionChart
                data={[
                  { name: "System", value: 60 },
                  { name: "Order", value: 25 },
                  { name: "Alert", value: 15 },
                ]}
                config={{
                  system: { label: "Système", color: "hsl(var(--chart-1))" },
                  order: { label: "Commande", color: "hsl(var(--chart-2))" },
                  alert: { label: "Alerte", color: "hsl(var(--chart-3))" },
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Interactions */}
        <TabsContent value="interactions" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Interactions"
              value={stats?.total_interactions || 0}
              icon={MessageCircle}
              description="Total engagements"
            />
            <StatCard
              title="Likes"
              value={stats?.total_likes || 0}
              icon={Award}
              description="Total likes"
            />
          </div>
          <Card className="bg-card/40 backdrop-blur-xl border-border/50">
            <CardHeader>
              <CardTitle>Distribution des Engagements</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusDistributionChart
                data={[
                  { name: "Likes", value: 65 },
                  { name: "Follows", value: 20 },
                  { name: "Bookmarks", value: 15 },
                ]}
                config={{
                  likes: { label: "Likes", color: "hsl(var(--chart-1))" },
                  follows: { label: "Follows", color: "hsl(var(--chart-2))" },
                  bookmarks: { label: "Favoris", color: "hsl(var(--chart-3))" },
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Messages */}
        <TabsContent value="messages" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Messages"
              value={stats?.total_messages || 0}
              icon={Mail}
              description="Total envoyés"
            />
          </div>
          <Card className="bg-card/40 backdrop-blur-xl border-border/50">
            <CardHeader>
              <CardTitle>Activité Messagerie</CardTitle>
            </CardHeader>
            <CardContent>
              <EntityGrowthChart
                data={[
                  { name: "Jan", messages: 1200 },
                  { name: "Fév", messages: 1800 },
                  { name: "Mar", messages: 2100 },
                  { name: "Avr", messages: 2500 },
                  { name: "Mai", messages: 3200 },
                  { name: "Juin", messages: 4500 },
                ]}
                dataKey="messages"
                label="Total messages"
                color="hsl(var(--chart-2))"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Requêtes */}
        <TabsContent value="requests" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Requêtes"
              value={stats?.total_game_item_requests || 0}
              icon={FileQuestion}
              description="Demandes reçues"
            />
          </div>
          <Card className="bg-card/40 backdrop-blur-xl border-border/50">
            <CardHeader>
              <CardTitle>Statut des Requêtes</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusDistributionChart
                data={[
                  { name: "Pending", value: 30 },
                  { name: "Processed", value: 60 },
                  { name: "Denied", value: 10 },
                ]}
                config={{
                  pending: { label: "En attente", color: "hsl(var(--chart-1))" },
                  processed: { label: "Traitée", color: "hsl(var(--chart-2))" },
                  denied: { label: "Refusée", color: "hsl(var(--chart-3))" },
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Boutiques */}
        <TabsContent value="shops" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Boutiques"
              value={stats?.total_shops || 0}
              icon={Store}
              description={`${stats?.active_shops || 0} actives`}
            />
            <StatCard
              title="Vérifiées"
              value={stats?.verified_shops || 0}
              icon={Award}
              description="Boutiques certifiées"
            />
          </div>
          <Card className="bg-card/40 backdrop-blur-xl border-border/50">
            <CardHeader>
              <CardTitle>Croissance des Boutiques</CardTitle>
            </CardHeader>
            <CardContent>
              <EntityGrowthChart
                data={[
                  { name: "Jan", shops: 12 },
                  { name: "Fév", shops: 18 },
                  { name: "Mar", shops: 25 },
                  { name: "Avr", shops: 32 },
                  { name: "Mai", shops: 45 },
                  { name: "Juin", shops: 58 },
                ]}
                dataKey="shops"
                label="Nouvelles boutiques"
                color="hsl(var(--chart-5))"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Annonces */}
        <TabsContent value="announcements" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Annonces"
              value={stats?.total_announcements || 0}
              icon={Megaphone}
              description={`${stats?.active_announcements || 0} actives`}
            />
            <StatCard
              title="Épinglées"
              value={stats?.pinned_announcements || 0}
              icon={Activity}
              description="Messages importants"
            />
          </div>
          <Card className="bg-card/40 backdrop-blur-xl border-border/50">
            <CardHeader>
              <CardTitle>Visibilité des Annonces</CardTitle>
            </CardHeader>
            <CardContent>
              <TypeDistributionBarChart
                data={[
                  { name: "News", count: 15 },
                  { name: "Update", count: 24 },
                  { name: "Alert", count: 8 },
                  { name: "Maintenance", count: 3 },
                ]}
                dataKey="count"
                label="Nombre d'annonces"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
