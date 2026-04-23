// app/tournaments/[tournamentId]/editions/[editionId]/dashboard/matches/page.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import Link from "next/link";
import {
  Swords,
  Calendar,
  Clock, ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  User as UserIcon,
  AlertCircle, FolderTree,
  ListTree,
  Grid3X3, Zap,
  Layers,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Image from "next/image";
import { MatchesDashboardFilters } from "@/components/pages/tournaments/edition-detail/matches-dashboard-filters";
import { ExportMatchesButton } from "@/components/pages/tournaments/edition-detail/export-matches-button";
import { useQuery } from "@tanstack/react-query";
import { getTournamentPhases, getMatches, getEditionDetailTree } from "@/actions/tournaments";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

function StatusBadge({ status }: { status: string | null | undefined }) {
  const s = status || "PENDING";
  const config: Record<string, { label: string; className: string }> = {
    COMPLETED: { label: "Terminé", className: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
    IN_PROGRESS: { label: "En cours", className: "bg-blue-500/10 text-blue-600 border-blue-200" },
    PENDING_REVIEW: { label: "À valider", className: "bg-amber-500/10 text-amber-600 border-amber-200" },
    DISPUTED: { label: "Litige", className: "bg-destructive/10 text-destructive border-destructive/20" },
    AWAITING_ADMIN_CONFIRMATION: { label: "Validation admin", className: "bg-purple-500/10 text-purple-600 border-purple-200" },
    PENDING: { label: "En attente", className: "bg-muted text-muted-foreground border-border" },
  };
  const { label, className } = config[s] || config.PENDING;
  return (
    <Badge variant="outline" className={cn("text-[10px] uppercase font-bold", className)}>
      {label}
    </Badge>
  );
}

function ParticipantAvatar({ participant }: { participant: any }) {
  const name = participant?.member?.displayName || participant?.member?.user?.fullName || "?";
  const image = participant?.member?.avatar || participant?.member?.user?.profileImage || participant?.member?.user?.image;
  
  return (
    <div className="h-10 w-10 shrink-0 relative rounded-full bg-muted border-2 border-background shadow-sm flex items-center justify-center overflow-hidden">
      {image ? (
        <Image src={image} fill className="object-cover" alt={name} />
      ) : (
        <UserIcon className="h-5 w-5 text-muted-foreground/50" />
      )}
    </div>
  );
}

function MatchCard({ match, tournamentId, editionId }: { match: any; tournamentId: string; editionId: string }) {
  return (
    <Card className="group hover:border-primary/40 transition-all">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row items-stretch md:items-center">
          {/* Left: Info */}
          <div className="p-4 flex-1 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 border-b md:border-b-0 md:border-r border-border/50">
            <div className="w-24 shrink-0">
              <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">
                {match.phase?.name || "Match"}
              </div>
              <div className="text-sm font-bold flex items-center gap-1.5">
                <Swords className="h-3.5 w-3.5 text-primary" />
                #{match.matchNumber}
              </div>
              {match.group?.name && (
                <div className="text-[9px] text-muted-foreground mt-1 truncate">
                  {match.group.name}
                </div>
              )}
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Calendar className="h-3 w-3" />
                {match.scheduledTime ? format(new Date(match.scheduledTime), "d MMMM yyyy", { locale: fr }) : "Non planifié"}
              </div>
              <div className="flex items-center gap-2 text-xs font-medium">
                <Clock className="h-3 w-3" />
                {match.scheduledTime ? format(new Date(match.scheduledTime), "HH:mm") : "--:--"}
              </div>
            </div>

            <div className="ml-auto sm:ml-0">
              <StatusBadge status={match.status} />
            </div>
          </div>

          {/* Middle: Participants & Score */}
          <div className="p-4 md:p-6 flex-[2] bg-muted/5 group-hover:bg-primary/5 transition-colors">
            <div className="flex items-center justify-between gap-4 max-w-xl mx-auto">
              {/* P1 */}
              <div className="flex-1 flex flex-col items-center sm:flex-row sm:items-center gap-3 text-center sm:text-left min-w-0">
                <ParticipantAvatar participant={match.participant1} />
                <div className="truncate w-full">
                  <div className="text-sm font-bold truncate">
                    {match.participant1?.member?.displayName || match.participant1?.member?.user?.fullName || "À déterminer"}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate uppercase">
                    {match.participant1?.member?.team?.name || "Joueur Solo"}
                  </div>
                </div>
              </div>

              {/* Score */}
              <div className="shrink-0 flex items-center gap-3 px-4 py-2 bg-background rounded-lg border shadow-sm font-black text-lg min-w-20 justify-center">
                <span className={cn(match.score1 > match.score2 && "text-primary")}>{match.score1 ?? "-"}</span>
                <span className="text-muted-foreground/30 text-xs">VS</span>
                <span className={cn(match.score2 > match.score1 && "text-primary")}>{match.score2 ?? "-"}</span>
              </div>

              {/* P2 */}
              <div className="flex-1 flex flex-col-reverse items-center sm:flex-row sm:items-center gap-3 text-center sm:text-right min-w-0">
                <div className="truncate w-full">
                  <div className="text-sm font-bold truncate">
                    {match.participant2?.member?.displayName || match.participant2?.member?.user?.fullName || "À déterminer"}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate uppercase">
                    {match.participant2?.member?.team?.name || "Joueur Solo"}
                  </div>
                </div>
                <ParticipantAvatar participant={match.participant2} />
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="p-4 flex shrink-0 items-center justify-center border-t md:border-t-0 md:border-l border-border/50">
            <Button variant="outline" size="sm" className="h-9 gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-all" asChild>
              <Link href={`/tournaments/${tournamentId}/editions/${editionId}/matches/${match.id}`}>
                Gérer <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MatchTreeNode({ node, tournamentId, editionId, depth = 0 }: { node: any; tournamentId: string; editionId: string; depth?: number }) {
  const [isOpen, setIsOpen] = useState(depth < 1); // Only first level open by default
  const hasChildren = (node.children && node.children.length > 0) || (node.matches && node.matches.length > 0);
  const matches = node.matches || [];

  return (
    <div className="space-y-1">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className={cn(
          "flex items-center gap-2 py-2.5 px-3 rounded-xl transition-all border",
          isOpen ? "bg-muted/50 border-primary/20" : "bg-card hover:bg-muted/30 border-transparent shadow-sm"
        )}>
          {hasChildren ? (
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full shrink-0">
                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
          ) : (
            <div className="w-7 shrink-0" />
          )}
          
          <div className="flex-1 flex items-center gap-3 overflow-hidden">
            <div className={cn(
              "p-1.5 rounded-lg shrink-0",
              node.type === "phase" ? "bg-primary/10 text-primary" : 
              node.type === "group" ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" :
              "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400"
            )}>
              {node.type === "phase" ? <Layers className="h-4 w-4" /> : 
               node.type === "group" ? <Users className="h-4 w-4" /> : 
               <Zap className="h-4 w-4" />}
            </div>
            <div className="truncate">
              <span className="font-bold text-sm block truncate">{node.name || node.nodeCode || "Matchs"}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                {node.type === "phase" ? "Phase" : node.type === "group" ? "Groupe" : "Node"}
              </span>
            </div>
            <Badge variant="secondary" className="text-[10px] h-4 leading-none">
              {matches.length}
            </Badge>
          </div>
          
          {matches.length > 0 && (
            <Button size="sm" variant="outline" className="h-7 px-3 text-[10px] rounded-full border-primary/30 text-primary hover:bg-primary hover:text-white" asChild>
              <Link href={`?${new URLSearchParams({ bracketNodeId: node.id, view: "list" })}`}>
                Gérer la liste
              </Link>
            </Button>
          )}
        </div>
        
        <CollapsibleContent>
          <div className="mt-2 space-y-2 pl-6 border-l-2 border-primary/10 ml-6 py-2">
            {matches.map((match: any) => (
              <div key={match.id} className="flex items-center justify-between p-2 rounded-lg bg-card border hover:border-primary/20 transition-all">
                <div className="flex items-center gap-3 overflow-hidden">
                   <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                     {match.matchNumber}
                   </div>
                   <div className="text-[11px] font-medium truncate">
                      {match.participant1?.member?.displayName || "TBD"} 
                      <span className="mx-1 text-muted-foreground opacity-30 italic">vs</span> 
                      {match.participant2?.member?.displayName || "TBD"}
                   </div>
                </div>
                <div className="flex items-center gap-2">
                   <div className="text-[10px] font-black mr-2">
                     {match.score1 ?? "-"} : {match.score2 ?? "-"}
                   </div>
                   <Button size="sm" variant="ghost" className="h-6 w-6 p-0 rounded-full" asChild>
                      <Link href={`/tournaments/${tournamentId}/editions/${editionId}/matches/${match.id}`}>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                   </Button>
                </div>
              </div>
            ))}
            {node.children && node.children.map((child: any, idx: number) => (
              <MatchTreeNode key={idx} node={child} tournamentId={tournamentId} editionId={editionId} depth={depth + 1} />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export default function MatchesDashboardPage({ params }: { params: { tournamentId: string; editionId: string } }) {
  const { tournamentId, editionId } = params;
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const page = searchParams.get("page") || "1";
  const phaseId = searchParams.get("phaseId") || undefined;
  const groupId = searchParams.get("groupId") || undefined;
  const bracketNodeId = searchParams.get("bracketNodeId") || undefined;
  const status = searchParams.get("status") || undefined;
  const search = searchParams.get("search") || undefined;
  const view = (searchParams.get("view") as "list" | "tree" | "grid") || "grid";
  
  const currentPage = parseInt(page);
  const limit = 20;

  // Fetch data with React Query
  const { data: phasesRes, isLoading: phasesLoading } = useQuery({
    queryKey: ["tournament-phases", editionId],
    queryFn: () => getTournamentPhases({ filters: { editionId } }),
  });
  
  const { data: matchesRes, isLoading: matchesLoading } = useQuery({
    queryKey: ["matches", editionId, phaseId, groupId, bracketNodeId, status, search, currentPage],
    queryFn: () => getMatches({
      filters: { 
        editionId, 
        phaseId,
        groupId,
        bracketNodeId,
        statuses: status ? [status] as any : undefined,
        search
      },
      pagination: { page: currentPage, limit },
      options: { sortBy: "scheduledTime", sortOrder: "asc" }
    }),
  });
  
  const { data: editionTree, isLoading: treeLoading } = useQuery({
    queryKey: ["edition-tree", editionId],
    queryFn: () => getEditionDetailTree(editionId).catch(() => null),
  });

  const phases = phasesRes?.data || [];
  const matches = matchesRes?.data || [];
  const pagination = matchesRes?.pagination || { total: 0, totalPages: 0, hasPrev: false, hasNext: false };
  const isLoading = phasesLoading || matchesLoading || treeLoading;

  // Build tree structure for tree view
  const buildTreeView = () => {
    if (!editionTree?.phases) return [];
    return editionTree.phases.map((phase: any) => ({
      id: phase.id,
      name: phase.name,
      type: "phase",
      matches: phase.matches || [],
      children: (phase.groups || []).map((group: any) => ({
        id: group.id,
        name: group.name,
        type: "group",
        matches: group.matches || [],
        children: (group.bracketNodes || []).map((node: any) => ({
          id: node.id,
          name: node.nodeCode || node.name || `Nœud ${node.round}`,
          type: "bracketNode",
          matches: node.matches || [],
          children: []
        }))
      }))
    }));
  };

  const treeData = buildTreeView();

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    // Reset pagination when filter changes
    if (!updates.page) params.set("page", "1");
    
    router.push(`${pathname}?${params.toString()}`);
  };

  // Phase & Group Tabs logic
  const activePhase = phases.find(p => p.id === phaseId);
  const activePhaseGroups = activePhase ? (editionTree?.phases?.find((p: any) => p.id === phaseId)?.groups || []) : [];

  if (isLoading && !matches.length) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            <div className="h-4 w-32 bg-muted animate-pulse rounded mt-2" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-24 bg-muted animate-pulse rounded" />
            <div className="h-8 w-8 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="h-20 bg-muted animate-pulse rounded-xl" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Typography variant="h3" weight="bold">Gestion des Matchs</Typography>
          <Typography variant="body-sm" theme="muted">
            {pagination.total} match{pagination.total > 1 ? "s" : ""} trouvé{pagination.total > 1 ? "s" : ""}
          </Typography>
        </div>
        
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex bg-muted/50 p-1.5 rounded-xl border border-primary/10 shadow-inner">
            <Button 
              variant={view === "list" ? "secondary" : "ghost"} 
              size="sm" 
              className={cn("h-8 px-4 rounded-lg text-xs font-bold gap-2", view === "list" && "shadow-sm border")}
              onClick={() => updateParams({ view: "list" })}
            >
              <ListTree className="h-3.5 w-3.5" />
              Liste
            </Button>
            <Button 
              variant={view === "tree" ? "secondary" : "ghost"} 
              size="sm" 
              className={cn("h-8 px-4 rounded-lg text-xs font-bold gap-2", view === "tree" && "shadow-sm border")}
              onClick={() => updateParams({ view: "tree" })}
            >
              <FolderTree className="h-3.5 w-3.5" />
              Arbre
            </Button>
            <Button 
              variant={view === "grid" ? "secondary" : "ghost"} 
              size="sm" 
              className={cn("h-8 px-4 rounded-lg text-xs font-bold gap-2", view === "grid" && "shadow-sm border")}
              onClick={() => updateParams({ view: "grid" })}
            >
              <Grid3X3 className="h-3.5 w-3.5" />
              Grille
            </Button>
          </div>

          {/* Export Button */}
          <ExportMatchesButton editionId={editionId} />
        </div>
      </div>

      {/* Navigation Horizontale (Nodes) */}
      <div className="space-y-4">
        {/* Phase Tabs */}
        {phases.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
            <Button
              variant={!phaseId ? "default" : "outline"}
              size="sm"
              onClick={() => updateParams({ phaseId: null, groupId: null, bracketNodeId: null })}
              className={cn(
                "flex-shrink-0 h-9 px-5 rounded-full",
                !phaseId && "shadow-lg shadow-primary/20"
              )}
            >
              Toutes les phases
            </Button>
            {phases.map((phase: any) => (
              <Button
                key={phase.id}
                variant={phaseId === phase.id ? "default" : "outline"}
                size="sm"
                onClick={() => updateParams({ phaseId: phase.id, groupId: null, bracketNodeId: null })}
                className={cn(
                  "flex-shrink-0 h-9 px-5 rounded-full transition-all",
                  phaseId === phase.id && "shadow-lg shadow-primary/20 scale-105"
                )}
              >
                {phase.name}
              </Button>
            ))}
          </div>
        )}

        {/* Group Tabs (Contextual) */}
        {phaseId && activePhaseGroups.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-6 border-l-4 border-primary/20 bg-muted/20 py-3 rounded-xl">
             <Button
                variant={!groupId ? "default" : "ghost"}
                size="xs"
                onClick={() => updateParams({ groupId: null, bracketNodeId: null })}
                className="flex-shrink-0 h-7 px-3 rounded-full text-[10px] uppercase tracking-wider font-black"
              >
                Tous les groupes
              </Button>
              {activePhaseGroups.map((group: any) => (
                <Button
                  key={group.id}
                  variant={groupId === group.id ? "default" : "ghost"}
                  size="xs"
                  onClick={() => updateParams({ groupId: group.id, bracketNodeId: null })}
                  className="flex-shrink-0 h-7 px-3 rounded-full text-[10px] uppercase tracking-wider font-black"
                >
                  {group.name}
                </Button>
              ))}
          </div>
        )}
      </div>

      {/* Filters Bar */}
      <Card className="bg-muted/50 border-none">
        <CardContent className="p-4">
          <MatchesDashboardFilters 
            search={search} 
            status={status} 
            phaseId={phaseId}
            groupId={groupId}
            phases={phases}
          />
        </CardContent>
      </Card>

      {/* Content based on view */}
      {view === "tree" ? (
        <Card className="border-none shadow-xl">
          <CardHeader className="border-b pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <FolderTree className="h-4 w-4 text-primary" />
              Arborescence des matchs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {treeData.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed rounded-xl bg-muted/20">
                <AlertCircle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <Typography variant="body-sm" theme="muted">Aucune structure de match disponible.</Typography>
              </div>
            ) : (
              <div className="space-y-2">
                {treeData.map((phase: any, idx: number) => (
                  <MatchTreeNode key={idx} node={phase} tournamentId={tournamentId} editionId={editionId} depth={0} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {matches.length === 0 ? (
            <div className="col-span-full py-20 text-center border-2 border-dashed rounded-xl bg-muted/20">
              <AlertCircle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <Typography variant="body-sm" theme="muted">Aucun match ne correspond à vos critères.</Typography>
            </div>
          ) : (
            matches.map((match: any) => (
              <Card key={match.id} className="group hover:border-primary/40 transition-all overflow-hidden">
                <div className="bg-muted/30 p-3 border-b flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[9px]">
                      {match.phase?.name || "Match"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">#{match.matchNumber}</span>
                  </div>
                  <StatusBadge status={match.status} />
                </div>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 text-center">
                      <ParticipantAvatar participant={match.participant1} />
                      <div className="text-xs font-medium mt-1 truncate">
                        {match.participant1?.member?.displayName?.slice(0, 12) || "TBD"}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-1 px-2 py-1 bg-muted rounded-lg font-bold text-sm">
                      <span>{match.score1 ?? "-"}</span>
                      <span className="text-muted-foreground">-</span>
                      <span>{match.score2 ?? "-"}</span>
                    </div>
                    <div className="flex-1 text-center">
                      <ParticipantAvatar participant={match.participant2} />
                      <div className="text-xs font-medium mt-1 truncate">
                        {match.participant2?.member?.displayName?.slice(0, 12) || "TBD"}
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <Button size="sm" variant="outline" className="w-full h-8 text-xs gap-1" asChild>
                      <Link href={`/tournaments/${tournamentId}/editions/${editionId}/matches/${match.id}`}>
                        Gérer <ArrowRight className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        // List view
        <div className="space-y-4">
          {matches.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed rounded-xl bg-muted/20">
              <AlertCircle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <Typography variant="body-sm" theme="muted">Aucun match ne correspond à vos critères.</Typography>
            </div>
          ) : (
            matches.map((match: any) => (
              <MatchCard key={match.id} match={match} tournamentId={tournamentId} editionId={editionId} />
            ))
          )}
        </div>
      )}

      {/* Pagination */}
      {view !== "tree" && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-8">
          <Button 
            variant="outline" 
            size="icon" 
            disabled={!pagination.hasPrev}
            onClick={() => updateParams({ page: (currentPage - 1).toString() })}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum: number;
              if (pagination.totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <Button 
                  key={pageNum}
                  variant={pageNum === currentPage ? "default" : "outline"} 
                  size="sm"
                  className="w-9 h-9"
                  onClick={() => updateParams({ page: pageNum.toString() })}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button 
            variant="outline" 
            size="icon" 
            disabled={!pagination.hasNext}
            onClick={() => updateParams({ page: (currentPage + 1).toString() })}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}