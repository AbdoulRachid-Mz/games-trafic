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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Wallet, ArrowRight, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuthContext } from "@/contexts/auth-context";
import { TournamentEdition } from "@/database/schema";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { joinEdition } from "@/actions/editions";

interface EditionPaymentDialogProps {
  edition: TournamentEdition;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

import { useUserProfile } from "@/hooks/use-profile";
import { useWalletBalance } from "@/hooks/use-wallets";

export function EditionPaymentDialog({
  edition,
  open,
  onOpenChange,
}: EditionPaymentDialogProps) {
  const { isAuthenticated, user } = useAuthContext();
  const { data: completeData } = useUserProfile({
    mode: "partial",
    relations: ["wallet"],
  });
  const router = useRouter();
  const balance = useWalletBalance(completeData?.wallet?.id || "");
  const entryFee = Number(edition.entryFee) || 0;
  const canAfford = (balance.data ?? 0) >= entryFee;
  const [isPaying, setIsPaying] = React.useState(false);
  const [pin, setPin] = React.useState("");
  const [pinRequired, setPinRequired] = React.useState(false);
  const [payError, setPayError] = React.useState<string | null>(null);

  const resetState = () => {
    setIsPaying(false);
    setPin("");
    setPinRequired(false);
    setPayError(null);
  };

  const handlePayment = async () => {
    if (!canAfford) return;
    if (!isAuthenticated || !user) {
      toast.error("Vous devez être connecté pour payer votre inscription.");
      router.push("/sign-in");
      return;
    }

    setIsPaying(true);
    setPayError(null);

    try {
      // Paiement atomique côté serveur : débit du portefeuille, écritures
      // comptables, inscription et lien de paiement dans une seule transaction.
      const result = await joinEdition(
        edition.id,
        user.id,
        {
          username:
            completeData?.username ||
            user.username ||
            user.fullName ||
            "Joueur",
          image: completeData?.profileImage || user.profileImage,
        },
        { payWithWallet: true, pin: pin || undefined },
      );

      if (result.paymentRequired) {
        setPinRequired(true);
        return;
      }

      if (!result.success) {
        setPayError(result.message || "Le paiement n'a pas pu être finalisé.");
        return;
      }

      toast.success(result.message || "Inscription confirmée");
      onOpenChange(false);
      resetState();

      if (result.tournamentId && result.memberId) {
        router.push(
          `/tournaments/${result.tournamentId}/members/${result.memberId}`,
        );
      } else {
        router.refresh();
      }
    } catch (error: any) {
      const message = error?.message || "Le paiement a échoué.";
      setPayError(message);
      if (message.toLowerCase().includes("pin")) {
        setPinRequired(true);
      }
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!isPaying) {
          onOpenChange(next);
          if (!next) resetState();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Paiement Requis</DialogTitle>
          <DialogDescription>
            Cette édition est payante. Réglez les frais d&apos;inscription pour
            rejoindre la compétition.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <span className="text-muted-foreground">Frais d&apos;inscription</span>
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
              {(balance.data ?? 0).toFixed(2)} {edition.prizeCurrency || "GTC"}
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
                  onClick={() => router.push("/wallet/deposit")}
                >
                  Recharger maintenant
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {pinRequired && (
            <div className="space-y-2">
              <Label htmlFor="wallet-pin">
                Code PIN du portefeuille
              </Label>
              <Input
                id="wallet-pin"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                value={pin}
                onChange={(event) => setPin(event.target.value)}
                placeholder="Saisissez votre code PIN"
              />
            </div>
          )}

          {payError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Paiement impossible</AlertTitle>
              <AlertDescription>{payError}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPaying}
          >
            Annuler
          </Button>
          <Button
            onClick={handlePayment}
            disabled={
              !canAfford || isPaying || (pinRequired && pin.trim().length === 0)
            }
          >
            {isPaying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Paiement...
              </>
            ) : (
              <>
                Payer et Rejoindre
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
