"use client";

import React from "react";
import {
  Clock,
  AlertCircle,
  CheckCircle2,
  User,
  History,
  Camera,
  ShieldCheck,
  Check,
  Trophy,
  ShieldAlert,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { updateMatchResult } from "@/actions/tournaments";
import { toast } from "sonner";

interface MatchCardProps {
  match: any;
  registrations?: Record<string, any>;
  onView?: () => void;
  onViewP1?: () => void;
  onViewP2?: () => void;
  currentUserId?: string;
  isAdmin?: boolean;
  onUpdate?: () => void;
  viewMode?: "list" | "grid" | "compact";
  showMinInfo?: boolean; // ✅ Nouveau: affichage minimal
  className?: string;
}

export function MatchCard({
  match,
  registrations,
  onView,
  onViewP1,
  onViewP2,
  currentUserId,
  isAdmin,
  onUpdate,
  viewMode = "grid",
  showMinInfo = false,
  className,
}: MatchCardProps) {
  const p1 =
    match.participant1?.member?.user ||
    match.participant1?.member?.team ||
    match.participant1;
  const p2 =
    match.participant2?.member?.user ||
    match.participant2?.member?.team ||
    match.participant2;

  const p1Name =
    match.participant1?.member?.displayName ||
    p1?.username ||
    p1?.name ||
    "À déterminer";
  const p2Name =
    match.participant2?.member?.displayName ||
    p2?.username ||
    p2?.name ||
    "À déterminer";

  const p1Id = match.participant1?.member?.userId || match.participant1?.member?.id;
  const p2Id = match.participant2?.member?.userId || match.participant2?.member?.id;

  const p1Image =
    match.participant1?.member?.avatar ||
    p1?.profileImage || "/icons/avatar-500.png"
  const p2Image =
    match.participant2?.member?.avatar ||
    p2?.profileImage || "/icons/avatar-500.png"

  const isParticipant =
    currentUserId &&
    (match.participant1?.member?.userId === currentUserId ||
      match.participant2?.member?.userId === currentUserId);

  const canSubmit = (isParticipant || isAdmin) && match.status !== "COMPLETED";
  const canAdminValidate = isAdmin && match.status !== "COMPLETED";

  const handleAdminValidate = async () => {
    try {
      const s1 = match.score1 ?? 0;
      const s2 = match.score2 ?? 0;
      const winnerId =
        s1 > s2
          ? match.participant1RegistrationId
          : s2 > s1
            ? match.participant2RegistrationId
            : null;

      await updateMatchResult(
        match.id,
        s1,
        s2,
        winnerId || "",
        currentUserId || "",
      );
      toast.success("Match validé par l'administrateur");
      onUpdate?.();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la validation");
    }
  };

  // ✅ Bordure latérale selon le statut
  const getBorderColor = () => {
    switch (match.status) {
      case "COMPLETED":
        return "border-l-4 border-l-green-500";
      case "IN_PROGRESS":
        return "border-l-4 border-l-blue-500";
      case "PENDING_REVIEW":
      case "AWAITING_ADMIN_CONFIRMATION":
        return "border-l-4 border-l-amber-500";
      case "DISPUTED":
        return "border-l-4 border-l-red-500";
      default:
        return "border-l-4 border-l-slate-300";
    }
  };

  const getStatusBadge = () => {
    switch (match.status) {
      case "PENDING":
        return (
          <Badge variant="outline" className="bg-slate-100 text-slate-700 text-[10px] h-5 px-1.5">
            Programmé
          </Badge>
        );
      case "IN_PROGRESS":
        return <Badge className="bg-blue-100 text-blue-700 text-[10px] h-5 px-1.5">En cours</Badge>;
      case "PENDING_REVIEW":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 text-[10px] h-5 px-1.5">
            En attente
          </Badge>
        );
      case "AWAITING_ADMIN_CONFIRMATION":
        return (
          <Badge className="bg-orange-100 text-orange-700 text-[10px] h-5 px-1.5">
            Vérification
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge className="bg-green-100 text-green-700 text-[10px] h-5 px-1.5">
            <Check className="w-2.5 h-2.5 mr-1" /> Terminé
          </Badge>
        );
      case "DISPUTED":
        return <Badge variant="destructive" className="text-[10px] h-5 px-1.5">Litige</Badge>;
      default:
        return <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{match.status}</Badge>;
    }
  };

  // ✅ Moins d'infos: affichage minimal
  if (showMinInfo) {
    const isCompleted = match.status === "COMPLETED";
    return (
      <div
        className={cn(
          "group relative overflow-hidden rounded-lg border bg-card transition-all hover:shadow-md cursor-pointer",
          getBorderColor(),
          className
        )}
        onClick={onView}
      >
        <div className="p-3">
          {/* Ligne 1: statut et time */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-[9px] text-muted-foreground">
                {match.scheduledTime
                  ? format(new Date(match.scheduledTime), "dd MMM HH:mm", { locale: fr })
                  : "À planifier"}
              </span>
            </div>
            {getStatusBadge()}
          </div>

          {/* Ligne 2: participants + score */}
          <div className="flex items-center justify-between gap-2">
            {/* Joueur 1 */}
            <div
              className="flex items-center gap-1.5 flex-1 min-w-0 cursor-pointer hover:text-primary transition-colors"
              onClick={onViewP1}
            >
              <Avatar className="h-6 w-6 ring-1 ring-slate-200">
                <AvatarImage src={p1Image} />
                <AvatarFallback className="bg-slate-100 text-[9px]">
                  {p1Name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="truncate text-xs font-medium max-w-[80px] sm:max-w-[100px]">
                {p1Name}
              </span>
            </div>

            {/* Score */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div
                className={cn(
                  "w-7 h-7 rounded-md flex items-center justify-center font-bold text-sm",
                  isCompleted && match.score1 > match.score2
                    ? "bg-green-100 text-green-700"
                    : "bg-slate-100 text-slate-700"
                )}
              >
                {match.status === "PENDING" ? "-" : (match.score1 ?? 0)}
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">vs</span>
              <div
                className={cn(
                  "w-7 h-7 rounded-md flex items-center justify-center font-bold text-sm",
                  isCompleted && match.score2 > match.score1
                    ? "bg-green-100 text-green-700"
                    : "bg-slate-100 text-slate-700"
                )}
              >
                {match.status === "PENDING" ? "-" : (match.score2 ?? 0)}
              </div>
            </div>

            {/* Joueur 2 */}
            <div
              className="flex items-center gap-1.5 flex-1 min-w-0 justify-end cursor-pointer hover:text-primary transition-colors"
              onClick={onViewP2}
            >
              <span className="truncate text-xs font-medium max-w-[80px] sm:max-w-[100px] text-right">
                {p2Name}
              </span>
              <Avatar className="h-6 w-6 ring-1 ring-slate-200">
                <AvatarImage src={p2Image} />
                <AvatarFallback className="bg-slate-100 text-[9px]">
                  {p2Name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          {/* Flèche d'aperçu */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // MODE NORMAL (affichage complet)
  // ============================================

  const isGrid = viewMode === "grid";
  const isList = viewMode === "list";
  const isCompact = viewMode === "compact";

  // ✅ Tailles responsives réduites
  const getAvatarSize = () => {
    if (isCompact) return "h-8 w-8";
    if (isList) return "h-9 w-9 md:h-10 md:w-10";
    return "h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14";
  };

  const getScoreBoxSize = () => {
    if (isCompact) return "h-7 w-7 text-sm";
    if (isList) return "h-8 w-8 text-base md:h-9 md:w-9 md:text-lg";
    return "h-9 w-9 text-lg sm:h-10 sm:w-10 sm:text-xl md:h-12 md:w-12 md:text-2xl";
  };

  const getNameMaxWidth = () => {
    if (isCompact) return "max-w-[70px] sm:max-w-[90px]";
    if (isList) return "max-w-[90px] sm:max-w-[120px] md:max-w-[150px]";
    return "max-w-[100px] sm:max-w-[130px] md:max-w-[160px]";
  };

  const wrapperClasses = cn(
    "group relative overflow-hidden rounded-xl border bg-card transition-all hover:shadow-md",
    getBorderColor(),
    isCompact ? "p-2" : "p-3 sm:p-4",
    className
  );

  const headerClasses = cn(
    "flex items-center justify-between",
    isCompact ? "mb-1.5" : "mb-3 sm:mb-4"
  );

  const participantsGrid = cn(
    "grid items-center gap-3 sm:gap-4",
    isList
      ? "grid-cols-[auto,1fr,auto,auto,1fr,auto] justify-between"
      : "grid-cols-[1fr,auto,1fr]"
  );

  const scoreCenter = cn(
    "flex flex-col items-center gap-0.5 sm:gap-1",
    isList && "flex-row gap-1 sm:gap-2"
  );

  const buttonWrapper = cn(
    "mt-3 flex gap-2",
    isCompact ? "mt-2" : isList ? "mt-2 sm:mt-3" : "mt-4 sm:mt-6"
  );

  return (
    <div className={wrapperClasses}>
      {/* Header */}
      <div className={headerClasses}>
        <div className={cn("flex", isList ? "flex-row items-center gap-2" : "flex-col gap-0.5 sm:gap-1")}>
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground">
            <Clock className={cn("h-3 w-3", isCompact && "h-2.5 w-2.5")} />
            {match.scheduledTime
              ? format(new Date(match.scheduledTime), "dd MMM, HH:mm", { locale: fr })
              : "Non planifié"}
          </div>
          <div className={cn("flex items-center gap-1.5", isList ? "ml-2" : "")}>
            {match.phase?.name && (
              <Badge
                variant="secondary"
                className={cn(
                  "text-[8px] sm:text-[9px] h-3.5 sm:h-4 px-1 sm:px-1.5"
                )}
              >
                {match.phase.name}
              </Badge>
            )}
            {match.round && (
              <span className={cn("font-bold uppercase tracking-wider text-muted-foreground/70 text-[8px] sm:text-[9px]")}>
                R{match.round}
              </span>
            )}
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {/* Participants et scores */}
      <div className={participantsGrid}>
        {/* Participant 1 */}
        <div className={cn("flex items-center gap-2", isList ? "" : "flex-col text-center")}>
          <Avatar className={cn(getAvatarSize(), "border-2 border-background ring-2 ring-slate-100 group-hover:ring-primary/20 transition-all")}>
            <AvatarImage src={p1Image} />
            <AvatarFallback className="bg-slate-50 text-slate-400 text-xs sm:text-sm">
              <User className={cn(isCompact ? "h-3.5 w-3.5" : "h-4 w-4 sm:h-5 sm:w-5")} />
            </AvatarFallback>
          </Avatar>
          <div className="space-y-0.5">
            <button
              onClick={onViewP1}
              className={cn(
                "truncate font-semibold text-foreground hover:text-primary transition-colors text-left",
                getNameMaxWidth(),
                isCompact ? "text-[11px] sm:text-xs" : "text-xs sm:text-sm"
              )}
            >
              {p1Name}
            </button>
            {match.confirmedByParticipant1 && !isCompact && (
              <span className="flex items-center justify-center text-[8px] sm:text-[9px] text-green-600 font-medium">
                <CheckCircle2 className="mr-0.5 h-2.5 w-2.5" /> Confirmé
              </span>
            )}
          </div>
        </div>

        {/* Score / VS */}
        <div className={scoreCenter}>
          <div className={cn("flex items-center justify-center rounded-lg bg-black/20 font-bold border-2 transition-colors", getScoreBoxSize())}>
            {match.status === "PENDING" ? "-" : (match.score1 ?? 0)}
          </div>
          {isList ? (
            <span className="text-xs sm:text-sm font-medium text-muted-foreground mx-1 sm:mx-2">vs</span>
          ) : (
            <span className="text-[10px] sm:text-sm font-medium text-muted-foreground">vs</span>
          )}
          <div className={cn("flex items-center justify-center rounded-lg bg-black/20 font-bold border-2 transition-colors", getScoreBoxSize())}>
            {match.status === "PENDING" ? "-" : (match.score2 ?? 0)}
          </div>
          {match.status === "COMPLETED" && !isCompact && (
            <div className="mt-1 text-[8px] sm:text-[9px] uppercase tracking-wider font-bold text-primary flex items-center gap-0.5">
              <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Officiel
            </div>
          )}
        </div>

        {/* Participant 2 */}
        <div className={cn("flex items-center gap-2", isList ? "" : "flex-col text-center")}>
          <Avatar className={cn(getAvatarSize(), "border-2 border-background ring-2 ring-slate-100 group-hover:ring-primary/20 transition-all")}>
            <AvatarImage src={p2Image} />
            <AvatarFallback className="bg-slate-50 text-slate-400 text-xs sm:text-sm">
              <User className={cn(isCompact ? "h-3.5 w-3.5" : "h-4 w-4 sm:h-5 sm:w-5")} />
            </AvatarFallback>
          </Avatar>
          <div className="space-y-0.5">
            <button
              onClick={onViewP2}
              className={cn(
                "truncate font-semibold text-foreground hover:text-primary transition-colors text-left",
                getNameMaxWidth(),
                isCompact ? "text-[11px] sm:text-xs" : "text-xs sm:text-sm"
              )}
            >
              {p2Name}
            </button>
            {match.confirmedByParticipant2 && !isCompact && (
              <span className="flex items-center justify-center text-[8px] sm:text-[9px] text-green-600 font-medium">
                <CheckCircle2 className="mr-0.5 h-2.5 w-2.5" /> Confirmé
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className={buttonWrapper}>
        <Link
          href={`/tournaments/${match.tournamentId}/editions/${match.editionId}/matches/${match.id}${canSubmit ? "?submit=true" : ""}`}
          className="flex-1"
        >
          <Button
            variant={canSubmit ? "default" : "outline"}
            size={isCompact ? "xs" : "sm"}
            className={cn(
              "w-full gap-1.5 text-xs sm:text-sm transition-all",
              canSubmit && "shadow-md shadow-primary/20"
            )}
          >
            {canSubmit ? (
              <>
                <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Saisir
              </>
            ) : (
              <>
                <History className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Détails
              </>
            )}
          </Button>
        </Link>

        {canAdminValidate && (
          <ConfirmationDialog
            title="Validation Administrateur"
            description={`Valider officiellement le score (${match.score1 ?? 0} - ${match.score2 ?? 0}) ?`}
            onConfirm={handleAdminValidate}
            confirmLabel="Valider"
            variant="default"
          >
            <Button
              size="icon"
              variant="outline"
              className="shrink-0 border-primary/20 text-primary hover:bg-primary/5 h-8 w-8 sm:h-9 sm:w-9"
              title="Validation Admin"
            >
              <ShieldAlert className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </ConfirmationDialog>
        )}
      </div>

      {/* Proof indicator */}
      {match.proofUrl && match.status !== "COMPLETED" && (
        <div className="absolute top-2 right-2 p-1 bg-primary/10 rounded-full" title="Preuve disponible">
          <Camera className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary" />
        </div>
      )}
    </div>
  );
}