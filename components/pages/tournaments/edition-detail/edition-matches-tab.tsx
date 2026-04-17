// @/components/pages/tournaments/edition-detail/edition-matches-tab.tsx
"use client";

import React, { useState, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Filter,
  Trophy,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Users,
  Calendar,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatsCarousel } from "@/components/shared/stats-carousel";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { toast } from "sonner";
import { exportMatchesToFormat } from "@/actions/editions";
import { useMatchList, useEditionMatchStats } from "@/hooks/use-match-manager";
import { useUserRegistration } from "@/hooks/use-editions";
import { MatchCard } from "@/components/cards/match-card";

interface EditionMatchesTabProps {
  editionId: string;
  tournamentId?: string;
  activePhaseId?: string;
  currentUserId?: string;
  isAdmin?: boolean;
  phases?: any[];
}

export function EditionMatchesTab({
  editionId,
  tournamentId,
  activePhaseId: initialPhaseId,
  currentUserId,
  isAdmin,
  phases = [],
}: EditionMatchesTabProps) {
  // États
  const [activePhaseId, setActivePhaseId] = useState(initialPhaseId || phases[0]?.id || "");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [showOnlyMyMatches, setShowOnlyMyMatches] = useState(false);
  const [allMatchesPage, setAllMatchesPage] = useState(1);
  const [myMatchesPage, setMyMatchesPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  const limit = 20;

  // Hooks
  const { data: userReg, isLoading: regLoading } = useUserRegistration(
    editionId,
    currentUserId,
  );
  const { data: stats, isLoading: statsLoading } =
    useEditionMatchStats(editionId);

  // Filtres communs
  const baseFilters: any = { editionId };
  if (activePhaseId) baseFilters.phaseId = activePhaseId;
  if (statusFilter !== "ALL") baseFilters.statuses = [statusFilter];

  // Tous les matchs (paginated)
  const {
    data: allMatchesRes,
    isLoading: allMatchesLoading,
    refetch: refetchAll,
  } = useMatchList({
    filters: baseFilters,
    pagination: { page: allMatchesPage, limit },
    options: { sortBy: "scheduledTime", sortOrder: "desc" },
  });

  // Mes matchs
  const myFilters: any = { ...baseFilters };
  if (userReg?.id) myFilters.memberRegistrationId = userReg.id;

  const {
    data: myMatchesRes,
    isLoading: myMatchesLoading,
    refetch: refetchMy,
  } = useMatchList({
    filters: myFilters,
    pagination: { page: myMatchesPage, limit },
    options: { sortBy: "scheduledTime", sortOrder: "asc" },
  });

  const allMatches = allMatchesRes?.data || [];
  const allPagination = allMatchesRes?.pagination || {
    total: 0,
    totalPages: 0,
    hasPrev: false,
    hasNext: false,
  };
  const myMatches = myMatchesRes?.data || [];
  const myPagination = myMatchesRes?.pagination || {
    total: 0,
    totalPages: 0,
    hasPrev: false,
    hasNext: false,
  };

  // Export
  const handleExport = useCallback(
    async (format: "csv" | "json" | "pdf" | "excel", scope: "all" | "my") => {
      setIsExporting(true);
      try {
        const { exportData: exportToFormat, createExportData } = await import("@/utils/export-utils");
        
        const filters: any = { editionId };
        if (activePhaseId) filters.phaseId = activePhaseId;
        if (statusFilter !== "ALL") filters.statuses = [statusFilter];
        if (scope === "my" && userReg?.id)
          filters.memberRegistrationId = userReg.id;

        const result = await exportMatchesToFormat(editionId, format, filters);
        
        if (result.success && result.data) {
          const rawData = JSON.parse(result.data);
          const config = {
            filename: result.filename || `matches_${scope}_${editionId}`,
            title: scope === "my" ? "Mes matchs" : "Tous les matchs",
            subtitle: `Édition: ${editionId.slice(0, 8)}`,
          };

          const tableData = createExportData(rawData, "matches");
          await exportToFormat(format, tableData, config);

          toast.success(`Export ${format.toUpperCase()} réussi`, {
            description: `${result.count || rawData.length} matchs exportés`,
          });
        } else {
          toast.error(result.error || "Erreur lors de l'export");
        }
      } catch (error: any) {
        toast.error(error.message || "Erreur lors de l'export");
      } finally {
        setIsExporting(false);
      }
    },
    [editionId, activePhaseId, statusFilter, userReg],
  );

  const matchStats = [
    {
      label: "Total",
      value: stats?.total || 0,
      icon: <Trophy className="h-4 w-4" />,
      color: "text-blue-500",
    },
    {
      label: "Terminés",
      value: stats?.completed || 0,
      icon: <CheckCircle2 className="h-4 w-4" />,
      color: "text-emerald-500",
    },
    {
      label: "En cours",
      value: stats?.inProgress || 0,
      icon: <Clock className="h-4 w-4" />,
      color: "text-yellow-500",
    },
    {
      label: "Litiges",
      value: stats?.disputed || 0,
      icon: <AlertCircle className="h-4 w-4" />,
      color: "text-red-500",
    },
  ];

  const isLoading =
    regLoading || statsLoading || allMatchesLoading || myMatchesLoading;

  if (isLoading && !allMatches.length && !myMatches.length) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Stats */}
      <StatsCarousel
        data={matchStats.map((s) => ({
          label: s.label,
          value: s.value,
          icon: s.icon,
          className: cn("border-none bg-muted/30", s.color),
        }))}
        className="p-4"
        itemsPerView={{ mobile: 2, md: 4, lg: 4 }}
      />

      {/* Phase Selector (Horizontal Scroll/Tabs) */}
      {phases.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-4 w-4 text-primary" />
            <Typography variant="body-sm" weight="bold" theme="muted" className="uppercase tracking-wider">
              Phases du tournoi
            </Typography>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
            {phases.map((phase) => (
              <Button
                key={phase.id}
                variant={activePhaseId === phase.id ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setActivePhaseId(phase.id);
                  setAllMatchesPage(1);
                  setMyMatchesPage(1);
                }}
                className={cn(
                  "flex-shrink-0 h-9 px-4 rounded-full transition-all",
                  activePhaseId === phase.id ? "shadow-md scale-105" : "hover:bg-primary/5"
                )}
              >
                {phase.name}
              </Button>
            ))}
          </div>
          <Separator className="opacity-50" />
        </div>
      )}

      {/* Mes matchs */}
      {userReg?.id && myPagination.total > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔥</span>
              <Typography variant="h5" weight="bold">
                Mes matchs
              </Typography>
              <Badge className="bg-primary/10 text-primary border-primary/20 text-xs rounded-full">
                {myPagination.total}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1"
                    disabled={isExporting}
                  >
                    {isExporting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    <span className="text-xs hidden sm:inline">Exporter</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Mes matchs</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleExport("excel", "my")}>
                    Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("csv", "my")}>
                    CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("json", "my")}>
                    JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("pdf", "my")}>
                    PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {myMatches.map((match: any) => (
              <MatchCard
                key={match.id}
                match={match}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                onUpdate={() => {
                  refetchAll();
                  refetchMy();
                }}
              />
            ))}
          </div>

          {myPagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!myPagination.hasPrev}
                onClick={() => setMyMatchesPage((p) => Math.max(1, p - 1))}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, myPagination.totalPages) }).map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={pageNum}
                      variant={myMatchesPage === pageNum ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setMyMatchesPage(pageNum)}
                      className="h-8 w-8 p-0 text-xs"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                {myPagination.totalPages > 5 && <span className="text-muted-foreground text-xs">...</span>}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={!myPagination.hasNext}
                onClick={() =>
                  setMyMatchesPage((p) =>
                    Math.min(myPagination.totalPages, p + 1),
                  )
                }
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          <Separator className="my-8 opacity-50" />
        </div>
      )}

      {/* Tous les matchs (Aperçu) */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <Typography variant="h5" weight="bold">
              Tous les matchs
            </Typography>
            <Badge variant="outline" className="text-xs rounded-full">
              {allPagination.total}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val);
                setAllMatchesPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-[130px] text-xs bg-card">
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1"
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  <span className="text-xs hidden sm:inline">Exporter</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Tous les matchs</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleExport("excel", "all")}>
                  Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("csv", "all")}>
                  CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("json", "all")}>
                  JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("pdf", "all")}>
                  PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {allMatches.length === 0 ? (
          <Card className="border-dashed py-12 bg-muted/5">
            <CardContent className="text-center">
              <div className="bg-muted p-4 rounded-full w-fit mx-auto mb-4">
                <Calendar className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <Typography variant="body-base" theme="muted">
                Aucun match trouvé pour cette phase ou ce filtre.
              </Typography>
              {statusFilter !== "ALL" && (
                <Button
                  variant="link"
                  size="sm"
                  className="mt-2 text-primary"
                  onClick={() => setStatusFilter("ALL")}
                >
                  Voir tous les matchs de cette phase
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {allMatches.map((match: any) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  currentUserId={currentUserId}
                  isAdmin={isAdmin}
                  onUpdate={() => refetchAll()}
                />
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-4 bg-muted/20 rounded-xl border border-dashed">
              <div className="text-sm text-muted-foreground">
                <Typography variant="body-sm">
                  Affichage des <strong>{allMatches.length}</strong> derniers matchs sur <strong>{allPagination.total}</strong>.
                </Typography>
              </div>
              {tournamentId && (
                <Button variant="default" size="sm" asChild className="gap-2 shadow-lg shadow-primary/20">
                  <Link href={`/tournaments/${tournamentId}/editions/${editionId}/matches`}>
                    Voir tout le calendrier
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
