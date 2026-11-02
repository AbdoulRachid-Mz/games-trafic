// @/app/(protected)/wallet/create/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/auth-context";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Wallet,
  ShieldCheck,
  Zap,
  Gift,
} from "lucide-react";
import { WalletUtils } from "@/lib/wallet/wallet-utils";
import { createWalletServer } from "@/actions/wallets";
import { ResultDialog } from "@/components/shared/result-dialog";

export default function CreateWalletPage() {
  const router = useRouter();
  const { user, loading } = useAuthContext();
  const [pinSimple, setPinSimple] = useState("");
  const [confirmPinSimple, setConfirmPinSimple] = useState("");
  const [creatingSimple, setCreatingSimple] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const usernameSimple =
    user?.fullName?.split(" ")?.[0] ||
    user?.username ||
    user?.email?.split("@")?.[0] ||
    "utilisateur";
  const defaultWalletNameSimple = `wallet_${usernameSimple}`;
  const validationSimple = WalletUtils.validatePinStrength(pinSimple);
  const canSubmitSimple = pinSimple.length >= 4 && validationSimple.isValid && pinSimple === confirmPinSimple;

  const handleCreateSimple = async () => {
    setCreatingSimple(true);
    setDialogError(null);
    try {
      const result = await createWalletServer(user!.id, pinSimple);
      if (!result.success) {
        setDialogError(result.error || "Erreur lors de la création");
        setDialogOpen(true);
        return;
      }
      setDialogOpen(true);
    } catch (e: any) {
      setDialogError(e?.message || "Erreur lors de la création");
      setDialogOpen(true);
    } finally {
      setCreatingSimple(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-10 px-4">
      <div className="max-w-xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <Typography variant="h2" weight="bold">
            Créer mon wallet
          </Typography>
          <Typography variant="body-base" theme="muted">
            Un seul champ obligatoire: votre code PIN.
          </Typography>
        </div>
        <Card className="shadow-xl border-0">
          <CardContent className="p-6 space-y-6">
            <div className="rounded-xl bg-muted/30 p-4 text-center">
              <Typography variant="caption1" theme="muted">
                Nom par défaut du wallet: <span className="font-semibold">{defaultWalletNameSimple}</span>
              </Typography>
            </div>
            <div className="space-y-4">
              <div>
                <Typography variant="body-sm" weight="medium">
                  Code PIN
                </Typography>
                <Input
                  type="password"
                  inputMode="numeric"
                  value={pinSimple}
                  onChange={(e) => setPinSimple(e.target.value.replace(/\D/g, "").slice(0, 12))}
                  placeholder="Minimum 4 chiffres"
                />
              </div>
              <div>
                <Typography variant="body-sm" weight="medium">
                  Confirmez le PIN
                </Typography>
                <Input
                  type="password"
                  inputMode="numeric"
                  value={confirmPinSimple}
                  onChange={(e) => setConfirmPinSimple(e.target.value.replace(/\D/g, "").slice(0, 12))}
                  placeholder="Retapez votre PIN"
                />
                <div className="mt-2 text-xs">
                  {confirmPinSimple.length > 0 &&
                    (pinSimple === confirmPinSimple ? (
                      <span className="text-green-600">Les PIN correspondent</span>
                    ) : (
                      <span className="text-red-600">Les PIN ne correspondent pas</span>
                    ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="flex items-center gap-2 rounded-lg border bg-card p-3">
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-sm">Sécurisé</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border bg-card p-3">
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                  <Zap className="w-4 h-4 text-yellow-600" />
                </div>
                <span className="text-sm">Transactions rapides</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border bg-card p-3">
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                  <Gift className="w-4 h-4 text-pink-600" />
                </div>
                <span className="text-sm">Bonus de bienvenue</span>
              </div>
            </div>
            <Button
              className="w-full h-12 gap-2"
              disabled={!canSubmitSimple || creatingSimple}
              onClick={handleCreateSimple}
            >
              {creatingSimple && (
                <span className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
              <Wallet className="w-5 h-5" />
              Créer mon wallet
            </Button>
          </CardContent>
        </Card>
        <ResultDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          type={dialogError ? "error" : "success"}
          title={dialogError ? "Échec de la création" : "Wallet créé avec succès"}
          description={
            dialogError
              ? dialogError
              : "Votre compte financier a été initialisé et un bonus a été crédité."
          }
          confetti={dialogError ? "none" : "celebration"}
          primaryAction={{
            label: dialogError ? "Réessayer" : "Completer le wallet",
            onClick: () => {
              setDialogOpen(false);
              if (dialogError) return;
              router.refresh();
              const requireVerification = process.env.NEXT_PUBLIC_REQUIRE_WALLET_VERIFICATION === 'true';
              if (requireVerification) {
                router.push("/wallet/verification");
              } else {
                router.push("/wallet");
              }
            },
            primary: true,
          }}
          secondaryActions={[
            {
              label: "Aller au tableau de bord",
              onClick: () => {
                setDialogOpen(false);
                router.push("/dashboard");
              },
              variant: "outline",
            },
          ]}
        />
      </div>
    </div>
  );
}