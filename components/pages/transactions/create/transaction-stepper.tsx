"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { TransactionStep } from "@/types/transaction-types";

interface TransactionStepperProps {
  steps: TransactionStep[];
  currentStep: number;
  currentStepType: TransactionStep;
}

const stepLabels: Record<TransactionStep, string> = {
  TYPE_SELECTION: "Type",
  ENTITY_SELECTION: "Sélection",
  AMOUNT_INPUT: "Montant",
  RECIPIENT_SELECTION: "Destinataire",
  DEPOSIT_DETAILS: "Détails",
  WITHDRAWAL_DETAILS: "Détails",
  PIN_VERIFICATION: "Sécurité",
  CONFIRMATION: "Validation",
  SUCCESS: "Terminé",
};

export function TransactionStepper({
  steps,
  currentStep,
  currentStepType,
}: TransactionStepperProps) {
  return (
    <div className="w-full mb-12">
      <div className="flex justify-between relative px-2">
        {/* Background Line */}
        <div className="absolute top-4 left-0 right-0 h-1 bg-muted/50 rounded-full -z-10" />

        {/* Active Progress Line */}
        <div
          className="absolute top-4 left-0 h-1 bg-linear-to-r from-primary to-primary/80 rounded-full -z-10 transition-all duration-500 ease-in-out"
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isUpcoming = index > currentStep;

          return (
            <div
              key={step}
              className="flex flex-col items-center gap-2 relative group"
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-sm z-10",
                  isCompleted &&
                    "bg-primary border-primary text-primary-foreground scale-100",
                  isCurrent &&
                    "bg-background border-primary text-primary scale-125 ring-4 ring-primary/20",
                  isUpcoming &&
                    "bg-card border-muted-foreground/30 text-muted-foreground/50 scale-90"
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" strokeWidth={3} />
                ) : (
                  <span className="text-xs font-bold font-mono">
                    {index + 1}
                  </span>
                )}
              </div>

              <span
                className={cn(
                  "absolute -bottom-8 text-xs font-bold tracking-tight bg-background px-2 py-0.5 rounded-md border border-border/40 transition-all duration-300 pointer-events-none",
                  isCurrent
                    ? "opacity-100 translate-y-0 text-foreground"
                    : "opacity-0 -translate-y-2 text-muted-foreground",
                  isCompleted && "opacity-60 text-muted-foreground"
                )}
              >
                {stepLabels[step]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
