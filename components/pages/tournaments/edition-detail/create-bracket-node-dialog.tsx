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
import { Loader2, Plus, AlertCircle, Layers } from "lucide-react";
import { createBracketNode } from "@/actions/phases";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { validateGroupCapacityAction } from "@/actions/validation";

interface CreateBracketNodeDialogProps {
  phaseId: string;
  groupId: string;
  defaultOrder?: number;
  groupOrder?: number;
  /** Nombre maximum de nodes dans ce groupe */
  maxNodes?: number;
  /** Nombre actuel de nodes */
  currentNodesCount?: number;
}

export function CreateBracketNodeDialog({
  phaseId,
  groupId,
  defaultOrder = 0,
  groupOrder = 0,
  maxNodes = 20,
  currentNodesCount = 0,
}: CreateBracketNodeDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [capacityError, setCapacityError] = useState<string | null>(null);
  const router = useRouter();

  const isAtCapacity = currentNodesCount >= maxNodes;
  const remainingSlots = maxNodes - currentNodesCount;

  // Dans le useEffect
  useEffect(() => {
    if (open) {
      if (isAtCapacity) {
        setCapacityError(
          `Limite de nodes atteinte (${currentNodesCount}/${maxNodes})`,
        );
      } else if (groupId) {
        validateGroupCapacityAction(groupId, 1).then((result) => {
          if (!result.isValid) {
            setCapacityError(result.errors[0]);
          } else {
            setCapacityError(null);
          }
        });
      } else {
        setCapacityError(null);
      }
    }
  }, [open, isAtCapacity, currentNodesCount, maxNodes, groupId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isAtCapacity) {
      toast.error(
        `Impossible d'ajouter un node : limite de ${maxNodes} nodes atteinte`,
      );
      return;
    }

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
        metadata: {
          participants: [],
          requiresMatch: true,
          generateMatches: true,
          matchesCount: 1,
          format: 'BEST_OF_1'
        },
      } as any);

      toast.success(`Nœud "${nodeCode}" créé avec succès`);
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
          className={cn(
            "h-8 gap-1.5 shadow-sm",
            isAtCapacity
              ? "border-destructive/50 text-destructive hover:bg-destructive/10"
              : "border-primary/20 bg-primary/5 hover:bg-primary/10",
          )}
          disabled={isAtCapacity}
        >
          <Plus className="h-3.5 w-3.5" />
          Nouveau node
          {isAtCapacity && (
            <Badge variant="destructive" className="ml-1 text-[8px] h-4">
              Complet
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Nouveau nœud de bracket
          </DialogTitle>
          <DialogDescription>
            Créez un nouveau nœud dans le bracket. Les participants pourront y
            être assignés ensuite.
          </DialogDescription>
        </DialogHeader>

        {capacityError && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{capacityError}</span>
          </div>
        )}

        {!isAtCapacity && remainingSlots <= 3 && (
          <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center gap-2 text-yellow-600 text-xs">
            <AlertCircle className="h-3 w-3" />
            Plus que {remainingSlots} place(s) disponible(s)
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-1.5">
            <Label htmlFor="nodeCode">Code d'identification</Label>
            <Input
              id="nodeCode"
              name="nodeCode"
              placeholder="ex: QF1, SF2, F"
              className="font-mono"
            />
            <p className="text-[10px] text-muted-foreground">
              Laissez vide pour génération automatique
            </p>
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
                defaultValue={currentNodesCount + 1}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bracketType">Position dans l'arbre</Label>
            <select
              id="bracketType"
              name="bracketType"
              defaultValue="UPPER"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="UPPER">Upper Bracket (Vainqueurs)</option>
              <option value="LOWER">Lower Bracket (Éliminés)</option>
              <option value="FINAL">Grande Finale</option>
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
            <Button type="submit" disabled={loading || isAtCapacity}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer le nœud
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
