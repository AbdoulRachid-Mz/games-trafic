"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Swords, AlertCircle, Users } from "lucide-react";
import { createMatch } from "@/actions/tournaments";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { validateGroupCapacity } from "@/hooks/use-bulk-validation";

interface CreateMatchDialogProps {
  editionId: string;
  phaseId: string;
  groupId: string | null;
  bracketNodeId: string | null;
  participants: Array<{
    registrationId: string;
    displayName: string;
    teamName?: string;
    isQualified?: boolean;
  }>;
  defaultRound?: number;
  defaultMatchNumber?: number;
  /** Nombre maximum de matchs dans ce contexte */
  maxMatches?: number;
  /** Nombre actuel de matchs */
  currentMatchesCount?: number;
}

export function CreateMatchDialog({
  editionId,
  phaseId,
  groupId,
  bracketNodeId,
  participants,
  defaultRound = 1,
  defaultMatchNumber = 1,
  maxMatches = 100,
  currentMatchesCount = 0,
}: CreateMatchDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [capacityError, setCapacityError] = useState<string | null>(null);
  const router = useRouter();

  const isAtCapacity = currentMatchesCount >= maxMatches;
  const remainingSlots = maxMatches - currentMatchesCount;

  // Vérifier la capacité à l'ouverture
  useEffect(() => {
    if (open) {
      if (isAtCapacity) {
        setCapacityError(`Limite de matchs atteinte (${currentMatchesCount}/${maxMatches})`);
      } else if (groupId) {
        validateGroupCapacity(groupId, 1).then(result => {
          if (!result.isValid) {
            setCapacityError(result.errors[0]);
          }
        });
      } else {
        setCapacityError(null);
      }
    }
  }, [open, isAtCapacity, currentMatchesCount, maxMatches, groupId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (capacityError) {
      toast.error("Action impossible: " + capacityError);
      return;
    }
    
    if (!p1 || !p2) {
      toast.error("Veuillez sélectionner deux participants.");
      return;
    }
    
    if (p1 === p2) {
      toast.error("Un participant ne peut pas jouer contre lui-même.");
      return;
    }

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const round = Number(formData.get("round") || defaultRound);
    const matchNumber = Number(formData.get("matchNumber") || defaultMatchNumber);
    const scheduledTime = formData.get("scheduledTime") ? new Date(formData.get("scheduledTime") as string) : undefined;
    const format = (formData.get("format") as string) || "BEST_OF_1";

    try {
      await createMatch({
        editionId,
        phaseId,
        groupId: groupId as any,
        bracketNodeId: bracketNodeId as any,
        round,
        matchNumber,
        participant1RegistrationId: p1,
        participant2RegistrationId: p2,
        scheduledTime,
        status: "PENDING",
        metadata: { format },
      } as any);

      toast.success("Match créé avec succès");
      setOpen(false);
      setP1("");
      setP2("");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  const getParticipantDisplay = (participant: typeof participants[0]) => {
    return participant.teamName 
      ? `${participant.displayName} (${participant.teamName})`
      : participant.displayName;
  };

  // Filtrer les participants déjà utilisés dans d'autres matchs? (optionnel)
  const availableParticipants = participants;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          size="sm" 
          className="gap-2" 
          disabled={isAtCapacity || participants.length < 2}
        >
          <Plus className="h-4 w-4" /> 
          Créer un match
          {isAtCapacity && (
            <Badge variant="destructive" className="ml-1 text-[8px] h-4">
              Limite
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Swords className="h-5 w-5 text-primary" />
            Nouveau match
          </DialogTitle>
          <DialogDescription>
            Créez une confrontation entre deux participants.
          </DialogDescription>
        </DialogHeader>
        
        {capacityError && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{capacityError}</span>
          </div>
        )}
        
        {!isAtCapacity && remainingSlots <= 10 && (
          <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center gap-2 text-yellow-600 text-xs">
            <AlertCircle className="h-3 w-3" />
            Plus que {remainingSlots} match(s) disponible(s)
          </div>
        )}
        
        {participants.length < 2 && (
          <div className="p-3 bg-muted rounded-lg flex items-center gap-2 text-muted-foreground text-sm">
            <Users className="h-4 w-4" />
            <span>Ajoutez d'abord des participants à ce groupe/bracket.</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="p1">Joueur 1</Label>
              <select
                id="p1"
                value={p1}
                onChange={(e) => setP1(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
                disabled={participants.length < 2}
              >
                <option value="">Sélectionner...</option>
                {availableParticipants.map((p) => (
                  <option key={p.registrationId} value={p.registrationId}>
                    {getParticipantDisplay(p)}
                    {p.isQualified && " (✓ qualifié)"}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="p2">Joueur 2</Label>
              <select
                id="p2"
                value={p2}
                onChange={(e) => setP2(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
                disabled={participants.length < 2}
              >
                <option value="">Sélectionner...</option>
                {availableParticipants.map((p) => (
                  <option key={p.registrationId} value={p.registrationId}>
                    {getParticipantDisplay(p)}
                    {p.isQualified && " (✓ qualifié)"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="round">Round</Label>
              <Input
                id="round"
                name="round"
                type="number"
                min={1}
                defaultValue={defaultRound}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="matchNumber">Match #</Label>
              <Input
                id="matchNumber"
                name="matchNumber"
                type="number"
                min={1}
                defaultValue={currentMatchesCount + 1}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="scheduledTime">Date & Heure (Optionnel)</Label>
            <Input id="scheduledTime" name="scheduledTime" type="datetime-local" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="format">Format du match</Label>
            <select
              id="format"
              name="format"
              defaultValue="BEST_OF_1"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="BEST_OF_1">Aller simple (BO1)</option>
              <option value="BEST_OF_3">Meilleur des 3 (BO3)</option>
              <option value="BEST_OF_5">Meilleur des 5 (BO5)</option>
              <option value="HOME_AWAY">Aller-retour</option>
            </select>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !!capacityError || participants.length < 2} 
              className="gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Swords className="h-4 w-4" />}
              Créer le match
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}