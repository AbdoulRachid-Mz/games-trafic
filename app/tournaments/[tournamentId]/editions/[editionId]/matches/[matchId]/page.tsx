import { Metadata } from "next";
import { getMatchById, getMatchesWithParticipants } from "@/actions/phases";
import { isUserTournamentOrganizer } from "@/actions/tournaments";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { 
  Swords, 
  Calendar, 
  Clock, 
  ChevronLeft, 
  Trophy, 
  AlertTriangle, 
  CheckCircle2, 
  User as UserIcon,
  ShieldCheck,
  Flag,
  Settings2,
  ExternalLink,
  GitBranch,
  History
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { notFound } from "next/navigation";
import Image from "next/image";
import { MatchControlClient } from "./match-control-client";

export const metadata: Metadata = {
  title: "Centre de Contrôle du Match",
};

interface PageProps {
  params: Promise<{
    tournamentId: string;
    editionId: string;
    matchId: string;
  }>;
  searchParams: Promise<{
    submit?: string;
  }>;
}

export default async function MatchDetailPage({ params, searchParams }: PageProps) {
  const { tournamentId, editionId, matchId } = await params;
  const { submit } = await searchParams;

  // Fetch match with full relations
  const match: any = await getMatchById(matchId, {
    populate: [
      "edition", 
      "phase", 
      "group", 
      "bracketNode", 
      "participant1", 
      "member1",
      "participant2",
      "member2",
      "winner",
      "loser",
      "submittedBy"
    ]
  });

  if (!match) notFound();

  // 1. Get Session and check Organizer status
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  
  const isOrganizer = session?.user?.id 
    ? await isUserTournamentOrganizer(tournamentId, session.user.id) 
    : false;

  // 2. Fetch Match History between these two participants
  const historyRes = await getMatchesWithParticipants({
    filters: { 
      editionId,
      // We need matches where BOTH participants played against each other
      // Since our filter only supports one participant at a time for now, 
      // we'll fetch matches for P1 and filter in memory for P2
      memberRegistrationId: match.participant1RegistrationId
    },
    pagination: { limit: 50, page: 1 }
  });

  const h2hMatches = historyRes.data.filter((m: any) => 
    (m.participant1RegistrationId === match.participant1RegistrationId && m.participant2RegistrationId === match.participant2RegistrationId) ||
    (m.participant1RegistrationId === match.participant2RegistrationId && m.participant2RegistrationId === match.participant1RegistrationId)
  ).filter((m: any) => m.id !== matchId); // Exclude current match
  
  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Navigation & Header */}
      <div className="flex flex-col gap-4">
        <Button variant="ghost" size="sm" className="w-fit gap-2 -ml-2 text-muted-foreground" asChild>
          <Link href={`/tournaments/${tournamentId}/editions/${editionId}/dashboard/matches`}>
            <ChevronLeft className="h-4 w-4" /> Retour aux matchs
          </Link>
        </Button>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
               <Badge variant="outline" className="text-[10px] uppercase tracking-tighter">
                 {match.phase?.name || "Phase inconnue"}
               </Badge>
               {match.group && (
                 <Badge variant="secondary" className="text-[10px] uppercase tracking-tighter">
                   Groupe {match.group.name}
                 </Badge>
               )}
            </div>
            <Typography variant="h2" weight="bold" className="tracking-tight">
              Match #{match.matchNumber}
            </Typography>
            <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
              <Calendar className="h-3.5 w-3.5" />
              {match.scheduledTime ? format(new Date(match.scheduledTime), "PPPP 'à' HH:mm", { locale: fr }) : "Date non fixée"}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="text-right hidden sm:block">
                <div className="text-[10px] font-bold text-muted-foreground uppercase">Statut actuel</div>
                <div className="font-bold flex items-center gap-1.5 justify-end">
                   {match.status === "COMPLETED" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                   {match.status === "DISPUTED" && <AlertTriangle className="h-4 w-4 text-destructive" />}
                   {match.status === "IN_PROGRESS" && <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />}
                   {match.status}
                </div>
             </div>
             <Separator orientation="vertical" className="h-10 mx-2 hidden sm:block" />
             
             {isOrganizer && (
               <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="gap-2" asChild>
                     <Link href={`/tournaments/${tournamentId}/editions/${editionId}/dashboard/matches`}>
                        <Settings2 className="h-4 w-4" /> Administration
                     </Link>
                  </Button>
               </div>
             )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Match Card & Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Versus Card */}
          <Card className="overflow-hidden border-none shadow-2xl bg-gradient-to-br from-card to-muted/30">
            <CardContent className="p-0">
               <div className="grid grid-cols-7 items-stretch min-h-[220px]">
                  {/* Participant 1 */}
                  <div className="col-span-3 p-6 flex flex-col items-center justify-center text-center gap-4">
                     <ParticipantLargeAvatar participant={match.participant1} isWinner={match.winnerRegistrationId === match.participant1RegistrationId} />
                     <div className="space-y-1">
                        <Typography variant="h4" weight="bold" className="line-clamp-1">
                          {match.participant1?.member?.displayName || "À déterminer"}
                        </Typography>
                        <Badge variant="outline" className="text-[9px] opacity-60">ID: {match.participant1RegistrationId?.slice(0, 8)}</Badge>
                     </div>
                  </div>

                  {/* Versus / Score */}
                  <div className="col-span-1 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm border-x border-border/20">
                     <div className="text-[10px] font-black text-muted-foreground uppercase mb-4 tracking-[0.2em]">VS</div>
                     <div className="flex flex-col items-center gap-2">
                        <span className={cn("text-5xl font-black tabular-nums tracking-tighter", match.score1 > match.score2 && "text-primary")}>
                          {match.score1 ?? "-"}
                        </span>
                        <div className="h-[2px] w-8 bg-border" />
                        <span className={cn("text-5xl font-black tabular-nums tracking-tighter", match.score2 > match.score1 && "text-primary")}>
                          {match.score2 ?? "-"}
                        </span>
                     </div>
                  </div>

                  {/* Participant 2 */}
                  <div className="col-span-3 p-6 flex flex-col items-center justify-center text-center gap-4">
                     <ParticipantLargeAvatar participant={match.participant2} isWinner={match.winnerRegistrationId === match.participant2RegistrationId} />
                     <div className="space-y-1">
                        <Typography variant="h4" weight="bold" className="line-clamp-1">
                           {match.participant2?.member?.displayName || "À déterminer"}
                        </Typography>
                        <Badge variant="outline" className="text-[9px] opacity-60">ID: {match.participant2RegistrationId?.slice(0, 8)}</Badge>
                     </div>
                  </div>
               </div>
            </CardContent>
          </Card>

          {/* Controls Client Component */}
          <MatchControlClient 
            match={match} 
            tournamentId={tournamentId} 
            editionId={editionId} 
            autoSubmit={submit === "true"}
          />

          {/* Head-to-Head History */}
          <div className="space-y-4">
             <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                <Typography variant="h5" weight="bold">Historique des rencontres</Typography>
             </div>
             
             {h2hMatches.length > 0 ? (
               <div className="grid grid-cols-1 gap-3">
                 {h2hMatches.map((m: any) => (
                   <Card key={m.id} className="overflow-hidden border-none bg-muted/20 hover:bg-muted/40 transition-colors">
                     <CardContent className="p-4 flex items-center justify-between">
                       <div className="flex items-center gap-4 flex-1">
                         <div className="text-center w-24 truncate text-xs font-bold">
                           {m.participant1?.member?.displayName}
                         </div>
                         <div className="flex items-center gap-2 bg-background px-3 py-1 rounded-full border border-border/50">
                           <span className={cn("font-bold", m.score1 > m.score2 && "text-primary")}>{m.score1}</span>
                           <span className="text-muted-foreground text-[10px]">vs</span>
                           <span className={cn("font-bold", m.score2 > m.score1 && "text-primary")}>{m.score2}</span>
                         </div>
                         <div className="text-center w-24 truncate text-xs font-bold">
                           {m.participant2?.member?.displayName}
                         </div>
                       </div>
                       
                       <div className="flex items-center gap-4">
                         <Badge variant="outline" className="text-[9px] uppercase">
                           {m.phase?.name}
                         </Badge>
                         <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                           <Link href={`/tournaments/${tournamentId}/editions/${editionId}/matches/${m.id}`}>
                             <ExternalLink className="h-3.5 w-3.5" />
                           </Link>
                         </Button>
                       </div>
                     </CardContent>
                   </Card>
                 ))}
               </div>
             ) : (
               <Card className="border-dashed py-8">
                 <CardContent className="flex flex-col items-center justify-center text-muted-foreground">
                   <Swords className="h-8 w-8 mb-2 opacity-20" />
                   <p className="text-sm">Aucune rencontre précédente enregistrée</p>
                 </CardContent>
               </Card>
             )}
          </div>
        </div>

        {/* Right Column: Info & History */}
        <div className="space-y-6">
          {/* Match Info Card */}
          <Card className="border-primary/10">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                   <ShieldCheck className="h-4 w-4 text-primary" /> Détails Officiels
                </CardTitle>
                <CardDescription className="text-[10px]">Informations de la compétition</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-border/50 text-sm">
                  <span className="text-muted-foreground flex items-center gap-2 text-xs"><GitBranch className="h-3 w-3" /> Type de match</span>
                  <Badge variant="secondary" className="text-[10px] font-bold">{match.matchType || "STANDARD"}</Badge>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/50 text-sm">
                  <span className="text-muted-foreground flex items-center gap-2 text-xs"><Clock className="h-3 w-3" /> Durée prévue</span>
                  <span className="font-medium text-xs">{match.duration || 30} minutes</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/50 text-sm">
                  <span className="text-muted-foreground flex items-center gap-2 text-xs"><Flag className="h-3 w-3" /> Round</span>
                  <span className="font-bold text-xs">Round {match.round}</span>
                </div>
              </div>
              
              <div className="pt-2">
                 <Button variant="ghost" size="sm" className="w-full h-8 text-[10px] uppercase font-bold tracking-wider text-primary hover:text-primary hover:bg-primary/5" asChild>
                    <Link href={`/tournaments/${tournamentId}/editions/${editionId}/dashboard/phases`}>
                       Consulter l'arbre complet
                    </Link>
                 </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notifications / Alerts */}
          {match.disputed && (
            <Card className="bg-destructive/5 border-destructive/20">
               <CardContent className="p-4 flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                  <div className="space-y-1">
                     <Typography variant="body-sm" weight="bold" className="text-destructive">Litige en cours</Typography>
                     <p className="text-[10px] text-destructive/80 leading-relaxed">
                        Un litige a été ouvert pour ce match. Un administrateur doit intervenir pour valider le score final. 
                        Raison : {match.disputeReason || "Non précisée"}
                     </p>
                  </div>
               </CardContent>
            </Card>
          )}

          {!match.confirmedByAdmin && match.status === "COMPLETED" && (
             <Card className="bg-amber-500/5 border-amber-500/20">
                <CardContent className="p-4 flex gap-3">
                   <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                   <div className="space-y-1">
                      <Typography variant="body-sm" weight="bold" className="text-amber-700">En attente de validation</Typography>
                      <p className="text-[10px] text-amber-600/80 leading-relaxed">
                         Le score a été soumis mais nécessite la confirmation finale d'un organisateur pour être comptabilisé dans les classements.
                      </p>
                   </div>
                </CardContent>
             </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function ParticipantLargeAvatar({ participant, isWinner }: { participant: any, isWinner?: boolean }) {
  const name = participant?.member?.displayName || "?";
  const image = participant?.member?.avatar || participant?.member?.user?.profileImage || participant?.member?.user?.image;
  
  return (
    <div className={cn(
      "h-24 w-24 relative rounded-2xl border-2 transition-all duration-500",
      isWinner ? "border-primary shadow-xl shadow-primary/20 scale-105" : "border-border",
      !participant && "opacity-30 border-dashed"
    )}>
      {image ? (
        <Image src={image} fill className="object-cover rounded-2xl" alt={name} />
      ) : (
        <div className="h-full w-full flex items-center justify-center bg-muted rounded-2xl text-2xl font-black text-muted-foreground/30">
          {name.substring(0, 2).toUpperCase()}
        </div>
      )}
      
      {isWinner && (
        <div className="absolute -top-3 -right-3 h-8 w-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground border-2 border-background animate-bounce shadow-lg">
           <Trophy className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
