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
import { AlertCircle, Wallet, ArrowRight, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuthContext } from "@/contexts/auth-context";
import { TournamentEdition } from "@/database/schema";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { joinEdition } from "@/actions/editions";
import { useUserProfile } from "@/hooks/use-profile";
import { useWalletBalance } from "@/hooks/use-wallets";
import { useTransactionFees } from "@/hooks/use-transaction-fees";
import {
  PinVerification,
  type PasskeyTransactionProof,
} from "@/components/pages/transactions/create/pin-verification";

function createJoinIntentKey() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `join-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

interface EditionPaymentDialogProps {
  edition: TournamentEdition;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userInfo?: {
    playerName?: string;
    teamName?: string;
  };
}

export function EditionPaymentDialog({
  edition,
  open,
  onOpenChange,
  userInfo,
}: EditionPaymentDialogProps) {
  const { isAuthenticated, user } = useAuthContext();
  const { data: completeData } = useUserProfile({
    mode: "partial",
    relations: ["wallet"],
  });
  const router = useRouter();
  const balance = useWalletBalance(completeData?.wallet?.id || "");
  const entryFee = Number(edition.entryFee) || 0;
  const { fees: participationFees } = useTransactionFees(
    "TOURNAMENT_PARTICIPATION",
    entryFee,
    { enabled: open && entryFee > 0 },
  );
  const canAfford = (balance.data ?? 0) >= entryFee + (participationFees || 0);
  const [isPaying, setIsPaying] = React.useState(false);
  const [step, setStep] = React.useState<"summary" | "verify">("summary");
  const [payError, setPayError] = React.useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = React.useState(createJoinIntentKey);

  const resetState = () => {
    setIsPaying(false);
    setStep("summary");
    setPayError(null);
    setIdempotencyKey(createJoinIntentKey());
  };

  const executePayment = async (auth: {
    pin?: string;
    passkeyProof?: PasskeyTransactionProof;
  }) => {
    if (!canAfford) return;
    if (!isAuthenticated || !user) {
      toast.error("Vous devez être connecté pour payer votre inscription.");
      router.push("/sign-in");
      return;
    }

    setIsPaying(true);
    setPayError(null);

    try {
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
          playerName: userInfo?.playerName,
          teamName: userInfo?.teamName,
        },
        { payWithWallet: true, idempotencyKey, ...auth },
      );

      if (!result.success) {
        setPayError(result.message || "Le paiement n'a pas pu être finalisé.");
        return;
      }

      toast.success(result.message || "Inscription confirmée");
      setIdempotencyKey(createJoinIntentKey());
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
      toast.error(message);
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
      <DialogContent className={step === "verify" ? "sm:max-w-xl" : ""}>
        {step === "summary" ? (
          <>
            <DialogHeader>
              <DialogTitle>Paiement Requis</DialogTitle>
              <DialogDescription>
                Cette édition est payante. Réglez les frais d&apos;inscription
                pour rejoindre la compétition.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <span className="text-muted-foreground">
                  Frais d&apos;inscription
                </span>
                <span className="font-bold text-lg">
                  {entryFee} {edition.prizeCurrency || "GTC"}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <span className="text-muted-foreground">Frais</span>
                <span className="font-medium">
                  {(participationFees || 0).toFixed(2)}{" "}
                  {edition.prizeCurrency || "GTC"}
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
                  {(balance.data ?? 0).toFixed(2)}{" "}
                  {edition.prizeCurrency || "GTC"}
                </span>
              </div>

              {!canAfford && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Solde insuffisant</AlertTitle>
                  <AlertDescription>
                    Vous devez recharger votre portefeuille pour payer les frais
                    de {entryFee + (participationFees || 0)}{" "}
                    {edition.prizeCurrency || "GTC"}.
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
                onClick={() => setStep("verify")}
                disabled={!canAfford || isPaying}
              >
                Continuer
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Confirmer le paiement</DialogTitle>
              <DialogDescription>
                Validez avec votre code PIN ou Passkey pour finaliser
                l&apos;inscription.
              </DialogDescription>
            </DialogHeader>
            <PinVerification
              onVerify={async (pin) => executePayment({ pin })}
              onVerifyPasskey={async (proof) =>
                executePayment({ passkeyProof: proof })
              }
              hasPasskey={!!completeData?.hasPasskey}
              onBack={() => setStep("summary")}
              isLoading={isPaying}
              transactionDetails={{
                type: "TOURNAMENT_PARTICIPATION",
                amount: entryFee,
                fees: participationFees || 0,
                totalAmount: entryFee + (participationFees || 0),
                walletId: completeData?.wallet?.id || "",
                recipientId: null,
              }}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
