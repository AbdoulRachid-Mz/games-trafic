"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CheckCircle2, AlertCircle, Clock, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface GenerationStatusBadgeProps {
  totalMatches: number;
  maxMatches: number;
  participantsCount: number;
  minParticipants: number;
  className?: string;
}

export function GenerationStatusBadge({
  totalMatches,
  maxMatches,
  participantsCount,
  minParticipants,
  className,
}: GenerationStatusBadgeProps) {
  const isAtCapacity = totalMatches >= maxMatches;
  const hasEnoughParticipants = participantsCount >= minParticipants;
  const isComplete =
    isAtCapacity || (hasEnoughParticipants && totalMatches > 0);

  if (!hasEnoughParticipants) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className={cn(
                "gap-1 text-amber-600 border-amber-200 bg-amber-50",
                className,
              )}
            >
              <AlertCircle className="h-3 w-3" />
              <span>Attente participants</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              Minimum {minParticipants} participants requis ({participantsCount}
              /{minParticipants})
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (isAtCapacity) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              className={cn(
                "gap-1 bg-green-100 text-green-700 border-green-200",
                className,
              )}
            >
              <CheckCircle2 className="h-3 w-3" />
              <span>Matchs complets</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              Tous les matchs sont générés ({totalMatches}/{maxMatches})
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="secondary" className={cn("gap-1", className)}>
            <RefreshCw className="h-3 w-3" />
            <span>
              {totalMatches}/{maxMatches} matchs
            </span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            Génération partielle. Lancez la génération automatique pour
            compléter.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
