// components/admin/stat-card.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useScreenSize } from "@/hooks/use-screen";

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
  const { isMobile } = useScreenSize();

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
        <CardContent className={cn("p-3", isMobile && "p-2")}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Typography
                variant={isMobile ? "caption2" : "caption1"}
                theme="muted"
                className="uppercase tracking-wider font-bold"
              >
                {title}
              </Typography>
              <Typography
                variant={isMobile ? "h4" : "h2"}
                weight="extrabold"
                className={cn("mt-2 mb-1", isMobile && "mt-1 mb-0")}
              >
                {value}
              </Typography>
              {description && (
                <Typography
                  variant={isMobile ? "caption3" : "caption2"}
                  theme="muted"
                >
                  {description}
                </Typography>
              )}
              {trend && (
                <div className={cn("flex items-center gap-1 mt-2", isMobile && "mt-1")}>
                  {isPositiveTrend ? (
                    <TrendingUp className={cn("h-4 w-4 text-green-600", isMobile && "h-3 w-3")} />
                  ) : (
                    <TrendingDown className={cn("h-4 w-4 text-red-600", isMobile && "h-3 w-3")} />
                  )}
                  <Typography
                    variant={isMobile ? "caption2" : "caption1"}
                    weight="semibold"
                    className={cn(
                      isPositiveTrend ? "text-green-600" : "text-red-600"
                    )}
                  >
                    {isPositiveTrend ? "+" : ""}
                    {trend.value}%
                  </Typography>
                  <Typography
                    variant={isMobile ? "caption3" : "caption2"}
                    theme="muted"
                  >
                    {trend.label}
                  </Typography>
                </div>
              )}
            </div>
            <div
              className={cn(
                "p-3 rounded-xl bg-primary/10",
                iconClassName,
                isMobile && "p-2"
              )}
            >
              <Icon className={cn("h-6 w-6 text-primary", isMobile && "h-5 w-5")} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
