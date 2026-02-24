"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
import { PinVerification } from "@/components/pages/transactions/create/pin-verification";
import { useUserProfile } from "@/hooks/use-profile";
import { transferBetweenIdentities, verifyWalletPin } from "@/actions/wallets";
import { toast } from "sonner";

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

  const handleConfirmAmount = () => {
    const numericAmount = parseFloat(amount || "0");
    if (!numericAmount || numericAmount <= 0) {
      toast.error("Montant invalide");
      return;
    }
    setStep("PIN");
  };

  const handleVerifyPin = async (pin: string) => {
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
      const verification = await verifyWalletPin(completeData.wallet.id, pin);
      if (!verification.success) {
        toast.error(verification.error || "PIN incorrect");
        return;
      }
      const result = await transferBetweenIdentities({
        fromIdentityId: editionId,
        fromType: "TOURNAMENT",
        toIdentityId: recipientUserId,
        toType: "USER",
        amount: numericAmount,
        description: `Virement tournoi vers ${recipientName}`,
      });
      if (!result.success) {
        toast.error(result.error || "Erreur lors du virement");
        return;
      }
      toast.success("Virement effectué");
      setOpen(false);
      setAmount("");
      setStep("AMOUNT");
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
        }
      }}>
        <DialogContent className="max-w-xl">
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
              onVerify={handleVerifyPin}
              onBack={() => setStep("AMOUNT")}
              isLoading={isLoading}
              transactionDetails={{
                type: "TRANSFER",
                amount: parseFloat(amount || "0"),
                fees: 0,
                totalAmount: parseFloat(amount || "0"),
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
