"use client";

import React, { useState } from "react";
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
import { Loader2, Swords } from "lucide-react";
import { createMatch } from "@/actions/tournaments";
import { getPhaseGroupParticipants } from "@/actions/phases";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import type { PhaseGroupParticipant } from "@/database/schema";

interface GenerateGroupMatchesDialogProps {
  groupId: string;
  editionId: string;
  phaseId: string;
}

export function GenerateGroupMatchesDialog({
  groupId,
  editionId,
  phaseId,
}: GenerateGroupMatchesDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGenerate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const format = (formData.get("format") as string) || "SINGLE";

    try {
      // 1. Fetch participants
      const list = await getPhaseGroupParticipants({
        filters: { groupId },
        pagination: { page: 1, limit: 500 },
      });
      const items = list.data as PhaseGroupParticipant[];
      const regIds = items
        .map((p) => p.registrationId)
        .filter(Boolean) as string[];

      if (regIds.length < 2) {
        throw new Error("Pas assez de participants pour générer des matchs.");
      }

      // 2. Generate matches
      let counter = 1;
      const promises = [];

      for (let i = 0; i < regIds.length; i++) {
        for (let j = i + 1; j < regIds.length; j++) {
          if (format === "HOME_AWAY") {
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
              } as any)
            );
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
              } as any)
            );
          } else {
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
              } as any)
            );
          }
        }
      }

      await Promise.all(promises);

      toast.success(`${promises.length} matchs générés avec succès !`);
      setOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la génération");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Swords className="h-4 w-4" /> Générer matchs
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Générer les matchs du groupe</DialogTitle>
          <DialogDescription>
             Tous les participants s'affronteront selon le format choisi.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleGenerate} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="format">Format de la rencontre</Label>
            <select
              id="format"
              name="format"
              defaultValue="SINGLE"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="SINGLE">Aller simple (Une seule fois)</option>
              <option value="HOME_AWAY">Aller-retour (Deux fois)</option>
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
            <Button type="submit" disabled={loading} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Swords className="h-4 w-4" />}
              Générer maintenant
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
