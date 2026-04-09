"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, Play, Settings2, Swords } from "lucide-react";
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
  const [createNodes, setCreateNodes] = useState(true);

  const handleGenerate = async () => {
    try {
      await generatePhaseMatches.mutateAsync({ 
        phaseId, 
        config: { forceRecreate, groupId, createNodes } as any
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
        <Button size="sm" variant="default" disabled={disabled || generatePhaseMatches.isPending} className="gap-2 font-bold shadow-md">
          <Play className="h-4 w-4" />
          Générer Tout
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
             <Settings2 className="w-5 h-5 text-primary" /> Assistant de Génération
          </DialogTitle>
          <DialogDescription>
             Créez automatiquement la structure (nœuds) et les matchs pour cette phase.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
           <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 text-sm text-primary/80 flex gap-3">
             <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
               <Swords className="h-5 w-5 text-primary" />
             </div>
             <div>
               <p className="font-bold">Mode Intelligent</p>
               <p className="text-xs opacity-80">Le système va répartir les participants inscrits dans des brackets et générer les confrontations optimales.</p>
             </div>
           </div>

           <div className="space-y-3">
             <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setCreateNodes(!createNodes)}>
               <div className="space-y-0.5">
                 <Label className="text-sm font-bold cursor-pointer">Créer les nœuds manquants</Label>
                 <p className="text-[10px] text-muted-foreground">Génère automatiquement des brackets si aucun n'existe.</p>
               </div>
               <Switch checked={createNodes} onCheckedChange={setCreateNodes} />
             </div>

             <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setForceRecreate(!forceRecreate)}>
               <div className="space-y-0.5">
                 <Label className="text-sm font-bold cursor-pointer text-destructive">Forcer la recréation</Label>
                 <p className="text-[10px] text-muted-foreground">Supprime les matchs non-joués existants avant de régénérer.</p>
               </div>
               <Switch checked={forceRecreate} onCheckedChange={setForceRecreate} className="data-[state=checked]:bg-destructive" />
             </div>
           </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
           <Button variant="ghost" onClick={() => setOpen(false)} disabled={generatePhaseMatches.isPending}>Annuler</Button>
           <Button onClick={handleGenerate} disabled={generatePhaseMatches.isPending} className="gap-2">
             {generatePhaseMatches.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
             {generatePhaseMatches.isPending ? "Génération..." : "Lancer la génération"}
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
