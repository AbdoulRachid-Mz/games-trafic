"use client";

import React, { useState, useTransition } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertTriangle, Loader2, Trophy, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { 
  checkPendingEntitiesAction, 
  markGroupCompleteAction, 
  markPhaseCompleteAction,
  markBracketNodeCompleteAction 
} from "@/actions/phases";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";

interface MarkCompleteDialogProps {
  type: 'PHASE' | 'GROUP' | 'BRACKET_NODE';
  id: string;
  name: string;
  onComplete?: () => void;
}

export function MarkCompleteDialog({ type, id, name, onComplete }: MarkCompleteDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isCompleting, startTransition] = useTransition();
  const [pendingEntities, setPendingEntities] = useState<string[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleCheck = async () => {
    setIsChecking(true);
    try {
      const result = await checkPendingEntitiesAction(type, id);
      if (result.success) {
        setPendingEntities(result.pendingEntities);
        setShowConfirm(true);
        setIsOpen(true);
      } else {
        toast.error("Erreur lors de la vérification");
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    } finally {
      setIsChecking(false);
    }
  };

  const handleComplete = () => {
    startTransition(async () => {
      try {
        let result;
        if (type === 'GROUP') {
          result = await markGroupCompleteAction(id);
        } else if (type === 'PHASE') {
          result = await markPhaseCompleteAction(id);
        } else if (type === 'BRACKET_NODE') {
          result = await markBracketNodeCompleteAction(id);
        }

        if (result?.success) {
          toast.success(`${name} marqué comme terminé avec succès !`);
          setIsOpen(false);
          setShowConfirm(false);
          if (onComplete) onComplete();
        } else {
          toast.error("Erreur lors de la clôture");
          if (result && 'pendingEntities' in result && Array.isArray(result.pendingEntities)) {
            setPendingEntities(result.pendingEntities);
          }
        }
      } catch (error) {
        toast.error("Une erreur est survenue lors de la clôture");
      }
    });
  };

  const typeLabel = type === 'PHASE' ? 'la phase' : type === 'GROUP' ? 'le groupe' : 'le nœud';

  return (
    <>
      <Button 
        onClick={handleCheck} 
        disabled={isChecking || isCompleting}
        className="gap-2 bg-green-600 hover:bg-green-700 text-white shadow-sm"
      >
        {isChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
        Marquer complet
      </Button>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {pendingEntities.length > 0 ? (
                <><AlertTriangle className="h-5 w-5 text-amber-500" /> Action requise</>
              ) : (
                <><CheckCircle2 className="h-5 w-5 text-green-500" /> Prêt pour la clôture</>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              {pendingEntities.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">
                    Impossible de clôturer {typeLabel} <strong>{name}</strong>. Les entités suivantes doivent être terminées :
                  </p>
                  <ul className="space-y-2 bg-muted/50 p-3 rounded-lg border border-border/50 max-h-[200px] overflow-y-auto">
                    {pendingEntities.map((entity, i) => (
                      <li key={i} className="text-xs flex items-center gap-2 text-muted-foreground">
                        <div className="h-1 w-1 rounded-full bg-amber-500 shrink-0" />
                        {entity}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-foreground">
                    Toutes les entités de <strong>{name}</strong> sont terminées. 
                    En marquant ce niveau comme complet :
                  </p>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <ArrowRight className="h-3 w-3 text-green-500" />
                      Les participants seront qualifiés selon la configuration.
                    </li>
                    <li className="flex items-center gap-2">
                      <ArrowRight className="h-3 w-3 text-green-500" />
                      Les statistiques seront définitivement mises à jour.
                    </li>
                    <li className="flex items-center gap-2">
                      <ArrowRight className="h-3 w-3 text-green-500" />
                      Les sous-entités seront verrouillées.
                    </li>
                  </ul>
                  <p className="text-xs font-bold text-amber-600 bg-amber-50 p-2 rounded border border-amber-100 dark:bg-amber-900/20 dark:border-amber-900/30">
                    Cette action est irréversible.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCompleting}>Annuler</AlertDialogCancel>
            {pendingEntities.length === 0 && (
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleComplete();
                }}
                disabled={isCompleting}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isCompleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trophy className="h-4 w-4 mr-2" />}
                Confirmer la clôture
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
