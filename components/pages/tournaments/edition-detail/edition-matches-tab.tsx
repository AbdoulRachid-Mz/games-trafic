// @/components/pages/tournaments/edition-detail/edition-matches-tab.tsx
"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useMatchList, useEditionMatchStats } from "@/hooks/use-match-manager";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
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
  Calendar,
  Eye,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatsCarousel } from "@/components/shared/stats-carousel";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { toast } from "sonner";
import { exportMatchesToFormat } from "@/actions/editions";

interface EditionMatchesTabProps {
  editionId: string;
  tournamentId?: string;
  activePhaseId?: string;
  currentUserId?: string;
  isAdmin?: boolean;
}

export function EditionMatchesTab({
  editionId,
  tournamentId,
  activePhaseId,
  currentUserId,
  isAdmin,
}: EditionMatchesTabProps) {
  // --- STATE ---
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [showOnlyMyMatches, setShowOnlyMyMatches] = useState(false);
  const [myMatchesPage, setMyMatchesPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const limit = 10; // Matches par page pour "mes matchs"

  // --- HOOKS ---
  const { data: userReg, isLoading: regLoading } = useUserRegistration(
    editionId,
    currentUserId,
  );
  const { data: stats, isLoading: statsLoading } =
    useEditionMatchStats(editionId);

  // 1. Tous les matchs (pour les filtres et la section "autres matchs")
  const allFilters: any = { editionId };
  if (activePhaseId) allFilters.phaseId = activePhaseId;
  if (statusFilter !== "ALL") allFilters.statuses = [statusFilter];

  const {
    data: allMatchesRes,
    isLoading: allMatchesLoading,
    refetch,
  } = useMatchList({
    filters: allFilters,
    pagination: { page: 1, limit: 100 },
    options: { sortBy: "scheduledTime", sortOrder: "desc" },
  });

  // 2. Mes matchs (filtrés par l'utilisateur)
  const myMatchesFilters: any = { editionId };
  if (userReg?.id) myMatchesFilters.memberRegistrationId = userReg.id;
  if (activePhaseId) myMatchesFilters.phaseId = activePhaseId;
  if (statusFilter !== "ALL") myMatchesFilters.statuses = [statusFilter];

  const {
    data: myMatchesRes,
    isLoading: myMatchesLoading,
    refetch: refetchMyMatches,
  } = useMatchList({
    filters: myMatchesFilters,
    pagination: { page: myMatchesPage, limit },
    options: { sortBy: "scheduledTime", sortOrder: "asc" },
  });

  const allMatches = allMatchesRes?.data || [];
  const myMatches = myMatchesRes?.data || [];
  const myMatchesTotal = myMatchesRes?.pagination?.total || 0;
  const myMatchesTotalPages = Math.ceil(myMatchesTotal / limit);

  // Filtrer les matchs où l'utilisateur n'est pas participant
  const otherMatches = useMemo(() => {
    const myMatchIds = new Set(myMatches.map((m: any) => m.id));
    return allMatches.filter((m: any) => !myMatchIds.has(m.id));
  }, [allMatches, myMatches]);

  // --- HANDLERS ---
  const handleExport = useCallback(
    async (format: "pdf" | "csv" | "json" | "excel", scope: "all" | "my") => {
      setIsExporting(true);
      try {
        const filters: any = { editionId };
        if (activePhaseId) filters.phaseId = activePhaseId;
        if (statusFilter !== "ALL") filters.statuses = [statusFilter];
        if (scope === "my" && userReg?.id)
          filters.memberRegistrationId = userReg.id;

        const result = await exportMatchesToFormat(editionId, format, filters);

        if (result.success && result.data) {
          const blob = await fetch(result.data).then((r) => r.blob());
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute(
            "download",
            result.filename ||
              `matches_export.${format === "excel" ? "xlsx" : format}`,
          );
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);

          toast.success(`Export ${format.toUpperCase()} réussi`, {
            description: `${result.count || 0} matchs exportés`,
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle2 className="h-3 w-3 text-emerald-500" />;
      case "IN_PROGRESS":
        return <Clock className="h-3 w-3 text-blue-500 animate-pulse" />;
      case "DISPUTED":
        return <AlertCircle className="h-3 w-3 text-amber-500" />;
      default:
        return <Calendar className="h-3 w-3 text-muted-foreground" />;
    }
  };

  // Match stats pour le carousel
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

  const isLoading = regLoading || allMatchesLoading || myMatchesLoading;

  if (isLoading && !allMatches.length && !myMatches.length) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* 📊 STATS CAROUSEL */}
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

      {/* 🔥 MES MATCHS SECTION */}
      {userReg?.id && myMatchesTotal > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔥</span>
              <Typography variant="h5" weight="bold">
                Mes matchs
              </Typography>
              <Badge
                variant="default"
                className="bg-primary/10 text-primary border-primary/20 text-[9px]"
              >
                {myMatchesTotal} match(s)
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {/* Export mes matchs */}
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
                    Excel (.xlsx)
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

              {showOnlyMyMatches && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowOnlyMyMatches(false)}
                  className="h-8 gap-1"
                >
                  <X className="h-3.5 w-3.5" />
                  <span className="text-xs">Fermer</span>
                </Button>
              )}
            </div>
          </div>

          {/* Liste des matchs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {myMatches
              .slice(0, showOnlyMyMatches ? limit : 4)
              .map((match: any) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  currentUserId={currentUserId}
                  isAdmin={isAdmin}
                  onUpdate={() => {
                    refetch();
                    refetchMyMatches();
                  }}
                />
              ))}
          </div>

          {/* Pagination pour mes matchs (si mode "voir tous") */}
          {showOnlyMyMatches && myMatchesTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={myMatchesPage === 1}
                onClick={() => setMyMatchesPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {myMatchesPage} / {myMatchesTotalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={myMatchesPage === myMatchesTotalPages}
                onClick={() =>
                  setMyMatchesPage((p) => Math.min(myMatchesTotalPages, p + 1))
                }
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Bouton "Voir tous mes matchs" */}
          {!showOnlyMyMatches && myMatchesTotal > 4 && (
            <div className="text-center pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowOnlyMyMatches(true)}
                className="gap-1"
              >
                <Eye className="h-3.5 w-3.5" />
                Voir tous mes {myMatchesTotal} matchs
              </Button>
            </div>
          )}

          <Separator className="my-6 opacity-50" />
        </div>
      )}

      {/* 📋 AUTRES MATCHS (où l'utilisateur n'est pas participant) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <Typography variant="h5" weight="bold">
              Matchs de l'édition
            </Typography>
            <Badge variant="outline" className="text-[9px]">
              {allMatches.length} matchs
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filtre par statut */}
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-[140px] text-xs">
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

            {/* Bouton Export */}
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
                  Excel (.xlsx)
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

            {/* Bouton voir tous les matchs */}
            {tournamentId && (
              <Button size="sm" variant="outline" asChild className="gap-1">
                <Link
                  href={`/tournaments/${tournamentId}/editions/${editionId}/matches`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span className="text-xs hidden sm:inline">
                    Page complète
                  </span>
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Liste des matchs (excluant les matchs de l'utilisateur si non en mode "mes matchs" uniquement) */}
        {otherMatches.length === 0 ? (
          <div className="p-12 text-center bg-card border border-dashed rounded-2xl flex flex-col items-center justify-center space-y-3">
            <div className="bg-muted p-4 rounded-full">
              <Trophy className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
            <Typography variant="h6" className="text-muted-foreground">
              Aucun match trouvé
            </Typography>
            {statusFilter !== "ALL" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStatusFilter("ALL")}
              >
                Réinitialiser les filtres
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {otherMatches.slice(0, 10).map((match: any) => (
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

        {/* Lien vers la page complète des matchs */}
        {tournamentId && otherMatches.length > 10 && (
          <div className="text-center pt-4">
            <Button variant="outline" asChild className="gap-2">
              <Link
                href={`/tournaments/${tournamentId}/editions/${editionId}/matches`}
              >
                Voir tous les {allMatches.length} matchs
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}

        {/* Message si aucun match en dehors des siens */}
        {userReg?.id && myMatchesTotal > 0 && otherMatches.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p>Aucun autre match programmé pour le moment.</p>
          </div>
        )}
      </div>

      {/* Indicateur de chargement pour les matchs */}
      {isLoading && allMatches.length === 0 && myMatches.length === 0 && (
        <div className="text-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground mt-2">
            Chargement des matchs...
          </p>
        </div>
      )}
    </div>
  );
}
