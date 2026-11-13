// @/components/pages/tournaments/edition-detail/edition-matches-tab.tsx
"use client";

import React, { useState, useCallback, useMemo, useRef } from "react";
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
  Star,
  UserCheck,
  Sparkles,
  Search,
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

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(val);
      setAllMatchesPage(1);
    }, 300);
  };

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
  if (debouncedSearch.trim()) baseFilters.search = debouncedSearch.trim();

  // Tous les matchs (paginated) — source unique de vérité
  const {
    data: allMatchesRes,
    isLoading: allMatchesLoading,
    refetch: refetchAll,
  } = useMatchList({
    filters: baseFilters,
    pagination: { page: allMatchesPage, limit },
    options: { sortBy: "scheduledTime", sortOrder: "desc" },
  });

  // Mes matchs — utilisé uniquement pour la section "Mes Prochains Chocs"
  // On ne fait cette requête que si l'utilisateur a un userReg.id
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
    // Désactiver si pas de userReg pour éviter une requête inutile
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

  /**
   * Priorisation côté client :
   * On identifie les matchs du user dans la liste principale (allMatches)
   * et on les remonte en tête de liste avec un flag `isMyMatch`.
   */
  const prioritizedMatches = useMemo(() => {
    if (!currentUserId) return allMatches.map((m: any) => ({ ...m, _isMyMatch: false }));

    const mine: any[] = [];
    const others: any[] = [];

    for (const match of allMatches) {
      const isMyMatch =
        match.participant1?.member?.userId === currentUserId ||
        match.participant2?.member?.userId === currentUserId;
      if (isMyMatch) {
        mine.push({ ...match, _isMyMatch: true });
      } else {
        others.push({ ...match, _isMyMatch: false });
      }
    }

    return [...mine, ...others];
  }, [allMatches, currentUserId]);

  /**
   * Si le toggle "Mes matchs seulement" est actif, on filtre côté client.
   */
  const displayedMatches = useMemo(() => {
    if (showOnlyMyMatches && currentUserId) {
      return prioritizedMatches.filter((m: any) => m._isMyMatch);
    }
    return prioritizedMatches;
  }, [prioritizedMatches, showOnlyMyMatches, currentUserId]);

  // Nombre de mes matchs dans la page courante (pour le toggle badge)
  const myMatchesCountInPage = useMemo(
    () => prioritizedMatches.filter((m: any) => m._isMyMatch).length,
    [prioritizedMatches],
  );

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
    regLoading || statsLoading || allMatchesLoading || (userReg?.id ? myMatchesLoading : false);

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

        {/* Barre de recherche réactive */}
        <div className="relative min-w-[180px] sm:min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            className="w-full h-10 pl-9 pr-7 rounded-xl border-none bg-muted/50 text-xs font-semibold placeholder:text-muted-foreground/60 focus:ring-1 focus:ring-primary outline-none transition-all"
            placeholder="Joueur, équipe, code..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm("");
                setDebouncedSearch("");
                setAllMatchesPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:text-destructive text-muted-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 p-1">
          {/* Toggle "Mes matchs seulement" — visible uniquement si l'user est connecté */}
          {currentUserId && (
            <Button
              variant={showOnlyMyMatches ? "default" : "outline"}
              className={cn(
                "h-10 rounded-xl px-4 gap-2 border-none font-bold text-[11px] uppercase tracking-wider transition-all",
                showOnlyMyMatches
                  ? "bg-primary text-white shadow-lg shadow-primary/30"
                  : "bg-muted/50 text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setShowOnlyMyMatches((v) => !v)}
            >
              <Star className={cn("h-3.5 w-3.5", showOnlyMyMatches && "fill-white")} />
              Mes matchs
              {myMatchesCountInPage > 0 && (
                <span className={cn(
                  "ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black",
                  showOnlyMyMatches ? "bg-white/20" : "bg-primary/20 text-primary"
                )}>
                  {myMatchesCountInPage}
                </span>
              )}
            </Button>
          )}

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
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="16" y1="9" x2="8" y2="9"/></svg>
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
        {/* ── Section "Mes Prochains Chocs" ── */}
        {currentUserId && (
          <>
            {/* Utilisateur inscrit avec des matchs */}
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
                  <Badge className="font-mono text-xs bg-primary/10 text-primary border-primary/20">
                    {myMatches.length} match{myMatches.length > 1 ? "s" : ""}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myMatches.map((match: any) => (
                    <div key={match.id} className="relative">
                      {/* Badge "Votre combat" */}
                      <div className="absolute -top-2 left-4 z-10">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-wider shadow-lg shadow-primary/30">
                          <Sparkles className="h-2.5 w-2.5" />
                          Votre combat
                        </span>
                      </div>
                      <MatchCard
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
                        className="bg-primary/5 border-primary/30 hover:bg-primary/10 transition-colors shadow-lg shadow-primary/5 ring-1 ring-primary/20"
                      />
                    </div>
                  ))}
                </div>
                <Separator className="my-8" />
              </div>
            )}

            {/* Utilisateur connecté mais pas encore inscrit à l'édition */}
            {!userReg?.id && !regLoading && (
              <div className="col-span-full">
                <div className="relative overflow-hidden rounded-2xl border border-dashed border-primary/20 bg-primary/5 p-6 flex flex-col sm:flex-row items-center gap-4">
                  <div className="p-3 rounded-full bg-primary/10 shrink-0">
                    <UserCheck className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <Typography variant="body-base" weight="bold" className="mb-1">
                      Pas encore inscrit à cette édition
                    </Typography>
                    <Typography variant="body-sm" theme="muted">
                      Inscrivez-vous pour participer et retrouver vos matchs mis en avant ici.
                    </Typography>
                  </div>
                </div>
                <Separator className="my-8" />
              </div>
            )}
          </>
        )}

        {/* ── Calendrier des rencontres (liste principale) ── */}
        <div className="col-span-full space-y-6">
          <div className="flex items-center justify-between px-2">
            <Typography
              variant="body-sm"
              weight="bold"
              theme="muted"
              className="uppercase tracking-[0.2em] font-bold"
            >
              {showOnlyMyMatches ? "Mes rencontres" : "Calendrier des rencontres"}
            </Typography>
            <div className="flex items-center gap-2">
              {showOnlyMyMatches && (
                <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-bold">
                  <Star className="h-3 w-3 mr-1 fill-primary" />
                  Filtre actif
                </Badge>
              )}
              <Badge variant="outline" className="font-mono text-xs">
                {showOnlyMyMatches
                  ? `${displayedMatches.length} Matchs`
                  : `${allPagination.total} Matchs`}
              </Badge>
            </div>
          </div>

          {displayedMatches.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed rounded-3xl bg-muted/5 flex flex-col items-center justify-center gap-4">
              <div className="p-4 rounded-full bg-muted/20">
                <Calendar className="h-10 w-10 text-muted-foreground/30" />
              </div>
              <Typography variant="body-base" theme="muted" weight="medium">
                {showOnlyMyMatches
                  ? "Vous n'avez aucun match sur cette page."
                  : "Aucune rencontre disponible avec ces filtres."}
              </Typography>
              <div className="flex gap-2 flex-wrap justify-center">
                {showOnlyMyMatches && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setShowOnlyMyMatches(false)}
                  >
                    Voir tous les matchs
                  </Button>
                )}
                <Button
                  variant="link"
                  onClick={() => {
                    setStatusFilter("ALL");
                    setActivePhaseId(phases[0]?.id || "");
                    setShowOnlyMyMatches(false);
                  }}
                >
                  Réinitialiser les filtres
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {displayedMatches.map((match: any) => {
                  const isMyMatch = match._isMyMatch;
                  return (
                    <div key={match.id} className="relative">
                      {/* Badge "Mon match" sur les cartes prioritaires dans la liste principale */}
                      {isMyMatch && (
                        <div className="absolute -top-2 left-4 z-10">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-wider shadow-lg shadow-primary/30">
                            <Star className="h-2.5 w-2.5 fill-white" />
                            Mon match
                          </span>
                        </div>
                      )}
                      <MatchCard
                        viewMode={matchViewMode}
                        item={match}
                        currentUserId={currentUserId}
                        isAdmin={isAdmin}
                        onUpdate={() => {
                          refetchAll();
                          if (userReg?.id) refetchMy();
                        }}
                        className={cn(
                          isMyMatch &&
                            "border-primary/30 ring-1 ring-primary/20 shadow-lg shadow-primary/5",
                        )}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Pagination Premium — masquée si "Mes matchs seulement" (filtrage client) */}
              {!showOnlyMyMatches && allPagination.totalPages > 1 && (
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
