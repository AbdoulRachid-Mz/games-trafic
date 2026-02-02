// @/components/wallet/pin-pad.tsx
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Delete, Dot } from "lucide-react";
import { cn } from "@/lib/utils";
import { Typography } from "@/components/ui/typography";

interface PinPadProps {
  onDigit: (digit: string) => void;
  onDelete: () => void;
  disabled?: boolean;
}

export function PinPad({ onDigit, onDelete, disabled = false }: PinPadProps) {
  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  return (
    <div className="max-w-xs mx-auto">
      <div className="grid grid-cols-3 gap-3 p-2 bg-muted/20 rounded-2xl">
        {digits.map((digit, index) => (
          <motion.div
            key={digit}
            whileHover={{ scale: disabled ? 1 : 1.05 }}
            whileTap={{ scale: disabled ? 1 : 0.95 }}
          >
            <Button
              type="button"
              variant="ghost"
              size="lg"
              className={cn(
                "w-full h-14 text-xl font-medium rounded-xl",
                "hover:bg-primary hover:text-primary-foreground",
                "active:bg-primary/90",
                "transition-all duration-200 shadow-sm",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              onClick={() => !disabled && onDigit(digit)}
              disabled={disabled}
            >
              {digit}
            </Button>
          </motion.div>
        ))}
        
        {/* Bouton vide pour l'alignement */}
        <div />
        
        {/* Bouton 0 */}
        <motion.div
          whileHover={{ scale: disabled ? 1 : 1.05 }}
          whileTap={{ scale: disabled ? 1 : 0.95 }}
        >
          <Button
            type="button"
            variant="ghost"
            size="lg"
            className={cn(
              "w-full h-14 text-xl font-medium rounded-xl",
              "hover:bg-primary hover:text-primary-foreground",
              "active:bg-primary/90",
              "transition-all duration-200 shadow-sm",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => !disabled && onDigit("0")}
            disabled={disabled}
          >
            0
          </Button>
        </motion.div>
        
        {/* Bouton effacer */}
        <motion.div
          whileHover={{ scale: disabled ? 1 : 1.05 }}
          whileTap={{ scale: disabled ? 1 : 0.95 }}
        >
          <Button
            type="button"
            variant="ghost"
            size="lg"
            className={cn(
              "w-full h-14 rounded-xl",
              "hover:bg-destructive hover:text-destructive-foreground",
              "active:bg-destructive/90",
              "transition-all duration-200 shadow-sm",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => !disabled && onDelete()}
            disabled={disabled}
          >
            <Delete className="h-5 w-5" />
          </Button>
        </motion.div>
      </div>
      
      <Typography variant="caption2" theme="muted" className="text-center mt-3">
        Utilisez le clavier numérique ou cliquez sur les touches
      </Typography>
    </div>
  );
}