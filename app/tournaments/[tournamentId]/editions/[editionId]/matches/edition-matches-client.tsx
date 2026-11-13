// app/tournaments/[tournamentId]/editions/[editionId]/matches/edition-matches-client.tsx
"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Calendar,
  Swords,
  Filter,
  ChevronDown,
  ChevronUp,
  Download,
  FileSpreadsheet,
  FileJson,
  FileText,
  Loader2,
  Users,
  Layers,
  Zap,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Search,
  X,
  Star,
} from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useAuthContext } from "@/contexts/auth-context";
import { usePhases } from "@/hooks/use-phase-manager";
import { useGroups } from "@/hooks/use-group-manager";
import { useMatchList, useMyMatches } from "@/hooks/use-match-manager";
import { useEditionDetailTree } from "@/hooks/use-tournament-editions";
import { useEdition } from "@/hooks/use-editions";
import { useIsUserTournamentOrganizer } from "@/hooks/use-tournaments";
import { getEditionMatchesDocument } from "@/actions/documents";
import { downloadDocument } from "@/lib/documents/engine";
import type { DocumentFormat } from "@/lib/documents/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Image from "next/image";
import { StatsCarousel } from "@/components/shared/stats-carousel";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface EditionMatchesClientProps {
  editionId: string;
  tournamentId: string;
}

// Composant pour l'avatar d'un participant
function ParticipantAvatar({
  participant,
  size = "md",
}: {
  participant: any;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  };

  const name =
    participant?.member?.displayName ||
    participant?.member?.user?.username ||
    "?";
  const image =
    participant?.member?.avatar ||
    participant?.member?.user?.profileImage;

  return (
    <div
      className={cn(
        "shrink-0 relative rounded-full bg-card border-2 border-white/10 shadow-lg flex items-center justify-center overflow-hidden font-black text-primary",
        sizeClasses[size],
      )}
    >
      {image ? (
        <Image src={image} fill className="object-cover" alt={name} />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </div>
  );
}

// Composant pour la carte d'un match
function PublicMatchCard({
  match,
  tournamentId,
  editionId,
  userId,
  isAdmin,
}: any) {
  const isUserParticipant =
    match.participant1?.member?.userId === userId ||
    match.participant2?.member?.userId === userId;

  const router = useRouter();

  const isCompleted = match.status === "COMPLETED";
  const isP1Winner = isCompleted && typeof match.score1 === "number" && typeof match.score2 === "number" && match.score1 > match.score2;
  const isP2Winner = isCompleted && typeof match.score1 === "number" && typeof match.score2 === "number" && match.score2 > match.score1;

  const getStatusBadge = () => {
    const status = match.status || "PENDING";
    const config: Record<
      string,
      { label: string; className: string; icon: any }
    > = {
      COMPLETED: {
        label: "Terminé",
        className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
        icon: CheckCircle2,
      },
      IN_PROGRESS: {
        label: "En direct",
        className: "bg-red-500/15 text-red-400 border-red-500/30 animate-pulse",
        icon: Zap,
      },
      PENDING_REVIEW: {
        label: "À valider",
        className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
        icon: AlertCircle,
      },
      DISPUTED: {
        label: "Litige",
        className: "bg-destructive/15 text-destructive border-destructive/30",
        icon: AlertCircle,
      },
      PENDING: {
        label: "Programmé",
        className: "bg-muted/60 text-muted-foreground border-white/10",
        icon: Calendar,
      },
      SCHEDULED: {
        label: "Programmé",
        className: "bg-muted/60 text-muted-foreground border-white/10",
        icon: Calendar,
      },
    };
    const { label, className, icon: Icon } = config[status] || config.PENDING;
    return (
      <Badge
        variant="outline"
        className={cn("text-[9px] uppercase font-black tracking-wider gap-1 px-2 py-0.5", className)}
      >
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const cardContent = (
    <CardContent className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {(isUserParticipant || match._isMyMatch) && (
            <Badge className="bg-primary text-primary-foreground text-[9px] font-black uppercase tracking-wider gap-1 px-2 py-0.5 shadow-md shadow-primary/20">
              <Star className="h-2.5 w-2.5 fill-current" />
              Votre match
            </Badge>
          )}
          <Badge variant="outline" className="text-[9px] font-black uppercase tracking-wider border-white/10 bg-white/5">
            #{String(match.matchNumber || 1).padStart(2, "0")}
          </Badge>
          {match.group?.name && (
            <Badge variant="secondary" className="text-[9px] font-bold border-none bg-primary/10 text-primary">
              {match.group.name}
            </Badge>
          )}
        </div>
        {getStatusBadge()}
      </div>

      {/* Participants */}
      <div className="flex items-center justify-between gap-3">
        {/* Participant 1 */}
        <div className="flex-1 text-center min-w-0">
          <div className="flex justify-center mb-2">
            <div className={cn("relative transition-all", isP1Winner && "ring-2 ring-emerald-500 rounded-full p-0.5")}>
              <ParticipantAvatar participant={match.participant1} size="md" />
              {isP1Winner && (
                <div className="absolute -top-1 -right-1 bg-emerald-500 text-black rounded-full p-0.5 shadow-md">
                  <Trophy className="h-2.5 w-2.5" />
                </div>
              )}
            </div>
          </div>
          <div
            className={cn(
              "text-xs md:text-sm truncate transition-colors",
              isP1Winner ? "font-black text-foreground" : "font-medium text-foreground/80",
            )}
            onClick={(e) => {
              e.preventDefault();
              if (match.participant1?.member?.id) {
                router.push(`/tournaments/${match.tournamentId}/members/${match.participant1.member.id}`);
              }
            }}
          >
            {match.participant1?.member?.displayName ||
              match.participant1?.member?.user?.username ||
              "TBD"}
          </div>
          {match.participant1?.member?.team?.name && (
            <div className="text-[10px] text-muted-foreground truncate font-medium">
              {match.participant1.member.team.name}
            </div>
          )}
        </div>

        {/* Score Box Esports */}
        <div className="shrink-0 flex flex-col items-center gap-1">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-background/80 border border-white/10 rounded-xl font-black text-base shadow-inner">
            <span className={cn(isP1Winner ? "text-emerald-400" : isCompleted ? "text-muted-foreground/60" : "text-foreground")}>
              {match.score1 ?? "-"}
            </span>
            <span className="text-muted-foreground/40 text-xs font-mono">:</span>
            <span className={cn(isP2Winner ? "text-emerald-400" : isCompleted ? "text-muted-foreground/60" : "text-foreground")}>
              {match.score2 ?? "-"}
            </span>
          </div>
          {match.scheduledTime && (
            <div className="text-[10px] text-muted-foreground font-mono">
              {format(new Date(match.scheduledTime), "dd/MM HH:mm")}
            </div>
          )}
        </div>

        {/* Participant 2 */}
        <div className="flex-1 text-center min-w-0">
          <div className="flex justify-center mb-2">
            <div className={cn("relative transition-all", isP2Winner && "ring-2 ring-emerald-500 rounded-full p-0.5")}>
              <ParticipantAvatar participant={match.participant2} size="md" />
              {isP2Winner && (
                <div className="absolute -top-1 -right-1 bg-emerald-500 text-black rounded-full p-0.5 shadow-md">
                  <Trophy className="h-2.5 w-2.5" />
                </div>
              )}
            </div>
          </div>
          <div
            className={cn(
              "text-xs md:text-sm truncate transition-colors",
              isP2Winner ? "font-black text-foreground" : "font-medium text-foreground/80",
            )}
            onClick={(e) => {
              e.preventDefault();
              if (match.participant2?.member?.id) {
                router.push(`/tournaments/${match.tournamentId}/members/${match.participant2.member.id}`);
              }
            }}
          >
            {match.participant2?.member?.displayName ||
              match.participant2?.member?.user?.username ||
              "TBD"}
          </div>
          {match.participant2?.member?.team?.name && (
            <div className="text-[10px] text-muted-foreground truncate font-medium">
              {match.participant2.member.team.name}
            </div>
          )}
        </div>
      </div>
    </CardContent>
  );

  return (
    <Link
      href={`/tournaments/${tournamentId}/editions/${editionId}/matches/${match.id}`}
    >
      <Card
        className={cn(
          "transition-all duration-300 bg-card/70 backdrop-blur-xl border border-white/10 hover:border-primary/50 hover:bg-card/90 hover:shadow-xl cursor-pointer h-full group",
          isUserParticipant &&
            "border-primary/50 bg-primary/10 shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)] ring-1 ring-primary/30",
        )}
      >
        {cardContent}
      </Card>
    </Link>
  );
}

// Composant pour un nœud de bracket (une confrontation entre 2 participants)
function BracketNodeSection({
  node,
  tournamentId,
  editionId,
  userId,
  isAdmin,
  defaultOpen = false,
}: any) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const matches = node.matches || [];

  if (matches.length === 0) return null;

  // Déterminer le nom du nœud.
  // Nouveau modèle RR : 1 node = 1 confrontation (2 participants)
  // → nom metadata/nodeCode. Legacy : node = journée entière
  // (metadata.participants > 2) → libellé à base de round conservé.
  const nodeParticipants = node.metadata?.participants;
  const isLegacyNodeNode =
    Array.isArray(nodeParticipants) && nodeParticipants.length > 2;
  const nodeName = isLegacyNodeNode
    ? node.metadata?.name || node.name || node.nodeCode || `Round ${node.round}`
    : node.metadata?.name ||
      node.nodeCode ||
      `Confrontation ${node.matchNumber}`;
  const nodeType = node.metadata?.nodeType || node.nodeType;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="mb-4">
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="font-bold text-sm">{nodeName}</div>
                <div className="text-[10px] text-muted-foreground">
                  {matches.length} match{matches.length > 1 ? "s" : ""}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[9px]">
                {matches.filter((m: any) => m.status === "COMPLETED").length}/
                {matches.length}
              </Badge>
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {matches.map((match: any) => (
              <PublicMatchCard
                key={match.id}
                match={match}
                tournamentId={tournamentId}
                editionId={editionId}
                userId={userId}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// Composant pour un groupe
function GroupSection({
  group,
  tournamentId,
  editionId,
  userId,
  isAdmin,
}: any) {
  const [isOpen, setIsOpen] = useState(true);
  const nodes = group.bracketNodes || [];
  const directMatches = group.matches || [];

  // Regrouper les matchs par bracketNode
  const matchesByNode = new Map();
  nodes.forEach((node: any) => {
    matchesByNode.set(node.id, node.matches || []);
  });

  // Matchs sans bracketNode
  const orphanMatches = directMatches.filter((m: any) => !m.bracketNodeId);

  if (nodes.length === 0 && orphanMatches.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="mb-6">
        <CollapsibleTrigger asChild>
          <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl cursor-pointer hover:bg-primary/10 transition-colors">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="font-bold">{group.name}</div>
              <div className="text-xs text-muted-foreground">
                {group?.config?.isMatchday === true
                  ? `${nodes.length} ${
                      nodes.length > 1 ? "confrontations" : "confrontation"
                    }`
                  : `${nodes.length} ${
                      nodes.length > 1 ? "journées" : "journée"
                    }`}
              </div>
            </div>
            <Badge variant="secondary">
              {nodes.reduce(
                (acc: number, node: any) => acc + (node.matches?.length || 0),
                0,
              ) + orphanMatches.length}{" "}
              matchs
            </Badge>
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="pl-4 pt-4 space-y-6">
            {/* Nodes (confrontations) */}
            {nodes.map((node: any) => (
              <BracketNodeSection
                key={node.id}
                node={node}
                tournamentId={tournamentId}
                editionId={editionId}
                userId={userId}
                isAdmin={isAdmin}
              />
            ))}

            {/* Matchs orphelins */}
            {orphanMatches.length > 0 && (
              <div className="space-y-3">
                <div className="text-sm font-medium text-muted-foreground">
                  Matchs directs
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {orphanMatches.map((match: any) => (
                    <PublicMatchCard
                      key={match.id}
                      match={match}
                      tournamentId={tournamentId}
                      editionId={editionId}
                      userId={userId}
                      isAdmin={isAdmin}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// Composant pour une phase
function PhaseSection({
  phase,
  tournamentId,
  editionId,
  userId,
  isAdmin,
}: any) {
  const [isOpen, setIsOpen] = useState(true);
  const groups = phase.groups || [];
  const directMatches = phase.matches || [];

  if (groups.length === 0 && directMatches.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="mb-8">
        <CollapsibleTrigger asChild>
          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-primary/10 to-transparent rounded-xl cursor-pointer hover:from-primary/15 transition-colors">
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Layers className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-lg">{phase.name}</div>
              <div className="text-xs text-muted-foreground">
                {phase.phaseType === "ROUND_ROBIN"
                  ? "Championnat"
                  : phase.phaseType === "GROUP_STAGE"
                    ? "Phase de groupes"
                    : phase.phaseType === "ELIMINATION"
                      ? "Élimination directe"
                      : "Phase"}
              </div>
            </div>
            <Badge variant="secondary" className="text-sm">
              {groups.reduce(
                (acc: number, g: any) =>
                  acc +
                  (g.bracketNodes?.length || 0) +
                  (g.matches?.length || 0),
                0,
              ) + directMatches.length}{" "}
              matchs
            </Badge>
            {isOpen ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="pl-6 pt-6 space-y-6">
            {/* Groups */}
            {groups.map((group: any) => (
              <GroupSection
                key={group.id}
                group={group}
                tournamentId={tournamentId}
                editionId={editionId}
                userId={userId}
                isAdmin={isAdmin}
              />
            ))}

            {/* Matchs directs de la phase */}
            {directMatches.length > 0 && (
              <div className="space-y-4">
                <div className="text-sm font-medium text-muted-foreground">
                  Matchs de la phase
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {directMatches.map((match: any) => (
                    <PublicMatchCard
                      key={match.id}
                      match={match}
                      tournamentId={tournamentId}
                      editionId={editionId}
                      userId={userId}
                      isAdmin={isAdmin}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// Composant principal
export function EditionMatchesClient({
  editionId,
  tournamentId,
}: EditionMatchesClientProps) {
  const { user } = useAuthContext();
  const [viewMode, setViewMode] = useState<"tree" | "list">("list");
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>("all");
  const [selectedGroupId, setSelectedGroupId] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showOnlyMyMatches, setShowOnlyMyMatches] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(val);
    }, 300);
  };

  // Fetch data
  const { data: edition } = useEdition(editionId);
  const { data: editionTree, isLoading: isLoadingTree } =
    useEditionDetailTree(editionId);
  const { data: phasesRes, isLoading: isLoadingPhases } = usePhases(editionId);
  const { data: isOrganizer } = useIsUserTournamentOrganizer(
    edition?.tournamentId || "",
    user?.id || "",
  );
  const router = useRouter();

  // Fetch matches for list view with active filters
  const { data: matchesRes, isLoading: isLoadingMatches } = useMatchList({
    filters: {
      editionId,
      phaseId: selectedPhaseId !== "all" ? selectedPhaseId : undefined,
      groupId: selectedGroupId !== "all" ? selectedGroupId : undefined,
      statuses: statusFilter !== "ALL" ? ([statusFilter] as any) : undefined,
      search: debouncedSearch.trim() || undefined,
    },
    pagination: { limit: 200, page: 1 },
    options: { sortBy: "scheduledTime", sortOrder: "asc" },
  });

  const { data: myMatches } = useMyMatches(editionId, user?.id || "");

  const phases = phasesRes?.data || [];
  const rawMatches = matchesRes?.data || [];

  // Priorisation : mettre les matchs du user en premier dans la liste
  const prioritizedMatches = useMemo(() => {
    if (!user?.id) return rawMatches;
    const mine: any[] = [];
    const others: any[] = [];
    for (const m of rawMatches) {
      const isMine =
        m.participant1?.member?.userId === user.id ||
        m.participant2?.member?.userId === user.id;
      if (isMine) {
        mine.push({ ...m, _isMyMatch: true });
      } else {
        others.push({ ...m, _isMyMatch: false });
      }
    }
    return [...mine, ...others];
  }, [rawMatches, user?.id]);

  const matches = useMemo(() => {
    if (showOnlyMyMatches && user?.id) {
      return prioritizedMatches.filter((m: any) => m._isMyMatch);
    }
    return prioritizedMatches;
  }, [prioritizedMatches, showOnlyMyMatches, user?.id]);

  // Match statistics for StatsCarousel
  const stats = useMemo(() => {
    const total = matches.length;
    const completed = matches.filter((m: any) => m.status === "COMPLETED").length;
    const inProgress = matches.filter(
      (m: any) => m.status === "IN_PROGRESS" || m.status === "LIVE",
    ).length;
    const upcoming = matches.filter(
      (m: any) =>
        m.status === "SCHEDULED" ||
        m.status === "UPCOMING" ||
        m.status === "PENDING",
    ).length;
    const userMatchesCount = myMatches?.myMatches?.length || 0;
    return { total, completed, inProgress, upcoming, userMatchesCount };
  }, [matches, myMatches]);

  // Filter tree data based on selected phase
  const phasesWithMatches = useMemo(() => {
    const allPhases = editionTree?.phases || [];
    if (selectedPhaseId === "all") return allPhases;
    return allPhases.filter((p: any) => p.id === selectedPhaseId);
  }, [editionTree, selectedPhaseId]);

  const groupsInSelectedPhase = useMemo(() => {
    if (selectedPhaseId === "all") return [];
    const phase = editionTree?.phases?.find(
      (p: any) => p.id === selectedPhaseId,
    );
    return phase?.groups || [];
  }, [editionTree, selectedPhaseId]);

  useEffect(() => {
    setSelectedGroupId("all");
  }, [selectedPhaseId]);

  const isLoading = isLoadingTree || isLoadingPhases || isLoadingMatches;

  // Export — données et autorisations construites côté serveur.
  const handleExport = useCallback(
    async (format: DocumentFormat, scope: "all" | "phase") => {
      try {
        const filters: { phaseId?: string } = {};
        if (scope === "phase" && selectedPhaseId !== "all") {
          filters.phaseId = selectedPhaseId;
        }

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
      }
    },
    [editionId, selectedPhaseId],
  );

  // Mes matchs section
  const MyMatchesCard = () => {
    if (!myMatches?.myMatches.length) return null;

    return (
      <Card className="border-primary/30 bg-primary/5 mb-8 backdrop-blur-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 font-black italic uppercase tracking-tighter">
            <Swords className="h-5 w-5 text-primary" />
            🔥 Mes affrontements
            <Badge className="bg-primary text-primary-foreground font-black ml-1">
              {myMatches.myMatches.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myMatches.myMatches.map((match: any) => (
              <PublicMatchCard
                key={match.id}
                match={match}
                tournamentId={tournamentId}
                editionId={editionId}
                userId={user?.id}
                isAdmin={isOrganizer}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container max-w-6xl mx-auto py-6 px-4">
      {/* Esports Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary shadow-lg shadow-primary/5">
            <Swords className="h-6 w-6" />
          </div>
          <div>
            <Typography
              variant="h2"
              weight="bold"
              className="font-black italic uppercase tracking-tighter text-2xl md:text-3xl text-foreground"
            >
              Matchs & Affrontements
            </Typography>
            <Typography variant="body-sm" theme="muted" className="text-xs uppercase tracking-wider font-semibold">
              {edition?.name || `Édition #${edition?.editionNumber}`}
            </Typography>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Recherche textuelle en temps réel */}
          <div className="relative min-w-[200px] sm:min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              className="w-full h-9 pl-9 pr-7 rounded-xl border border-white/10 bg-card/60 text-xs font-semibold placeholder:text-muted-foreground/60 focus:ring-1 focus:ring-primary outline-none transition-all"
              placeholder="Rechercher joueur, équipe..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setDebouncedSearch("");
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:text-destructive text-muted-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filtre par statut */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-9 bg-card/60 border-white/10 text-xs font-semibold">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous statuts</SelectItem>
              <SelectItem value="PENDING">À venir</SelectItem>
              <SelectItem value="IN_PROGRESS">En direct</SelectItem>
              <SelectItem value="COMPLETED">Terminés</SelectItem>
              <SelectItem value="DISPUTED">Litiges</SelectItem>
            </SelectContent>
          </Select>

          {/* Toggle Mes matchs */}
          {user?.id && (
            <Button
              variant={showOnlyMyMatches ? "default" : "outline"}
              size="sm"
              onClick={() => setShowOnlyMyMatches(!showOnlyMyMatches)}
              className={cn(
                "h-9 gap-1.5 font-bold text-xs rounded-xl border-white/10",
                showOnlyMyMatches && "shadow-lg shadow-primary/20",
              )}
            >
              <Star className={cn("h-3.5 w-3.5", showOnlyMyMatches && "fill-white")} />
              <span className="hidden sm:inline">Mes matchs</span>
            </Button>
          )}

          {/* Phase filter for list view */}
          {viewMode === "list" && phases.length > 0 && (
            <Select value={selectedPhaseId} onValueChange={setSelectedPhaseId}>
              <SelectTrigger className="w-[180px] bg-card/60 border-white/10 text-xs font-semibold">
                <SelectValue placeholder="Toutes les phases" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les phases</SelectItem>
                {phases.map((phase: any) => (
                  <SelectItem key={phase.id} value={phase.id}>
                    {phase.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* View toggle */}
          <div className="flex bg-muted/60 border border-white/5 p-1 rounded-xl">
            <Button
              variant={viewMode === "tree" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("tree")}
              className="h-8 gap-1.5 font-bold text-xs rounded-lg"
            >
              <Layers className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Structure</span>
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-8 gap-1.5 font-bold text-xs rounded-lg"
            >
              <Filter className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Liste</span>
            </Button>
          </div>

          {/* Export button — réservé aux organisateurs (vérifié aussi serveur) */}
          {isOrganizer && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 border-white/10 bg-card/60 text-xs font-bold rounded-xl h-8">
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Exporter</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card/95 backdrop-blur-xl border-white/10">
                <DropdownMenuLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Format d&apos;export</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={() => void handleExport("xlsx", "all")} className="text-xs font-medium cursor-pointer">
                  <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-400" /> Excel - Tous les matchs
                </DropdownMenuItem>
                {selectedPhaseId !== "all" && (
                  <DropdownMenuItem
                    onClick={() => void handleExport("xlsx", "phase")}
                    className="text-xs font-medium cursor-pointer"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-400" /> Excel - Phase active
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => void handleExport("csv", "all")} className="text-xs font-medium cursor-pointer">
                  <FileSpreadsheet className="h-4 w-4 mr-2 text-blue-400" /> CSV - Tous les matchs
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void handleExport("json", "all")} className="text-xs font-medium cursor-pointer">
                  <FileJson className="h-4 w-4 mr-2 text-amber-400" /> JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void handleExport("pdf", "all")} className="text-xs font-medium cursor-pointer">
                  <FileText className="h-4 w-4 mr-2 text-red-400" /> PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Stats rapides Esports */}
      <div className="mb-8">
        <StatsCarousel
          data={[
            {
              title: "Total Matchs",
              value: stats.total,
              icon: <Swords className="h-5 w-5" />,
              className: "bg-blue-500/10 text-blue-500 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]",
            },
            {
              title: "En Direct",
              value: stats.inProgress,
              icon: <Zap className="h-5 w-5" />,
              className: "bg-red-500/10 text-red-500 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]",
            },
            {
              title: "Terminés",
              value: stats.completed,
              icon: <CheckCircle2 className="h-5 w-5" />,
              className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]",
            },
            {
              title: "À Venir",
              value: stats.upcoming,
              icon: <Clock className="h-5 w-5" />,
              className: "bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]",
            },
            {
              title: "Mes Matchs",
              value: stats.userMatchesCount,
              icon: <Users className="h-5 w-5" />,
              className: "bg-purple-500/10 text-purple-500 border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]",
            },
          ]}
          itemsPerView={{ mobile: 2, lg: 5 }}
        />
      </div>

      {/* Mes matchs */}
      {user?.id && <MyMatchesCard />}

      {/* Loading state */}
      {isLoading && (
        <Card className="border-none shadow-none bg-transparent">
          <CardContent className="py-20 text-center">
            <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto rounded-full" />
            <p className="mt-4 text-muted-foreground">
              Chargement des matchs...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tree view - Organisation par phases > groupes > brackets */}
      {!isLoading && viewMode === "tree" && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Phase Selector */}
          {phases.length > 0 && (
            <div className="bg-card/50 p-2 rounded-2xl border flex items-center gap-2 overflow-x-auto scrollbar-hide">
              <Button
                variant={selectedPhaseId === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedPhaseId("all")}
                className={cn(
                  "rounded-xl transition-all font-bold",
                  selectedPhaseId === "all" && "shadow-lg",
                )}
              >
                Toutes les phases
              </Button>
              {phases.map((phase: any) => (
                <Button
                  key={phase.id}
                  variant={selectedPhaseId === phase.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedPhaseId(phase.id)}
                  className={cn(
                    "rounded-xl transition-all font-bold",
                    selectedPhaseId === phase.id && "shadow-lg",
                  )}
                >
                  {phase.name}
                </Button>
              ))}
            </div>
          )}

          {/* Group Selector with StatsCarousel */}
          {selectedPhaseId !== "all" && groupsInSelectedPhase.length > 0 && (
            <div className="space-y-3">
              <Typography
                variant="body-sm"
                weight="bold"
                theme="muted"
                className="px-2 uppercase tracking-widest"
              >
                Groupes
              </Typography>
              <StatsCarousel
                mode="auto"
                itemsPerView={{ mobile: 2, md: 3, lg: 4, xl: 5 }}
                gap={10}
                className="pb-2"
              >
                <Button
                  variant={selectedGroupId === "all" ? "default" : "outline"}
                  className={cn(
                    "w-full h-16 rounded-2xl flex flex-col items-center justify-center gap-1 border-2 transition-all",
                    selectedGroupId === "all"
                      ? "border-primary shadow-lg shadow-primary/20"
                      : "hover:border-primary/50 hover:bg-primary/5",
                  )}
                  onClick={() => setSelectedGroupId("all")}
                >
                  <Layers className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase">Tous</span>
                </Button>
                {groupsInSelectedPhase.map((group: any) => (
                  <Button
                    key={group.id}
                    variant={
                      selectedGroupId === group.id ? "default" : "outline"
                    }
                    className={cn(
                      "w-full h-16 rounded-2xl flex flex-col items-center justify-center gap-1 border-2 transition-all",
                      selectedGroupId === group.id
                        ? "border-primary shadow-lg shadow-primary/20"
                        : "hover:border-primary/50 hover:bg-primary/5",
                    )}
                    onClick={() => setSelectedGroupId(group.id)}
                  >
                    <Users className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase truncate max-w-full px-2">
                      {group.name}
                    </span>
                  </Button>
                ))}
              </StatsCarousel>
            </div>
          )}

          {phasesWithMatches.length === 0 ? (
            <Card className="border-dashed py-20 bg-muted/20">
              <CardContent className="text-center">
                <Trophy className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                <Typography variant="body-lg" theme="muted" weight="medium">
                  Aucun match n'est encore programmé.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-12">
              {phasesWithMatches.map((phase: any) => (
                <div key={phase.id} className="space-y-6">
                  {/* Only show phase header if viewing all phases */}
                  {selectedPhaseId === "all" && (
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
                      <Typography
                        variant="h4"
                        weight="bold"
                        className="uppercase tracking-tighter text-muted-foreground/50"
                      >
                        {phase.name}
                      </Typography>
                      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
                    </div>
                  )}

                  <div className="space-y-8">
                    {(phase.groups || [])
                      .filter(
                        (g: any) =>
                          selectedGroupId === "all" || g.id === selectedGroupId,
                      )
                      .map((group: any) => (
                        <GroupSection
                          key={group.id}
                          group={group}
                          tournamentId={tournamentId}
                          editionId={editionId}
                          userId={user?.id}
                          isAdmin={isOrganizer}
                        />
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* List view - Simple liste avec filtres */}
      {!isLoading && viewMode === "list" && (
        <div className="space-y-4">
          {matches.length === 0 ? (
            <Card className="border-dashed py-12">
              <CardContent className="text-center">
                <Filter className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <Typography variant="body-base" theme="muted">
                  Aucun match ne correspond aux filtres sélectionnés.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matches.map((match: any) => (
                <PublicMatchCard
                  key={match.id}
                  match={match}
                  tournamentId={tournamentId}
                  editionId={editionId}
                  userId={user?.id}
                  isAdmin={isOrganizer}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer stats */}
      {!isLoading && matches.length > 0 && (
        <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>
                Terminés:{" "}
                {matches.filter((m: any) => m.status === "COMPLETED").length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span>
                En cours:{" "}
                {matches.filter((m: any) => m.status === "IN_PROGRESS").length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                Programmés:{" "}
                {matches.filter((m: any) => m.status === "PENDING").length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
