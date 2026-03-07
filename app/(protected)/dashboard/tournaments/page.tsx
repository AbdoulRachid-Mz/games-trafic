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
import { useAuthContext } from "@/contexts/auth-context";
import { TournamentCard } from "@/components/cards/tournament-card";

export default function TournamentsDashboardPage() {
  const { isSmallScreen, isMediumScreen } = useScreenSize();
  const { user } = useAuthContext();
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
    defaultFilters: { creatorId: user?.id },
    defaultLimit: isSmallScreen ? 12 : isMediumScreen ? 15 : 20,
    enabled: !!user?.id,
  });

  const renderTournamentCard = (t: Tournament, index: number) => (
    <TournamentCard
        key={t.id}
        tournament={t as any}
        viewMode={viewMode === "grid" ? "grid" : "list"}
        onView={() => router.push(`/tournaments/${t.id}`)}
    />
  );

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
