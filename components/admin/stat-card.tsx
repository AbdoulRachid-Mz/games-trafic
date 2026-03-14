// components/admin/stat-card.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
  iconClassName?: string;
  color?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  className,
  iconClassName,
  color,
}: StatCardProps) {
  const isPositiveTrend = trend && trend.value >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={cn(
          "overflow-hidden bg-card/40 p-3 backdrop-blur-xl border-border/50",
          color,
          className
        )}
      >
        <CardContent className="p-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Typography
                variant="caption1"
                theme="muted"
                className="uppercase tracking-wider font-bold"
              >
                {title}
              </Typography>
              <Typography variant="h2" weight="extrabold" className="mt-2 mb-1">
                {value}
              </Typography>
              {description && (
                <Typography variant="caption2" theme="muted">
                  {description}
                </Typography>
              )}
              {trend && (
                <div className="flex items-center gap-1 mt-2">
                  {isPositiveTrend ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <Typography
                    variant="caption1"
                    weight="semibold"
                    className={cn(
                      isPositiveTrend ? "text-green-600" : "text-red-600"
                    )}
                  >
                    {isPositiveTrend ? "+" : ""}
                    {trend.value}%
                  </Typography>
                  <Typography variant="caption2" theme="muted">
                    {trend.label}
                  </Typography>
                </div>
              )}
            </div>
            <div className={cn("p-3 rounded-xl bg-primary/10", iconClassName)}>
              <Icon className="h-6 w-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
