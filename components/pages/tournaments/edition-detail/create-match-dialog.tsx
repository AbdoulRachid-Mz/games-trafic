"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Swords } from "lucide-react";
import { createMatch } from "@/actions/tournaments";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface CreateMatchDialogProps {
  editionId: string;
  phaseId: string;
  groupId: string | null;
  bracketNodeId: string | null;
  participants: Array<{
    registrationId: string;
    displayName: string;
  }>;
  defaultRound?: number;
  defaultMatchNumber?: number;
}

export function CreateMatchDialog({
  editionId,
  phaseId,
  groupId,
  bracketNodeId,
  participants,
  defaultRound = 1,
  defaultMatchNumber = 1,
}: CreateMatchDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const p1 = formData.get("p1") as string;
    const p2 = formData.get("p2") as string;
    const round = Number(formData.get("round") || defaultRound);
    const matchNumber = Number(formData.get("matchNumber") || defaultMatchNumber);
    const scheduledTime = formData.get("scheduledTime") ? new Date(formData.get("scheduledTime") as string) : undefined;
    const format = (formData.get("format") as string) || "BEST_OF_1";

    if (!p1 || !p2) {
      toast.error("Veuillez sélectionner deux participants.");
      setLoading(false);
      return;
    }

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
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Créer un match
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nouveau match</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="p1">Joueur 1</Label>
              <select
                id="p1"
                name="p1"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              >
                <option value="">Sélectionner...</option>
                {participants.map((p) => (
                  <option key={p.registrationId} value={p.registrationId}>
                    {p.displayName}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="p2">Joueur 2</Label>
              <select
                id="p2"
                name="p2"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              >
                <option value="">Sélectionner...</option>
                {participants.map((p) => (
                  <option key={p.registrationId} value={p.registrationId}>
                    {p.displayName}
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
                defaultValue={defaultMatchNumber}
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
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
            <Button type="submit" disabled={loading} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Swords className="h-4 w-4" />}
              Créer le match
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
