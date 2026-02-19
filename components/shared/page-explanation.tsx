// components/shared/page-explanation.tsx
"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useExplanationTracking } from "@/contexts/tracing-context";
import { PAGE_EXPLANATIONS } from "@/config/page-explanations";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info, X, ChevronRight, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export function PageExplanation() {
  const pathname = usePathname();
  const { shouldShowExplanation, completeExplanation, skipExplanation } =
    useExplanationTracking();

  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const explanation = PAGE_EXPLANATIONS.find((e) => {
    if (e.page === pathname) return true;
    if (e.page.includes("[") || e.page.includes("*")) {
      const pattern = e.page
        .replace(/\[[^\]]+\]/g, "[^/]+")
        .replace(/\*\*/g, ".*")
        .replace(/\*/g, "[^/]*");
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(pathname);
    }
    return false;
  });
  const steps = explanation?.steps || [];
  const key = explanation ? `${explanation.page}@v${explanation.version}` : pathname;

  useEffect(() => {
    if (explanation && shouldShowExplanation(key)) {
      // Délai avant d'afficher l'explication
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [pathname, explanation, shouldShowExplanation, key]);

  const handleClose = () => {
    setIsOpen(false);
    setCurrentStep(0);
    skipExplanation(key);
  };

  const handleDisablePage = () => {
    localStorage.setItem(`gt_explanation_${explanation?.page || pathname}_disabled`, "true");
    setIsOpen(false);
    setCurrentStep(0);
    skipExplanation(key);
  };

  const handleDisableAll = () => {
    localStorage.setItem("gt_explanations_disabled", "true");
    setIsOpen(false);
    setCurrentStep(0);
    skipExplanation(key);
  };

  const handleComplete = () => {
    setIsOpen(false);
    setCurrentStep(0);
    completeExplanation(key);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  if (!explanation || steps.length === 0) {
    return null;
  }

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {currentStep + 1}
                  </span>
                  <h3 className="font-semibold">{currentStepData.title}</h3>
                </div>

                <p className="text-sm text-muted-foreground">
                  {currentStepData.content}
                </p>

                {currentStepData.image && (
                  <div className="rounded-lg relative border overflow-hidden">
                    <Image
                      src={currentStepData.image}
                      width={400}
                      height={400}
                      alt={currentStepData.title}
                      className="w-full h-auto"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Progress indicator */}
          {steps.length > 1 && (
            <div className="mt-6 flex items-center gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    index <= currentStep ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2 flex-1"></div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDisablePage}>
              Ne plus afficher cette page
            </Button>
            <Button variant="outline" onClick={handleDisableAll}>
              Ne plus afficher les explications
            </Button>
            {currentStep > 0 && (
              <Button variant="outline" onClick={handlePrevious}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Précédent
              </Button>
            )}

            <Button
              variant={isLastStep ? "default" : "outline"}
              onClick={isLastStep ? handleComplete : handleNext}
            >
              {isLastStep ? (
                "Compris"
              ) : (
                <>
                  Suivant
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
