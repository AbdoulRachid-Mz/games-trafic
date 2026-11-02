// components/pages/tournaments/editions/calendar/edition-calendar-timeline.tsx
"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Trophy,
  Users,
  GitBranch,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  ShieldAlert,
  ArrowRight,
  Swords,
  Search,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  format,
  addDays,
  subDays,
  isSameDay,
} from "date-fns";
import { fr } from "date-fns/locale";
import { useMatchList } from "@/hooks/use-match-manager";
import { usePhases } from "@/hooks/use-phase-manager";
import { useGroups } from "@/hooks/use-group-manager";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { updateMatchResult } from "@/actions/tournaments";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { StatsCarousel } from "@/components/shared/stats-carousel";
import Image from "next/image";

interface EditionCalendarTimelineProps {
  editionId: string;
  currentUserId?: string;
  isAdmin?: boolean;
}

export function EditionCalendarTimeline({
  editionId,
  currentUserId,
  isAdmin,
}: EditionCalendarTimelineProps) {
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>("all");
  const [selectedGroupId, setSelectedGroupId] = useState<string>("all");
  const [currentDate, setCurrentDate] = useState(new Date());

  // Fetch phases
  const { data: phasesRes } = usePhases(editionId);
  const phases = phasesRes?.data || [];

  // Fetch groups for selected phase
  const { data: groupsRes } = useGroups(
    selectedPhaseId !== "all" ? selectedPhaseId : "",
    selectedPhaseId !== "all",
  );
  const groups = groupsRes?.data || [];

  // Fetch matches
  const { data: matchesRes, isLoading } = useMatchList({
    filters: { 
      editionId,
      phaseId: selectedPhaseId !== "all" ? selectedPhaseId : undefined,
      groupId: selectedGroupId !== "all" ? selectedGroupId : undefined,
    },
    pagination: { limit: 500, page: 1 }
  });
  const matches = matchesRes?.data || [];

  const [showUnplanned, setShowUnplanned] = useState(false);

  const unplannedMatches = useMemo(() => {
    return matches.filter((m) => !m.scheduledTime);
  }, [matches]);

  const scheduledMatches = useMemo(() => {
    return matches.filter((m) => !!m.scheduledTime);
  }, [matches]);

  const days = useMemo(() => {
    const map = new Map<string, any[]>();
    scheduledMatches.forEach((m) => {
      const date = format(new Date(m.scheduledTime!), "yyyy-MM-dd");
      const existing = map.get(date) || [];
      map.set(date, [...existing, m]);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [scheduledMatches]);

  const matchesByDate = useMemo(() => new Map(days), [days]);
  const dates = useMemo(() => days.map(([date]) => date), [days]);

  // Navigation
  const currentDateObj = new Date(currentDate);
  const currentDateKey = format(currentDateObj, "yyyy-MM-dd");
  const todayMatches = matchesByDate.get(currentDateKey) || [];

  const goPrevDay = () => setCurrentDate(subDays(currentDate, 1));
  const goNextDay = () => setCurrentDate(addDays(currentDate, 1));

  // Statistiques
  const totalMatches = matches.length;
  const completedMatches = matches.filter(
    (m: any) => m.status === "COMPLETED",
  ).length;
  const inProgressMatches = matches.filter(
    (m: any) => m.status === "IN_PROGRESS" || m.status === "LIVE",
  ).length;
  const myMatches = matches.filter(
    (m: any) =>
      m.participant1?.member?.userId === currentUserId ||
      m.participant2?.member?.userId === currentUserId,
  ).length;

  return (
    <div className="space-y-6">
      {/* Barre de Filtres Esports */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start sm:items-center bg-card/60 backdrop-blur-xl border border-white/5 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={selectedPhaseId} onValueChange={(val) => {
            setSelectedPhaseId(val);
            setSelectedGroupId("all");
          }}>
            <SelectTrigger className="w-fit min-w-[160px] bg-background/50 border-white/10 font-bold text-xs">
              <SelectValue placeholder="Toutes les phases" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les phases</SelectItem>
              {phases.map((phase) => (
                <SelectItem key={phase.id} value={phase.id}>
                  {phase.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {groups.length > 0 && selectedPhaseId !== "all" && (
            <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
              <SelectTrigger className="w-fit min-w-[150px] bg-background/50 border-white/10 font-bold text-xs">
                <SelectValue placeholder="Tous les groupes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les groupes</SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowUnplanned(!showUnplanned)}
            className={cn(
              "gap-2 font-bold text-xs border-white/10",
              showUnplanned && "bg-amber-500/20 text-amber-300 border-amber-500/40"
            )}
          >
            <AlertCircle className="h-4 w-4" />
            Non planifiés ({unplannedMatches.length})
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
            className="font-bold text-xs shadow-[0_0_15px_rgba(var(--primary),0.3)]"
          >
            Aujourd&apos;hui
          </Button>
        </div>
      </div>

      {/* Stats rapides du calendrier */}
      <StatsCarousel
        data={[
          {
            title: "Total Matchs",
            value: totalMatches,
            icon: <CalendarDays className="h-5 w-5" />,
            className: "bg-blue-500/10 text-blue-500 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]",
          },
          {
            title: "Terminés",
            value: completedMatches,
            icon: <CheckCircle2 className="h-5 w-5" />,
            className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]",
          },
          {
            title: "En direct",
            value: inProgressMatches,
            icon: <Zap className="h-5 w-5" />,
            className: "bg-red-500/10 text-red-500 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]",
          },
          {
            title: "Mes Matchs",
            value: myMatches,
            icon: <Users className="h-5 w-5" />,
            className: "bg-purple-500/10 text-purple-500 border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]",
          },
          {
            title: "Phases",
            value: phases.length,
            icon: <GitBranch className="h-5 w-5" />,
            className: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]",
          },
        ]}
        itemsPerView={{ mobile: 2, lg: 5 }}
      />

      {showUnplanned ? (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-black italic text-lg tracking-tight">
                Matchs en attente de programmation
              </h3>
              <p className="text-xs text-muted-foreground">
                Ces rencontres n&apos;ont pas encore d&apos;horaire fixé.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {unplannedMatches.map((match: any) => (
              <MatchTimelineCard
                key={match.id}
                match={match}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
              />
            ))}
          </div>

          {unplannedMatches.length === 0 && (
            <Card className="border-dashed border-white/10 bg-card/30 py-12 text-center text-muted-foreground">
              <CardContent>Tous les matchs sont planifiés sur le calendrier !</CardContent>
            </Card>
          )}
        </div>
      ) : (
        <>
          {/* Timeline Navigation Card */}
          <div className="flex items-center justify-between bg-card/70 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl">
            <Button
              variant="outline"
              size="icon"
              onClick={goPrevDay}
              className="border-white/10 bg-background/50 hover:bg-background/90"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <div className="text-center">
              <div className="text-xl md:text-2xl font-black italic tracking-tight capitalize text-foreground">
                {format(currentDateObj, "EEEE d MMMM yyyy", { locale: fr })}
              </div>
              <div className="text-xs text-muted-foreground font-semibold mt-0.5">
                {todayMatches.length} {todayMatches.length > 1 ? "matchs programmés" : "match programmé"} ce jour
              </div>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={goNextDay}
              className="border-white/10 bg-background/50 hover:bg-background/90"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Sélecteur horizontal de dates (Corrigé pour afficher TOUTES les dates disponibles) */}
          {dates.length > 0 && (
            <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar">
              {dates.map((dateKey) => {
                const date = new Date(dateKey);
                const matchCount = matchesByDate.get(dateKey)?.length || 0;
                const isToday = isSameDay(date, new Date());
                const isSelected = currentDateKey === dateKey;

                return (
                  <button
                    key={dateKey}
                    onClick={() => setCurrentDate(date)}
                    className={cn(
                      "flex flex-col items-center px-4 py-2.5 rounded-2xl min-w-[85px] transition-all border shrink-0",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-[0_0_15px_rgba(var(--primary),0.35)] scale-105"
                        : isToday
                        ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
                        : "border-white/5 bg-card/60 hover:bg-card hover:border-white/15 text-muted-foreground"
                    )}
                  >
                    <span className="text-[11px] font-black uppercase tracking-wider">
                      {format(date, "EEE", { locale: fr })}
                    </span>
                    <span className="text-lg font-black">{format(date, "d")}</span>
                    <span className="text-[10px] font-bold opacity-80">
                      {matchCount} m.
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Matchs du jour */}
          <div className="space-y-4">
            <h3 className="font-black italic text-lg tracking-tight flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Rencontres du {format(currentDateObj, "dd MMMM yyyy", { locale: fr })}
            </h3>

            {isLoading ? (
              <div className="animate-pulse space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-card/40 border border-white/5 rounded-2xl" />
                ))}
              </div>
            ) : todayMatches.length === 0 ? (
              <Card className="border-dashed border-white/10 bg-card/30">
                <CardContent className="py-12 text-center text-muted-foreground flex flex-col items-center gap-4">
                  <Clock className="w-10 h-10 opacity-30 text-primary" />
                  <span className="text-sm">Aucun match programmé pour cette date.</span>
                  {unplannedMatches.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowUnplanned(true)}
                      className="border-white/10 font-bold"
                    >
                      Voir les {unplannedMatches.length} matchs non planifiés
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {todayMatches.map((match: any) => (
                  <MatchTimelineCard
                    key={match.id}
                    match={match}
                    currentUserId={currentUserId}
                    isAdmin={isAdmin}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function MatchTimelineCard({ match, currentUserId, isAdmin }: any) {
  const isMyMatch =
    match.participant1?.member?.userId === currentUserId ||
    match.participant2?.member?.userId === currentUserId;

  const router = useRouter();
  const canAdminValidate = isAdmin && match.status !== "COMPLETED";

  const handleAdminValidate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const s1 = match.score1 ?? 0;
      const s2 = match.score2 ?? 0;
      const winnerId = s1 > s2 ? match.participant1RegistrationId : (s2 > s1 ? match.participant2RegistrationId : null);
      
      await updateMatchResult(match.id, s1, s2, winnerId || "", currentUserId || "");
      toast.success("Match validé par l'administrateur");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la validation");
    }
  };

  const p1Name = match.participant1?.member?.displayName || match.participant1?.member?.user?.username || "TBD";
  const p2Name = match.participant2?.member?.displayName || match.participant2?.member?.user?.username || "TBD";

  const isLive = match.status === "IN_PROGRESS" || match.status === "LIVE";
  const isCompleted = match.status === "COMPLETED";

  return (
    <div
      onClick={() => router.push(`/tournaments/${match.tournamentId}/editions/${match.editionId}/matches/${match.id}`)}
      className={cn(
        "group relative overflow-hidden bg-card/80 backdrop-blur-xl border border-white/10 hover:border-primary/50 rounded-2xl p-4 transition-all duration-300 hover:shadow-[0_0_20px_rgba(var(--primary),0.15)] cursor-pointer flex flex-col justify-between gap-3",
        isMyMatch && "border-primary/40 bg-primary/5 shadow-[0_0_15px_rgba(var(--primary),0.1)]",
        isLive && "border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
      )}
    >
      {/* Top Meta Bar */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          {/* Horodatage */}
          <span className="font-mono font-bold text-foreground flex items-center gap-1 bg-background/60 px-2 py-0.5 rounded-md border border-white/5">
            <Clock className="w-3 h-3 text-primary" />
            {match.scheduledTime ? format(new Date(match.scheduledTime), "HH:mm") : "TBD"}
          </span>

          {match.phase?.name && (
            <Badge variant="outline" className="text-[10px] font-bold border-white/10">
              {match.phase.name}
            </Badge>
          )}

          {match.group?.name && (
            <Badge variant="secondary" className="text-[10px] font-bold">
              {match.group.name}
            </Badge>
          )}
        </div>

        {/* Statut Badge */}
        {isLive ? (
          <Badge className="bg-red-500 text-white animate-pulse text-[10px] font-black uppercase">
            EN DIRECT
          </Badge>
        ) : isCompleted ? (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] font-black uppercase">
            TERMINÉ
          </Badge>
        ) : (
          <Badge variant="outline" className="border-white/10 text-muted-foreground text-[10px] uppercase font-bold">
            PROGRAMMÉ
          </Badge>
        )}
      </div>

      {/* Participants & Scores */}
      <div className="flex items-center justify-between gap-4 py-1">
        {/* Joueur 1 */}
        <div className="flex-1 flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-background/80 border border-white/10 flex items-center justify-center font-black text-xs text-primary shrink-0 overflow-hidden relative">
            {match.participant1?.member?.user?.profileImage ? (
              <Image
                src={match.participant1.member.user.profileImage}
                alt={p1Name}
                fill
                className="object-cover"
              />
            ) : (
              p1Name.charAt(0).toUpperCase()
            )}
          </div>
          <span className={cn("font-bold text-sm truncate", match.winnerRegistrationId === match.participant1RegistrationId && "text-primary font-black")}>
            {p1Name}
          </span>
        </div>

        {/* Score Box */}
        <div className="shrink-0 flex items-center gap-2 px-3 py-1 bg-background/60 rounded-xl border border-white/5">
          <span className={cn("text-base font-black", match.winnerRegistrationId === match.participant1RegistrationId ? "text-primary" : "text-foreground")}>
            {match.score1 ?? "-"}
          </span>
          <span className="text-xs text-muted-foreground font-black">:</span>
          <span className={cn("text-base font-black", match.winnerRegistrationId === match.participant2RegistrationId ? "text-primary" : "text-foreground")}>
            {match.score2 ?? "-"}
          </span>
        </div>

        {/* Joueur 2 */}
        <div className="flex-1 flex items-center justify-end gap-2.5 min-w-0 text-right">
          <span className={cn("font-bold text-sm truncate", match.winnerRegistrationId === match.participant2RegistrationId && "text-primary font-black")}>
            {p2Name}
          </span>
          <div className="w-8 h-8 rounded-full bg-background/80 border border-white/10 flex items-center justify-center font-black text-xs text-primary shrink-0 overflow-hidden relative">
            {match.participant2?.member?.user?.profileImage ? (
              <Image
                src={match.participant2.member.user.profileImage}
                alt={p2Name}
                fill
                className="object-cover"
              />
            ) : (
              p2Name.charAt(0).toUpperCase()
            )}
          </div>
        </div>
      </div>

      {/* Footer / Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-muted-foreground">
        <div>
          {isMyMatch && (
            <Badge className="bg-primary/20 text-primary border-primary/30 text-[9px] font-black uppercase">
              Votre Match
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-primary font-bold group-hover:translate-x-1 transition-transform">
          <span>Détails & Score</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}
