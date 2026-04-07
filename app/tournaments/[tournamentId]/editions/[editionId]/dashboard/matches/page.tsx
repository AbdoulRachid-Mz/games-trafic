import { Metadata } from "next";
import { getTournamentPhases, getMatches } from "@/actions/tournaments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  Swords, 
  Calendar, 
  Clock, 
  Search, 
  Filter, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight,
  User as UserIcon,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Image from "next/image";
import { MatchesDashboardFilters } from "@/components/pages/tournaments/edition-detail/matches-dashboard-filters";

export const metadata: Metadata = {
  title: "Gestion des Matchs - Dashboard",
};

interface PageProps {
  params: Promise<{
    tournamentId: string;
    editionId: string;
  }>;
  searchParams: Promise<{
    page?: string;
    phaseId?: string;
    status?: string;
    search?: string;
  }>;
}

function StatusBadge({ status }: { status: string | null | undefined }) {
  const s = status || "PENDING";
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "text-[10px] uppercase font-bold",
        s === "COMPLETED" && "bg-emerald-500/10 text-emerald-600 border-emerald-200",
        s === "IN_PROGRESS" && "bg-blue-500/10 text-blue-600 border-blue-200",
        s === "PENDING_REVIEW" && "bg-amber-500/10 text-amber-600 border-amber-200",
        s === "DISPUTED" && "bg-destructive/10 text-destructive border-destructive/20",
        s === "PENDING" && "bg-muted text-muted-foreground border-border"
      )}
    >
      {s === "COMPLETED" ? "Terminé" : 
       s === "IN_PROGRESS" ? "En cours" : 
       s === "PENDING_REVIEW" ? "A valider" :
       s === "DISPUTED" ? "Litige" : "En attente"}
    </Badge>
  );
}

export default async function MatchesDashboardPage({ params, searchParams }: PageProps) {
  const { tournamentId, editionId } = await params;
  const { page = "1", phaseId, status, search } = await searchParams;
  
  const currentPage = parseInt(page);
  const limit = 20;

  // Fetch data
  const [phasesRes, matchesRes] = await Promise.all([
    getTournamentPhases({ filters: { editionId } }),
    getMatches({
      filters: { 
        editionId, 
        phaseId: phaseId || undefined,
        statuses: status ? [status] as any : undefined,
        search: search || undefined
      },
      pagination: { page: currentPage, limit },
      options: { sortBy: "scheduledTime", sortOrder: "asc" }
    })
  ]);

  const phases = phasesRes.data || [];
  const matches = matchesRes.data || [];
  const { pagination } = matchesRes;

  const sp = await searchParams;

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
          {/* Quick Phase Filter Tabs */}
          <div className="hidden lg:flex bg-muted p-1 rounded-lg border">
            <Button 
              variant={!phaseId ? "secondary" : "ghost"} 
              size="sm" 
              className="text-xs h-7"
              asChild
            >
              <Link href={`?${new URLSearchParams({ ...Object.fromEntries(Object.entries(sp).filter(([k]) => k !== "phaseId" && k !== "page")) })}`}>
                Tous
              </Link>
            </Button>
            {phases.slice(0, 3).map(p => (
              <Button 
                key={p.id}
                variant={phaseId === p.id ? "secondary" : "ghost"} 
                size="sm" 
                className="text-xs h-7"
                asChild
              >
                <Link href={`?${new URLSearchParams({ ...Object.fromEntries(Object.entries(sp)), phaseId: p.id, page: "1" })}`}>
                  {p.name}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <Card className="bg-muted/50 border-none">
        <CardContent className="p-4">
          <MatchesDashboardFilters 
            search={search} 
            status={status} 
            phaseId={phaseId} 
          />
        </CardContent>
      </Card>

      {/* Matches List */}
      <div className="space-y-4">
        {matches.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed rounded-xl bg-muted/20">
            <AlertCircle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <Typography variant="body-sm" theme="muted">Aucun match ne correspond à vos critères.</Typography>
          </div>
        ) : (
          matches.map((match: any) => (
            <Card key={match.id} className="group hover:border-primary/40 transition-all">
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
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-8">
          <Button 
            variant="outline" 
            size="icon" 
            disabled={!pagination.hasPrev}
            asChild
          >
            <Link href={`?${new URLSearchParams({ ...Object.fromEntries(Object.entries(sp)), page: (currentPage - 1).toString() })}`}>
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          
          <div className="flex items-center gap-1">
             {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => {
               // Only show a limited number of pages if too many
               if (pagination.totalPages > 7) {
                 if (p !== 1 && p !== pagination.totalPages && Math.abs(p - currentPage) > 1) {
                   if (p === 2 || p === pagination.totalPages - 1) return <span key={p} className="px-2">...</span>;
                   return null;
                 }
               }
               
               return (
                 <Button 
                   key={p}
                   variant={p === currentPage ? "default" : "outline"} 
                   size="sm"
                   className="w-9 h-9"
                   asChild
                 >
                   <Link href={`?${new URLSearchParams({ ...Object.fromEntries(Object.entries(sp)), page: p.toString() })}`}>
                     {p}
                   </Link>
                 </Button>
               );
             })}
          </div>

          <Button 
            variant="outline" 
            size="icon" 
            disabled={!pagination.hasNext}
            asChild
          >
            <Link href={`?${new URLSearchParams({ ...Object.fromEntries(Object.entries(sp)), page: (currentPage + 1).toString() })}`}>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}
    </div>
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
