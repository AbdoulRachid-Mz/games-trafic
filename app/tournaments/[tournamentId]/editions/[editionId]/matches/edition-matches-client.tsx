// app/tournaments/[tournamentId]/editions/[editionId]/matches/edition-matches-client.tsx
"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
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
  AlertCircle
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuthContext } from "@/contexts/auth-context";
import { usePhases } from "@/hooks/use-phase-manager";
import { useGroups } from "@/hooks/use-group-manager";
import { useMatchList, useMyMatches } from "@/hooks/use-match-manager";
import { useEditionDetailTree } from "@/hooks/use-tournament-editions";
import { useEdition } from "@/hooks/use-editions";
import { useIsUserTournamentOrganizer } from "@/hooks/use-tournaments";
import { exportMatchesToFormat } from "@/actions/editions";
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
function ParticipantAvatar({ participant, size = "md" }: { participant: any; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12"
  };

  const router = useRouter();
  
  const name = participant?.member?.displayName || participant?.member?.user?.username || "?";
  const image = participant?.member?.avatar || participant?.member?.user?.profileImage || "icons/avatar.png";
  
  return (
    <div className={cn("shrink-0 relative rounded-full bg-muted border-2 border-background shadow-sm flex items-center justify-center overflow-hidden", sizeClasses[size])}>
      {image ? (
        <Image src={image} fill className="object-cover" alt={name} />
      ) : (
        <Users className="h-4 w-4 text-muted-foreground/50" />
      )}
    </div>
  );
}

// Composant pour la carte d'un match
function PublicMatchCard({ match, tournamentId, editionId, userId, isAdmin }: any) {
  const isUserParticipant = match.participant1?.member?.userId === userId || match.participant2?.member?.userId === userId;
  
  const router = useRouter();

  const getScoreClass = () => {
    if (!match.score1 || !match.score2) return "";
    if (match.score1 > match.score2) return "text-emerald-600 font-bold";
    if (match.score2 > match.score1) return "text-emerald-600 font-bold";
    return "";
  };
  
  const getStatusBadge = () => {
    const status = match.status || "PENDING";
    const config: Record<string, { label: string; className: string; icon: any }> = {
      COMPLETED: { label: "Terminé", className: "bg-emerald-500/10 text-emerald-600 border-emerald-200", icon: CheckCircle2 },
      IN_PROGRESS: { label: "En cours", className: "bg-blue-500/10 text-blue-600 border-blue-200", icon: Clock },
      PENDING_REVIEW: { label: "À valider", className: "bg-amber-500/10 text-amber-600 border-amber-200", icon: AlertCircle },
      DISPUTED: { label: "Litige", className: "bg-destructive/10 text-destructive border-destructive/20", icon: AlertCircle },
      PENDING: { label: "Programmé", className: "bg-muted text-muted-foreground border-border", icon: Calendar },
    };
    const { label, className, icon: Icon } = config[status] || config.PENDING;
    return <Badge variant="outline" className={cn("text-[10px] uppercase font-bold gap-1", className)}><Icon className="h-3 w-3" />{label}</Badge>;
  };

  const cardContent = (
    <CardContent className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[9px]">
            #{match.matchNumber}
          </Badge>
          {match.group?.name && (
            <Badge variant="secondary" className="text-[9px]">
              {match.group.name}
            </Badge>
          )}
        </div>
        {getStatusBadge()}
      </div>
      
      {/* Participants */}
      <div className="flex items-center justify-between gap-3">
        {/* Participant 1 */}
        <div className="flex-1 text-center" >
          <div className="flex justify-center mb-2">
            <ParticipantAvatar participant={match.participant1} size="md" />
          </div>
          <div className="font-medium text-sm truncate" onClick={() => router.push(`/tournaments/${match.tournamentId}/members/${match.participant1?.member?.id}`)}>
            {match.participant1?.member?.displayName || 
             match.participant1?.member?.user?.username || 
             "TBD"}
          </div>
          {match.participant1?.member?.team?.name && (
            <div className="text-[10px] text-muted-foreground truncate">
              {match.participant1.member.team.name}
            </div>
          )}
        </div>
        
        {/* Score */}
        <div className="shrink-0 flex flex-col items-center gap-1">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg font-bold text-lg">
            <span className={getScoreClass()}>{match.score1 ?? "-"}</span>
            <span className="text-muted-foreground text-sm">-</span>
            <span className={getScoreClass()}>{match.score2 ?? "-"}</span>
          </div>
          {match.scheduledTime && (
            <div className="text-[10px] text-muted-foreground">
              {format(new Date(match.scheduledTime), "dd/MM HH:mm")}
            </div>
          )}
        </div>
        
        {/* Participant 2 */}
        <div className="flex-1 text-center">
          <div className="flex justify-center mb-2">
            <ParticipantAvatar participant={match.participant2} size="md" />
          </div>
          <div className="font-medium text-sm truncate">
            {match.participant2?.member?.displayName || 
             match.participant2?.member?.user?.username || 
             "TBD"}
          </div>
          {match.participant2?.member?.team?.name && (
            <div className="text-[10px] text-muted-foreground truncate">
              {match.participant2.member.team.name}
            </div>
          )}
        </div>
      </div>
    </CardContent>
  );
  
  return (
    <Link href={`/tournaments/${tournamentId}/editions/${editionId}/matches/${match.id}`}>
      <Card className={cn(
        "transition-all hover:shadow-xl hover:border-primary/50 cursor-pointer h-full group", 
        isUserParticipant && "border-primary/50 bg-primary/5 shadow-primary/5"
      )}>
        {cardContent}
      </Card>
    </Link>
  );
}

// Composant pour un nœud de bracket (journée/round)
function BracketNodeSection({ 
  node, 
  tournamentId, 
  editionId, 
  userId, 
  isAdmin,
  defaultOpen = false 
}: any) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const matches = node.matches || [];
  
  if (matches.length === 0) return null;
  
  // Déterminer le nom du nœud
  const nodeName = node.metadata?.name || node.name || node.nodeCode || `Round ${node.round}`;
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
                {matches.filter((m: any) => m.status === "COMPLETED").length}/{matches.length}
              </Badge>
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
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
function GroupSection({ group, tournamentId, editionId, userId, isAdmin }: any) {
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
                {nodes.length} {nodes.length > 1 ? "journées" : "journée"}
              </div>
            </div>
            <Badge variant="secondary">
              {nodes.reduce((acc: number, node: any) => acc + (node.matches?.length || 0), 0) + orphanMatches.length} matchs
            </Badge>
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="pl-4 pt-4 space-y-6">
            {/* Nodes (journées) */}
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
                <div className="text-sm font-medium text-muted-foreground">Matchs directs</div>
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
function PhaseSection({ phase, tournamentId, editionId, userId, isAdmin }: any) {
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
                {phase.phaseType === "ROUND_ROBIN" ? "Championnat" : 
                 phase.phaseType === "GROUP_STAGE" ? "Phase de groupes" :
                 phase.phaseType === "ELIMINATION" ? "Élimination directe" : "Phase"}
              </div>
            </div>
            <Badge variant="secondary" className="text-sm">
              {groups.reduce((acc: number, g: any) => acc + (g.bracketNodes?.length || 0) + (g.matches?.length || 0), 0) + directMatches.length} matchs
            </Badge>
            {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
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
                <div className="text-sm font-medium text-muted-foreground">Matchs de la phase</div>
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
export function EditionMatchesClient({ editionId, tournamentId }: EditionMatchesClientProps) {
  const { user } = useAuthContext();
  const [viewMode, setViewMode] = useState<"tree" | "list">("tree");
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>("all");
  const [selectedGroupId, setSelectedGroupId] = useState<string>("all");
  
  // Fetch data
  const { data: edition } = useEdition(editionId);
  const { data: editionTree, isLoading: isLoadingTree } = useEditionDetailTree(editionId);
  const { data: phasesRes, isLoading: isLoadingPhases } = usePhases(editionId);
  const { data: isOrganizer } = useIsUserTournamentOrganizer(
    edition?.tournamentId || "",
    user?.id || "",
  );
  
  // Fetch matches for list view
  const { data: matchesRes, isLoading: isLoadingMatches } = useMatchList({
    filters: { editionId, phaseId: selectedPhaseId !== "all" ? selectedPhaseId : undefined },
    pagination: { limit: 200, page: 1 }
  });
  
  const { data: myMatches } = useMyMatches(editionId, user?.id || "");
  
  const phases = phasesRes?.data || [];
  const matches = matchesRes?.data || [];
  
  // Filter tree data based on selected phase
  const phasesWithMatches = useMemo(() => {
    const allPhases = editionTree?.phases || [];
    if (selectedPhaseId === "all") return allPhases;
    return allPhases.filter((p: any) => p.id === selectedPhaseId);
  }, [editionTree, selectedPhaseId]);

  const groupsInSelectedPhase = useMemo(() => {
    if (selectedPhaseId === "all") return [];
    const phase = editionTree?.phases?.find((p: any) => p.id === selectedPhaseId);
    return phase?.groups || [];
  }, [editionTree, selectedPhaseId]);

  useEffect(() => {
    setSelectedGroupId("all");
  }, [selectedPhaseId]);
  
  const isLoading = isLoadingTree || isLoadingPhases || isLoadingMatches;
  
  // Export handlers
  const handleExport = useCallback(async (format: "csv" | "json" | "pdf" | "excel", scope: "all" | "phase") => {
    try {
      const { exportData: exportToFormat, createExportData } = await import("@/utils/export-utils");
      
      const filters: any = { editionId };
      if (scope === "phase" && selectedPhaseId !== "all") {
        filters.phaseId = selectedPhaseId;
      }
      
      const result = await exportMatchesToFormat(editionId, format, filters);
      if (result.success && result.data) {
        const rawData = JSON.parse(result.data);
        const config = {
          filename: result.filename || `matches_${scope}_${editionId}`,
          title: scope === "phase" ? `Matchs - Phase ${selectedPhaseId}` : "Tous les matchs",
          subtitle: `Édition: ${editionId.slice(0, 8)}`,
        };

        const tableData = createExportData(rawData, "matches");
        await exportToFormat(format, tableData, config);

        toast.success(`Export ${format.toUpperCase()} réussi`, {
          description: `${result.count || rawData.length} matchs exportés`
        });
      } else {
        toast.error(result.error || "Erreur lors de l'export");
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'export");
    }
  }, [editionId, selectedPhaseId]);
  
  // Mes matchs section
  const MyMatchesCard = () => {
    if (!myMatches?.myMatches.length) return null;
    
    return (
      <Card className="border-primary/30 bg-primary/5 mb-8">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Swords className="h-5 w-5 text-primary" />
            🔥 Mes matchs
            <Badge variant="default">{myMatches.myMatches.length}</Badge>
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
    <div className="container max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <Typography variant="h2" weight="bold" className="flex items-center gap-2">
            <Trophy className="h-7 w-7 text-primary" />
            Matchs du tournoi
          </Typography>
          <Typography variant="body-sm" theme="muted">
            {edition?.name || `Édition ${edition?.editionNumber}`}
          </Typography>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Phase filter for list view */}
          {viewMode === "list" && phases.length > 0 && (
            <Select value={selectedPhaseId} onValueChange={setSelectedPhaseId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Toutes les phases" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les phases</SelectItem>
                {phases.map((phase: any) => (
                  <SelectItem key={phase.id} value={phase.id}>{phase.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {/* View toggle */}
          <div className="flex bg-muted p-1 rounded-lg">
            <Button
              variant={viewMode === "tree" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("tree")}
              className="h-8 gap-1"
            >
              <Layers className="h-3.5 w-3.5" />
              <span className="text-xs hidden sm:inline">Structure</span>
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-8 gap-1"
            >
              <Filter className="h-3.5 w-3.5" />
              <span className="text-xs hidden sm:inline">Liste</span>
            </Button>
          </div>
          
          {/* Export button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Exporter</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Format d'export</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleExport("excel", "all")}>
                <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel - Tous les matchs
              </DropdownMenuItem>
              {selectedPhaseId !== "all" && (
                <DropdownMenuItem onClick={() => handleExport("excel", "phase")}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel - Cette phase
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => handleExport("csv", "all")}>
                <FileSpreadsheet className="h-4 w-4 mr-2" /> CSV - Tous les matchs
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("json", "all")}>
                <FileJson className="h-4 w-4 mr-2" /> JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("pdf", "all")}>
                <FileText className="h-4 w-4 mr-2" /> PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Mes matchs */}
      {user?.id && <MyMatchesCard />}
      
      {/* Loading state */}
      {isLoading && (
        <Card className="border-none shadow-none bg-transparent">
          <CardContent className="py-20 text-center">
            <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto rounded-full" />
            <p className="mt-4 text-muted-foreground">Chargement des matchs...</p>
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
                className={cn("rounded-xl transition-all font-bold", selectedPhaseId === "all" && "shadow-lg")}
              >
                Toutes les phases
              </Button>
              {phases.map((phase: any) => (
                <Button
                  key={phase.id}
                  variant={selectedPhaseId === phase.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedPhaseId(phase.id)}
                  className={cn("rounded-xl transition-all font-bold", selectedPhaseId === phase.id && "shadow-lg")}
                >
                  {phase.name}
                </Button>
              ))}
            </div>
          )}

          {/* Group Selector with StatsCarousel */}
          {selectedPhaseId !== "all" && groupsInSelectedPhase.length > 0 && (
            <div className="space-y-3">
              <Typography variant="body-sm" weight="bold" theme="muted" className="px-2 uppercase tracking-widest">
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
                  className={cn("w-full h-16 rounded-2xl flex flex-col items-center justify-center gap-1 border-2 transition-all", 
                    selectedGroupId === "all" ? "border-primary shadow-lg shadow-primary/20" : "hover:border-primary/50 hover:bg-primary/5")
                  }
                  onClick={() => setSelectedGroupId("all")}
                >
                  <Layers className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase">Tous</span>
                </Button>
                {groupsInSelectedPhase.map((group: any) => (
                  <Button
                    key={group.id}
                    variant={selectedGroupId === group.id ? "default" : "outline"}
                    className={cn("w-full h-16 rounded-2xl flex flex-col items-center justify-center gap-1 border-2 transition-all", 
                      selectedGroupId === group.id ? "border-primary shadow-lg shadow-primary/20" : "hover:border-primary/50 hover:bg-primary/5")
                    }
                    onClick={() => setSelectedGroupId(group.id)}
                  >
                    <Users className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase truncate max-w-full px-2">{group.name}</span>
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
                      <Typography variant="h4" weight="bold" className="uppercase tracking-tighter text-muted-foreground/50">
                        {phase.name}
                      </Typography>
                      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
                    </div>
                  )}
                  
                  <div className="space-y-8">
                    {(phase.groups || [])
                      .filter((g: any) => selectedGroupId === "all" || g.id === selectedGroupId)
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
              <span>Terminés: {matches.filter((m: any) => m.status === "COMPLETED").length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span>En cours: {matches.filter((m: any) => m.status === "IN_PROGRESS").length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Programmés: {matches.filter((m: any) => m.status === "PENDING").length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}