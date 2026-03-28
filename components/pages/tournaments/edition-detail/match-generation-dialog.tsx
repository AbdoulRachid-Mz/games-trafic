"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play, Settings2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMatchManager } from "@/hooks/use-match-manager";
import { toast } from "sonner";

export function MatchGenerationDialog({
  phaseId,
  editionId,
  phaseType,
  groupId, // if specific to a group
  disabled = false,
  onSuccess,
}: {
  phaseId: string;
  editionId: string;
  phaseType: string;
  groupId?: string;
  disabled?: boolean;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { generatePhaseMatches } = useMatchManager(phaseId);
  const [forceRecreate, setForceRecreate] = useState(false);

  const handleGenerate = async () => {
    try {
      // NOTE: Here we would pass configuration like forceRecreate to the hook
      // But assuming the backend generates smartly using participant data
      await generatePhaseMatches.mutateAsync({ 
        phaseId, 
        config: { forceRecreate, groupId } 
      });
      setOpen(false);
      onSuccess?.();
    } catch (e: any) {
      // Error handled by hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="default" disabled={disabled || generatePhaseMatches.isPending}>
          <Play className="h-4 w-4 mr-2" />
          Générer Matchs
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
             <Settings2 className="w-5 h-5" /> Génération des Matchs
          </DialogTitle>
          <DialogDescription>
             Générez automatiquement toutes les confrontations pour {phaseType === "GROUP_STAGE" ? "la phase de poules" : "cette phase."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
           {phaseType === "GROUP_STAGE" && (
             <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground border">
               Les matchs de groupes seront générés en mode Round-Robin (chaque participant affronte tous les autres de son groupe).
             </div>
           )}

           <div className="flex items-center justify-between border-b pb-4">
             <div className="space-y-0.5">
               <Label className="text-base font-bold">Forcer la recréation</Label>
               <p className="text-xs text-muted-foreground">Attention: supprimera les matchs existants non-joués pour régénérer un nouveau calendrier.</p>
             </div>
             <Switch checked={forceRecreate} onCheckedChange={setForceRecreate} />
           </div>
        </div>

        <DialogFooter>
           <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
           <Button onClick={handleGenerate} disabled={generatePhaseMatches.isPending}>
             {generatePhaseMatches.isPending ? "Génération..." : "Confirmer"}
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
