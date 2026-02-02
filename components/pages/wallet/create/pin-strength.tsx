"use client";

import React from "react";
import { Typography } from "@/components/ui/typography";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Lock, Shield, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PinStrengthProps {
  pin: string;
  className?: string;
}

export function PinStrength({ pin, className }: PinStrengthProps) {
  const calculateStrength = (pin: string): {
    score: number;
    level: "faible" | "moyen" | "fort" | "très fort";
    color: string;
    suggestions: string[];
  } => {
    let score = 0;
    const suggestions: string[] = [];

    // Longueur
    if (pin.length >= 4) score += 25;
    if (pin.length >= 6) score += 25;
    
    // Diversité
    const hasLetters = /[a-zA-Z]/.test(pin);
    const hasNumbers = /\d/.test(pin);
    const hasSpecial = /[^a-zA-Z0-9]/.test(pin);
    
    if (hasLetters && hasNumbers) score += 25;
    if (hasSpecial) score += 25;

    // Vérifier les motifs courants
    const commonPatterns = [
      "1234", "0000", "1111", "2222", "3333", "4444", "5555",
      "6666", "7777", "8888", "9999", "1212", "1313", "2525",
    ];
    
    if (commonPatterns.includes(pin)) {
      score = Math.max(score - 50, 0);
      suggestions.push("Évitez les combinaisons courantes comme 1234");
    }

    // Vérifier les séquences
    if (/123|234|345|456|567|678|789|890/.test(pin)) {
      suggestions.push("Évitez les séquences numériques");
    }

    // Déterminer le niveau
    let level: "faible" | "moyen" | "fort" | "très fort" = "faible";
    let color = "bg-red-500";
    
    if (score >= 75) {
      level = "très fort";
      color = "bg-green-500";
    } else if (score >= 50) {
      level = "fort";
      color = "bg-green-400";
    } else if (score >= 25) {
      level = "moyen";
      color = "bg-yellow-500";
    }

    return { score, level, color, suggestions };
  };

  const { score, level, color, suggestions } = calculateStrength(pin);

  if (!pin) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("space-y-4", className)}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Typography variant="body-sm" weight="medium">
            Force du code PIN
          </Typography>
          <Badge
            variant={
              level === "très fort" || level === "fort"
                ? "default"
                : level === "moyen"
                ? "secondary"
                : "destructive"
            }
            className="gap-1"
          >
            {level === "très fort" || level === "fort" ? (
              <Shield className="h-3 w-3" />
            ) : level === "moyen" ? (
              <Lock className="h-3 w-3" />
            ) : (
              <AlertCircle className="h-3 w-3" />
            )}
            {level.toUpperCase()}
          </Badge>
        </div>
        
        <Progress value={score} className="h-2" />
        
        <Typography variant="caption2" theme="muted">
          Score: {score}/100
        </Typography>
      </div>

      {suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-2"
        >
          <Typography variant="caption1" weight="medium">
            Suggestions d'amélioration:
          </Typography>
          <ul className="space-y-1">
            {suggestions.map((suggestion, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-2"
              >
                <AlertCircle className="h-3 w-3 text-yellow-600 mt-0.5 flex-shrink-0" />
                <Typography variant="caption2" theme="muted">
                  {suggestion}
                </Typography>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}

      {score >= 75 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 text-green-600"
        >
          <CheckCircle className="h-4 w-4" />
          <Typography variant="caption1" weight="medium">
            Excellent! Votre code PIN est sécurisé
          </Typography>
        </motion.div>
      )}

      {/* Conseils de sécurité */}
      <div className="pt-4 border-t">
        <Typography variant="caption1" weight="medium" className="mb-2">
          Conseils pour un code PIN sécurisé:
        </Typography>
        <ul className="space-y-1">
          <li className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-primary" />
            <Typography variant="caption2" theme="muted">
              Utilisez au moins 4 caractères
            </Typography>
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-primary" />
            <Typography variant="caption2" theme="muted">
              Combinez lettres et chiffres
            </Typography>
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-primary" />
            <Typography variant="caption2" theme="muted">
              Évitez les informations personnelles
            </Typography>
          </li>
        </ul>
      </div>
    </motion.div>
  );
}