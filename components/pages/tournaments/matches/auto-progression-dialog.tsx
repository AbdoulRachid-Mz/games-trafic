"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { addQualifiedToNextPhase } from "@/actions/tournaments";

interface AutoProgressionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  winnerName: string;
  winnerRegistrationId: string;
  nextPhaseId: string;
  editionId: string;
  tournamentId: string;
}

export function AutoProgressionDialog({
  open,
  onOpenChange,
  winnerName,
  winnerRegistrationId,
  nextPhaseId,
  editionId,
  tournamentId,
}: AutoProgressionDialogProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const result = await addQualifiedToNextPhase({
        registrationId: winnerRegistrationId,
        nextPhaseId,
        editionId,
      });

      if (result.success) {
        toast.success(`${winnerName} a été ajouté à la phase suivante !`);
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de l'ajout");
      }
    } catch (error) {
      toast.error("Erreur lors de l'ajout à la phase suivante");
    } finally {
      setLoading(false);
    }
  };

  const handleLater = () => {
    onOpenChange(false);
    toast.info(
      `${winnerName} pourra être ajouté manuellement plus tard depuis le dashboard.`,
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Qualification automatique
          </DialogTitle>
          <DialogDescription>
            {winnerName} a terminé tous ses matches dans cette phase.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 text-center space-y-2">
          <div className="text-2xl font-bold text-primary">{winnerName}</div>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <span>Phase actuelle</span>
            <ArrowRight className="h-4 w-4" />
            <span className="font-medium">Phase suivante</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Souhaitez-vous l'ajouter automatiquement à la phase suivante ?
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={handleLater}
            disabled={loading}
            className="flex-1"
          >
            Plus tard
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trophy className="h-4 w-4" />
            )}
            Ajouter à la phase suivante
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
