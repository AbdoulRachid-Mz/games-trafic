// @/components/wallet/pin-strength.tsx
"use client";

import React from "react";
import { Typography } from "@/components/ui/typography";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface PinStrengthIndicatorProps {
  validation: {
    isValid: boolean;
    errors: string[];
    strength: 'weak' | 'medium' | 'strong';
  };
}

export function PinStrengthIndicator({ validation }: PinStrengthIndicatorProps) {
  const { isValid, errors, strength } = validation;
  
  const strengthConfig = {
    weak: {
      color: "bg-red-500",
      text: "Faible",
      icon: XCircle,
      progress: 33,
      description: "Améliorez votre PIN pour plus de sécurité",
    },
    medium: {
      color: "bg-yellow-500",
      text: "Moyen",
      icon: AlertCircle,
      progress: 66,
      description: "Bon, mais peut être amélioré",
    },
    strong: {
      color: "bg-green-500",
      text: "Fort",
      icon: CheckCircle,
      progress: 100,
      description: "Excellent niveau de sécurité",
    },
  };
  
  const config = strengthConfig[strength];
  const Icon = config.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="space-y-4 p-4 rounded-lg bg-muted/30"
    >
      <div className="flex items-center justify-between">
        <Typography variant="body-sm" weight="medium" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Force du PIN
        </Typography>
        <div className="flex items-center gap-2">
          <Icon className={cn(
            "h-4 w-4",
            strength === 'weak' && 'text-red-500',
            strength === 'medium' && 'text-yellow-500',
            strength === 'strong' && 'text-green-500'
          )} />
          <Typography 
            variant="caption1" 
            weight="bold"
            className={cn(
              strength === 'weak' && 'text-red-600',
              strength === 'medium' && 'text-yellow-600',
              strength === 'strong' && 'text-green-600'
            )}
          >
            {config.text}
          </Typography>
        </div>
      </div>
      
      <Progress
        value={config.progress}
        className="h-2"
        // indicatorClassName={cn(
        //   config.color,
        //   "transition-all duration-500"
        // )}
      />
      
      <Typography variant="caption2" theme="muted">
        {config.description}
      </Typography>
      
      {errors.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-2 pt-2"
        >
          {errors.map((error, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-2 text-red-600 dark:text-red-400"
            >
              <XCircle className="h-3 w-3 flex-shrink-0" />
              <Typography variant="caption2">{error}</Typography>
            </motion.div>
          ))}
        </motion.div>
      )}
      
      {isValid && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 text-green-600 dark:text-green-400 pt-2"
        >
          <CheckCircle className="h-4 w-4" />
          <Typography variant="caption2" weight="medium">
            PIN valide et sécurisé
          </Typography>
        </motion.div>
      )}
    </motion.div>
  );
}

// Icon supplémentaire
function Shield(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}