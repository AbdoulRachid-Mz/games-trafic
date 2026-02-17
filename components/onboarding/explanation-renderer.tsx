"use client";

import { useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { StepTooltip } from "./step-tooltip";
import type { PageExplanation } from "@/types/explanation";
import { Info, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface Props {
  explanation: PageExplanation;
  open: boolean;
  stepIndex: number;
  onNext: () => void;
  onPrevious: () => void;
  onComplete: () => void;
  onSkip: () => void;
  onClose: () => void;
}

export function ExplanationRenderer({
  explanation,
  open,
  stepIndex,
  onNext,
  onPrevious,
  onComplete,
  onSkip,
  onClose,
}: Props) {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const steps = explanation.steps || [];
  const isLast = stepIndex >= steps.length - 1;
  const step = steps[stepIndex];

  const hasTooltip = !!step?.position?.elementSelector;

  const onSkipClick = () => {
    try {
      if (dontShowAgain) {
        localStorage.setItem(`gt_explanation_${explanation.page}_shown`, "true");
      }
    } catch {}
    onSkip();
  };

  const onCompleteClick = () => {
    try {
      if (dontShowAgain) {
        localStorage.setItem(`gt_explanation_${explanation.page}_shown`, "true");
      }
    } catch {}
    onComplete();
  };

  const dialog = (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Info className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle>{explanation.title}</DialogTitle>
                <DialogDescription>{explanation.description}</DialogDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={stepIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {stepIndex + 1}
                  </span>
                  <h3 className="font-semibold">{step?.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{step?.content}</p>
                {step?.image ? (
                  <div className="rounded-lg relative border overflow-hidden">
                    <Image
                      src={step.image}
                      width={400}
                      height={400}
                      alt={step.title}
                      className="w-full h-auto"
                    />
                  </div>
                ) : null}
              </div>
            </motion.div>
          </AnimatePresence>
          {steps.length > 1 ? (
            <div className="mt-6 flex items-center gap-2">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${idx <= stepIndex ? "bg-primary" : "bg-muted"}`}
                />
              ))}
            </div>
          ) : null}
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2 flex-1">
            <Checkbox
              id="dont-show"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(!!checked)}
            />
            <Label htmlFor="dont-show" className="text-sm text-muted-foreground cursor-pointer">
              Ne plus afficher une seule fois
            </Label>
          </div>
          <div className="flex gap-2">
            {stepIndex > 0 ? (
              <Button variant="outline" onClick={onPrevious}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Précédent
              </Button>
            ) : null}
            <Button variant="outline" onClick={onSkipClick}>
              Ignorer
            </Button>
            <Button variant={isLast ? "default" : "outline"} onClick={isLast ? onCompleteClick : onNext}>
              {isLast ? "Compris" : "Suivant"}
              {!isLast ? <ChevronRight className="h-4 w-4 ml-1" /> : null}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (hasTooltip && step?.position?.elementSelector) {
    return (
      <>
        <StepTooltip
          selector={step.position.elementSelector}
          placement={step.position.placement || "bottom"}
          title={step.title}
          content={step.content}
          onNext={isLast ? onComplete : onNext}
          onPrevious={onPrevious}
          onSkip={onSkip}
          hasPrevious={stepIndex > 0}
          isLast={isLast}
        />
      </>
    );
  }
  return dialog;
}
