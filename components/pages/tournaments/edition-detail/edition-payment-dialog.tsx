"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, Wallet, ArrowRight } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuthContext } from "@/contexts/auth-context";
import { TournamentEdition } from "@/database/schema";
import { useRouter } from "next/navigation";

interface EditionPaymentDialogProps {
  edition: TournamentEdition;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // onConfirm is replaced by internal handling, but we can keep it if parent wants to track closing
  memberId?: string;
}

import { useUserProfile } from "@/hooks/use-profile";

export function EditionPaymentDialog({
  edition,
  open,
  onOpenChange,
  memberId,
}: EditionPaymentDialogProps) {
  const { isAuthenticated } = useAuthContext();
  const { data: completeData } = useUserProfile(isAuthenticated);
  const router = useRouter();
  const balance = Number(completeData?.wallet?.balance || 0);
  const entryFee = Number(edition.entryFee) || 0;
  const canAfford = balance >= entryFee;
  const [isRedirecting, setIsRedirecting] = React.useState(false);

  const handlePaymentRedirect = () => {
    if (!canAfford || !memberId) return;
    setIsRedirecting(true);

    // Build the wallet transaction URL
    // We want to create a transaction of type 'TOURNAMENT_PARTICIPATION'
    // Metadata should include editionId and memberId so the transaction hook knows what to do on success
    const params = new URLSearchParams({
      type: "TOURNAMENT_PARTICIPATION",
      amount: entryFee.toString(),
      description: `Participation: ${
        edition.name || `Edition #${edition.editionNumber}`
      }`,
      metadata: JSON.stringify({
        editionId: edition.id,
        memberId: memberId,
        redirectUrl: window.location.href, // Return here after
      }),
      callback: window.location.href, // Simple callback param often used
    });

    router.push(`/wallet/transactions/create?${params.toString()}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Paiement Requis</DialogTitle>
          <DialogDescription>
            Cette édition est privée ou payante. Vous devez régler les frais
            pour participer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <span className="text-muted-foreground">Frais d'inscription</span>
            <span className="font-bold text-lg">
              {entryFee} {edition.prizeCurrency || "GTC"}
            </span>
          </div>

          <div
            className={`flex items-center justify-between p-4 border rounded-lg ${
              !canAfford ? "bg-red-50/10 border-red-500/20" : ""
            }`}
          >
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              <span>Votre solde</span>
            </div>
            <span
              className={`font-bold ${
                canAfford ? "text-green-600" : "text-red-500"
              }`}
            >
              {balance} {edition.prizeCurrency || "GTC"}
            </span>
          </div>

          {!canAfford && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Solde insuffisant</AlertTitle>
              <AlertDescription>
                Vous devez recharger votre portefeuille pour payer les frais de{" "}
                {entryFee} {edition.prizeCurrency || "GTC"}.
                <Button
                  variant="link"
                  className="p-0 h-auto ml-2 underline"
                  onClick={() => {
                    // Keep using standard router/link for internal moves
                    router.push("/wallet/deposit");
                  }}
                >
                  Recharger maintenant
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handlePaymentRedirect}
            disabled={!canAfford || !memberId || isRedirecting}
          >
            {isRedirecting ? "Redirection..." : "Payer et Rejoindre"}
            {!isRedirecting && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
