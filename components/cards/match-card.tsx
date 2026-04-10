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
  ShieldAlert
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
  match: any; // match object with participants, status, scores, etc.
  registrations?: Record<string, any>; // editionRegistrations map for name resolution
  onView?: () => void; // optional callback when view button clicked
  currentUserId?: string;
  isAdmin?: boolean;
  onUpdate?: () => void;
  viewMode?: "list" | "grid" | "compact"
  className?: string
}

export function MatchCard({ match, registrations, onView, currentUserId, isAdmin, onUpdate, viewMode = "grid", className }: MatchCardProps) {
  const p1 = match.participant1?.member?.user || match.participant1?.member?.team || match.participant1;
  const p2 = match.participant2?.member?.user || match.participant2?.member?.team || match.participant2;

  // Resolve display names and images from enriched data
  const p1Name = match.participant1?.member?.displayName || p1?.username || p1?.name || "À déterminer";
  const p2Name = match.participant2?.member?.displayName || p2?.username || p2?.name || "À déterminer";
  const p1Image = match.participant1?.member?.avatar || p1?.profileImage || p1?.image || p1?.logo;
  const p2Image = match.participant2?.member?.avatar || p2?.profileImage || p2?.image || p2?.logo;

  const isParticipant = currentUserId && (
    match.participant1?.member?.userId === currentUserId || 
    match.participant2?.member?.userId === currentUserId
  );

  const canSubmit = (isParticipant || isAdmin) && match.status !== "COMPLETED";
  const canAdminValidate = isAdmin && match.status !== "COMPLETED";

  const handleAdminValidate = async () => {
    try {
      // Use existing scores or 0 if not set
      const s1 = match.score1 ?? 0;
      const s2 = match.score2 ?? 0;
      const winnerId = s1 > s2 ? match.participant1RegistrationId : (s2 > s1 ? match.participant2RegistrationId : null);
      
      await updateMatchResult(match.id, s1, s2, winnerId || "", currentUserId || "");
      toast.success("Match validé par l'administrateur");
      onUpdate?.();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la validation");
    }
  };

  const getStatusBadge = () => {
    switch (match.status) {
      case "PENDING":
        return <Badge variant="outline" className="bg-slate-100 text-slate-700">Programmé</Badge>;
      case "IN_PROGRESS":
        return <Badge className="bg-blue-100 text-blue-700">En cours</Badge>;
      case "PENDING_REVIEW":
        return <Badge className="bg-yellow-100 text-yellow-700">En attente de confirmation</Badge>;
      case "AWAITING_ADMIN_CONFIRMATION":
        return <Badge className="bg-orange-100 text-orange-700">Vérification Admin</Badge>;
      case "COMPLETED":
        return (
          <Badge className="bg-green-100 text-green-700">
            <Check className="w-3 h-3 mr-1" /> Terminé
          </Badge>
        );
      case "DISPUTED":
        return <Badge variant="destructive">Litige</Badge>;
      default:
        return <Badge variant="secondary">{match.status}</Badge>;
    }
  };

  // Layout variants based on viewMode
  const isGrid = viewMode === "grid";
  const isList = viewMode === "list";
  const isCompact = viewMode === "compact";

  // Avatar sizes
  const avatarSize = isCompact ? "h-8 w-8" : isList ? "h-10 w-10" : "h-14 w-14";
  const scoreBoxSize = isCompact ? "h-8 w-8 text-base" : isList ? "h-10 w-10 text-lg" : "h-12 w-12 text-xl";
  const nameMaxWidth = isCompact ? "max-w-[80px]" : isList ? "max-w-[100px]" : "max-w-[120px]";

  // Wrapper classes
  const wrapperClasses = cn(
    "group relative overflow-hidden rounded-xl border bg-card transition-all hover:shadow-md",
    isCompact ? "p-2" : "p-4"
  );

  // Header layout
  const headerClasses = cn(
    "flex items-center justify-between",
    isCompact ? "mb-2" : "mb-4"
  );

  // Participants layout
  const participantsGrid = cn(
    "grid items-center gap-4",
    isList ? "grid-cols-[auto,1fr,auto,auto,1fr,auto] items-center" : "grid-cols-[1fr,auto,1fr]"
  );

  // Score centering
  const scoreCenter = cn(
    "flex flex-col items-center gap-1",
    isList && "flex-row gap-2"
  );

  // Button wrapper
  const buttonWrapper = cn(
    "mt-4",
    isCompact ? "mt-2" : isList ? "mt-3" : "mt-6"
  );

  return (
    <div className={wrapperClasses}>
      {/* Header: time, phase/round, status */}
      <div className={headerClasses}>
        <div className={cn("flex", isList ? "flex-row items-center gap-2" : "flex-col gap-1")}>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <Clock className={cn("h-3.5 w-3.5", isCompact && "h-3 w-3")} />
            {match.scheduledTime
              ? format(new Date(match.scheduledTime), "dd MMM, HH:mm", { locale: fr })
              : "Non planifié"}
          </div>
          <div className={cn("flex items-center gap-2", isList ? "ml-2" : "")}>
            {match.phase?.name && (
              <Badge variant="secondary" className={cn("opacity-70", isCompact ? "text-[8px] h-3 px-1" : "text-[9px] h-4 px-1.5")}>
                {match.phase.name}
              </Badge>
            )}
            {match.round && (
              <span className={cn("font-bold uppercase tracking-wider text-muted-foreground/70", isCompact ? "text-[9px]" : "text-[10px]")}>
                R{match.round}
              </span>
            )}
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {/* Participants and scores */}
      <div className={participantsGrid}>
        {/* Participant 1 */}
        <div className={cn("flex items-center gap-2", isList ? "" : "flex-col text-center")}>
          <Avatar className={cn(avatarSize, "border-2 border-background ring-2 ring-slate-100 group-hover:ring-primary/20 transition-all")}>
            <AvatarImage src={p1Image} />
            <AvatarFallback className="bg-slate-50 text-slate-400">
              <User className={cn(isCompact ? "h-4 w-4" : "h-6 w-6")} />
            </AvatarFallback>
          </Avatar>
          <div className={cn("space-y-0.5", isList && "flex-1")}>
            <p className={cn("truncate font-semibold text-foreground", nameMaxWidth, isCompact ? "text-xs" : "text-sm")}>
              {p1Name}
            </p>
            {match.confirmedByParticipant1 && !isCompact && (
              <span className="flex items-center justify-center text-[10px] text-green-600 font-medium">
                <CheckCircle2 className="mr-1 h-3 w-3" /> Confirmé
              </span>
            )}
          </div>
        </div>

        {/* Score / VS */}
        <div className={scoreCenter}>
          <div className={cn("flex items-center justify-center rounded-lg bg-black/20 font-bold border-2 transition-colors", scoreBoxSize, match.status === "COMPLETED" ? "border-slate-200" : "border-transparent")}>
            {match.status === "PENDING" ? "-" : (match.score1 ?? 0)}
          </div>
          {isList ? (
            <span className="text-sm font-medium text-muted-foreground mx-2">vs</span>
          ) : (
            <span className="text-sm font-medium text-muted-foreground">vs</span>
          )}
          <div className={cn("flex items-center justify-center rounded-lg bg-black/20 font-bold border-2 transition-colors", scoreBoxSize, match.status === "COMPLETED" ? "border-slate-200" : "border-transparent")}>
            {match.status === "PENDING" ? "-" : (match.score2 ?? 0)}
          </div>
          {match.status === "COMPLETED" && !isCompact && (
            <div className="mt-2 text-[10px] uppercase tracking-wider font-bold text-primary flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Officiel
            </div>
          )}
        </div>

        {/* Participant 2 */}
        <div className={cn("flex items-center gap-2", isList ? "" : "flex-col text-center")}>
          <Avatar className={cn(avatarSize, "border-2 border-background ring-2 ring-slate-100 group-hover:ring-primary/20 transition-all")}>
            <AvatarImage src={p2Image} />
            <AvatarFallback className="bg-slate-50 text-slate-400">
              <User className={cn(isCompact ? "h-4 w-4" : "h-6 w-6")} />
            </AvatarFallback>
          </Avatar>
          <div className={cn("space-y-0.5", isList && "flex-1")}>
            <p className={cn("truncate font-semibold text-foreground", nameMaxWidth, isCompact ? "text-xs" : "text-sm")}>
              {p2Name}
            </p>
            {match.confirmedByParticipant2 && !isCompact && (
              <span className="flex items-center justify-center text-[10px] text-green-600 font-medium">
                <CheckCircle2 className="mr-1 h-3 w-3" /> Confirmé
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action button */}
      <div className={cn(buttonWrapper, "flex gap-2")}>
        <Link 
          href={`/tournaments/${match.tournamentId}/editions/${match.editionId}/matches/${match.id}${canSubmit ? "?submit=true" : ""}`} 
          className="flex-1"
        >
          <Button 
            variant={canSubmit ? "default" : "outline"} 
            size={isCompact ? "xs" : "sm"} 
            className={cn(
              "w-full gap-2 transition-all",
              canSubmit ? "shadow-md shadow-primary/20" : "hover:bg-primary hover:text-primary-foreground"
            )}
          >
            {canSubmit ? (
              <>
                <Trophy className={cn("h-4 w-4", isCompact && "h-3 w-3")} /> Saisir le Score
              </>
            ) : (
              <>
                <History className={cn("h-4 w-4", isCompact && "h-3 w-3")} /> Détails & Score
              </>
            )}
          </Button>
        </Link>

        {canAdminValidate && (
          <ConfirmationDialog
            title="Validation Administrateur"
            description={`Êtes-vous sûr de vouloir valider officiellement ce score (${match.score1 ?? 0} - ${match.score2 ?? 0}) ? Cette action est irréversible.`}
            onConfirm={handleAdminValidate}
            confirmLabel="Valider le score"
            variant="default"
          >
            <Button size="icon" variant="outline" className="shrink-0 border-primary/20 text-primary hover:bg-primary/5" title="Validation Admin">
              <ShieldAlert className="h-4 w-4" />
            </Button>
          </ConfirmationDialog>
        )}
      </div>

      {/* Proof indicator */}
      {match.proofUrl && match.status !== "COMPLETED" && (
        <div className="absolute top-2 right-2 p-1 bg-primary/10 rounded-full" title="Preuve disponible">
          <Camera className={cn("text-primary", isCompact ? "w-3 h-3" : "w-3 h-3")} />
        </div>
      )}
    </div>
  );
}
