"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Copy, Check, ZoomIn, QrCode, Sparkles } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import QRCode from "qrcode";
import { motion, AnimatePresence } from "framer-motion";

interface TypographyProps {
  variant?:
    | "display"
    | "h1"
    | "h2"
    | "h3"
    | "h4"
    | "h5"
    | "h6"
    | "lead"
    | "body-lg"
    | "body-base"
    | "body-sm"
    | "caption1"
    | "caption2"
    | "caption3"
    | "caption4"
    | "label"
    | "small"
    | "muted";
  children: React.ReactNode;
  component?:
    | "h1"
    | "h2"
    | "h3"
    | "h4"
    | "h5"
    | "h6"
    | "div"
    | "p"
    | "span"
    | "label"
    | "small";
  theme?:
    | "black"
    | "gray"
    | "white"
    | "primary"
    | "secondary"
    | "danger"
    | "success"
    | "warning"
    | "gray-600"
    | "muted"
    | string; // Permet les couleurs personnalisées
  weight?: "light" | "regular" | "medium" | "semibold" | "bold" | "extrabold";
  className?: string;
  gradient?: boolean;
  animated?: boolean;
  animationType?:
    | "fade"
    | "slide"
    | "bounce"
    | "pulse"
    | "glow"
    | "gradient-shift"
    | "3d-float"
    | "typewriter";
  animationIntensity?: "low" | "medium" | "high" | "extreme";
  copyable?: boolean;
  hasTooltip?: boolean;
  tooltipContent?: string;
  tooltipSide?: "top" | "right" | "bottom" | "left";
  htmlFor?: string;
  required?: boolean;
  onClick?: () => void;
  isMarked?: boolean;
  markColor?: string;
  markVariation?: "highlight" | "underline" | "circle" | "strike" | "dotted";
  withLoupe?: boolean;
  loupeIntensity?: number;
  withQRCode?: boolean;
  qrSize?: number;
  qrMargin?: number;
  withConfetti?: boolean;
  confettiIntensity?: "low" | "medium" | "high" | "extreme";
  threeD?: boolean;
  threeDIntensity?: "low" | "medium" | "high" | "extreme";
  threeDColor?: string;
}

const useConfetti = (intensity: string = "medium") => {
  const triggerConfetti = () => {
    const config = {
      particleCount:
        intensity === "low"
          ? 30
          : intensity === "medium"
          ? 50
          : intensity === "high"
          ? 100
          : 200,
      spread:
        intensity === "low"
          ? 45
          : intensity === "medium"
          ? 60
          : intensity === "high"
          ? 75
          : 90,
      startVelocity:
        intensity === "low"
          ? 20
          : intensity === "medium"
          ? 30
          : intensity === "high"
          ? 40
          : 50,
    };

    confetti(config);
    confetti({ ...config, angle: 60 });
    confetti({ ...config, angle: 120 });
  };

  return triggerConfetti;
};

const ThreeDText = ({
  children,
  intensity = "medium",
  color = "#000",
  className,
}: {
  children: React.ReactNode;
  intensity?: string;
  color?: string;
  className?: string;
}) => {
  const intensityMap = {
    low: { layers: 3, offset: 1, blur: 2 },
    medium: { layers: 5, offset: 2, blur: 3 },
    high: { layers: 8, offset: 3, blur: 4 },
    extreme: { layers: 12, offset: 4, blur: 5 },
  };

  const { layers, offset, blur } =
    intensityMap[intensity as keyof typeof intensityMap] || intensityMap.medium;

  return (
    <span className={cn("relative inline-block", className)}>
      {/* Texte principal */}
      <span className="relative z-10">{children}</span>

      {/* Couches 3D */}
      {Array.from({ length: layers }).map((_, i) => (
        <span
          key={i}
          className="absolute inset-0 z-0 opacity-50"
          style={{
            filter: `blur(${blur}px)`,
            transform: `translate3d(${offset * (i + 1)}px, ${
              offset * (i + 1)
            }px, 0)`,
            color: color,
            textShadow: `0 0 ${blur * 2}px ${color}40`,
          }}
        >
          {children}
        </span>
      ))}
    </span>
  );
};

const MarkedText = ({
  children,
  variation = "highlight",
  color = "#ffeb3b",
  className,
}: {
  children: React.ReactNode;
  variation?: string;
  color?: string;
  className?: string;
}) => {
  const styles = {
    highlight: {
      backgroundColor: `${color}40`,
      padding: "0.1em 0.3em",
      borderRadius: "0.25em",
    },
    underline: {
      borderBottom: `2px solid ${color}`,
      paddingBottom: "0.1em",
    },
    circle: {
      backgroundColor: `${color}20`,
      padding: "0.1em 0.4em",
      borderRadius: "50%",
      display: "inline-block",
    },
    strike: {
      textDecoration: `line-through ${color} wavy`,
      textDecorationThickness: "2px",
    },
    dotted: {
      borderBottom: `2px dotted ${color}`,
      paddingBottom: "0.1em",
    },
  };

  return (
    <span style={styles[variation as keyof typeof styles]} className={className}>
      {children}
    </span>
  );
};

const TextLoupe = ({
  children,
  intensity = 1.5,
}: {
  children: React.ReactNode;
  intensity?: number;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className="transition-all duration-300 hover:scale-105">
        {children}
      </span>

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 p-3 bg-background border rounded-lg shadow-xl z-50"
            style={{ transformOrigin: "center top" }}
          >
            <div
              className="text-lg font-bold whitespace-nowrap"
              style={{ transform: `scale(${intensity})` }}
            >
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const QRCodeGenerator = ({
  text,
  size = 128,
  margin = 1,
}: {
  text: string;
  size?: number;
  margin?: number;
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    const generateQR = async () => {
      try {
        const url = await QRCode.toDataURL(text, {
          width: size,
          margin,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        });
        setQrDataUrl(url);
      } catch (err) {
        console.error("Error generating QR code:", err);
      }
    };

    generateQR();
  }, [text, size, margin]);

  return qrDataUrl ? (
    <div className="p-2 bg-white rounded-lg shadow-lg">
      <img src={qrDataUrl} alt="QR Code" className="w-full h-auto" />
    </div>
  ) : null;
};

export function Typography({
  variant = "body-base",
  children,
  component = "div",
  theme = "black",
  weight = "regular",
  className,
  gradient = false,
  animated = false,
  animationType = "fade",
  animationIntensity = "medium",
  copyable = false,
  hasTooltip = false,
  tooltipContent,
  tooltipSide = "top",
  htmlFor,
  required = false,
  onClick,
  isMarked = false,
  markColor = "#ffeb3b",
  markVariation = "highlight",
  withLoupe = false,
  loupeIntensity = 1.5,
  withQRCode = false,
  qrSize = 128,
  qrMargin = 1,
  withConfetti = false,
  confettiIntensity = "medium",
  threeD = false,
  threeDIntensity = "medium",
  threeDColor = "#000",
  ...props
}: TypographyProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const triggerConfetti = useConfetti(confettiIntensity);

  const getDefaultComponent = () => {
    if (component) return component;

    switch (variant) {
      case "display":
      case "h1":
        return "h1";
      case "h2":
        return "h2";
      case "h3":
        return "h3";
      case "h4":
        return "h4";
      case "h5":
        return "h5";
      case "h6":
        return "h6";
      case "label":
        return "label";
      case "small":
      case "caption1":
      case "caption2":
      case "caption3":
      case "caption4":
        return "small";
      case "lead":
      case "body-lg":
      case "body-base":
      case "body-sm":
      case "muted":
      default:
        return "p";
    }
  };

  const Component = getDefaultComponent();

  let variantStyles = "";
  let colorStyles = "";
  let weightStyles = "";
  let gradientStyles = "";
  let animatedStyles = "";

  // Variant styles
  switch (variant) {
    case "display":
      variantStyles =
        "text-5xl sm:text-6xl md:text-7xl leading-none tracking-tight";
      break;
    case "h1":
      variantStyles =
        "text-4xl sm:text-5xl md:text-6xl leading-tight tracking-tight";
      break;
    case "h2":
      variantStyles =
        "text-3xl sm:text-4xl md:text-5xl leading-tight tracking-tight";
      break;
    case "h3":
      variantStyles =
        "text-2xl sm:text-3xl md:text-4xl leading-tight tracking-tight";
      break;
    case "h4":
      variantStyles = "text-xl sm:text-2xl md:text-3xl leading-tight";
      break;
    case "h5":
      variantStyles = "text-lg sm:text-xl md:text-2xl leading-tight";
      break;
    case "h6":
      variantStyles = "text-base sm:text-lg md:text-xl leading-tight";
      break;
    case "lead":
      variantStyles = "text-lg sm:text-xl md:text-2xl leading-relaxed";
      break;
    case "body-lg":
      variantStyles = "text-base sm:text-lg leading-relaxed";
      break;
    case "body-base":
      variantStyles = "text-sm sm:text-base leading-relaxed";
      break;
    case "body-sm":
      variantStyles = "text-xs sm:text-sm leading-relaxed";
      break;
    case "label":
      variantStyles =
        "text-xs sm:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70";
      break;
    case "small":
      variantStyles = "text-xs sm:text-sm leading-none";
      break;
    case "muted":
      variantStyles =
        "text-xs sm:text-sm text-muted-foreground leading-relaxed";
      break;
    case "caption1":
      variantStyles = "text-[10px] sm:text-xs leading-tight";
      break;
    case "caption2":
      variantStyles = "text-[10px] sm:text-xs leading-tight opacity-80";
      break;
    case "caption3":
      variantStyles = "text-[8px] sm:text-[10px] leading-tight";
      break;
    case "caption4":
      variantStyles = "text-[6px] sm:text-[8px] leading-tight";
      break;
  }

  // Color styles
  if (!gradient && !theme.startsWith("#")) {
    switch (theme) {
      case "black":
        colorStyles = "text-foreground";
        break;
      case "white":
        colorStyles = "text-white";
        break;
      case "gray":
        colorStyles = "text-muted-foreground";
        break;
      case "gray-600":
        colorStyles = "text-gray-600";
        break;
      case "muted":
        colorStyles = "text-muted-foreground";
        break;
      case "primary":
        colorStyles = "text-primary";
        break;
      case "secondary":
        colorStyles = "text-secondary-foreground";
        break;
      case "danger":
        colorStyles = "text-destructive";
        break;
      case "success":
        colorStyles = "text-green-600 dark:text-green-500";
        break;
      case "warning":
        colorStyles = "text-yellow-600 dark:text-yellow-500";
        break;
      default:
        colorStyles = `text-[${theme}]`;
        break;
    }
  } else if (gradient) {
    gradientStyles = theme.startsWith("#")
      ? `bg-gradient-to-r from-[${theme}] to-[${theme}]/70 text-transparent bg-clip-text`
      : `bg-gradient-to-r from-${theme} to-${theme}/70 text-transparent bg-clip-text`;
  } else {
    colorStyles = `text-[${theme}]`;
  }

  // Weight styles
  switch (weight) {
    case "light":
      weightStyles = "font-light";
      break;
    case "regular":
      weightStyles = "font-normal";
      break;
    case "medium":
      weightStyles = "font-medium";
      break;
    case "semibold":
      weightStyles = "font-semibold";
      break;
    case "bold":
      weightStyles = "font-bold";
      break;
    case "extrabold":
      weightStyles = "font-extrabold";
      break;
  }

  // Animation styles
  if (animated) {
    const intensityClasses = {
      low: "duration-1000",
      medium: "duration-700",
      high: "duration-500",
      extreme: "duration-300",
    };

    switch (animationType) {
      case "fade":
        animatedStyles = `animate-in fade-in ${intensityClasses[animationIntensity]}`;
        break;
      case "slide":
        animatedStyles = `animate-in slide-in-from-bottom-2 ${intensityClasses[animationIntensity]}`;
        break;
      case "bounce":
        animatedStyles = `animate-bounce ${intensityClasses[animationIntensity]}`;
        break;
      case "pulse":
        animatedStyles = `animate-pulse ${intensityClasses[animationIntensity]}`;
        break;
      case "glow":
        animatedStyles = `animate-pulse drop-shadow-lg ${intensityClasses[animationIntensity]}`;
        break;
      case "gradient-shift":
        animatedStyles = `animate-gradient bg-gradient-to-r from-primary via-secondary to-primary bg-300% text-transparent bg-clip-text ${intensityClasses[animationIntensity]}`;
        break;
      case "3d-float":
        animatedStyles = `animate-float ${intensityClasses[animationIntensity]}`;
        break;
      case "typewriter":
        animatedStyles = `typewriter ${intensityClasses[animationIntensity]}`;
        break;
    }
  }

  const handleCopy = async () => {
    const textContent =
      typeof children === "string" ? children : String(children);

    try {
      await navigator.clipboard.writeText(textContent);
      setCopied(true);

      if (withConfetti) {
        triggerConfetti();
      }

      toast.success("Texte copié!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Erreur lors de la copie");
    }
  };

  const handleQRCode = () => {
    setShowQR(!showQR);
  };

  const combinedClassName = cn(
    variantStyles,
    gradient ? gradientStyles : colorStyles,
    weightStyles,
    animated ? animatedStyles : "",
    (copyable || withQRCode) && "cursor-pointer select-all",
    "group relative",
    className
  );

  const renderContent = () => {
    let content = children;

    if (isMarked) {
      content = (
        <MarkedText variation={markVariation} color={markColor}>
          {content}
        </MarkedText>
      );
    }

    if (threeD) {
      content = (
        <ThreeDText intensity={threeDIntensity} color={threeDColor}>
          {content}
        </ThreeDText>
      );
    }

    if (withLoupe) {
      content = <TextLoupe intensity={loupeIntensity}>{content}</TextLoupe>;
    }

    return content;
  };

  const componentProps = {
    className: combinedClassName,
    onClick: copyable ? handleCopy : withQRCode ? handleQRCode : onClick,
    ...(Component === "label" && htmlFor ? { htmlFor } : {}),
    ...props,
  };

  const content = (
    <Component {...componentProps}>
      {renderContent()}
      {required && Component === "label" && (
        <span className="text-destructive ml-1">*</span>
      )}

      {(copyable || withQRCode) && (
        <div className="absolute -right-8 -top-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
          {copyable && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                handleCopy();
              }}
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          )}

          {withQRCode && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                handleQRCode();
              }}
            >
              <QrCode className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}
    </Component>
  );

  const wrappedContent = (
    <>
      {content}

      {withQRCode && showQR && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="absolute top-full left-0 mt-2 z-50"
        >
          <QRCodeGenerator
            text={String(children)}
            size={qrSize}
            margin={qrMargin}
          />
        </motion.div>
      )}
    </>
  );

  if (hasTooltip && tooltipContent) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "group relative ",
                (copyable || withQRCode) && "pr-8"
              )}
            >
              {wrappedContent}
            </div>
          </TooltipTrigger>
          <TooltipContent side={tooltipSide}>
            <p>{tooltipContent}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div
      className={cn(
        "relative ",
        (copyable || withQRCode) && "pr-8"
      )}
    >
      {wrappedContent}
    </div>
  );
}
