// @/components/pages/tournaments/edition-detail/create-bracket-node-dialog.tsx
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
import { Loader2, Plus, AlertCircle, Layers, Info } from "lucide-react";
import { createBracketNode } from "@/actions/phases";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface CreateBracketNodeDialogProps {
  phaseId: string;
  groupId: string;
  phaseType?: string;
  defaultOrder?: number;
  groupOrder?: number;
  maxNodes?: number;
  currentNodesCount?: number;
  inheritedConfig?: {
    nodeType?: "ROUND_ROBIN" | "ELIMINATION" | "SWISS";
    matchFormat?: "BEST_OF_1" | "BEST_OF_3" | "BEST_OF_5";
    generateMatches?: boolean;
  };
  asFormOnly?: boolean;
}

export function CreateBracketNodeDialog({
  phaseId,
  groupId,
  phaseType = "GROUP_STAGE",
  defaultOrder = 0,
  groupOrder = 0,
  maxNodes = 20,
  currentNodesCount = 0,
  inheritedConfig,
  asFormOnly = false,
}: CreateBracketNodeDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nodeType, setNodeType] = useState<"ROUND_ROBIN" | "ELIMINATION" | "SWISS">(
    inheritedConfig?.nodeType || (phaseType === "ROUND_ROBIN" ? "ROUND_ROBIN" : "ELIMINATION")
  );
  const [matchFormat, setMatchFormat] = useState<"BEST_OF_1" | "BEST_OF_3" | "BEST_OF_5">(
    inheritedConfig?.matchFormat || "BEST_OF_1"
  );
  const [generateMatches, setGenerateMatches] = useState(inheritedConfig?.generateMatches !== false);
  const [roundsCount, setRoundsCount] = useState(5);
  
  const router = useRouter();

  const isAtCapacity = currentNodesCount >= maxNodes;
  const remainingSlots = maxNodes - currentNodesCount;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isAtCapacity) {
      toast.error(`Impossible d'ajouter un node : limite de ${maxNodes} nodes atteinte`);
      return;
    }

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const nodeCode = ((formData.get("nodeCode") as string) || "").trim() ||
      `${nodeType === "ROUND_ROBIN" ? "J" : "N"}${(currentNodesCount + 1)}`;
    const round = Number(formData.get("round") || 1);
    const matchNumber = Number(formData.get("matchNumber") || currentNodesCount + 1);
    const bracketType = (formData.get("bracketType") as string) || "UPPER";

    try {
      await createBracketNode({
        phaseId,
        groupId,
        nodeCode,
        round,
        matchNumber,
        bracketType,
        order: defaultOrder + currentNodesCount,
        nodeType: "MATCH",
        metadata: {
          participants: [],
          requiresMatch: true,
          generateMatches,
          matchesCount: nodeType === "ROUND_ROBIN" ? 1 : 1,
          format: matchFormat,
          nodeType,
          roundsCount: nodeType === "SWISS" ? roundsCount : undefined,
        },
      } as any);

      toast.success(`Nœud "${nodeCode}" créé avec succès`);
      if (!asFormOnly) setOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-1.5">
        <Label htmlFor="nodeCode">Code d'identification</Label>
        <Input
          id="nodeCode"
          name="nodeCode"
          placeholder="ex: QF1, J1, R1"
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

      {/* Configuration spécifique au type de nœud */}
      <div className="space-y-3 p-3 rounded-lg bg-muted/30">
        <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Configuration du nœud
        </Label>
        
        <div className="space-y-2">
          <Label className="text-[10px] text-muted-foreground">Type d'organisation</Label>
          <Select value={nodeType} onValueChange={(v: any) => setNodeType(v)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ROUND_ROBIN">Round Robin (Journées)</SelectItem>
              <SelectItem value="ELIMINATION">Élimination directe</SelectItem>
              <SelectItem value="SWISS">Système Suisse</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {nodeType === "SWISS" && (
          <div className="space-y-2">
            <Label className="text-[10px] text-muted-foreground">Nombre de rounds</Label>
            <Input
              type="number"
              min={3}
              max={11}
              step={2}
              value={roundsCount}
              onChange={(e) => setRoundsCount(parseInt(e.target.value) || 5)}
              className="h-8 text-xs"
            />
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-[10px] text-muted-foreground">Format des matchs</Label>
          <Select value={matchFormat} onValueChange={(v: any) => setMatchFormat(v)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BEST_OF_1">BO1 (un match)</SelectItem>
              <SelectItem value="BEST_OF_3">BO3 (meilleur des 3)</SelectItem>
              <SelectItem value="BEST_OF_5">BO5 (meilleur des 5)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="generate-matches"
            checked={generateMatches}
            onCheckedChange={(v) => setGenerateMatches(!!v)}
          />
          <Label htmlFor="generate-matches" className="text-xs cursor-pointer">
            Générer les matches automatiquement
          </Label>
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
  );

  if (asFormOnly) return formContent;

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
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Nouveau nœud de bracket
          </DialogTitle>
          <DialogDescription>
            Créez un nouveau nœud dans le bracket. Les participants pourront y être assignés ensuite.
          </DialogDescription>
        </DialogHeader>

        {/* Configuration héritée */}
        {inheritedConfig && Object.keys(inheritedConfig).length > 0 && (
          <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center gap-1 text-[10px] text-primary font-bold uppercase mb-2">
              <Info className="h-3 w-3" /> Configuration héritée
            </div>
            <div className="flex flex-wrap gap-1">
              {inheritedConfig.nodeType && (
                <Badge variant="secondary" className="text-[9px]">
                  Type: {inheritedConfig.nodeType}
                </Badge>
              )}
              {inheritedConfig.matchFormat && (
                <Badge variant="secondary" className="text-[9px]">
                  Format: {inheritedConfig.matchFormat}
                </Badge>
              )}
            </div>
          </div>
        )}

        {isAtCapacity && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Limite de {maxNodes} nodes atteinte</span>
          </div>
        )}

        {!isAtCapacity && remainingSlots <= 3 && (
          <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center gap-2 text-yellow-600 text-xs">
            <AlertCircle className="h-3 w-3" />
            Plus que {remainingSlots} place(s) disponible(s)
          </div>
        )}

        {formContent}
      </DialogContent>
    </Dialog>
  );
}