// app/tournaments/[tournamentId]/editions/[editionId]/matches/[matchId]/page.tsx
import { Metadata } from "next";
import { getMatchById, getMatchesWithParticipants } from "@/actions/phases";
import { isUserTournamentOrganizer } from "@/actions/tournaments";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  History,
  Users,
  MapPin,
  Eye,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { notFound } from "next/navigation";
import Image from "next/image";
import { MatchControlClient } from "./match-control-client";

export const metadata: Metadata = {
  title: "Détail du match | Game Trafics",
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

export default async function MatchDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { tournamentId, editionId, matchId } = await params;
  const { submit } = await searchParams;

  // Fetch match with full relations (incluant les membres du tournoi pour la détection des co-organisateurs)
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
      "submittedBy",
    ],
  });

  if (!match) notFound();

  // Get session and check organizer status
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const isOrganizer = session?.user?.id
    ? await isUserTournamentOrganizer(tournamentId, session.user.id)
    : false;

  // Fetch match history between these two participants
  const historyRes = await getMatchesWithParticipants({
    filters: {
      editionId,
      memberRegistrationId: match.participant1RegistrationId,
    },
    pagination: { limit: 50, page: 1 },
  });

  const h2hMatches = historyRes.data
    .filter(
      (m: any) =>
        (m.participant1RegistrationId === match.participant1RegistrationId &&
          m.participant2RegistrationId === match.participant2RegistrationId) ||
        (m.participant1RegistrationId === match.participant2RegistrationId &&
          m.participant2RegistrationId === match.participant1RegistrationId),
    )
    .filter((m: any) => m.id !== matchId);

  const getScoreClass = (score1: number, score2: number, isWinner: boolean) => {
    if (score1 === null || score2 === null) return "";
    if (isWinner && score1 > score2) return "text-primary";
    if (!isWinner && score2 > score1) return "text-primary";
    return "";
  };

  // Fetch sibling matches (same group or phase)
  const siblingMatchesRes = await getMatchesWithParticipants({
    filters: {
      editionId,
      phaseId: match.phaseId,
      groupId: match.groupId || undefined,
    },
    pagination: { limit: 12, page: 1 },
  });
  const siblingMatches = siblingMatchesRes.data.filter(
    (m: any) => m.id !== matchId,
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Navigation */}
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit gap-2 -ml-2 text-muted-foreground"
          asChild
        >
          {/* on fait un back */}
          {isOrganizer ? (
            <Link
              href={`/tournaments/${tournamentId}/editions/${editionId}/dashboard/matches`}
            >
              <ChevronLeft className="h-4 w-4" /> Retour aux matchs
            </Link>
          ) : (
            <Link
              href={`/tournaments/${tournamentId}/editions/${editionId}/matches`}
            >
              <ChevronLeft className="h-4 w-4" /> Retour aux matchs
            </Link>
          )}
        </Button>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge
                variant="outline"
                className="text-[10px] uppercase tracking-tighter"
              >
                {match.phase?.name || "Phase inconnue"}
              </Badge>
              {match.group && (
                <Badge
                  variant="secondary"
                  className="text-[10px] uppercase tracking-tighter"
                >
                  <Users className="h-3 w-3 mr-1" />
                  {match.group.name}
                </Badge>
              )}
              {match.bracketNode && (
                <Badge variant="outline" className="text-[10px]">
                  <GitBranch className="h-3 w-3 mr-1" />
                  {match.bracketNode.nodeCode || `Round ${match.round}`}
                </Badge>
              )}
            </div>
            <Typography variant="h2" weight="bold" className="tracking-tight">
              Match #{match.matchNumber}
            </Typography>
            <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
              <Calendar className="h-3.5 w-3.5" />
              {match.scheduledTime
                ? format(new Date(match.scheduledTime), "PPPP 'à' HH:mm", {
                    locale: fr,
                  })
                : "Date non fixée"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-[10px] font-bold text-muted-foreground uppercase">
                Statut
              </div>
              <div className="font-bold flex items-center gap-1.5 justify-end">
                {match.status === "COMPLETED" && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                )}
                {match.status === "DISPUTED" && (
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                )}
                {match.status === "IN_PROGRESS" && (
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                )}
                {match.status === "PENDING_REVIEW" && (
                  <Eye className="h-4 w-4 text-amber-500" />
                )}
                <span className="text-sm">
                  {match.status === "COMPLETED"
                    ? "Terminé"
                    : match.status === "IN_PROGRESS"
                      ? "En cours"
                      : match.status === "PENDING_REVIEW"
                        ? "À valider"
                        : match.status === "DISPUTED"
                          ? "Litige"
                          : "Programmé"}
                </span>
              </div>
            </div>
            <Separator
              orientation="vertical"
              className="h-10 mx-2 hidden sm:block"
            />

            {isOrganizer && (
              <Button size="sm" variant="outline" className="gap-2" asChild>
                <Link
                  href={`/tournaments/${tournamentId}/editions/${editionId}/dashboard/matches`}
                >
                  <Settings2 className="h-4 w-4" /> Dashboard
                </Link>
              </Button>
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
              <div className="grid grid-cols-7 items-stretch min-h-[280px]">
                {/* Participant 1 */}
                <div className="col-span-3 p-6 flex flex-col items-center justify-center text-center gap-4">
                  <ParticipantLargeAvatar
                    participant={match.participant1}
                    isWinner={
                      match.winnerRegistrationId ===
                      match.participant1RegistrationId
                    }
                  />
                  <div className="space-y-1">
                    <Typography
                      variant="h4"
                      weight="bold"
                      className="line-clamp-1"
                    >
                      {match.participant1?.member?.displayName ||
                        "À déterminer"}
                    </Typography>
                    {match.participant1?.member?.team?.name && (
                      <div className="text-xs text-muted-foreground">
                        {match.participant1.member.team.name}
                      </div>
                    )}
                  </div>
                </div>

                {/* Versus / Score */}
                <div className="col-span-1 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm border-x border-border/20">
                  <div className="text-[10px] font-black text-muted-foreground uppercase mb-4 tracking-[0.2em]">
                    VS
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <span
                      className={cn(
                        "text-5xl font-black tabular-nums tracking-tighter",
                        match.score1 > match.score2 && "text-primary",
                      )}
                    >
                      {match.score1 ?? "-"}
                    </span>
                    <div className="h-[2px] w-8 bg-border" />
                    <span
                      className={cn(
                        "text-5xl font-black tabular-nums tracking-tighter",
                        match.score2 > match.score1 && "text-primary",
                      )}
                    >
                      {match.score2 ?? "-"}
                    </span>
                  </div>
                </div>

                {/* Participant 2 */}
                <div className="col-span-3 p-6 flex flex-col items-center justify-center text-center gap-4">
                  <ParticipantLargeAvatar
                    participant={match.participant2}
                    isWinner={
                      match.winnerRegistrationId ===
                      match.participant2RegistrationId
                    }
                  />
                  <div className="space-y-1">
                    <Typography
                      variant="h4"
                      weight="bold"
                      className="line-clamp-1"
                    >
                      {match.participant2?.member?.displayName ||
                        "À déterminer"}
                    </Typography>
                    {match.participant2?.member?.team?.name && (
                      <div className="text-xs text-muted-foreground">
                        {match.participant2.member.team.name}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Match Control Client */}
          <MatchControlClient
            match={match}
            tournamentId={tournamentId}
            editionId={editionId}
            autoSubmit={submit === "true"}
            isOrganizer={isOrganizer}
          />

          {/* Head-to-Head History */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              <Typography variant="h5" weight="bold">
                Historique des confrontations
              </Typography>
            </div>

            {h2hMatches.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {h2hMatches.map((m: any) => (
                  <Card
                    key={m.id}
                    className="overflow-hidden border-none bg-muted/20 hover:bg-muted/40 transition-colors"
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="text-center w-28 truncate text-xs font-bold">
                          {m.participant1?.member?.displayName?.slice(0, 15)}
                        </div>
                        <div className="flex items-center gap-2 bg-background px-3 py-1.5 rounded-full border border-border/50">
                          <span
                            className={cn(
                              "font-bold",
                              m.score1 > m.score2 && "text-primary",
                            )}
                          >
                            {m.score1 ?? "-"}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            -
                          </span>
                          <span
                            className={cn(
                              "font-bold",
                              m.score2 > m.score1 && "text-primary",
                            )}
                          >
                            {m.score2 ?? "-"}
                          </span>
                        </div>
                        <div className="text-center w-28 truncate text-xs font-bold">
                          {m.participant2?.member?.displayName?.slice(0, 15)}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <Badge
                          variant="outline"
                          className="text-[9px] uppercase"
                        >
                          {m.phase?.name || `Round ${m.round}`}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          asChild
                        >
                          <Link
                            href={`/tournaments/${tournamentId}/editions/${editionId}/matches/${m.id}`}
                          >
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
                  <p className="text-sm">
                    Aucune rencontre précédente enregistrée
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Right Column: Info */}
        <div className="space-y-6">
          {/* Match Info Card */}
          <Card className="border-primary/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> Détails
                Officiels
              </CardTitle>
              <CardDescription className="text-[10px]">
                Informations de la compétition
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-border/50 text-sm">
                  <span className="text-muted-foreground flex items-center gap-2 text-xs">
                    <GitBranch className="h-3 w-3" /> Type de match
                  </span>
                  <Badge variant="secondary" className="text-[10px] font-bold">
                    {match.matchType || "STANDARD"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/50 text-sm">
                  <span className="text-muted-foreground flex items-center gap-2 text-xs">
                    <Clock className="h-3 w-3" /> Durée prévue
                  </span>
                  <span className="font-medium text-xs">
                    {match.duration || 30} minutes
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/50 text-sm">
                  <span className="text-muted-foreground flex items-center gap-2 text-xs">
                    <Flag className="h-3 w-3" /> Round / Journée
                  </span>
                  <span className="font-bold text-xs">
                    {match.bracketNode?.metadata?.name ||
                      `Round ${match.round}`}
                  </span>
                </div>
                {match.streamLink && (
                  <div className="flex items-center justify-between py-2 border-b border-border/50 text-sm">
                    <span className="text-muted-foreground flex items-center gap-2 text-xs">
                      <ExternalLink className="h-3 w-3" /> Stream
                    </span>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs"
                      asChild
                    >
                      <Link href={match.streamLink} target="_blank">
                        Regarder
                      </Link>
                    </Button>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-8 text-[10px] uppercase font-bold tracking-wider"
                  asChild
                >
                  <Link
                    href={`/tournaments/${tournamentId}/editions/${editionId}/dashboard/phases`}
                  >
                    Voir l'arbre complet
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
                  <Typography
                    variant="body-sm"
                    weight="bold"
                    className="text-destructive"
                  >
                    Litige en cours
                  </Typography>
                  <p className="text-xs text-destructive/80 leading-relaxed">
                    Un litige a été ouvert. Un administrateur doit intervenir.
                    {match.disputeReason && <br />}
                    {match.disputeReason && (
                      <span className="text-[10px]">
                        Raison: {match.disputeReason}
                      </span>
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {match.status === "PENDING_REVIEW" && !match.confirmedByAdmin && (
            <Card className="bg-amber-500/5 border-amber-500/20">
              <CardContent className="p-4 flex gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                <div className="space-y-1">
                  <Typography
                    variant="body-sm"
                    weight="bold"
                    className="text-amber-700"
                  >
                    En attente de validation
                  </Typography>
                  <p className="text-xs text-amber-600/80 leading-relaxed">
                    Le score a été soumis par{" "}
                    {match.submittedBy?.username || "un participant"}. Un
                    organisateur doit confirmer.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Participants info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> Participants
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold">
                    P1
                  </div>
                  <span className="text-sm">
                    {match.participant1?.member?.displayName || "TBD"}
                  </span>
                </div>
                {match.participant1?.member?.user?.username && (
                  <span className="text-[10px] text-muted-foreground">
                    @{match.participant1.member.user.username}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold">
                    P2
                  </div>
                  <span className="text-sm">
                    {match.participant2?.member?.displayName || "TBD"}
                  </span>
                </div>
                {match.participant2?.member?.user?.username && (
                  <span className="text-[10px] text-muted-foreground">
                    @{match.participant2.member.user.username}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Other matches in same group/phase */}
      {siblingMatches.length > 0 && (
        <div className="space-y-6 pt-8 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Swords className="h-5 w-5 text-primary" />
              <Typography variant="h5" weight="bold">
                Autres matchs de la phase
              </Typography>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              asChild
            >
              <Link
                href={
                  isOrganizer
                    ? `/tournaments/${tournamentId}/editions/${editionId}/dashboard/matches`
                    : `/tournaments/${tournamentId}/editions/${editionId}/matches`
                }
              >
                Tout voir <ChevronRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {siblingMatches.map((m: any) => (
              <Link
                key={m.id}
                href={`/tournaments/${tournamentId}/editions/${editionId}/matches/${m.id}`}
                className="group"
              >
                <Card className="overflow-hidden hover:border-primary/30 transition-all hover:shadow-md bg-muted/10">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                      <span>#{m.matchNumber}</span>
                      <span>
                        {m.status === "COMPLETED"
                          ? "Terminé"
                          : format(
                              new Date(m.scheduledTime || m.createdAt),
                              "HH:mm",
                            )}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium truncate max-w-[100px]">
                          {m.participant1?.member?.displayName || "TBD"}
                        </span>
                        <span
                          className={cn(
                            "text-xs font-black",
                            (m.score1 ?? 0) > (m.score2 ?? 0) && "text-primary",
                          )}
                        >
                          {m.score1 ?? "-"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium truncate max-w-[100px]">
                          {m.participant2?.member?.displayName || "TBD"}
                        </span>
                        <span
                          className={cn(
                            "text-xs font-black",
                            (m.score2 ?? 0) > (m.score1 ?? 0) && "text-primary",
                          )}
                        >
                          {m.score2 ?? "-"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <Badge variant="outline" className="text-[8px] h-4">
                        {m.group?.name || m.phase?.name || "Match"}
                      </Badge>
                      <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ParticipantLargeAvatar({
  participant,
  isWinner,
}: {
  participant: any;
  isWinner?: boolean;
}) {
  const name = participant?.member?.displayName || "?";
  const image =
    participant?.member?.avatar ||
    participant?.member?.user?.profileImage ||
    participant?.member?.user?.image ||
    "icons/avatar.png";

  return (
    <div
      className={cn(
        "h-24 w-24 relative rounded-2xl border-2 transition-all duration-500",
        isWinner
          ? "border-primary shadow-xl shadow-primary/20 scale-105"
          : "border-border",
        !participant && "opacity-30 border-dashed",
      )}
    >
      {image ? (
        <Image
          src={image}
          fill
          className="object-cover rounded-2xl"
          alt={name}
        />
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
