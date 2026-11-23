"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
import { PinVerification, type PasskeyTransactionProof } from "@/components/pages/transactions/create/pin-verification";
import { useUserProfile } from "@/hooks/use-profile";
import { getUserWalletByUserId, transferBetweenIdentities } from "@/actions/wallets";
import { toast } from "sonner";

function newIdempotencyKey() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `tk-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

interface TournamentPayoutDialogProps {
  editionId: string;
  recipientUserId: string;
  recipientName: string;
  onSuccess?: () => void;
}

export function TournamentPayoutDialog({
  editionId,
  recipientUserId,
  recipientName,
  onSuccess,
}: TournamentPayoutDialogProps) {
  const { data: completeData } = useUserProfile();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"AMOUNT" | "PIN">("AMOUNT");
  const [isLoading, setIsLoading] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(newIdempotencyKey);
  const [recipientWalletId, setRecipientWalletId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!open) return;
    (async () => {
      try {
        const wallet = await getUserWalletByUserId(recipientUserId);
        if (!cancelled) setRecipientWalletId(wallet?.id ?? null);
      } catch {
        if (!cancelled) setRecipientWalletId(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, recipientUserId]);

  const handleConfirmAmount = () => {
    const numericAmount = parseFloat(amount || "0");
    if (!numericAmount || numericAmount <= 0) {
      toast.error("Montant invalide");
      return;
    }
    setStep("PIN");
  };

  const executePayout = async (auth: { pin?: string; passkeyProof?: PasskeyTransactionProof }) => {
    if (!completeData?.wallet?.id) {
      toast.error("Wallet requis");
      return;
    }
    const numericAmount = parseFloat(amount || "0");
    if (!numericAmount || numericAmount <= 0) {
      toast.error("Montant invalide");
      return;
    }
    setIsLoading(true);
    try {
      const result = await transferBetweenIdentities({
        fromIdentityId: editionId,
        fromType: "TOURNAMENT",
        toIdentityId: recipientUserId,
        toType: "USER",
        amount: numericAmount,
        description: `Virement tournoi vers ${recipientName}`,
        idempotencyKey,
        ...auth,
      });
      if (!result.success) {
        toast.error(result.error || "Erreur lors du virement");
        return;
      }
      toast.success("Virement effectué");
      setOpen(false);
      setAmount("");
      setStep("AMOUNT");
      setIdempotencyKey(newIdempotencyKey());
      onSuccess?.();
    } catch {
      toast.error("Erreur lors du virement");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Virement
      </Button>
      <Dialog open={open} onOpenChange={(value) => {
        setOpen(value);
        if (!value) {
          setStep("AMOUNT");
          setAmount("");
          setIdempotencyKey(newIdempotencyKey());
          setRecipientWalletId(null);
        }
      }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Virement vers {recipientName}</DialogTitle>
          </DialogHeader>
          {step === "AMOUNT" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Typography variant="body-sm" theme="muted">
                  Montant (GTC)
                </Typography>
                <Input
                  type="number"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleConfirmAmount}>
                  Continuer
                </Button>
              </DialogFooter>
            </div>
          )}
          {step === "PIN" && (
            <PinVerification
              onVerify={async (pin) => executePayout({ pin })}
              onVerifyPasskey={async (proof) => executePayout({ passkeyProof: proof })}
              hasPasskey={!!completeData?.hasPasskey}
              onBack={() => setStep("AMOUNT")}
              isLoading={isLoading}
              transactionDetails={{
                type: "TRANSFER",
                amount: parseFloat(amount || "0"),
                fees: 0,
                totalAmount: parseFloat(amount || "0"),
                walletId: completeData?.wallet?.id || "",
                recipientId: recipientWalletId,
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
