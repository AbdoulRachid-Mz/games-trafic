"use client";

import { useState, useTransition } from "react";
import { DynamicActionMenu, MenuItemAction } from "@/components/shared/dynamic-action-menu";
import { 
  Trophy, 
  Settings, 
  Users, 
  LayoutGrid, 
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { finalizeTournamentEditionAction } from "@/actions/tournaments";
import { useRouter } from "next/navigation";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface EditionDashboardActionsProps {
  tournamentId: string;
  editionId: string;
  status: string;
  potentialWinnerId?: string;
  potentialWinnerName?: string;
}

export function EditionDashboardActions({
  tournamentId,
  editionId,
  status,
  potentialWinnerId,
  potentialWinnerName
}: EditionDashboardActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [showConfirmWinner, setShowConfirmWinner] = useState(false);
  const router = useRouter();

  const handleFinalize = () => {
    if (!potentialWinnerId) {
      toast.error("Impossible de déterminer un vainqueur automatiquement. Veuillez le faire manuellement.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await finalizeTournamentEditionAction(editionId, potentialWinnerId);
        if (result.success && 'winner' in result) {
          toast.success(`Félicitations ! ${result.winner} est sacré champion.`);
          setShowConfirmWinner(false);
          router.refresh();
        } else if ('error' in result) {
          toast.error(result.error || "Erreur lors de la clôture de l'édition.");
        }
      } catch (error: any) {
        toast.error(error.message || "Une erreur est survenue.");
      }
    });
  };

  const actions: MenuItemAction[] = [
    {
      id: "view-public",
      label: "Vue Publique",
      icon: Users,
      href: `/tournaments/${tournamentId}/editions/${editionId}`,
    },
    {
      id: "organize",
      label: "Organiser Structure",
      icon: LayoutGrid,
      href: `/tournaments/${tournamentId}/editions/${editionId}/dashboard/organize`,
      separatorBefore: true,
    },
    {
      id: "matches",
      label: "Gérer Matchs",
      icon: Calendar,
      href: `/tournaments/${tournamentId}/editions/${editionId}/dashboard/matches`,
    },
    {
      id: "finalize",
      label: "Confirmer le Vainqueur",
      icon: Trophy,
      className: "text-amber-600 font-bold",
      onClick: () => setShowConfirmWinner(true),
      separatorBefore: true,
    },
    {
      id: "settings",
      label: "Paramètres",
      icon: Settings,
      href: `/tournaments/${tournamentId}/editions/${editionId}/dashboard/settings`,
      separatorBefore: true,
    }
  ];

  // Filter actions based on status
  const filteredActions = status === "COMPLETED" 
    ? actions.filter(a => ["view-public", "settings"].includes(a.id))
    : actions;

  return (
    <>
      <DynamicActionMenu 
        actions={filteredActions} 
        variant="floating" 
        floatingLabel="Actions"
        menuTitle="Gestion Édition"
      />

      <AlertDialog open={showConfirmWinner} onOpenChange={setShowConfirmWinner}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Couronner le Champion
            </AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir clôturer cette édition ? 
              <br /><br />
              Vainqueur détecté : <span className="font-bold text-primary">{potentialWinnerName || "Inconnu"}</span>
              <br /><br />
              Cette action est irréversible et marquera l'édition comme terminée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleFinalize();
              }}
              disabled={isPending || !potentialWinnerId}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Confirmer la Victoire
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
