"use client";

import type { HTMLAttributes } from "react";
import { Gamepad2 } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

interface LoaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  size?: "sm" | "md" | "lg";
}

const sizeConfig = {
  sm: { arena: "size-20", icon: "size-7", title: "text-sm", bar: "w-32" },
  md: { arena: "size-28", icon: "size-9", title: "text-base", bar: "w-48" },
  lg: { arena: "size-36", icon: "size-11", title: "text-lg", bar: "w-56" },
} as const;

/**
 * Indicateur de chargement gaming, accessible et aligné sur les tokens
 * violet/or du projet. Aucune couleur hors palette, aucune donnée fictive.
 */
export default function Loader({
  title = "Préparation de la partie...",
  subtitle = "Chargement de votre espace gaming",
  size = "md",
  className,
  ...props
}: LoaderProps) {
  const reducedMotion = useReducedMotion();
  const config = sizeConfig[size];

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={title}
      className={cn(
        "flex flex-col items-center justify-center gap-5 px-4 py-8 text-center",
        className,
      )}
      {...props}
    >
      <div className={cn("relative grid place-items-center", config.arena)}>
        <motion.div
          aria-hidden
          className="absolute inset-0 rounded-full border-2 border-dashed border-primary/30"
          animate={reducedMotion ? undefined : { rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          aria-hidden
          className="absolute inset-2 rounded-full border-t-2 border-secondary"
          animate={reducedMotion ? undefined : { rotate: -360 }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          aria-hidden
          className="absolute inset-5 rounded-full bg-primary/10 ring-1 ring-primary/20"
          animate={reducedMotion ? undefined : { scale: [1, 1.08, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <Gamepad2
          aria-hidden
          className={cn("relative z-10 text-primary", config.icon)}
        />
      </div>

      <div className="space-y-1.5">
        <p className={cn("font-semibold text-foreground", config.title)}>
          {title}
        </p>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <div
        aria-hidden
        className={cn("h-1 overflow-hidden rounded-full bg-muted", config.bar)}
      >
        <motion.div
          className="h-full w-1/3 rounded-full bg-gradient-to-r from-primary to-secondary"
          animate={
            reducedMotion
              ? { x: 0 }
              : { x: ["-100%", "300%"], opacity: [0.4, 1, 0.4] }
          }
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}
