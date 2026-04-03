//@/components/pages/tournaments/edition-detail/edition-matches-tab.tsx
"use client";

import React, { useState } from "react";
import { useMatchList, useEditionMatchStats } from "@/hooks/use-match-manager";
import { useEditionManager } from "@/hooks/use-edition-manager";
import { useUserRegistration } from "@/hooks/use-editions";
import { MatchCard } from "@/components/cards/match-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileJson,
  FileDown,
  FileText,
  Filter,
  Users,
  Trophy,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EditionMatchesTabProps {
  editionId: string;
  activePhaseId?: string;
  currentUserId?: string;
  isAdmin?: boolean;
}

export function EditionMatchesTab({
  editionId,
  activePhaseId,
  currentUserId,
  isAdmin,
}: EditionMatchesTabProps) {
  // --- STATE ---
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [showOnlyMyMatches, setShowOnlyMyMatches] = useState(false);
  const limit = 12;

  // --- HOOKS ---
  const { data: userReg } = useUserRegistration(editionId, currentUserId);
  const { data: stats, isLoading: statsLoading } =
    useEditionMatchStats(editionId);
  const { exportParticipants, exportMatches } = useEditionManager(editionId);

  const filters: any = { editionId };
  if (activePhaseId) filters.phaseId = activePhaseId;
  if (statusFilter !== "ALL") filters.statuses = [statusFilter];
  if (showOnlyMyMatches && userReg?.id) {
    filters.memberRegistrationId = userReg.id;
  }

  const {
    data: matchesRes,
    isLoading,
    isError,
    refetch,
  } = useMatchList({
    filters,
    pagination: { page, limit },
    options: { sortBy: "scheduledTime", sortOrder: "asc" },
  });

  const matches = matchesRes?.data || [];
  const pagination = matchesRes?.pagination;

  // --- HANDLERS ---
  const handleExport = (type: "pdf" | "csv" | "json") => {
    exportMatches.mutate(type);
  };

  // --- RENDER HELPERS ---
  if (isLoading && page === 1) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 📊 STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Matchs"
          value={stats?.total || 0}
          icon={<Trophy className="h-4 w-4" />}
          color="blue"
        />
        <StatCard
          label="Terminés"
          value={stats?.completed || 0}
          icon={<CheckCircle2 className="h-4 w-4" />}
          color="green"
        />
        <StatCard
          label="En cours"
          value={stats?.inProgress || 0}
          icon={<Clock className="h-4 w-4" />}
          color="yellow"
        />
        <StatCard
          label="Litiges"
          value={stats?.disputed || 0}
          icon={<AlertCircle className="h-4 w-4" />}
          color="red"
        />
      </div>

      {/* 🔍 ACTION BAR */}
      <div className="bg-card border rounded-xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center shadow-sm">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex bg-muted p-1 rounded-lg">
            <button
              onClick={() => {
                setShowOnlyMyMatches(false);
                setPage(1);
              }}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                !showOnlyMyMatches
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Tous les matchs
            </button>
            <button
              disabled={!currentUserId || !userReg}
              onClick={() => {
                setShowOnlyMyMatches(true);
                setPage(1);
              }}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5",
                showOnlyMyMatches
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground disabled:opacity-50",
              )}
            >
              <Users className="h-3 w-3" />
              Mes Matchs
            </button>
          </div>

          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[150px] text-xs">
              <Filter className="h-3 w-3 mr-2" />
              <SelectValue placeholder="État" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les états</SelectItem>
              <SelectItem value="PENDING">Programmé</SelectItem>
              <SelectItem value="IN_PROGRESS">En cours</SelectItem>
              <SelectItem value="COMPLETED">Terminé</SelectItem>
              <SelectItem value="DISPUTED">Litige</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Select onValueChange={(val) => handleExport(val as any)}>
            <SelectTrigger className="h-9 w-full md:w-[160px] text-xs bg-primary text-primary-foreground hover:bg-primary/90">
              <Download className="h-3.5 w-3.5 mr-2" />
              <span>Exporter Matchs</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-red-500" />
                  <span>Format PDF</span>
                </div>
              </SelectItem>
              <SelectItem value="csv">
                <div className="flex items-center gap-2">
                  <FileDown className="h-4 w-4 text-green-500" />
                  <span>Format CSV</span>
                </div>
              </SelectItem>
              <SelectItem value="json">
                <div className="flex items-center gap-2">
                  <FileJson className="h-4 w-4 text-blue-500" />
                  <span>Format JSON</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 🎮 MATCHES GRID */}
      {matches.length === 0 ? (
        <div className="p-12 text-center bg-card border border-dashed rounded-2xl flex flex-col items-center justify-center space-y-3">
          <div className="bg-muted p-4 rounded-full">
            <Trophy className="h-8 w-8 text-muted-foreground opacity-50" />
          </div>
          <Typography variant="h6" className="text-muted-foreground">
            {showOnlyMyMatches
              ? "Vous n'avez aucun match filtré."
              : "Aucun match trouvé."}
          </Typography>
          <Typography variant="body-sm" theme="muted">
            Essayez de modifier vos filtres ou revenez plus tard.
          </Typography>
          {(statusFilter !== "ALL" || showOnlyMyMatches) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter("ALL");
                setShowOnlyMyMatches(false);
              }}
            >
              Réinitialiser les filtres
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {matches.map((match: any) => (
            <MatchCard
              key={match.id}
              match={match}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onUpdate={() => refetch()}
            />
          ))}
        </div>
      )}

      {/* 📄 PAGINATION */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!pagination.hasPrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
              (p) => (
                <Button
                  key={p}
                  variant={page === p ? "default" : "ghost"}
                  size="sm"
                  className="w-8 h-8 p-0"
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              ),
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              setPage((p) => Math.min(pagination.totalPages, p + 1))
            }
            disabled={!pagination.hasNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// --- UTILS ---
function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  const colors: any = {
    blue: "text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800",
    green:
      "text-green-600 bg-green-50 border-green-100 dark:bg-green-900/20 dark:border-green-800",
    yellow:
      "text-yellow-600 bg-yellow-50 border-yellow-100 dark:bg-yellow-900/20 dark:border-yellow-800",
    red: "text-red-600 bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-800",
  };

  return (
    <div
      className={cn(
        "p-4 rounded-xl border flex items-center justify-between shadow-sm",
        colors[color],
      )}
    >
      <div className="space-y-0.5">
        <Typography variant="body-sm" className="opacity-80 leading-none">
          {label}
        </Typography>
        <Typography variant="h5" weight="bold" className="leading-tight">
          {value}
        </Typography>
      </div>
      <div className="p-2.5 rounded-lg bg-background/50 backdrop-blur-sm shadow-sm border border-current/10">
        {icon}
      </div>
    </div>
  );
}
