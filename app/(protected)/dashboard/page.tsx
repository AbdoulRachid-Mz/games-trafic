"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Typography } from "@/components/ui/typography";
import { StatsCard } from "@/components/pages/dashboard/stats-card";
import { QuickActions } from "@/components/pages/dashboard/quick-actions";
import { ActivityFeed } from "@/components/pages/dashboard/activity-feed";
import { useAuthContext } from "@/contexts/auth-context";
import { Store, ShoppingBag, Trophy, CreditCard } from "lucide-react";
import { getUserStats } from "@/actions/user-stats";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsCarousel } from "@/components/shared/stats-carousel";
import { useScreenSize } from "@/hooks/use-screen";

export default function DashboardPage() {
  const { user } = useAuthContext();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { isMobile } = useScreenSize();

  useEffect(() => {
    if (user?.id) {
      loadStats();
    }
  }, [user?.id]);

  const loadStats = async () => {
    try {
      if (!user?.id) return;
      const result = await getUserStats({
        userId: user.id,
        period: "month",
      });
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Typography variant="h1" weight="bold" className="mb-2">
          Tableau de Bord
        </Typography>
        <Typography variant="body-base" theme="muted">
          Bienvenue {user?.username}, voici un aperçu de votre activité
        </Typography>
      </motion.div>

      {/* Stats Section with Carousel */}
      <StatsCarousel mode={isMobile ? "carousel" : "auto"}>
        <StatsCard
          title="Boutiques"
          value={stats?.overview.total_shops ?? 0}
          icon={Store}
          change={12}
          changeLabel={`${stats?.shops.total_products ?? 0} produits`}
          trend="up"
          className="border-2 border-l-primary border-r-secondary"
          delay={0}
        />

        <StatsCard
          title="Produits"
          value={stats?.overview.total_products ?? 0}
          icon={ShoppingBag}
          change={8}
          changeLabel={`${stats?.products.sold ?? 0} vendus`}
          trend="up"
          className="border-2 border-l-primary border-r-secondary"
          delay={0.1}
        />

        <StatsCard
          title="Tournois"
          value={stats?.overview.total_tournaments ?? 0}
          icon={Trophy}
          change={-3}
          changeLabel={`${stats?.tournaments.total_participants ?? 0} participants`}
          trend="down"
          className="border-2 border-l-primary border-r-secondary"
          delay={0.2}
        />

        <StatsCard
          title="Solde"
          value={`${stats?.wallet.balance?.toFixed(2) ?? "0.00"} GTC`}
          icon={CreditCard}
          change={15}
          changeLabel={`${stats?.overview.total_transactions ?? 0} transactions`}
          trend="up"
          className="border-2 border-l-primary border-r-secondary"
          delay={0.3}
        />
      </StatsCarousel>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <QuickActions />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <ActivityFeed activities={stats?.recent_activity} />
      </motion.div>
    </div>
  );
}
