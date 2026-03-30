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
import { Loader2, Settings } from "lucide-react";
import { updatePhaseGroup } from "@/actions/phases";
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
}

export function UpdatePhaseGroupDialog({ group }: UpdatePhaseGroupDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const order = Number(formData.get("order") || 1);
    const advanceCount = Number(formData.get("advanceCount") || 2);
    const isLocked = formData.get("isLocked") === "on";

    try {
      await updatePhaseGroup(group.id, {
        name,
        order,
        isLocked,
        config: {
          ...((group.config as any) || {}),
          advanceCount,
        },
      } as any);

      toast.success("Groupe mis à jour avec succès");
      setOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

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
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
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
            <div className="space-y-2">
              <Label htmlFor="advanceCount">Nb Qualifiés (Q)</Label>
              <Input
                id="advanceCount"
                name="advanceCount"
                type="number"
                min={1}
                defaultValue={(group.config as any)?.advanceCount || 2}
              />
            </div>
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

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
