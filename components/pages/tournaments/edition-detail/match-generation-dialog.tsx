"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, Play, RefreshCcw, Settings2, Swords, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useMatchManager } from "@/hooks/use-match-manager";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { organizeEditionStructure } from "@/actions/phases";
import { useRouter } from "next/navigation";

export function MatchGenerationDialog({
  phaseId,
  editionId,
  phaseType,
  groupId,
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
  const { generateMatches } = useMatchManager(phaseId);
  const [genMode, setGenMode] = useState<"RESET" | "APPEND" | "FILL">("FILL");
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const handleGenerate = async () => {
    setIsPending(true);
    try {
      if (genMode === "RESET") {
        // Re-organiser toute la structure via OrganizeAction
        const result = await organizeEditionStructure(
          editionId,
          [{
            name: "Phase", // Idéalement le nom réel
            phaseType: phaseType as any,
            order: 0,
            config: { generateGroups: true, generateNodes: true, generateMatches: true }
          }],
          [], // participants existants auto
          { clearExisting: true, targetPhaseId: phaseId }
        );
        if (!result.success) throw new Error(result.error);
      } else {
        // Mode APPEND ou FILL via generateMatchesAction
        await generateMatches.mutateAsync({ 
          type: "PHASE",
          id: phaseId, 
          options: { 
            forceRecreate: genMode === "APPEND", 
            groupId, 
            createNodes: true 
          }
        });
      }
      
      toast.success("Génération terminée avec succès");
      setOpen(false);
      onSuccess?.();
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la génération");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="default" disabled={disabled || generateMatches.isPending} className="gap-2 font-black italic uppercase tracking-tighter shadow-xl bg-primary hover:scale-105 transition-transform">
          <Play className="h-4 w-4 fill-current" />
          Moteur de Génération
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] border-primary/20 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl font-black italic uppercase tracking-tighter">
             <Settings2 className="w-6 h-6 text-primary animate-spin-slow" /> 
             Assistant de Structure
          </DialogTitle>
          <DialogDescription className="font-medium">
             Choisissez comment le système doit générer ou mettre à jour les confrontations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-6">
           <div className="grid gap-3">
              {/* Option 1: FILL (Smart Completion) */}
              <div 
                className={cn(
                  "p-4 rounded-xl border-2 transition-all cursor-pointer flex gap-4",
                  genMode === "FILL" ? "border-primary bg-primary/5 shadow-md" : "border-muted hover:border-primary/30"
                )}
                onClick={() => setGenMode("FILL")}
              >
                <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0", genMode === "FILL" ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-sm">Compléter la structure</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">Génère uniquement les matchs manquants sans toucher à ce qui existe déjà. Idéal pour les progressions en cours.</p>
                </div>
              </div>

              {/* Option 2: APPEND (Regenerate Matches) */}
              <div 
                className={cn(
                  "p-4 rounded-xl border-2 transition-all cursor-pointer flex gap-4",
                  genMode === "APPEND" ? "border-amber-500 bg-amber-500/5 shadow-md" : "border-muted hover:border-amber-500/30"
                )}
                onClick={() => setGenMode("APPEND")}
              >
                <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0", genMode === "APPEND" ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground")}>
                  <RefreshCcw className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-sm">Régénérer les matchs</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">Supprime les matchs non-joués et les recrée sur la structure actuelle. Utile pour corriger un mauvais tirage.</p>
                </div>
              </div>

              {/* Option 3: RESET (Full Re-init) */}
              <div 
                className={cn(
                  "p-4 rounded-xl border-2 transition-all cursor-pointer flex gap-4",
                  genMode === "RESET" ? "border-destructive bg-destructive/5 shadow-md" : "border-muted hover:border-destructive/30"
                )}
                onClick={() => setGenMode("RESET")}
              >
                <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0", genMode === "RESET" ? "bg-destructive text-white" : "bg-muted text-muted-foreground")}>
                  <Trash2 className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-sm text-destructive">Réinitialisation Complète</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">Efface TOUT (groupes, brackets, matchs) et reconstruit à partir de zéro selon la configuration de la phase.</p>
                </div>
              </div>
           </div>

           <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex gap-3 mt-4">
              <Swords className="h-5 w-5 text-primary shrink-0" />
              <p className="text-[10px] leading-relaxed">
                <span className="font-bold block mb-1 uppercase tracking-wider">Note Importante</span>
                Les participants seront répartis selon la méthode de seed définie dans la configuration de la phase ({phaseType}).
              </p>
           </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
           <Button variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>Annuler</Button>
           <Button 
            onClick={handleGenerate} 
            disabled={isPending} 
            variant={genMode === "RESET" ? "destructive" : "default"}
            className="gap-2 font-bold px-6"
           >
             {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
             {isPending ? "Traitement..." : "Lancer le moteur"}
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
