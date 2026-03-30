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
import { Loader2, Plus } from "lucide-react";
import { createBracketNode } from "@/actions/phases";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface CreateBracketNodeDialogProps {
  phaseId: string;
  groupId: string;
  defaultOrder?: number;
  groupOrder?: number;
}

export function CreateBracketNodeDialog({
  phaseId,
  groupId,
  defaultOrder = 0,
  groupOrder = 0,
}: CreateBracketNodeDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const nodeCode =
      ((formData.get("nodeCode") as string) || "").trim() ||
      `G${groupOrder}-N${Date.now().toString().slice(-4)}`;
    const round = Number(formData.get("round") || 1);
    const matchNumber = Number(formData.get("matchNumber") || 1);
    const bracketType = (formData.get("bracketType") as string) || "UPPER";

    try {
      await createBracketNode({
        phaseId,
        groupId,
        nodeCode,
        round,
        matchNumber,
        bracketType,
        order: defaultOrder,
      } as any);

      toast.success("Nœud créé avec succès");
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
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 shadow-sm border-primary/20 bg-primary/5 hover:bg-primary/10"
        >
          <Plus className="h-3.5 w-3.5" /> Nouveau
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nouveau nœud de bracket</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-1.5">
            <Label htmlFor="nodeCode">Code d'identification</Label>
            <Input
              id="nodeCode"
              name="nodeCode"
              placeholder="ex: QF1"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="round">Round</Label>
              <Input
                id="round"
                name="round"
                type="number"
                min={1}
                defaultValue={1}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="matchNumber">Match #</Label>
              <Input
                id="matchNumber"
                name="matchNumber"
                type="number"
                min={1}
                defaultValue={1}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bracketType">Position Bracket</Label>
            <select
              id="bracketType"
              name="bracketType"
              defaultValue="UPPER"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="UPPER">Upper Bracket (WB)</option>
              <option value="LOWER">Lower Bracket (LB)</option>
              <option value="FINAL">Grand Final</option>
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
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer le nœud
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
