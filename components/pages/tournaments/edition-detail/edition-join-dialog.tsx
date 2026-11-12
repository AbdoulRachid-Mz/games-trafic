"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Shield, User } from "lucide-react";
import { TournamentEdition, Team } from "@/database/schema";

export interface JoinEditionFormValues {
  playerName: string;
  teamName?: string;
}

interface EditionJoinDialogProps {
  edition: TournamentEdition;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (values: JoinEditionFormValues) => void;
  isLoading?: boolean;
  userTeam?: Team | null;
  defaultPlayerName?: string;
}

export function EditionJoinDialog({
  edition,
  open,
  onOpenChange,
  onConfirm,
  isLoading,
  userTeam,
  defaultPlayerName = "",
}: EditionJoinDialogProps) {
  const [playerName, setPlayerName] = useState(defaultPlayerName);
  const [teamName, setTeamName] = useState(userTeam?.name ?? "");
  const [error, setError] = useState<string | null>(null);

  // Réinitialise le formulaire à chaque ouverture avec les valeurs par défaut.
  useEffect(() => {
    if (!open) return;
    setPlayerName(defaultPlayerName);
    setTeamName(userTeam?.name ?? "");
    setError(null);
  }, [open, defaultPlayerName, userTeam?.name]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = playerName.trim();
    if (trimmedName.length < 2) {
      setError("Indiquez un nom de joueur d'au moins 2 caractères.");
      return;
    }
    if (trimmedName.length > 60) {
      setError("Le nom de joueur ne peut pas dépasser 60 caractères.");
      return;
    }
    if (teamName.trim().length > 80) {
      setError("Le nom d'équipe ne peut pas dépasser 80 caractères.");
      return;
    }
    setError(null);
    onConfirm({
      playerName: trimmedName,
      teamName: teamName.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Rejoindre l&apos;édition</DialogTitle>
            <DialogDescription>
              Confirmez votre inscription à{" "}
              <strong>{edition.name || `#${edition.editionNumber}`}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="join-player-name" className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-primary" />
                Nom de joueur
              </Label>
              <Input
                id="join-player-name"
                value={playerName}
                onChange={(event) => setPlayerName(event.target.value)}
                placeholder="Ex. ShadowStrike"
                maxLength={60}
                required
                autoComplete="nickname"
              />
              <p className="text-xs text-muted-foreground">
                Ce nom apparaîtra dans les classements et les matchs de l&apos;édition.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="join-team-name" className="flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-primary" />
                Équipe <span className="text-muted-foreground">(facultatif)</span>
              </Label>
              <Input
                id="join-team-name"
                value={teamName}
                onChange={(event) => setTeamName(event.target.value)}
                placeholder={
                  userTeam?.name
                    ? userTeam.name
                    : "Ex. Les Invincibles — laissez vide pour jouer en solo"
                }
                maxLength={80}
              />
              {userTeam?.name && (
                <p className="text-xs text-muted-foreground">
                  Votre équipe actuelle est proposée par défaut. Vous pouvez la
                  modifier pour cette inscription.
                </p>
              )}
            </div>

            {error && (
              <p className="text-sm font-medium text-destructive" role="alert">
                {error}
              </p>
            )}

            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Validation de l&apos;inscription</AlertTitle>
              <AlertDescription>
                {Number(edition.entryFee || 0) > 0
                  ? "Votre inscription sera effective après confirmation du paiement."
                  : "Votre place est confirmée immédiatement. Vous serez redirigé vers votre profil de participant."}
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? "Inscription en cours..."
                : Number(edition.entryFee || 0) > 0
                  ? "Continuer vers le paiement"
                  : "Confirmer mon inscription"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
