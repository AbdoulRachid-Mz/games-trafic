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
  Swords,
  Grid,
  List,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatsCarousel } from "@/components/shared/stats-carousel";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { toast } from "sonner";
import { getEditionMatchesDocument } from "@/actions/documents";
import { downloadDocument } from "@/lib/documents/engine";
import type { DocumentFormat } from "@/lib/documents/types";
import { useMatchList, useEditionMatchStats } from "@/hooks/use-match-manager";
import { useUserRegistration } from "@/hooks/use-editions";
import { MatchCard } from "@/components/cards/match-card";
import { useRouter } from "next/navigation";
import { ButtonGroup } from "@/components/ui/button-group";

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
  const [activePhaseId, setActivePhaseId] = useState(
    initialPhaseId || phases[0]?.id || "",
  );
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [showOnlyMyMatches, setShowOnlyMyMatches] = useState(false);
  const [allMatchesPage, setAllMatchesPage] = useState(1);
  const [myMatchesPage, setMyMatchesPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  // viewmode
  const [matchViewMode, setMatchViewMode] = useState<"list" | "grid" | "compact">("list");
  const router = useRouter();

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

  // Export — données et autorisations construites côté serveur.
  const handleExport = useCallback(
    async (format: DocumentFormat) => {
      setIsExporting(true);
      try {
        const filters: { phaseId?: string; status?: string } = {};
        if (activePhaseId) filters.phaseId = activePhaseId;
        if (statusFilter !== "ALL") filters.status = statusFilter;

        const result = await getEditionMatchesDocument(editionId, filters);

        if (!result.success || !result.document) {
          toast.error(result.error || "Erreur lors de l'export");
          return;
        }

        await downloadDocument(result.document, format);
        const count = result.document.meta.totalRecords ?? 0;
        toast.success(`Export ${format.toUpperCase()} réussi`, {
          description: `${count} match(s) exporté(s)`,
        });
      } catch (error: any) {
        toast.error(error?.message || "Erreur lors de l'export");
      } finally {
        setIsExporting(false);
      }
    },
    [editionId, activePhaseId, statusFilter],
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
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
      {/* Premium Header/Stats Section */}
      <div className="relative overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 p-6 md:p-8">
        <div className="absolute -top-24 -right-24 h-64 w-64 bg-primary/10 blur-[100px]" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 bg-primary/10 blur-[100px]" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <Typography
              variant="h3"
              weight="bold"
              className="italic uppercase tracking-tighter flex items-center gap-3"
            >
              <Swords className="h-8 w-8 text-primary" />
              Arène des Combats
            </Typography>
            <Typography variant="body-sm" theme="muted" className="max-w-md">
              Suivez l'intensité de chaque affrontement en temps réel. Les
              statistiques et résultats sont mis à jour officiellement.
            </Typography>
          </div>

          <div className="flex flex-wrap gap-4">
            {matchStats.map((s, i) => (
              <div
                key={i}
                className="flex flex-col items-center px-6 py-3 rounded-2xl bg-background/50 border border-white/5 backdrop-blur-sm min-w-[100px]"
              >
                <div className={cn("mb-1", s.color)}>{s.icon}</div>
                <div className="text-xl font-black italic">{s.value}</div>
                <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modern Filter Bar */}
      <div className="sticky top-2 z-20 bg-background/80 backdrop-blur-md border rounded-2xl p-2 shadow-xl shadow-primary/5 flex flex-col lg:flex-row items-stretch lg:items-center gap-2">
        <div className="flex-1 flex overflow-x-auto scroller-hide gap-1 p-1">
          {phases.map((phase) => (
            <button
              key={phase.id}
              onClick={() => {
                setActivePhaseId(phase.id);
                setAllMatchesPage(1);
              }}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-tighter transition-all whitespace-nowrap",
                activePhaseId === phase.id
                  ? "bg-primary text-white shadow-lg shadow-primary/30 scale-105"
                  : "hover:bg-muted text-muted-foreground",
              )}
            >
              {phase.name}
            </button>
          ))}
        </div>

        <Separator
          orientation="vertical"
          className="hidden lg:block h-8 mx-2"
        />

        <div className="flex items-center gap-2 p-1">
          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val);
              setAllMatchesPage(1);
            }}
          >
            <SelectTrigger className="h-10 w-[150px] max-md:w-[100px] max-sm:w-[80px] border-none bg-muted/50 font-bold text-[11px] uppercase tracking-wider rounded-xl">
              <Filter className="h-3 w-3 mr-2 text-primary" />
              <SelectValue placeholder="État" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les états</SelectItem>
              <SelectItem value="PENDING">À venir</SelectItem>
              <SelectItem value="IN_PROGRESS">Live NOW</SelectItem>
              <SelectItem value="COMPLETED">Terminés</SelectItem>
              <SelectItem value="DISPUTED">Litiges</SelectItem>
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-10 border-none bg-muted/50 rounded-xl px-4 gap-2"
                disabled={isExporting}
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 text-primary" />
                )}
                <span className="text-[11px] font-black uppercase tracking-wider">
                  Export
                </span>
                <ChevronDown className="h-4 w-4 text-primary" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl p-2 w-48">
              <DropdownMenuLabel className="text-[10px] uppercase font-black text-muted-foreground">
                Format d'export
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => void handleExport("xlsx")}
                className="rounded-lg gap-2 cursor-pointer font-bold"
              >
                <div className="h-2 w-2 rounded-full bg-green-500" /> Excel
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => void handleExport("pdf")}
                className="rounded-lg gap-2 cursor-pointer font-bold"
              >
                <div className="h-2 w-2 rounded-full bg-red-500" /> PDF
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => void handleExport("csv")}
                className="rounded-lg gap-2 cursor-pointer font-bold"
              >
                <div className="h-2 w-2 rounded-full bg-blue-500" /> CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Mode toggle button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-10 border-none bg-muted/50 rounded-xl px-4 gap-2"
              >
                {matchViewMode === "list" && <List className="h-4 w-4 text-primary" />}
                {matchViewMode === "grid" && <Grid className="h-4 w-4 text-primary" />}
                {matchViewMode === "compact" && (
                  <span className="text-[11px] font-black uppercase tracking-wider">
                    {/* icon compact */}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="h-4 w-4"><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="16" y1="9" x2="8" y2="9"/></svg>
                  </span>
                )}
                <span className="text-[11px] font-black uppercase tracking-wider">Vue</span>
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl p-2 w-40">
              <DropdownMenuLabel className="text-[10px] uppercase font-black text-muted-foreground">
                Mode d'affichage
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setMatchViewMode("list")}
                className="rounded-lg gap-2 cursor-pointer font-bold"
              >
                <List className="h-4 w-4" /> Liste
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setMatchViewMode("grid")}
                className="rounded-lg gap-2 cursor-pointer font-bold"
              >
                <Grid className="h-4 w-4" /> Grille
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setMatchViewMode("compact")}
                className="rounded-lg gap-2 cursor-pointer font-bold"
              >
                <span className="text-xs">comp</span> Compact
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mes Matchs (Spécial Highlight) */}
        {userReg?.id && myMatches.length > 0 && (
          <div className="col-span-full space-y-4">
            <div className="flex items-center gap-3 px-2">
              <div className="h-3 w-3 rounded-full bg-primary animate-ping" />
              <Typography
                variant="h5"
                weight="bold"
                className="italic uppercase tracking-tighter"
              >
                Mes Prochains Chocs
              </Typography>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myMatches.map((match: any) => (
                <MatchCard
                  key={match.id}
                  viewMode={matchViewMode}
                  item={match}
                  onViewP1={() =>
                    router.push(
                      `/tournaments/members/${match.participant1?.member?.userId || match.participant1?.member?.id}`,
                    )
                  }
                  onViewP2={() =>
                    router.push(
                      `/tournaments/members/${match.participant2?.member?.userId || match.participant2?.member?.id}`,
                    )
                  }
                  currentUserId={currentUserId}
                  isAdmin={isAdmin}
                  onUpdate={() => {
                    refetchAll();
                    refetchMy();
                  }}
                  className="bg-primary/5 border-primary/20 hover:bg-primary/10 transition-colors shadow-lg shadow-primary/5"
                />
              ))}
            </div>
            <Separator className="my-8" />
          </div>
        )}

        {/* Tous les matchs */}
        <div className="col-span-full space-y-6">
          <div className="flex items-center justify-between px-2">
            <Typography
              variant="body-sm"
              weight="bold"
              theme="muted"
              className="uppercase tracking-[0.2em] font-bold"
            >
              Calendrier des rencontres
            </Typography>
            <Badge variant="outline" className="font-mono text-xs">
              {allPagination.total} Matchs
            </Badge>
          </div>

          {allMatches.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed rounded-3xl bg-muted/5 flex flex-col items-center justify-center gap-4">
              <div className="p-4 rounded-full bg-muted/20">
                <Calendar className="h-10 w-10 text-muted-foreground/30" />
              </div>
              <Typography variant="body-base" theme="muted" weight="medium">
                Aucune rencontre disponible avec ces filtres.
              </Typography>
              <Button
                variant="link"
                onClick={() => {
                  setStatusFilter("ALL");
                  setActivePhaseId(phases[0]?.id || "");
                }}
              >
                Réinitialiser les filtres
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {allMatches.map((match: any) => (
                  <MatchCard
                    viewMode={matchViewMode}
                    key={match.id}
                    item={match}
                    currentUserId={currentUserId}
                    isAdmin={isAdmin}
                    onUpdate={() => refetchAll()}
                  />
                ))}
              </div>

              {/* Pagination Premium */}
              {allPagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 py-8">
                  <Button
                    variant="outline"
                    disabled={!allPagination.hasPrev}
                    onClick={() => setAllMatchesPage((p) => Math.max(1, p - 1))}
                    className="rounded-full h-12 w-12 border-primary/10 hover:bg-primary/5"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>

                  <div className="flex items-center gap-2 px-6 py-2 bg-muted/30 rounded-full border border-white/5 font-black italic text-sm">
                    <span className="text-primary">{allMatchesPage}</span>
                    <span className="opacity-30">/</span>
                    <span>{allPagination.totalPages}</span>
                  </div>

                  <Button
                    variant="outline"
                    disabled={!allPagination.hasNext}
                    onClick={() =>
                      setAllMatchesPage((p) =>
                        Math.min(allPagination.totalPages, p + 1),
                      )
                    }
                    className="rounded-full h-12 w-12 border-primary/10 hover:bg-primary/5"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
