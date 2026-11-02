// @/components/shared/interaction-button
"use client";

import { useState, ReactNode, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Bookmark, UserPlus, Share2 } from "lucide-react";
import { useAuthContext } from "@/contexts/auth-context";
import {
  useToggleInteraction,
  useEntityInteractionCounts,
  useInteractionExists,
} from "@/hooks/use-interactions";
import { cn } from "@/lib/utils";
import { fireConfettiPreset } from "@/utils/confetti";
import { EntityType } from "@/database/schema";

type InteractionType = "like" | "bookmark" | "follow" | "share";

export interface InteractionButtonProps {
  type: InteractionType;
  entityType: EntityType;
  entityId: string;
  iconOnly?: boolean;
  count?: number;
  children?: ReactNode;
  singleAction?: boolean; // if true, cannot toggle off
  className?: string;
  variant?: "default" | "ghost" | "outline" | "secondary";
  size?: "sm" | "md" | "lg";
  withConfetti?: boolean; // trigger confetti animation on activate
  withCount?: boolean; // display count next to icon
}

const iconMap: Record<InteractionType, React.ElementType> = {
  like: Heart,
  bookmark: Bookmark,
  follow: UserPlus,
  share: Share2,
};

const defaultLabels: Record<InteractionType, string> = {
  like: "J'aime",
  bookmark: "Sauvegarder",
  follow: "Suivre",
  share: "Partager",
};

export function InteractionButton({
  type,
  entityType,
  entityId,
  iconOnly = false,
  count = 0,
  children,
  singleAction = true,
  className,
  variant = "default",
  size = "md",
  withConfetti = true,
  withCount = true,
}: InteractionButtonProps): React.JSX.Element {
  const { user, isAuthenticated } = useAuthContext();
  const { mutate: toggle } = useToggleInteraction();
  const { data: counts } = useEntityInteractionCounts(entityId, entityType);

  // Check if interaction exists
  const { data: interactionExists, isLoading: checkingExists } =
    useInteractionExists(
      user?.id || "",
      entityId,
      entityType,
      type.toUpperCase(),
    );

  const [localCount, setLocalCount] = useState(count);
  const [isActivated, setIsActivated] = useState(false);

  const Icon = iconMap[type];
  const label = children || defaultLabels[type];

  // Sync local state with server counts
  useEffect(() => {
    if (counts && typeof counts[type.toUpperCase()] === "number") {
      setLocalCount(counts[type.toUpperCase()]);
    }
  }, [counts, type]);

  // Sync activated state with server
  useEffect(() => {
    if (interactionExists !== undefined) {
      setIsActivated(interactionExists);
    }
  }, [interactionExists]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated || !user) {
      // TODO: open auth modal or toast
      return;
    }

    if (singleAction && isActivated) return; // block toggle off

    const next = !isActivated;
    setIsActivated(next);
    setLocalCount((prev) => (next ? prev + 1 : Math.max(0, prev - 1)));

    if (next && withConfetti) {
      fireConfettiPreset("success");
    }

    toggle({
      userId: user.id,
      entityId,
      entityType,
      type: type.toUpperCase() as any,
    });
  };

  const sizeClasses = {
    sm: "h-8 px-2 text-sm gap-1",
    md: "h-10 px-3 text-base gap-2",
    lg: "h-12 px-4 text-lg gap-2",
  };

  const variantClasses = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    outline: "border border-input hover:bg-accent hover:text-accent-foreground",
  };

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none",
        sizeClasses[size],
        variantClasses[variant],
        isActivated &&
          variant === "default" &&
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        className,
      )}
      aria-pressed={isActivated}
      aria-label={String(label)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={isActivated ? "active" : "idle"}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="flex items-center gap-2"
        >
          <Icon
            className={cn(
              "shrink-0",
              size === "sm" ? "w-4 h-4" : size === "md" ? "w-5 h-5" : "w-6 h-6",
              isActivated && type === "like" && "fill-current",
            )}
          />
          {!iconOnly && (
            <>
              <span>{label}</span>
              {localCount > 0 && (
                <span className="tabular-nums text-xs ml-1">{localCount}</span>
              )}
            </>
          )}
          {iconOnly && withCount && localCount > 0 && (
            <span className="tabular-nums text-xs">{localCount}</span>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
}
