"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { EntityList } from "@/components/shared/entity-list";
import { useEntityList } from "@/hooks/use-entity-list";
import { useScreenSize } from "@/hooks/use-screen";
import { getVipSubscriptions } from "@/actions/vip";
import { type VipSubscription } from "@/database/schema";
import {
  Star,
  Calendar,
  ShieldCheck,
  Zap,
  MoreHorizontal,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function SubscriptionsDashboardPage() {
  const { isSmallScreen, isMediumScreen } = useScreenSize();

  const {
    data,
    total,
    loading,
    error,
    page,
    limit,
    searchTerm,
    filters,
    setPage,
    setLimit,
    setSearchTerm,
    setFilters,
    viewMode,
    setViewMode,
    onRefresh,
  } = useEntityList<VipSubscription>({
    entityType: "subscriptions",
    defaultLimit: isSmallScreen ? 10 : isMediumScreen ? 15 : 20,
    fetchFunction: async (params) => {
      const res = await getVipSubscriptions({
        pagination: { page: params.page, limit: params.limit },
        filters: params,
      });
      return {
        success: true,
        data: res.data,
        pagination: res.pagination,
      };
    },
  });

  const renderSubscriptionCard = (s: VipSubscription, index: number) => {
    const isActive = (s as any).status === "ACTIVE";
    const planType = (s as any).planType || "VIP";

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.05 }}
        whileHover={{ y: -5 }}
        className="h-full"
      >
        <Card className="h-full border-2 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 group overflow-hidden bg-card/50 backdrop-blur-sm">
          {/* Accent decoration */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-all" />

          <CardHeader className="relative flex flex-row items-center justify-between pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 ring-1 ring-purple-500/20">
                <Zap className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <Typography variant="body-base" weight="bold">
                  {planType}
                </Typography>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                  <Star className="h-3 w-3 fill-purple-500 text-purple-500" />
                  Premium
                </div>
              </div>
            </div>
            <Badge
              className={
                isActive
                  ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                  : "bg-muted text-muted-foreground"
              }
            >
              {isActive ? "ACTIVE" : "EXPIRÉ"}
            </Badge>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs font-medium">Début</span>
                </div>
                <span className="text-sm font-bold">
                  {(s as any).startDate
                    ? new Date((s as any).startDate).toLocaleDateString()
                    : "-"}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="text-xs font-medium">Échéance</span>
                </div>
                <span className="text-sm font-bold text-purple-500">
                  {(s as any).endDate
                    ? new Date((s as any).endDate).toLocaleDateString()
                    : "-"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                size="sm"
                className="w-full gap-2 bg-purple-600 hover:bg-purple-700"
              >
                Détails
                <ArrowRight className="h-3 w-3" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="shrink-0 h-9 w-9"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="mx-auto p-2 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center px-2"
      >
        <div>
          <Typography variant="h2" weight="bold">
            Abonnements VIP
          </Typography>
          <Typography variant="body-sm" theme="muted">
            Gérez vos privilèges et accès exclusifs
          </Typography>
        </div>
        <Button
          variant="outline"
          className="gap-2 border-purple-500/50 text-purple-500 hover:bg-purple-500/5"
        >
          <Zap className="h-4 w-4" />
          Upgrade Plan
        </Button>
      </motion.div>

      <EntityList<VipSubscription>
        entityType="subscriptions"
        title="Abonnements VIP"
        data={data}
        total={total}
        loading={loading}
        error={error}
        page={page}
        limit={limit}
        searchTerm={searchTerm}
        filters={filters as Record<string, any>}
        viewMode={viewMode}
        onPageChange={setPage}
        onLimitChange={setLimit}
        onSearchChange={setSearchTerm}
        onFilterChange={setFilters}
        onViewModeChange={(mode) =>
          setViewMode(mode === "table" ? "grid" : mode)
        }
        renderCard={(item, index) => renderSubscriptionCard(item, Number(index))}
        showSearch={true}
        showFilters={true}
        showViewToggle={true}
        onRefresh={onRefresh}
        gridClassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      />
    </div>
  );
}
