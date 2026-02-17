"use client";

import React, { useState } from "react";
import { Typography } from "@/components/ui/typography";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Shield, Check, Delete, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface PinVerificationProps {
  onVerify: (pin: string) => Promise<void>;
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
  onBack,
  isLoading = false,
  transactionDetails,
}: PinVerificationProps) {
  const [pin, setPin] = useState("");

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
        <CardContent className="p-8">
          <div className="flex justify-center gap-6 mb-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                initial={false}
                animate={{
                  scale: pin.length > i ? 1.2 : 1,
                  borderColor:
                    pin.length > i ? "var(--primary)" : "var(--border)",
                  backgroundColor:
                    pin.length > i ? "var(--primary)" : "transparent",
                }}
                className={cn(
                  "w-4 h-4 rounded-full border-2 transition-colors duration-200",
                  pin.length > i &&
                    "bg-primary border-primary shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                )}
              />
            ))}
          </div>

          {/* Custom Numeric Keypad for Mobile feel */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleDigitClick(digit)}
                disabled={isLoading || pin.length >= 8}
                className="h-16 rounded-2xl bg-muted/30 hover:bg-muted/60 text-2xl font-bold transition-all active:scale-95 disabled:opacity-50"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              disabled={isLoading}
              className="h-16 rounded-2xl flex items-center justify-center text-muted-foreground hover:bg-muted/30 transition-all active:scale-95"
              onClick={onBack}
            >
              <Typography variant="caption1" weight="bold">
                RETOUR
              </Typography>
            </button>
            <button
              type="button"
              onClick={() => handleDigitClick(0)}
              disabled={isLoading || pin.length >= 8}
              className="h-16 rounded-2xl bg-muted/30 hover:bg-muted/60 text-2xl font-bold transition-all active:scale-95 disabled:opacity-50"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isLoading || pin.length === 0}
              className="h-16 rounded-2xl flex items-center justify-center hover:bg-destructive/10 text-destructive transition-all active:scale-95 disabled:opacity-50"
            >
              <Delete className="w-6 h-6" />
            </button>
          </div>

          <Button
            onClick={() => handleSubmit()}
            disabled={pin.length < 4 || isLoading}
            className="w-full h-14 text-lg rounded-xl font-bold shadow-lg shadow-primary/25"
          >
            {isLoading ? (
              <>
                <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Vérification...
              </>
            ) : (
              "Confirmer"
            )}
          </Button>

          <div className="mt-6 flex items-center justify-center gap-2 text-muted-foreground/60">
            <Shield className="h-3 w-3" />
            <span className="text-xs uppercase tracking-widest font-medium">
              Sécurisé & Chiffré
            </span>
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
