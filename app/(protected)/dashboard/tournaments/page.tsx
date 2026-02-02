"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { EntityList } from "@/components/shared/entity-list";
import { useEntityList } from "@/hooks/use-entity-list";
import { useScreenSize } from "@/hooks/use-screen";
import { getTournaments } from "@/actions/tournaments";
import { type Tournament } from "@/database/schema";
import {
  Trophy,
  Users,
  Swords,
  Clock,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function TournamentsDashboardPage() {
  const { isSmallScreen, isMediumScreen } = useScreenSize();
  const router = useRouter();

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
  } = useEntityList<Tournament>({
    entityType: "tournaments",
    defaultLimit: isSmallScreen ? 12 : isMediumScreen ? 15 : 20,
    fetchFunction: async (params) => {
      const res = await getTournaments({
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

  const renderTournamentCard = (t: Tournament, index: number) => {
    const status = (t as any).status || "UPCOMING";
    const participants =
      (t as any).totalParticipants ?? (t as any).currentParticipants ?? 0;
    const maxParticipants = (t as any).maxParticipants || 100;
    const progress = (participants / maxParticipants) * 100;

    const statusConfig: Record<
      string,
      { label: string; color: string; icon: any }
    > = {
      UPCOMING: {
        label: "À venir",
        color: "bg-blue-500/10 text-blue-500",
        icon: Calendar,
      },
      ONGOING: {
        label: "En cours",
        color: "bg-orange-500/10 text-orange-500",
        icon: Swords,
      },
      COMPLETED: {
        label: "Terminé",
        color: "bg-green-500/10 text-green-500",
        icon: Trophy,
      },
      CANCELLED: {
        label: "Annulé",
        color: "bg-red-500/10 text-red-500",
        icon: Clock,
      },
    };

    const config = statusConfig[status] || statusConfig.UPCOMING;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.05 }}
        whileHover={{ scale: 1.02 }}
        className="h-full"
      >
        <Card className="h-full border-2 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 group overflow-hidden bg-card/40">
          {/* Status Header */}
          <div
            className={`p-1.5 text-center ${config.color} text-[10px] font-bold uppercase tracking-widest`}
          >
            {config.label}
          </div>

          <CardHeader className="p-5 flex flex-row items-start justify-between">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-lg font-black line-clamp-1">
                {t.name}
              </CardTitle>
              <Typography
                variant="caption2"
                theme="muted"
                className="flex items-center gap-1 font-bold"
              >
                <TrendingUp className="h-3 w-3" />
                NIVEAU REQUIS: GOLD
              </Typography>
            </div>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Trophy className="h-5 w-5" />
            </div>
          </CardHeader>

          <CardContent className="p-5 pt-0 space-y-5">
            <Typography
              variant="body-sm"
              theme="muted"
              className="line-clamp-2 h-10 italic"
            >
              {t.description || "Préparez-vous pour la compétition ultime."}
            </Typography>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Remplissage
                </span>
                <span>
                  {participants} / {maxParticipants}
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                  className="h-full bg-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                size="sm"
                variant="outline"
                className="w-full font-bold h-9"
                onClick={() => router.push(`/tournaments/${t.id}`)}
              >
                VOIR
              </Button>
              <Button
                size="sm"
                className="w-full font-bold h-9 shadow-lg shadow-primary/20"
              >
                REJOINDRE
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
            Compétitions
          </Typography>
          <Typography variant="body-sm" theme="muted">
            Suivez vos tournois et vos exploits
          </Typography>
        </div>
        <Button
          variant="outline"
          className="gap-2 border-primary/50 text-primary hover:bg-primary/5"
        >
          <Swords className="h-4 w-4" />
          Trouver un Match
        </Button>
      </motion.div>

      <EntityList<Tournament>
        entityType="tournaments"
        title="Compétitions"
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
        onViewModeChange={setViewMode}
        renderCard={(item, index) => renderTournamentCard(item, Number(index))}
        showSearch={true}
        showFilters={true}
        showViewToggle={true}
        onRefresh={onRefresh}
        gridClassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      />
    </div>
  );
}
