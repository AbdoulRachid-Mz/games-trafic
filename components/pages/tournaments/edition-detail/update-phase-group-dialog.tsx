"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Settings } from "lucide-react";
import { updatePhaseGroup } from "@/actions/phases";
import { getEffectiveAdvanceCount, isMatchdayGroup } from "@/lib/tournaments/config";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface UpdatePhaseGroupDialogProps {
  group: {
    id: string;
    name: string | null;
    order: number | null;
    isLocked: boolean | null;
    config: any;
  };
  /** Phase parente : sert au champ qualifiés prérempli (héritage). */
  phase?: { config?: unknown } | null;
  asFormOnly?: boolean;
}

export function UpdatePhaseGroupDialog({ group, phase, asFormOnly = false }: UpdatePhaseGroupDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Un groupe-journée (RR refondu) ne qualifie jamais : pas de champ
  // « qualifiés » — la qualification est actée à la validation de phase.
  const isMatchday = isMatchdayGroup((group.config as any) || null);
  const currentAdvanceCount = getEffectiveAdvanceCount(phase ?? undefined, group);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const order = Number(formData.get("order") || 1);
    const isLocked = formData.get("isLocked") === "on";

    try {
      await updatePhaseGroup(group.id, {
        name,
        order,
        isLocked,
        config: {
          ...((group.config as any) || {}),
          // Champ vide = on retire la valeur : le groupe redevient héritant
          // de la phase plutôt que figé sur un défaut toute fait.
          ...(isMatchday
            ? {}
            : {
                advanceCount:
                  (formData.get("advanceCount") as string)?.trim() !== "" &&
                  !isNaN(Number(formData.get("advanceCount")))
                    ? Number(formData.get("advanceCount"))
                    : undefined,
              }),
        },
      } as any);

      toast.success("Groupe mis à jour avec succès");
      if (!asFormOnly) {
        setOpen(false);
      } else {
        router.back();
      }
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className={!asFormOnly ? "space-y-4 pt-4" : "space-y-4"}>
      <div className="space-y-2">
        <Label htmlFor="name">Nom du groupe</Label>
        <Input id="name" name="name" defaultValue={group.name || ""} required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="order">Ordre d'affichage</Label>
          <Input
            id="order"
            name="order"
            type="number"
            min={1}
            defaultValue={group.order || 1}
          />
        </div>
        {!isMatchday ? (
          <div className="space-y-2">
            <Label htmlFor="advanceCount">Nb Qualifiés (Q)</Label>
            <Input
              id="advanceCount"
              name="advanceCount"
              type="number"
              min={1}
              placeholder={`${currentAdvanceCount} (hérité)`}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Journée (pas de qualification ici)</Label>
            <p className="text-[10px] text-muted-foreground leading-snug">
              Les qualifiés sont décidés au classement de la phase, à la
              validation de la phase.
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 pt-2">
        <input
          type="checkbox"
          name="isLocked"
          id="isLocked"
          defaultChecked={!!group.isLocked}
          className="h-4 w-4 rounded border-primary/20 text-primary focus:ring-primary"
        />
        <Label htmlFor="isLocked" className="text-sm font-medium cursor-pointer">
          Verrouiller le groupe (lecture seule)
        </Label>
      </div>

      <div className="flex gap-2 sm:gap-0 justify-end pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => asFormOnly ? router.back() : setOpen(false)}
          disabled={loading}
          className="mr-2"
        >
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Enregistrer
        </Button>
      </div>
    </form>
  );

  if (asFormOnly) {
    return formContent;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" /> Modifier le groupe
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifier le groupe</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
