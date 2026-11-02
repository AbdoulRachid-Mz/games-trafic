"use client";

import React, { useState } from "react";
import { Typography } from "@/components/ui/typography";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Check, Delete, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

interface PinVerificationProps {
  onVerify: (pin: string) => Promise<void>;
  onVerifyPasskey?: () => Promise<void>;
  hasPasskey?: boolean;
  onBack: () => void;
  isLoading?: boolean;
  transactionDetails: {
    type: string;
    amount: number;
    fees: number;
    totalAmount: number;
  };
}

export function PinVerification({
  onVerify,
  onVerifyPasskey,
  hasPasskey = false,
  onBack,
  isLoading = false,
  transactionDetails,
}: PinVerificationProps) {
  const [pin, setPin] = useState("");
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);

  const handlePasskeyVerify = async () => {
    if (!onVerifyPasskey) return;
    try {
      setIsPasskeyLoading(true);
      const { data, error } = await authClient.signIn.passkey();
      if (error) throw error;
      await onVerifyPasskey();
    } catch (error) {
      console.error(error);
      toast.error("Échec de la vérification par Passkey");
    } finally {
      setIsPasskeyLoading(false);
    }
  };

  const handleAddPasskey = async () => {
    try {
      setIsPasskeyLoading(true);
      const { data, error } = await authClient.passkey.addPasskey();
      if (error) throw error;
      toast.success("Passkey ajouté avec succès !");
      if (onVerifyPasskey) {
        await onVerifyPasskey();
      }
    } catch (error) {
      console.error(error);
      toast.error("Échec de l'ajout du Passkey");
    } finally {
      setIsPasskeyLoading(false);
    }
  };

  const handleDigitClick = (digit: number) => {
    if (pin.length < 8) {
      setPin((prev) => prev + digit);
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pin.length >= 4) {
      await onVerify(pin);
    }
  };

  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Lock className="h-8 w-8 text-primary" />
        </div>
        <Typography variant="h3" weight="bold">
          Code de sécurité
        </Typography>
        <Typography variant="body-base" theme="muted">
          Entrez votre code PIN (min. 4 chiffres)
        </Typography>
      </div>

      <Card className="bg-card/40 backdrop-blur-xl border-border/50 shadow-xl overflow-hidden">
        <CardContent className="p-8 space-y-6">
          {/* PIN dots display */}
          <div className="flex justify-center gap-3 mb-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  scale: pin.length > i ? 1.1 : 1,
                  backgroundColor:
                    pin.length > i ? "hsl(var(--primary))" : "hsl(var(--muted))",
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="w-4 h-4 rounded-full"
              />
            ))}
          </div>

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
              <motion.button
                key={digit}
                whileTap={{ scale: 0.92 }}
                onClick={() => handleDigitClick(digit)}
                disabled={isLoading || isPasskeyLoading}
                className="h-14 rounded-xl bg-muted/40 hover:bg-primary/10 border border-border/30 hover:border-primary/40 transition-all text-lg font-semibold"
              >
                {digit}
              </motion.button>
            ))}
            <div /> {/* empty cell */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => handleDigitClick(0)}
              disabled={isLoading || isPasskeyLoading}
              className="h-14 rounded-xl bg-muted/40 hover:bg-primary/10 border border-border/30 hover:border-primary/40 transition-all text-lg font-semibold"
            >
              0
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={handleDelete}
              disabled={isLoading || isPasskeyLoading || pin.length === 0}
              className="h-14 rounded-xl bg-muted/40 hover:bg-destructive/10 border border-border/30 hover:border-destructive/40 transition-all flex items-center justify-center"
            >
              <Delete className="h-5 w-5" />
            </motion.button>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-2">
            <Button
              onClick={handleSubmit}
              disabled={pin.length < 4 || isLoading || isPasskeyLoading}
              className="h-12 rounded-xl font-bold shadow-lg shadow-primary/25"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Vérification...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Confirmer
                </span>
              )}
            </Button>

            {hasPasskey && onVerifyPasskey ? (
              <Button
                variant="outline"
                onClick={handlePasskeyVerify}
                disabled={isLoading || isPasskeyLoading}
                className="h-12 rounded-xl font-semibold border-primary/30"
              >
                {isPasskeyLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    Passkey...
                  </span>
                ) : (
                  "🔐 Utiliser mon Passkey"
                )}
              </Button>
            ) : !hasPasskey ? (
              <Button
                variant="ghost"
                onClick={handleAddPasskey}
                disabled={isLoading || isPasskeyLoading}
                className="h-10 text-sm text-muted-foreground hover:text-primary"
              >
                + Ajouter un Passkey pour la prochaine fois
              </Button>
            ) : null}

            <Button
              variant="ghost"
              onClick={onBack}
              disabled={isLoading || isPasskeyLoading}
              className="h-10 text-sm flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Typography variant="caption1" theme="muted">
          Total transaction:{" "}
          <span className="font-bold text-foreground">
            {transactionDetails.totalAmount.toFixed(2)} GTC
          </span>
        </Typography>
      </div>
    </div>
  );
}
