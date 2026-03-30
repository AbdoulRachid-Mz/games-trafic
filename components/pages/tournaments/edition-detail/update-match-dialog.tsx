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
import { Loader2, Swords } from "lucide-react";
import { updateMatch } from "@/actions/phases";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface UpdateMatchDialogProps {
  match: {
    id: string;
    score1: number | null;
    score2: number | null;
    scheduledTime: Date | string | null;
  };
  p1Name: string;
  p2Name: string;
}

export function UpdateMatchDialog({
  match,
  p1Name,
  p2Name,
}: UpdateMatchDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const score1 = formData.get("score1") ? Number(formData.get("score1")) : null;
    const score2 = formData.get("score2") ? Number(formData.get("score2")) : null;
    const scheduledTime = formData.get("scheduledTime") ? new Date(formData.get("scheduledTime") as string) : undefined;

    try {
      await updateMatch(match.id, {
        score1: score1 as any,
        score2: score2 as any,
        scheduledTime,
      } as any);

      toast.success("Match mis à jour");
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
        <Button variant="outline" size="sm" className="h-7 text-xs">
          Modifier
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifier le match</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-xl border">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="score1" className="text-[10px] uppercase font-bold text-muted-foreground truncate block">
                {p1Name}
              </Label>
              <Input
                id="score1"
                name="score1"
                type="number"
                defaultValue={match.score1 ?? undefined}
                className="text-center font-black text-lg h-12"
                placeholder="0"
              />
            </div>
            <span className="text-xl font-black italic text-muted-foreground pt-5">VS</span>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="score2" className="text-[10px] uppercase font-bold text-muted-foreground truncate block">
                {p2Name}
              </Label>
              <Input
                id="score2"
                name="score2"
                type="number"
                defaultValue={match.score2 ?? undefined}
                className="text-center font-black text-lg h-12"
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="scheduledTime">Date & Heure</Label>
            <Input
              id="scheduledTime"
              name="scheduledTime"
              type="datetime-local"
              defaultValue={
                match.scheduledTime
                  ? new Date(match.scheduledTime).toISOString().slice(0, 16)
                  : ""
              }
            />
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
