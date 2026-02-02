"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Info,
  ExternalLink,
  Users,
  ShoppingBag,
  Trophy,
  Coins,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useScreenSize } from "@/hooks/use-screen";

interface StatsCardProps {
  title?: string;
  value?: string | number;
  description?: string;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  iconName?: "Users" | "ShoppingBag" | "Trophy" | "Coins";
  trend?: {
    value: number;
    label?: string;
    isPositive?: boolean;
  };
  bgType?:
    | "gradient-1"
    | "gradient-2"
    | "gradient-3"
    | "gradient-4"
    | "gradient-5"
    | "gradient-6"
    | "glass"
    | "neuomorphic"
    | "solid"
    | "animated"
    | "neon"
    | "default";
  bgIcon?:
    | "gradient-1"
    | "gradient-2"
    | "gradient-3"
    | "gradient-4"
    | "gradient-5"
    | "gradient-6"
    | "glass"
    | "solid"
    | "default";
  variant?:
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger";
  size?: "sm" | "md" | "lg";
  shadow?: "sm" | "md" | "lg" | "xl" | "2xl" | "none" | "custom" | "default";
  customShadow?: string;
  animated?: boolean;
  clickable?: boolean;
  badge?: string;
  subtitle?: string;
  className?: string;
  onClick?: () => void;
  actions?: React.ReactNode;
  tooltipContent?: string;
  responsive?: boolean;
}

export function StatsCard({
  title,
  value,
  description,
  icon: IconElement,
  iconName,
  trend,
  bgType = "solid",
  bgIcon = "default",
  variant = "default",
  size = "md",
  shadow = "md",
  customShadow,
  animated = false,
  clickable = false,
  badge,
  subtitle,
  className,
  onClick,
  actions,
  tooltipContent,
  responsive = true,
  children,
  ...props
}: StatsCardProps) {
  const { isSmallScreen, isMediumScreen, isLargeScreen, screenSize } =
    useScreenSize();

  // Ajuster la taille en fonction de l'écran si responsive est activé
  const getAdjustedSize = () => {
    if (!responsive) return size;

    if (isSmallScreen) {
      return "sm";
    } else if (isMediumScreen) {
      return size === "lg" ? "md" : size;
    }
    return size;
  };

  const adjustedSize = getAdjustedSize();

  const getBackgroundStyles = () => {
    const gradientMap = {
      "gradient-1": "bg-gradient-1",
      "gradient-2": "bg-gradient-2",
      "gradient-3": "bg-gradient-3",
      "gradient-4": "bg-gradient-4",
      "gradient-5": "bg-gradient-5",
      "gradient-6": "bg-gradient-6",
    };

    const baseGradients = {
      default:
        "from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800",
      primary: "from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900",
      secondary:
        "from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900",
      success:
        "from-green-50 to-green-100 dark:from-green-950 dark:to-green-900",
      warning:
        "from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900",
      danger: "from-red-50 to-red-100 dark:from-red-950 dark:to-red-900",
    };

    switch (bgType) {
      case "gradient-1":
      case "gradient-2":
      case "gradient-3":
      case "gradient-4":
      case "gradient-5":
      case "gradient-6":
        return `${gradientMap[bgType]} text-white border-none`;

      case "glass":
        return "bg-white/10 backdrop-blur-xl border-white/20 ";

      case "neuomorphic":
        return cn(
          "bg-slate-100 border-none shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff]",
          "dark:bg-slate-800 dark:shadow-[8px_8px_16px_#1e293b,-8px_-8px_16px_#334155]"
        );

      case "animated":
        return cn(
          `bg-gradient-to-br ${baseGradients[variant]}`,
          "border-none bg-size-200 animate-gradient"
        );

      case "neon":
        const neonColors = {
          default: "shadow-slate-500/25 border-slate-300",
          primary: "shadow-blue-500/25 border-blue-300",
          secondary: "shadow-purple-500/25 border-purple-300",
          success: "shadow-green-500/25 border-green-300",
          warning: "shadow-yellow-500/25 border-yellow-300",
          danger: "shadow-red-500/25 border-red-300",
        };
        return cn(
          "bg-background/95 backdrop-blur-sm",
          `${neonColors[variant]}`,
          "border-2 hover:shadow-3xl transition-all duration-300"
        );

      case "solid":
      case "default":
      default:
        return "bg-card border";
    }
  };

  const getIconBackgroundStyles = () => {
    const gradientMap = {
      "gradient-1": "bg-gradient-1",
      "gradient-2": "bg-gradient-2",
      "gradient-3": "bg-gradient-3",
      "gradient-4": "bg-gradient-4",
      "gradient-5": "bg-gradient-5",
      "gradient-6": "bg-gradient-6",
    };

    switch (bgIcon) {
      case "gradient-1":
      case "gradient-2":
      case "gradient-3":
      case "gradient-4":
      case "gradient-5":
      case "gradient-6":
        return `${gradientMap[bgIcon]} text-white`;

      case "glass":
        return "bg-white/20 backdrop-blur-md";

      case "solid":
        return "bg-primary/10 text-primary";

      case "default":
      default:
        return "bg-muted/30 text-muted-foreground";
    }
  };

  const getShadowClass = () => {
    if (shadow === "custom" && customShadow) {
      return customShadow;
    }

    if (shadow === "none") {
      return "shadow-none";
    }

    const shadowMap = {
      sm: "shadow-sm",
      md: "shadow-md",
      lg: "shadow-lg",
      xl: "shadow-xl",
      "2xl": "shadow-2xl",
      default: "shadow",
    };

    return shadowMap[shadow as keyof typeof shadowMap] || shadowMap.default;
  };

  const getIconColor = () => {
    // Si c'est un gradient, utiliser du blanc pour le contraste
    if (bgType.startsWith("gradient-")) {
      return "text-white";
    }

    switch (variant) {
      case "default":
        return "text-primary";
      case "primary":
        return "text-blue-500";
      case "secondary":
        return "text-purple-500";
      case "success":
        return "text-green-500";
      case "warning":
        return "text-yellow-500";
      case "danger":
        return "text-red-500";
      default:
        return "text-muted-foreground";
    }
  };

  const getSizeClasses = () => {
    const sizeToUse = responsive ? adjustedSize : size;

    switch (sizeToUse) {
      case "sm":
        return {
          card: "p-3",
          icon: "h-6 w-6",
          value: "text-lg",
          title: "text-xs",
          description: "text-xs",
        };
      case "lg":
        return {
          card: "p-6",
          icon: "h-12 w-12",
          value: "text-3xl lg:text-4xl",
          title: "text-lg",
          description: "text-base",
        };
      case "md":
      default:
        return {
          card: "p-4",
          icon: "h-8 w-8 lg:h-10 lg:w-10",
          value: "text-xl lg:text-2xl",
          title: "text-sm",
          description: "text-sm",
        };
    }
  };

  const sizeClasses = getSizeClasses();
  const TrendIcon = trend?.isPositive !== false ? TrendingUp : TrendingDown;
  const ArrowIcon = trend?.isPositive !== false ? ArrowUpRight : ArrowDownRight;
  const iconMap = {
    Users,
    ShoppingBag,
    Trophy,
    Coins,
  } as const;
  const IconToRender = iconName ? iconMap[iconName] : undefined;

  const cardContent = (
    <Card
      className={cn(
        getBackgroundStyles(),
        getShadowClass(),
        "relative overflow-hidden transition-all duration-300",
        animated && "hover:scale-105",
        clickable && "cursor-pointer hover:shadow-lg",
        responsive && "w-full",
        className
      )}
      onClick={clickable ? onClick : undefined}
      {...props}
    >
      {/* Effet de brillance animé */}
      {(bgType === "animated" || bgType === "neon") && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite] pointer-events-none" />
      )}

      <CardContent className={cn("relative", sizeClasses.card)}>
        {children ? (
          // Si children est fourni, on l'affiche directement
          children
        ) : (
          // Sinon, on utilise le layout par défaut avec les props
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* En-tête avec titre et badge */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Typography
                    variant="body-sm"
                    weight="medium"
                    theme={bgType.startsWith("gradient-") ? "white" : "gray"}
                    className={sizeClasses.title}
                    hasTooltip={!!tooltipContent}
                    tooltipContent={tooltipContent}
                  >
                    {title}
                  </Typography>
                  {tooltipContent && (
                    <Info
                      className={cn(
                        "h-3 w-3",
                        bgType.startsWith("gradient-")
                          ? "text-white/70"
                          : "text-muted-foreground"
                      )}
                    />
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {badge && (
                    <Badge
                      variant={
                        bgType.startsWith("gradient-") ? "default" : "secondary"
                      }
                      className="text-xs"
                    >
                      {badge}
                    </Badge>
                  )}
                  {actions && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      {actions}
                    </div>
                  )}
                </div>
              </div>

              {/* Valeur principale */}
              {value !== undefined && (
                <div className="flex items-baseline gap-2 mb-2">
                  <Typography
                    variant="h3"
                    weight="bold"
                    animated={animated}
                    animationType="fade"
                    className={cn(
                      sizeClasses.value,
                      bgType.startsWith("gradient-") && "text-white"
                    )}
                  >
                    {value}
                  </Typography>

                  {trend && (
                    <div
                      className={cn(
                        "flex items-center gap-1 text-sm",
                        trend.isPositive !== false
                          ? bgType.startsWith("gradient-")
                            ? "text-white/90"
                            : "text-green-600"
                          : bgType.startsWith("gradient-")
                          ? "text-white/70"
                          : "text-red-600"
                      )}
                    >
                      <ArrowIcon className="h-3 w-3" />
                      <span className="font-medium">
                        {Math.abs(trend.value)}%
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Sous-titre et description */}
              {subtitle && (
                <Typography
                  variant="body-sm"
                  weight="medium"
                  className={cn(
                    "mb-1",
                    bgType.startsWith("gradient-") && "text-white/90"
                  )}
                >
                  {subtitle}
                </Typography>
              )}

              {description && (
                <Typography
                  variant="caption1"
                  theme={bgType.startsWith("gradient-") ? "white" : "muted"}
                  className="line-clamp-2"
                >
                  {description}
                </Typography>
              )}

              {/* Tendance détaillée */}
              {trend?.label && (
                <div className="flex items-center gap-1 mt-2">
                  <TrendIcon
                    className={cn(
                      "h-3 w-3",
                      trend.isPositive !== false
                        ? bgType.startsWith("gradient-")
                          ? "text-white/90"
                          : "text-green-500"
                        : bgType.startsWith("gradient-")
                        ? "text-white/70"
                        : "text-red-500"
                    )}
                  />
                  <Typography
                    variant="caption2"
                    theme={bgType.startsWith("gradient-") ? "white" : "muted"}
                  >
                    {trend.label}
                  </Typography>
                </div>
              )}
            </div>

            {(IconToRender !== undefined || IconElement) && (
              <div
                className={cn(
                  "p-2 rounded-xl transition-all duration-300",
                  getIconBackgroundStyles(),
                  responsive && isSmallScreen ? "p-1.5" : "p-2"
                )}
              >
                {IconToRender ? (
                  <IconToRender
                    className={cn(
                      sizeClasses.icon,
                      getIconColor(),
                      "transition-all duration-300"
                    )}
                  />
                ) : IconElement && React.isValidElement(IconElement) ? (
                  // Correction : S'assurer que l'élément est un ReactElement avec props
                  React.cloneElement(
                    IconElement as React.ReactElement<{ className?: string }>,
                    {
                      className: cn(
                        sizeClasses.icon,
                        getIconColor(),
                        "transition-all duration-300",
                        (
                          IconElement as React.ReactElement<{
                            className?: string;
                          }>
                        ).props?.className
                      ),
                    }
                  )
                ) : IconElement ? (
                  <div className={cn(sizeClasses.icon, getIconColor())}>
                    {IconElement as React.ReactNode}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (tooltipContent) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="group">{cardContent}</div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipContent}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return <div className="group">{cardContent}</div>;
}

// Variantes prédéfinies pour faciliter l'utilisation
export const MetricCard = (
  props: Omit<StatsCardProps, "bgType" | "variant">
) => <StatsCard {...props} bgType="gradient-1" variant="primary" />;

export const GlassCard = (props: Omit<StatsCardProps, "bgType">) => (
  <StatsCard {...props} bgType="glass" />
);

export const NeonCard = (props: Omit<StatsCardProps, "bgType">) => (
  <StatsCard {...props} bgType="neon" />
);

export const AnimatedCard = (
  props: Omit<StatsCardProps, "bgType" | "animated">
) => <StatsCard {...props} bgType="animated" animated />;

// Composants avec gradients spécifiques
export const Gradient1Card = (props: Omit<StatsCardProps, "bgType">) => (
  <StatsCard {...props} bgType="gradient-1" />
);

export const Gradient2Card = (props: Omit<StatsCardProps, "bgType">) => (
  <StatsCard {...props} bgType="gradient-2" />
);

export const Gradient3Card = (props: Omit<StatsCardProps, "bgType">) => (
  <StatsCard {...props} bgType="gradient-3" />
);
