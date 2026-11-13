// @/components/cards/match-card.tsx
"use client";

import React, { useState } from "react";
import {
  Clock,
  Camera,
  Trophy,
  ShieldAlert,
  ChevronRight,
  User,
  History,
  CheckCircle2,
  Swords,
} from "lucide-react";
import Image from "next/image";
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
import { BaseCardProps, CardActionMenu, extraActionsProps } from "./card-action-menu";
import { matchStatusLabel } from "@/utils/types-label";
import { motion } from "framer-motion";

export interface MatchCardProps extends BaseCardProps<any> {
  match?: any;
  registrations?: Record<string, any>;
  onViewP1?: () => void;
  onViewP2?: () => void;
  currentUserId?: string;
  isAdmin?: boolean;
  onUpdate?: () => void;
  showMinInfo?: boolean;
}

export function MatchCard({
  item,
  match: propMatch,
  viewMode = "grid",
  status,
  isCliquable = true,
  isMini = false,
  activeAction = "view",
  onEdit,
  onView,
  onDelete,
  registrations,
  onViewP1,
  onViewP2,
  currentUserId,
  isAdmin,
  onUpdate,
  showMinInfo = false,
  className,
}: MatchCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const match = propMatch || item;
  
  const p1 =
    match.participant1?.member?.user ||
    match.participant1?.member?.team ||
    match.participant1;
  const p2 =
    match.participant2?.member?.user ||
    match.participant2?.member?.team ||
    match.participant2;

  const p1Name =
    match.participant1?.member?.team?.name ||
    match.participant1?.member?.displayName ||
    p1?.username ||
    p1?.name ||
    "TBD";
  const p2Name =
    match.participant2?.member?.team?.name ||
    match.participant2?.member?.displayName ||
    p2?.username ||
    p2?.name ||
    "TBD";

  const p1Image =
    match.participant1?.member?.team?.logo ||
    match.participant1?.member?.avatar ||
    p1?.profileImage ||
    "/icons/avatar-500.png";
  const p2Image =
    match.participant2?.member?.team?.logo ||
    match.participant2?.member?.avatar ||
    p2?.profileImage ||
    "/icons/avatar-500.png";

  const isParticipant = Boolean(
    (currentUserId &&
      (match.participant1?.member?.userId === currentUserId ||
        match.participant2?.member?.userId === currentUserId)) ||
      (match as any)._isMyMatch,
  );

  // Navigation fiable : ne jamais construire une URL avec un id vide.
  // match → édition → tournoi, avec repli sur les relations de la phase.
  const resolvedTournamentId: string | undefined =
    match.tournamentId ||
    match.edition?.tournamentId ||
    match.phase?.edition?.tournamentId;
  const resolvedEditionId: string | undefined =
    match.editionId ||
    match.edition?.id ||
    match.phase?.editionId ||
    match.phase?.edition?.id;
  const matchHref =
    resolvedTournamentId && resolvedEditionId
      ? `/tournaments/${resolvedTournamentId}/editions/${resolvedEditionId}/matches/${match.id}`
      : null;

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

  const handleView = () => {
    if (onView) onView(match);
  };

  const getStatusStyle = () => {
    switch (match.status) {
      case "COMPLETED":
        return {
          border: "border-green-500/50",
          glow: "shadow-[0_0_15px_rgba(34,197,94,0.15)]",
          badge: "bg-green-500/10 text-green-500 border-green-500/30",
          bg: "from-green-500/5 to-transparent"
        };
      case "IN_PROGRESS":
        return {
          border: "border-blue-500/50",
          glow: "shadow-[0_0_15px_rgba(59,130,246,0.15)] animate-pulse",
          badge: "bg-blue-500/10 text-blue-500 border-blue-500/30",
          bg: "from-blue-500/5 to-transparent"
        };
      case "PENDING_REVIEW":
      case "AWAITING_ADMIN_CONFIRMATION":
        return {
          border: "border-amber-500/50",
          glow: "shadow-[0_0_15px_rgba(245,158,11,0.15)]",
          badge: "bg-amber-500/10 text-amber-500 border-amber-500/30",
          bg: "from-amber-500/5 to-transparent"
        };
      case "DISPUTED":
        return {
          border: "border-red-500/50",
          glow: "shadow-[0_0_15px_rgba(239,68,68,0.15)]",
          badge: "bg-red-500/10 text-red-500 border-red-500/30",
          bg: "from-red-500/5 to-transparent"
        };
      default:
        return {
          border: "border-border/50",
          glow: "hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]",
          badge: "bg-secondary text-secondary-foreground border-border/50",
          bg: "from-muted/20 to-transparent"
        };
    }
  };

  const statusStyle = getStatusStyle();

  const getStatusBadge = () => {
    const label = matchStatusLabel(match.status);
    return (
      <Badge className={cn("text-[9px] sm:text-[10px] px-1.5 py-0 sm:py-0.5 uppercase tracking-wider font-bold backdrop-blur-sm", statusStyle.badge)}>
        {match.status === "COMPLETED" && <Trophy className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />}
        {match.status === "IN_PROGRESS" && <Swords className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1 animate-pulse" />}
        {label}
      </Badge>
    );
  };

  const extraActions: extraActionsProps[] = [];
  if (onViewP1) {
    extraActions.push({
      id: "view-p1",
      label: `Voir ${p1Name}`,
      icon: User,
      onClick: onViewP1
    });
  }
  if (onViewP2) {
    extraActions.push({
      id: "view-p2",
      label: `Voir ${p2Name}`,
      icon: User,
      onClick: onViewP2
    });
  }
  if (canSubmit) {
    extraActions.push({
      id: "submit",
      label: "Saisir le score",
      icon: Trophy,
      onClick: () => {
        if (!matchHref) {
          toast.error("Contexte du match incomplet (tournoi/édition introuvable)");
          return;
        }
        window.location.href = `${matchHref}?submit=true`;
      }
    });
  }

  const hasActions = onEdit || onView || onDelete || extraActions.length > 0;

  if (showMinInfo) {
    const isCompleted = match.status === "COMPLETED";
    return (
      <div
        className={cn(
          "group relative overflow-hidden rounded-xl border bg-card/80 backdrop-blur-md transition-all duration-300 cursor-pointer",
          statusStyle.border,
          statusStyle.glow,
          className,
        )}
        onClick={handleView}
      >
        <div className={cn("absolute inset-0 bg-gradient-to-r opacity-50", statusStyle.bg)} />
        <div className="p-3 relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-[9px] font-bold tracking-wider uppercase text-muted-foreground">
                {match.scheduledTime
                  ? format(new Date(match.scheduledTime), "dd MMM HH:mm", {
                      locale: fr,
                    })
                  : "À planifier"}
              </span>
            </div>
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              {getStatusBadge()}
              {hasActions && (
                <CardActionMenu
                  onEdit={onEdit ? () => onEdit(match) : undefined}
                  onView={onView ? () => onView(match) : undefined}
                  onDelete={onDelete ? () => onDelete(match) : undefined}
                  entityName={`le match ${p1Name} vs ${p2Name}`}
                  extraActions={extraActions}
                />
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div
              className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer hover:text-primary transition-colors group/p1"
              onClick={(e) => {
                e.stopPropagation();
                if (onViewP1) onViewP1();
              }}
            >
              <div className="relative">
                <Avatar className="h-7 w-7 rounded-md skew-x-[-10deg] border border-white/10 shrink-0 overflow-hidden shadow-lg group-hover/p1:border-primary/50 transition-colors">
                  <div className="skew-x-[10deg] w-full h-full scale-[1.2]">
                    <AvatarImage src={p1Image} className="object-cover" />
                  </div>
                  <AvatarFallback className="bg-muted text-[10px] skew-x-[10deg]">
                    {p1Name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <span className="truncate text-xs font-bold max-w-[80px] sm:max-w-[100px]">
                {p1Name}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 px-2 py-1 bg-background/50 rounded-lg border border-white/5 backdrop-blur-md">
              <span className={cn(
                "font-black text-sm italic tabular-nums leading-none",
                isCompleted && match.score1 > match.score2 ? "text-primary" : "text-foreground"
              )}>
                {match.status === "PENDING" ? "-" : (match.score1 ?? 0)}
              </span>
              <span className="text-[9px] font-black text-muted-foreground/50 mx-0.5">VS</span>
              <span className={cn(
                "font-black text-sm italic tabular-nums leading-none",
                isCompleted && match.score2 > match.score1 ? "text-primary" : "text-foreground"
              )}>
                {match.status === "PENDING" ? "-" : (match.score2 ?? 0)}
              </span>
            </div>

            <div
              className="flex items-center gap-2 flex-1 min-w-0 justify-end cursor-pointer hover:text-primary transition-colors group/p2"
              onClick={(e) => {
                e.stopPropagation();
                if (onViewP2) onViewP2();
              }}
            >
              <span className="truncate text-xs font-bold max-w-[80px] sm:max-w-[100px] text-right">
                {p2Name}
              </span>
              <div className="relative">
                <Avatar className="h-7 w-7 rounded-md skew-x-[-10deg] border border-white/10 shrink-0 overflow-hidden shadow-lg group-hover/p2:border-primary/50 transition-colors">
                  <div className="skew-x-[10deg] w-full h-full scale-[1.2]">
                    <AvatarImage src={p2Image} className="object-cover" />
                  </div>
                  <AvatarFallback className="bg-muted text-[10px] skew-x-[10deg]">
                    {p2Name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isListView = viewMode === "list";
  const isCompactView = viewMode === "compact" || isMini;

  const handleMainAction = () => {
    if (!isCliquable) return;
    if (activeAction === "view" && onView) onView(match);
    else if (activeAction === "edit" && onEdit) onEdit(match);
    else if (activeAction === "delete" && onDelete) onDelete(match);
    else if (onViewP1) onViewP1();
    else if (onViewP2) onViewP2();
    else if (onView) onView(match);
  };
  
  return (
    <motion.div 
      whileHover={isCliquable ? { scale: 0.995, y: -2 } : {}}
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-card/80 backdrop-blur-xl transition-all duration-300",
        statusStyle.border,
        statusStyle.glow,
        isCompactView ? "p-3" : "p-4 sm:p-5",
        isCliquable && "cursor-pointer",
        className
      )}
      onClick={handleMainAction}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Effects */}
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-30", statusStyle.bg)} />
      <div className={cn(
        "absolute inset-0 -translate-x-[150%] skew-x-[-30deg] bg-gradient-to-r from-transparent via-white/5 to-transparent z-0 transition-transform duration-1000",
        isHovered && "translate-x-[150%]"
      )} />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            {isParticipant && (
              <Badge className="bg-primary text-primary-foreground text-[9px] font-black uppercase tracking-wider gap-1 px-2 py-0.5 shadow-md shadow-primary/20">
                <Trophy className="h-2.5 w-2.5 fill-current" />
                Votre combat
              </Badge>
            )}
            <div className="flex items-center gap-1.5 px-2 py-1 bg-background/50 rounded-md border border-white/5 backdrop-blur-sm text-[10px] sm:text-xs text-muted-foreground font-bold uppercase tracking-wider">
              <Clock className={cn("h-3 w-3", isCompactView && "h-2.5 w-2.5")} />
              {match.scheduledTime
                ? format(new Date(match.scheduledTime), "dd MMM, HH:mm", { locale: fr })
                : "Non planifié"}
            </div>
            {match.phase?.name && (
              <Badge variant="outline" className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest border-white/10 bg-background/30 backdrop-blur-sm">
                {match.phase.name}
              </Badge>
            )}
            {match.round && (
              <span className="font-black italic uppercase tracking-widest text-muted-foreground/50 text-[10px] sm:text-xs bg-muted/50 px-1.5 py-0.5 rounded">
                R{match.round}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {getStatusBadge()}
            {hasActions && (
              <CardActionMenu
                onEdit={onEdit ? () => onEdit(match) : undefined}
                onView={onView ? () => onView(match) : undefined}
                onDelete={onDelete ? () => onDelete(match) : undefined}
                entityName={`le match ${p1Name} vs ${p2Name}`}
                extraActions={extraActions}
              />
            )}
          </div>
        </div>

        {/* VS Area */}
        <div className={cn("flex items-center justify-between gap-4", isListView ? "flex-row" : "flex-col sm:flex-row")}>
          
          {/* Player 1 */}
          <div className={cn(
            "flex flex-1 items-center gap-3",
            isListView ? "justify-start" : "justify-center sm:justify-end"
          )}>
            <div className={cn("flex flex-col gap-1", isListView ? "items-start" : "items-center sm:items-end")}>
              <span className={cn(
                "font-black italic tracking-tight text-foreground transition-colors group-hover:text-primary",
                isCompactView ? "text-sm" : "text-base sm:text-lg lg:text-xl",
                !isListView && "text-center sm:text-right"
              )}>
                {p1Name}
              </span>
              {match.confirmedByParticipant1 && (
                <span className="flex items-center text-[9px] sm:text-[10px] text-green-500 font-bold uppercase tracking-wider bg-green-500/10 px-1.5 py-0.5 rounded">
                  <CheckCircle2 className="mr-1 h-3 w-3" /> Confirmé
                </span>
              )}
            </div>
            <div className="relative group/avatar" onClick={(e) => { e.stopPropagation(); if (onViewP1) onViewP1(); }}>
              <div className={cn(
                "relative overflow-hidden border-2 transition-all duration-300",
                "bg-muted shadow-xl",
                isCompactView ? "w-10 h-10 rounded-lg skew-x-[-10deg]" : "w-12 h-12 sm:w-16 sm:h-16 rounded-xl skew-x-[-12deg]",
                "border-white/10 group-hover/avatar:border-primary/50 group-hover/avatar:shadow-primary/20"
              )}>
                <div className="w-full h-full scale-[1.2] skew-x-[12deg]">
                  {p1Image ? (
                    <Image src={p1Image} alt={p1Name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-black text-muted-foreground/30 text-xl">
                      {p1Name.charAt(0)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Score / VS Center */}
          <div className={cn(
            "flex items-center shrink-0 mx-2",
            isListView ? "" : "my-2 sm:my-0"
          )}>
            <div className="relative flex items-center bg-background/80 backdrop-blur-xl rounded-xl p-1 sm:p-1.5 border border-white/10 shadow-inner">
              <div className={cn(
                "flex items-center justify-center font-black italic tabular-nums leading-none rounded-lg bg-card border border-white/5 transition-colors",
                isCompactView ? "w-8 h-8 text-sm" : "w-10 h-10 sm:w-14 sm:h-14 text-lg sm:text-2xl",
                match.status === "COMPLETED" && match.score1 > match.score2 ? "text-primary shadow-[0_0_15px_rgba(var(--primary),0.2)]" : "text-foreground"
              )}>
                {match.status === "PENDING" ? "-" : (match.score1 ?? 0)}
              </div>
              <div className="px-2 sm:px-3 flex flex-col items-center justify-center">
                <span className="text-[10px] sm:text-xs font-black italic text-muted-foreground/40">VS</span>
              </div>
              <div className={cn(
                "flex items-center justify-center font-black italic tabular-nums leading-none rounded-lg bg-card border border-white/5 transition-colors",
                isCompactView ? "w-8 h-8 text-sm" : "w-10 h-10 sm:w-14 sm:h-14 text-lg sm:text-2xl",
                match.status === "COMPLETED" && match.score2 > match.score1 ? "text-primary shadow-[0_0_15px_rgba(var(--primary),0.2)]" : "text-foreground"
              )}>
                {match.status === "PENDING" ? "-" : (match.score2 ?? 0)}
              </div>
            </div>
          </div>

          {/* Player 2 */}
          <div className={cn(
            "flex flex-1 items-center gap-3",
            isListView ? "justify-end" : "justify-center sm:justify-start flex-row-reverse sm:flex-row"
          )}>
            <div className="relative group/avatar" onClick={(e) => { e.stopPropagation(); if (onViewP2) onViewP2(); }}>
              <div className={cn(
                "relative overflow-hidden border-2 transition-all duration-300",
                "bg-muted shadow-xl",
                isCompactView ? "w-10 h-10 rounded-lg skew-x-[-10deg]" : "w-12 h-12 sm:w-16 sm:h-16 rounded-xl skew-x-[-12deg]",
                "border-white/10 group-hover/avatar:border-primary/50 group-hover/avatar:shadow-primary/20"
              )}>
                <div className="w-full h-full scale-[1.2] skew-x-[12deg]">
                  {p2Image ? (
                    <Image src={p2Image} alt={p2Name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-black text-muted-foreground/30 text-xl">
                      {p2Name.charAt(0)}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className={cn("flex flex-col gap-1", isListView ? "items-end" : "items-center sm:items-start")}>
              <span className={cn(
                "font-black italic tracking-tight text-foreground transition-colors group-hover:text-primary",
                isCompactView ? "text-sm" : "text-base sm:text-lg lg:text-xl",
                !isListView && "text-center sm:text-left"
              )}>
                {p2Name}
              </span>
              {match.confirmedByParticipant2 && (
                <span className="flex items-center text-[9px] sm:text-[10px] text-green-500 font-bold uppercase tracking-wider bg-green-500/10 px-1.5 py-0.5 rounded">
                  <CheckCircle2 className="mr-1 h-3 w-3" /> Confirmé
                </span>
              )}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div 
          className={cn("mt-4 flex gap-2 pt-3 border-t border-white/5", isCompactView ? "mt-3 pt-2" : "mt-5")}
          onClick={(e) => e.stopPropagation()}
        >
          {canSubmit ? (
            <Link
              href={matchHref ? `${matchHref}?submit=true` : "#"}
              className="flex-1"
              onClick={(event) => {
                if (!matchHref) {
                  event.preventDefault();
                  onView?.(match);
                }
              }}
            >
              <Button
                variant="default"
                size={isCompactView ? "xs" : "sm"}
                className="w-full gap-2 font-bold uppercase tracking-wider text-xs shadow-[0_0_15px_rgba(var(--primary),0.2)] hover:shadow-[0_0_25px_rgba(var(--primary),0.4)] transition-shadow"
              >
                <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Saisir le score
              </Button>
            </Link>
          ) : (
            <Link
              href={matchHref ?? "#"}
              className="flex-1"
              onClick={(event) => {
                if (!matchHref) {
                  event.preventDefault();
                  onView?.(match);
                }
              }}
            >
              <Button
                variant="outline"
                size={isCompactView ? "xs" : "sm"}
                className="w-full gap-2 font-bold uppercase tracking-wider text-xs border-white/10 hover:bg-white/5"
              >
                <History className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Détails du match
              </Button>
            </Link>
          )}

          {canAdminValidate && (
            <ConfirmationDialog
              title="Validation Administrateur"
              description={`Valider officiellement le score (${match.score1 ?? 0} - ${match.score2 ?? 0}) ?`}
              onConfirm={handleAdminValidate}
              confirmLabel="Valider"
              variant="default"
            >
              <Button
                size={isCompactView ? "xs" : "sm"}
                variant="outline"
                className="shrink-0 border-amber-500/20 text-amber-500 hover:bg-amber-500/10 hover:border-amber-500/40"
                title="Validation Admin"
              >
                <ShieldAlert className="h-4 w-4" />
              </Button>
            </ConfirmationDialog>
          )}

          {match.proofUrl && match.status !== "COMPLETED" && (
            <Button
              size={isCompactView ? "xs" : "sm"}
              variant="outline"
              className="shrink-0 border-blue-500/20 text-blue-500 hover:bg-blue-500/10 hover:border-blue-500/40"
              title="Preuve disponible"
              onClick={() => window.open(match.proofUrl, '_blank')}
            >
              <Camera className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
