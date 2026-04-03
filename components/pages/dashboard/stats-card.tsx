"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: number;
  changeLabel?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
  delay?: number;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  change,
  changeLabel,
  trend = "neutral",
  className,
  delay = 0,
}: StatsCardProps) {
  const trendColors = {
    up: "text-green-500",
    down: "text-red-500",
    neutral: "text-muted-foreground",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ scale: 1.02 }}
      className={cn("h-full", className)}
    >
      <Card className="h-full border-2 p-2 py-0 hover:shadow-lg hover:shadow-primary/25 transition-all duration-300">
        <CardContent className="p-2">
          <div className="flex items-start justify-between mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            {change !== undefined && (
              <div className={cn("text-sm font-medium", trendColors[trend])}>
                {change > 0 ? "+" : ""}
                {change}%
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Typography
              variant="caption2"
              theme="muted"
              className="uppercase tracking-wide"
            >
              {title}
            </Typography>
            <Typography variant="h4" weight="bold">
              {value}
            </Typography>
            {changeLabel && (
              <Typography variant="caption2" theme="muted">
                {changeLabel}
              </Typography>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
