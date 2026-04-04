// components/pages/tournaments/editions/calendar/edition-calendar-timeline.tsx
"use client";

import React, { useState, useMemo } from "react";
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
  const filters: any = { editionId };
  if (selectedPhaseId !== "all") filters.phaseId = selectedPhaseId;
  if (selectedGroupId !== "all") filters.groupId = selectedGroupId;

  const { data: matchesRes, isLoading } = useMatchesByPhase(
    selectedPhaseId !== "all" ? selectedPhaseId : "",
    selectedPhaseId !== "all" ? selectedPhaseId : "",
  );
  const matches = matchesRes?.data || [];

  // Grouper les matchs par date
  const matchesByDate = useMemo(() => {
    const grouped = new Map<string, any[]>();
    for (const match of matches) {
      if (!match.scheduledTime) continue;
      const dateKey = format(new Date(match.scheduledTime), "yyyy-MM-dd");
      const arr = grouped.get(dateKey) || [];
      arr.push(match);
      grouped.set(dateKey, arr);
    }
    return grouped;
  }, [matches]);

  // Obtenir les dates uniques triées
  const dates = Array.from(matchesByDate.keys()).sort();

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
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-wrap gap-3">
          <Select value={selectedPhaseId} onValueChange={setSelectedPhaseId}>
            <SelectTrigger className="w-[180px]">
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
              <SelectTrigger className="w-[180px]">
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
            onClick={() => setCurrentDate(new Date())}
          >
            Aujourd'hui
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard
          label="Total matchs"
          value={totalMatches}
          icon={<CalendarDays className="h-4 w-4" />}
          color="blue"
        />
        <StatCard
          label="Terminés"
          value={completedMatches}
          icon={<CheckCircle2 className="h-4 w-4" />}
          color="green"
        />
        <StatCard
          label="En cours"
          value={inProgressMatches}
          icon={<Clock className="h-4 w-4" />}
          color="yellow"
        />
        <StatCard
          label="Mes matchs"
          value={myMatches}
          icon={<Users className="h-4 w-4" />}
          color="purple"
        />
        <StatCard
          label="Phases"
          value={phases.length}
          icon={<GitBranch className="h-4 w-4" />}
          color="indigo"
        />
      </div>

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

          return (
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
          );
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
            <CardContent className="py-12 text-center text-muted-foreground">
              Aucun match programmé pour cette date.
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

  return (
    <Card
      className={cn(
        "hover:shadow-md transition-all",
        isMyMatch && "border-l-4 border-l-primary bg-primary/5",
      )}
    >
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4 flex-wrap">
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

          {/* Score */}
          {match.status === "COMPLETED" &&
            match.score1 !== null &&
            match.score2 !== null && (
              <div className="flex items-center gap-2 font-bold">
                <span
                  className={cn(
                    match.winnerRegistrationId ===
                      match.participant1RegistrationId && "text-primary",
                  )}
                >
                  {match.score1}
                </span>
                <span>-</span>
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

          {/* Status */}
          <Badge
            variant={
              match.status === "COMPLETED"
                ? "default"
                : match.status === "IN_PROGRESS"
                  ? "secondary"
                  : match.status === "DISPUTED"
                    ? "destructive"
                    : "outline"
            }
          >
            {match.status === "COMPLETED"
              ? "Terminé"
              : match.status === "IN_PROGRESS"
                ? "En cours"
                : match.status === "DISPUTED"
                  ? "Litige"
                  : "Programmé"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
