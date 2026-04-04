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
import { Loader2, Swords, AlertCircle, Users, RefreshCw } from "lucide-react";
import { createMatch } from "@/actions/tournaments";
import { getPhaseGroupParticipants, getMatches } from "@/actions/phases";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PhaseGroupParticipant, Match } from "@/database/schema";

interface GenerateGroupMatchesDialogProps {
  groupId: string;
  editionId: string;
  phaseId: string;
  /** Nombre maximum de matchs autorisés pour ce groupe */
  maxMatches?: number;
  /** Mode round-robin déjà partiellement généré ? */
  existingMatchesCount?: number;
  /** Config du groupe (nombre de participants max, etc.) */
  groupConfig?: {
    maxParticipants?: number;
    matchesPerParticipant?: number;
  };
}

export function GenerateGroupMatchesDialog({
  groupId,
  editionId,
  phaseId,
  maxMatches = 100,
  existingMatchesCount = 0,
  groupConfig,
}: GenerateGroupMatchesDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [participantsCount, setParticipantsCount] = useState(0);
  const [expectedMatchesCount, setExpectedMatchesCount] = useState(0);
  const router = useRouter();

  // Calculer le nombre de matchs attendus selon le format
  const calculateExpectedMatches = (participants: number, format: string) => {
    if (format === "SINGLE") {
      return (participants * (participants - 1)) / 2;
    } else if (format === "HOME_AWAY") {
      return participants * (participants - 1);
    }
    return 0;
  };

  // Vérifier la faisabilité à l'ouverture
  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        try {
          const list = await getPhaseGroupParticipants({
            filters: { groupId },
            pagination: { page: 1, limit: 500 },
          });
          const participants = list.data as PhaseGroupParticipant[];
          const count = participants.length;
          setParticipantsCount(count);

          // Calculer pour le format SINGLE par défaut
          const expected = calculateExpectedMatches(count, "SINGLE");
          setExpectedMatchesCount(expected);
        } catch (error) {
          console.error("Error fetching participants count:", error);
        }
      };
      fetchData();
    }
  }, [open, groupId]);

  const handleGenerate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const format = (formData.get("format") as string) || "SINGLE";
    const shuffleParticipants = formData.get("shuffle") === "on";

    try {
      // 1. Fetch participants
      const list = await getPhaseGroupParticipants({
        filters: { groupId },
        pagination: { page: 1, limit: 500 },
      });
      const items = list.data as PhaseGroupParticipant[];
      let regIds = items
        .map((p) => p.registrationId)
        .filter(Boolean) as string[];

      if (regIds.length < 2) {
        throw new Error(
          "Pas assez de participants pour générer des matchs (minimum 2).",
        );
      }

      // 2. Vérifier la limite de matchs
      const totalMatchesNeeded = calculateExpectedMatches(
        regIds.length,
        format,
      );
      if (existingMatchesCount + totalMatchesNeeded > maxMatches) {
        throw new Error(
          `Impossible de générer ${totalMatchesNeeded} matchs. Limite du groupe: ${maxMatches} matchs maximum. ` +
            `(Actuellement: ${existingMatchesCount} matchs existants)`,
        );
      }

      // 3. Shuffle participants if needed
      if (shuffleParticipants) {
        regIds = [...regIds].sort(() => Math.random() - 0.5);
      }

      // 4. Get existing matches to avoid duplicates
      const existingMatchesRes = await getMatches({
        filters: { groupId },
        pagination: { page: 1, limit: 1000 },
      });
      const existingMatches = existingMatchesRes.data as Match[];

      const existingPairs = new Set();
      for (const m of existingMatches) {
        if (m.participant1RegistrationId && m.participant2RegistrationId) {
          const key = `${m.participant1RegistrationId}-${m.participant2RegistrationId}`;
          existingPairs.add(key);
          if (format === "HOME_AWAY") {
            existingPairs.add(
              `${m.participant2RegistrationId}-${m.participant1RegistrationId}`,
            );
          }
        }
      }

      // 5. Generate matches (only missing ones)
      let counter = existingMatches.length + 1;
      const promises = [];
      let createdCount = 0;

      for (let i = 0; i < regIds.length; i++) {
        for (let j = i + 1; j < regIds.length; j++) {
          const key1 = `${regIds[i]}-${regIds[j]}`;
          const key2 = `${regIds[j]}-${regIds[i]}`;

          if (format === "HOME_AWAY") {
            // Aller
            if (!existingPairs.has(key1)) {
              promises.push(
                createMatch({
                  editionId,
                  phaseId,
                  groupId,
                  round: 1,
                  matchNumber: counter++,
                  participant1RegistrationId: regIds[i],
                  participant2RegistrationId: regIds[j],
                  status: "PENDING",
                  metadata: { format: "HOME_AWAY", leg: 1 },
                } as any),
              );
              createdCount++;
            }
            // Retour
            if (!existingPairs.has(key2)) {
              promises.push(
                createMatch({
                  editionId,
                  phaseId,
                  groupId,
                  round: 1,
                  matchNumber: counter++,
                  participant1RegistrationId: regIds[j],
                  participant2RegistrationId: regIds[i],
                  status: "PENDING",
                  metadata: { format: "HOME_AWAY", leg: 2 },
                } as any),
              );
              createdCount++;
            }
          } else {
            if (!existingPairs.has(key1)) {
              promises.push(
                createMatch({
                  editionId,
                  phaseId,
                  groupId,
                  round: 1,
                  matchNumber: counter++,
                  participant1RegistrationId: regIds[i],
                  participant2RegistrationId: regIds[j],
                  status: "PENDING",
                  metadata: { format: "BEST_OF_1" },
                } as any),
              );
              createdCount++;
            }
          }
        }
      }

      if (createdCount === 0) {
        toast.info("Tous les matchs sont déjà générés pour ce groupe.");
        setOpen(false);
        setLoading(false);
        return;
      }

      await Promise.all(promises);

      toast.success(
        `${createdCount} nouveau(x) match(s) généré(s) avec succès !`,
      );
      setOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la génération");
    } finally {
      setLoading(false);
    }
  };

  const isGenerationPossible = participantsCount >= 2;
  const willExceedLimit =
    existingMatchesCount + expectedMatchesCount > maxMatches;
  const isDisabled = !isGenerationPossible || willExceedLimit || loading;

  let disabledReason = "";
  if (!isGenerationPossible) disabledReason = "Minimum 2 participants requis";
  else if (willExceedLimit)
    disabledReason = `Limite de ${maxMatches} matchs dépassée`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="gap-2"
          disabled={!isGenerationPossible}
        >
          <RefreshCw className="h-4 w-4" /> Générer matchs
          {!isGenerationPossible && participantsCount < 2 && (
            <Badge variant="destructive" className="ml-1 text-[8px] h-4">
              Attente participants
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Swords className="h-5 w-5 text-primary" />
            Génération automatique des matchs
          </DialogTitle>
          <DialogDescription>
            Créez toutes les confrontations du groupe en une seule opération.
          </DialogDescription>
        </DialogHeader>

        {/* État des participants */}
        <div className="p-3 bg-muted/30 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Participants dans le groupe</span>
          </div>
          <Badge variant={participantsCount >= 2 ? "default" : "destructive"}>
            {participantsCount}
          </Badge>
        </div>

        {/* Avertissement de limite */}
        {willExceedLimit && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>
              Limite de {maxMatches} matchs. Actuellement:{" "}
              {existingMatchesCount} / {maxMatches}. Besoin de{" "}
              {expectedMatchesCount} nouveaux matchs.
            </span>
          </div>
        )}

        {/* Info sur le nombre de matchs attendus */}
        {isGenerationPossible && !willExceedLimit && (
          <div className="p-2 bg-primary/5 border border-primary/10 rounded-lg text-xs text-muted-foreground flex items-center justify-between">
            <span>Matchs à générer :</span>
            <Badge variant="secondary" className="text-[10px]">
              {expectedMatchesCount} nouveaux
            </Badge>
          </div>
        )}

        <form onSubmit={handleGenerate} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="format">Format de la rencontre</Label>
            <select
              id="format"
              name="format"
              defaultValue="SINGLE"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              disabled={loading}
            >
              <option value="SINGLE">
                Round-robin (chaque paire une fois)
              </option>
              <option value="HOME_AWAY">
                Aller-retour (chaque paire deux fois)
              </option>
            </select>
            <p className="text-[10px] text-muted-foreground">
              {participantsCount >= 2
                ? `Générera ${(participantsCount * (participantsCount - 1)) / 2} (SINGLE) ou ${participantsCount * (participantsCount - 1)} (HOME_AWAY) matchs`
                : "Au moins 2 participants requis"}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="shuffle"
              name="shuffle"
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label
              htmlFor="shuffle"
              className="text-sm font-normal cursor-pointer"
            >
              Mélanger aléatoirement l'ordre des matchs
            </Label>
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
              disabled={isDisabled}
              className="gap-2"
              title={disabledReason}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Swords className="h-4 w-4" />
              )}
              {loading ? "Génération..." : "Générer maintenant"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
