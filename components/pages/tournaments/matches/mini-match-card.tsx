import { useScreenSize } from "@/hooks/use-screen";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export function MiniMatchCard({
  match,
  currentUserId,
  isAdmin,
  onUpdate,
  compact = false,
}: any) {
  const { isMobile } = useScreenSize();
  const isExtremelyCompact = compact || isMobile;

  const getParticipantName = (regId: string | null) => {
    if (!regId) return "TBD";
    const p1Reg = match.participant1;
    const p2Reg = match.participant2;
    if (p1Reg?.id === regId) {
      return p1Reg.member?.displayName || p1Reg.member?.user?.username || "Joueur";
    }
    if (p2Reg?.id === regId) {
      return p2Reg.member?.displayName || p2Reg.member?.user?.username || "Joueur";
    }
    return "Joueur";
  };

  const getStatusColor = () => {
    switch (match.status) {
      case "COMPLETED": return "border-emerald-500/30 bg-emerald-500/5";
      case "IN_PROGRESS": return "border-blue-500/30 bg-blue-500/5";
      case "DISPUTED": return "border-amber-500/30 bg-amber-500/5";
      case "PENDING_REVIEW": return "border-purple-500/30 bg-purple-500/5";
      default: return "border-border/50 bg-card";
    }
  };

  const isWinner = (regId: string | null) => match.winnerRegistrationId === regId;
  const isUserParticipant =
    match.participant1?.member?.userId === currentUserId ||
    match.participant2?.member?.userId === currentUserId;

  return (
    <div
      className={cn(
        "rounded-lg border transition-all",
        getStatusColor(),
        isExtremelyCompact ? "p-1.5" : "p-2",
        isUserParticipant && !isAdmin && "border-primary/50 bg-primary/5",
      )}
    >
      <div className="flex items-center justify-between gap-1 md:gap-2">
        <div
          className={cn(
            "flex-1 text-[10px] md:text-xs font-medium truncate",
            isWinner(match.participant1RegistrationId) && "text-emerald-600 font-bold",
          )}
        >
          {getParticipantName(match.participant1RegistrationId)}
        </div>

        <div className="flex items-center gap-0.5 md:gap-1 font-mono font-bold text-[10px] md:text-xs">
          {match.score1 !== null && match.score2 !== null ? (
            <>
              <span className={cn("min-w-[16px] md:min-w-[20px] text-center", (match.score1 || 0) > (match.score2 || 0) && "text-emerald-600")}>
                {match.score1}
              </span>
              <span className="text-muted-foreground text-[8px] md:text-[10px]">-</span>
              <span className={cn("min-w-[16px] md:min-w-[20px] text-center", (match.score2 || 0) > (match.score1 || 0) && "text-emerald-600")}>
                {match.score2}
              </span>
            </>
          ) : (
            <span className="text-[8px] md:text-[9px] text-muted-foreground">VS</span>
          )}
        </div>

        <div
          className={cn(
            "flex-1 text-[10px] md:text-xs font-medium truncate text-right",
            isWinner(match.participant2RegistrationId) && "text-emerald-600 font-bold",
          )}
        >
          {getParticipantName(match.participant2RegistrationId)}
        </div>
      </div>

      {!isExtremelyCompact && (
        <div className="flex items-center justify-center gap-1 mt-1">
          <span className="text-[7px] md:text-[8px] text-muted-foreground">
            {match.status === "COMPLETED"
              ? "✓ Terminé"
              : match.status === "IN_PROGRESS"
                ? "⏳ En cours"
                : match.status === "PENDING_REVIEW"
                  ? "⏳ En attente"
                  : match.scheduledTime
                    ? format(new Date(match.scheduledTime), "dd/MM HH:mm")
                    : "📅 Programmé"}
          </span>
        </div>
      )}
    </div>
  );
}