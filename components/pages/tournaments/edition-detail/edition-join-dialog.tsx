"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Users, Shield } from "lucide-react";
import { TournamentEdition, Team } from "@/database/schema";

interface EditionJoinDialogProps {
  edition: TournamentEdition;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
  userTeam?: Team | null;
}

export function EditionJoinDialog({
  edition,
  open,
  onOpenChange,
  onConfirm,
  isLoading,
  userTeam,
}: EditionJoinDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rejoindre l'édition</DialogTitle>
          <DialogDescription>
            Confirmez votre inscription à{" "}
            <strong>{edition.name || `#${edition.editionNumber}`}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted p-4 rounded-lg flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="font-medium text-sm">Inscription via Équipe</div>
              <div className="text-xs text-muted-foreground">
                Profil de compétition
              </div>
            </div>
          </div>

          {userTeam ? (
            <div className="border border-primary/20 bg-primary/5 p-4 rounded-lg flex items-center gap-3">
              <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center overflow-hidden">
                {userTeam.logo ? (
                  <img
                    src={userTeam.logo}
                    alt={userTeam.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Shield className="h-4 w-4 text-primary" />
                )}
              </div>
              <div>
                <div className="text-sm font-medium">Votre Équipe</div>
                <div className="text-sm text-primary font-bold">
                  {userTeam.name}
                </div>
              </div>
            </div>
          ) : (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Information</AlertTitle>
              <AlertDescription>
                Une équipe <strong>Solo</strong> sera automatiquement créée pour
                vous pour participer.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading
              ? "Traitement..."
              : `Confirmer ${
                  userTeam ? "avec mon équipe" : "et créer mon équipe"
                }`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
