"use client";

import React from "react";
import { SuccessDialog } from "@/components/shared/result-dialog";
import { Trophy, Swords, Share2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MatchSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matchData: {
    p1Name: string;
    p2Name: string;
    score1: number;
    score2: number;
    winnerName?: string;
    progressionResult?: any;
  };
  onClose?: () => void;
  onOrganizeNext?: () => void;
  showConfetti?: boolean;
}

export function MatchSuccessDialog({ 
  open, 
  onOpenChange, 
  matchData,
  onClose,
  onOrganizeNext,
  showConfetti = true 
}: MatchSuccessDialogProps) {
  const pr = matchData.progressionResult;
  let title = "Match Clôturé !";
  let description = "Le résultat a été validé officiellement et enregistré dans le bracket.";
  
  if (pr?.isEditionComplete) {
    title = "Édition Terminée !";
    description = "C'était le dernier match du tournoi. Le grand vainqueur est connu !";
  } else if (pr?.isPhaseComplete) {
    title = "Phase Terminée !";
    description = "Tous les matchs de cette phase sont terminés. Les qualifiés sont validés.";
  } else if (pr?.isGroupComplete) {
    title = "Groupe Terminé !";
    description = "Tous les matchs de ce groupe sont terminés. Le classement est définitif.";
  }

  const actions = [
    {
      label: "Partager le résultat",
      onClick: () => {
        if (navigator.share) {
          navigator.share({
            title: 'Résultat Match',
            text: `${matchData.p1Name} ${matchData.score1} - ${matchData.score2} ${matchData.p2Name}`,
            url: window.location.href,
          }).catch(console.error);
        } else {
          navigator.clipboard.writeText(`${matchData.p1Name} ${matchData.score1} - ${matchData.score2} ${matchData.p2Name}`);
          alert("Lien copié dans le presse-papier !");
        }
      },
      variant: "outline" as const,
      icon: <Share2 className="h-4 w-4" />,
    }
  ];

  if (pr?.nextLevelToOrganize && pr?.competitionMode === "MANUAL" && onOrganizeNext) {
    actions.push({
      label: `Organiser ${pr.nextLevelToOrganize.name}`,
      onClick: () => {
        onOpenChange(false);
        onOrganizeNext();
      },
      variant: "default" as const,
      primary: true,
      icon: <ArrowRight className="h-4 w-4" />,
    } as any);
    actions.push({
      label: "Plus tard",
      onClick: () => {
        onOpenChange(false);
        if (onClose) onClose();
      },
      variant: "outline" as const,
      icon: undefined as any,
    } as any);
  } else {
    actions.push({
      label: "Continuer",
      onClick: () => {
        onOpenChange(false);
        if (onClose) onClose();
      },
      variant: "default" as const,
      primary: true,
      icon: <ArrowRight className="h-4 w-4" />,
    } as any);
  }

  return (
    <SuccessDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      confettiType={showConfetti ? "celebration" : "none"}
      content={
        <div className="space-y-6 py-4">
          <div className="flex items-center justify-center gap-8 bg-muted/30 p-6 rounded-2xl border border-primary/10 relative overflow-hidden">
            <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent" />
            
            <div className="text-center z-10">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-bold">Participant 1</p>
              <p className="font-black text-lg">{matchData.p1Name}</p>
              <p className="text-4xl font-black mt-2 text-primary">{matchData.score1}</p>
            </div>

            <div className="flex flex-col items-center z-10">
              <div className="h-10 w-10 rounded-full bg-background border flex items-center justify-center shadow-sm">
                <Swords className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="h-8 w-[1px] bg-border my-1" />
              <p className="text-[10px] font-bold text-muted-foreground">VS</p>
            </div>

            <div className="text-center z-10">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-bold">Participant 2</p>
              <p className="font-black text-lg">{matchData.p2Name}</p>
              <p className="text-4xl font-black mt-2 text-primary">{matchData.score2}</p>
            </div>
          </div>

          {matchData.winnerName && (
            <div className="bg-primary/10 p-4 rounded-xl border border-primary/20 flex items-center gap-3 animate-in slide-in-from-bottom-2 duration-500">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-tight">Vainqueur</p>
                <p className="font-black text-foreground">{matchData.winnerName}</p>
              </div>
            </div>
          )}
        </div>
      }
      actions={actions}
    />
  );
}
