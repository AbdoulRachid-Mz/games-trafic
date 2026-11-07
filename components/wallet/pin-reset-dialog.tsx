"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { KeyRound, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import {
  requestPinResetCode,
  verifyPinResetCode,
  resetPinWithToken,
} from "@/actions/pin-reset";

interface PinResetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletId?: string;
  onSuccess?: () => void;
}

const STEPS = { REQUEST: 0, VERIFY: 1, NEW_PIN: 2 } as const;

export function PinResetDialog({
  open,
  onOpenChange,
  walletId,
  onSuccess,
}: PinResetDialogProps) {
  const [step, setStep] = useState<(typeof STEPS)[keyof typeof STEPS]>(
    STEPS.REQUEST
  );
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [resetToken, setResetToken] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setStep(STEPS.REQUEST);
      setCode("");
      setNewPin("");
      setConfirmPin("");
      setResetToken(null);
    }
  }, [open]);

  const handleRequestCode = async () => {
    if (!walletId) return;
    setLoading(true);
    try {
      const res = await requestPinResetCode(walletId);
      if (!res.success) {
        toast.error(res.error || "Impossible d'envoyer le code");
        return;
      }
      toast.success(
        "Code envoyé ! Consultez vos notifications en-app pour le récupérer."
      );
      setStep(STEPS.VERIFY);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'envoi du code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!walletId || !/^\d{4,8}$/.test(code)) {
      toast.error("Format de code invalide");
      return;
    }
    setLoading(true);
    try {
      const res = await verifyPinResetCode({ walletId, code });
      if (!res.success) {
        toast.error(res.error || "Code invalide");
        return;
      }
      const token = res.token;
      if (!token) {
        toast.error("Jeton non reçu, recommencez");
        return;
      }
      setResetToken(token);
      setStep(STEPS.NEW_PIN);
      toast.success("Code vérifié ! Définissez votre nouveau PIN.");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la vérification");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPin = async () => {
    if (!walletId || !resetToken) return;
    if (newPin.length < 6) {
      toast.error("Le PIN doit contenir au moins 6 chiffres");
      return;
    }
    if (newPin !== confirmPin) {
      toast.error("Les PIN ne correspondent pas");
      return;
    }
    setLoading(true);
    try {
      const res = await resetPinWithToken({
        walletId,
        token: resetToken,
        newPin,
      });
      if (!res.success) {
        toast.error(res.error || "Impossible de définir le nouveau PIN");
        return;
      }
      toast.success("PIN modifié avec succès");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la réinitialisation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            Réinitialiser le PIN
          </DialogTitle>
          <DialogDescription>
            {step === STEPS.REQUEST &&
              "Un code de vérification sera envoyé via vos notifications in-app."}
            {step === STEPS.VERIFY &&
              "Saisissez le code à 6 chiffres reçu dans vos notifications."}
            {step === STEPS.NEW_PIN && "Définissez votre nouveau PIN."}
          </DialogDescription>
        </DialogHeader>

        {step === STEPS.REQUEST && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 text-sm">
              <MailCheck className="h-4 w-4 mt-0.5 text-primary" />
              <span className="text-muted-foreground">
                Pendant que le flux email n&apos;est pas encore branché, le code
                est livré dans votre centre de notifications (cloche en haut).
              </span>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button onClick={handleRequestCode} disabled={loading}>
                {loading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Envoyer le code
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === STEPS.VERIFY && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pin-reset-code">Code de vérification</Label>
              <Input
                id="pin-reset-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="••••••"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className="text-center text-2xl tracking-[0.4em] font-bold"
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setStep(STEPS.REQUEST)}
                disabled={loading}
              >
                Retour
              </Button>
              <Button onClick={handleVerifyCode} disabled={loading}>
                {loading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Vérifier
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === STEPS.NEW_PIN && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pin-reset-new">Nouveau PIN</Label>
              <Input
                id="pin-reset-new"
                type="password"
                inputMode="numeric"
                maxLength={8}
                placeholder="Au moins 6 chiffres"
                value={newPin}
                onChange={(e) =>
                  setNewPin(e.target.value.replace(/\D/g, "").slice(0, 8))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pin-reset-confirm">Confirmer</Label>
              <Input
                id="pin-reset-confirm"
                type="password"
                inputMode="numeric"
                maxLength={8}
                placeholder="Confirmez le PIN"
                value={confirmPin}
                onChange={(e) =>
                  setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 8))
                }
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setStep(STEPS.VERIFY)}
                disabled={loading}
              >
                Retour
              </Button>
              <Button onClick={handleResetPin} disabled={loading}>
                {loading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Enregistrer
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
