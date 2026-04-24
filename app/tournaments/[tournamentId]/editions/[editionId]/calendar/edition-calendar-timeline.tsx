// components/pages/tournaments/editions/calendar/edition-calendar-timeline.tsx
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Search,
  Filter,
  LayoutGrid,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  format,
  addDays,
  subDays,
  isSameDay,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { fr } from "date-fns/locale";
import {
  useMatchesByPhase,
  useMatchesByGroup,
  useMatchList,
} from "@/hooks/use-match-manager";
import { usePhases } from "@/hooks/use-phase-manager";
import { useGroups } from "@/hooks/use-group-manager";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Typography } from "@/components/ui/typography";
import Link from "next/link";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { updateMatchResult } from "@/actions/tournaments";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { StatsCarousel } from "@/components/shared/stats-carousel";

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
    (m: any) => m.status === "IN_PROGRESS",
  ).length;
  const myMatches = matches.filter(
    (m: any) =>
      m.participant1?.member?.userId === currentUserId ||
      m.participant2?.member?.userId === currentUserId,
  ).length;

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-wrap gap-3">
          <Select value={selectedPhaseId} onValueChange={setSelectedPhaseId}>
            <SelectTrigger className="w-fit">
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
              <SelectTrigger className="w-[180px] max-md:w-full">
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

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowUnplanned(!showUnplanned)}
            className={cn(
              "gap-2 max-md:flex-1",
              showUnplanned && "bg-amber-500/10 text-amber-600 border-amber-500/20"
            )}
          >
            <AlertCircle className="h-4 w-4" />
            Non planifiés ({unplannedMatches.length})
          </Button>
          <div className="h-8 w-px bg-border mx-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
            className="max-md:flex-1"
          >
            Aujourd'hui
          </Button>
        </div>
      </div>

      {/* Stats */}
      <StatsCarousel
        data={[
          {
            title: "Total matchs",
            value: totalMatches,
            icon: <CalendarDays className="h-4 w-4" />,
            // bgType: "blue",
            className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
          },
          {
            title: "Terminés",
            value: completedMatches,
            icon: <CheckCircle2 className="h-4 w-4" />,
            // bgType: "green",
            className: "bg-green-500/10 text-green-600 border-green-500/20",
          },
          {
            title: "En cours",
            value: inProgressMatches,
            icon: <Clock className="h-4 w-4" />,
            // bgType: "yellow",
            className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
          },
          {
            title: "Mes matchs",
            value: myMatches,
            icon: <Users className="h-4 w-4" />,
            // bgType: "purple",
            className: "bg-purple-500/10 text-purple-600 border-purple-500/20",
          },
          {
            title: "Phases",
            value: phases.length,
            icon: <GitBranch className="h-4 w-4" />,
            // bgType: "indigo",
            className: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
          },
        ]}
        mode="auto"
        withNavButtons
        itemsPerView={{
          mobile: 2,
          md: 3,
          lg: 4,
          xl: 5,
        }}
        gap={12}
      />

      {showUnplanned ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3 px-2">
            <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
              <AlertCircle className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-lg">Matchs en attente de planification</h3>
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
            <Card className="border-dashed py-12 text-center text-muted-foreground">
              <CardContent>Tous les matchs sont planifiés !</CardContent>
            </Card>
          )}
        </div>
      ) : (
        <>
          {/* Timeline Navigation */}
          <div className="flex items-center justify-between bg-card border rounded-xl p-4">
            <Button variant="ghost" size="icon" onClick={goPrevDay}>
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <div className="text-center">
              <div className="text-2xl font-bold">
                {format(currentDateObj, "EEEE d MMMM yyyy", { locale: fr })}
              </div>
              <div className="text-sm text-muted-foreground">
                {todayMatches.length} match(s) ce jour
              </div>
            </div>

            <Button variant="ghost" size="icon" onClick={goNextDay}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Mini-calendar / Date selector */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {dates.slice(0, 14).map((dateKey) => {
              const date = new Date(dateKey);
              const matchCount = matchesByDate.get(dateKey)?.length || 0;
              const isToday = isSameDay(date, new Date());
              const isSelected = currentDateKey === dateKey;

              return (currentDateKey === dateKey && (
                <button
                  key={dateKey}
                  onClick={() => setCurrentDate(date)}
                  className={cn(
                    "flex flex-col items-center p-2 rounded-lg min-w-[70px] transition-all",
                    isSelected && "bg-primary text-primary-foreground",
                    !isSelected && isToday && "border border-primary bg-primary/5",
                    !isSelected && !isToday && "hover:bg-muted",
                  )}
                >
                  <span className="text-xs font-medium">
                    {format(date, "EEE", { locale: fr })}
                  </span>
                  <span className="text-lg font-bold">{format(date, "d")}</span>
                  <span className="text-[10px] opacity-70">
                    {matchCount} match{matchCount > 1 ? "s" : ""}
                  </span>
                </button>
              ));
            })}
          </div>

          {/* Matchs du jour */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Matchs du {format(currentDateObj, "dd MMMM yyyy", { locale: fr })}
            </h3>

            {isLoading ? (
              <div className="animate-pulse space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-muted rounded-xl" />
                ))}
              </div>
            ) : todayMatches.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center text-muted-foreground flex flex-col items-center gap-4">
                  <span>Aucun match programmé pour cette date.</span>
                  {unplannedMatches.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowUnplanned(true)}
                    >
                      Voir les {unplannedMatches.length} matchs non planifiés
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {todayMatches
                  .sort((a: any, b: any) => {
                    const timeA = a.scheduledTime
                      ? new Date(a.scheduledTime).getTime()
                      : 0;
                    const timeB = b.scheduledTime
                      ? new Date(b.scheduledTime).getTime()
                      : 0;
                    return timeA - timeB;
                  })
                  .map((match: any) => (
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

// Composant helper
function StatCard({ label, value, icon, color }: any) {
  const colors: any = {
    blue: "bg-blue-50 border-blue-100 dark:bg-blue-900/20",
    green: "bg-green-50 border-green-100 dark:bg-green-900/20",
    yellow: "bg-yellow-50 border-yellow-100 dark:bg-yellow-900/20",
    purple: "bg-purple-50 border-purple-100 dark:bg-purple-900/20",
    indigo: "bg-indigo-50 border-indigo-100 dark:bg-indigo-900/20",
  };

  return (
    <div className={cn("p-3 rounded-xl border", colors[color])}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}

function MatchTimelineCard({ match, currentUserId, isAdmin }: any) {
  const isMyMatch =
    match.participant1?.member?.userId === currentUserId ||
    match.participant2?.member?.userId === currentUserId;

  const router = useRouter();

  const canAdminValidate = isAdmin && match.status !== "COMPLETED";

  const handleAdminValidate = async () => {
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

  return (
      <Card
        className={cn(
          "hover:shadow-lg transition-all group cursor-pointer border-2 hover:border-primary/50",
          isMyMatch && "border-l-4 border-l-primary bg-primary/5",
        )}
        onClick={() => router.push(`/tournaments/${match.tournamentId}/editions/${match.editionId}/matches/${match.id}`)}
      >
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-4 flex-wrap flex-1">
              {/* Heure */}
              <div className="flex items-center gap-1 text-sm font-mono bg-muted px-2 py-1 rounded">
                <Clock className="h-3 w-3" />
                {match.scheduledTime
                  ? format(new Date(match.scheduledTime), "HH:mm", { locale: fr })
                  : "Horaire TBD"}
              </div>

              {/* Participants */}
              <div className="flex items-center gap-3">
                <span className="font-bold">
                  {match.participant1?.member?.displayName || "TBD"}
                </span>
                <span className="text-muted-foreground text-xs font-black">
                  VS
                </span>
                <span className="font-bold">
                  {match.participant2?.member?.displayName || "TBD"}
                </span>
              </div>

              {/* Badges */}
              <div className="flex gap-2">
                <Badge variant="outline" className="text-[10px]">
                  {match.phase?.name || "Phase"}
                </Badge>
                {match.group?.name && (
                  <Badge variant="secondary" className="text-[10px]">
                    {match.group.name}
                  </Badge>
                )}
                {isMyMatch && (
                  <Badge variant="default" className="text-[10px]">
                    VOUS
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Score */}
              {match.status === "COMPLETED" &&
                match.score1 !== null &&
                match.score2 !== null && (
                  <div className="flex items-center gap-2 font-bold px-3 py-1 bg-primary/5 rounded-lg border border-primary/10">
                    <span
                      className={cn(
                        match.winnerRegistrationId ===
                          match.participant1RegistrationId && "text-primary",
                      )}
                    >
                      {match.score1}
                    </span>
                    <span className="opacity-30">-</span>
                    <span
                      className={cn(
                        match.winnerRegistrationId ===
                          match.participant2RegistrationId && "text-primary",
                      )}
                    >
                      {match.score2}
                    </span>
                  </div>
                )}

              <div className="flex items-center gap-2">
                {canAdminValidate && (
                  <ConfirmationDialog
                    title="Validation Administrateur"
                    description="Valider officiellement le score actuel ?"
                    onConfirm={handleAdminValidate}
                    confirmLabel="Valider"
                    variant="default"
                  >
                    <div onClick={(e) => e.preventDefault()}>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-primary hover:bg-primary/10">
                        <ShieldAlert className="h-4 w-4" />
                      </Button>
                    </div>
                  </ConfirmationDialog>
                )}
                
                <Button size="icon" variant="ghost" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
  );
}
