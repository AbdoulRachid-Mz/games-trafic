'use client'
import React from 'react'
import { PlusIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
    variant?: "default" | "primary" | "secondary" | "tertiary"
    size?: number
    message?: string;
}

// Get variant-specific color configurations
const getVariantColors = (variant: Props["variant"]) => {
    switch (variant) {
        case "primary":
            return {
                main: "bg-primary",
                mainText: "text-primary",
                mainBorder: "border-primary",
                light: "bg-primary/10",
                lightBorder: "border-primary/20",
                lighter: "bg-primary/40",
                lighterBorder: "border-primary/40",
                shadow: "0 0 8px hsl(var(--primary))",
                shadowLarge: "0 0 15px -5px hsl(var(--primary))",
                crosshairOpacity: "opacity-20",
            }
        case "secondary":
            return {
                main: "bg-secondary",
                mainText: "text-secondary",
                mainBorder: "border-secondary",
                light: "bg-secondary/10",
                lightBorder: "border-secondary/20",
                lighter: "bg-secondary/40",
                lighterBorder: "border-secondary/40",
                shadow: "0 0 8px hsl(var(--secondary))",
                shadowLarge: "0 0 15px -5px hsl(var(--secondary))",
                crosshairOpacity: "opacity-20",
            }
        case "tertiary":
            return {
                main: "bg-emerald-500",
                mainText: "text-emerald-500",
                mainBorder: "border-emerald-500",
                light: "bg-emerald-500/10",
                lightBorder: "border-emerald-500/20",
                lighter: "bg-emerald-400/40",
                lighterBorder: "border-emerald-400/40",
                shadow: "0 0 8px #10b981",
                shadowLarge: "0 0 15px -5px #10b981",
                crosshairOpacity: "opacity-20",
            }
        case "default":
        default:
            return {
                main: "bg-blue-500",
                mainText: "text-blue-500",
                mainBorder: "border-blue-500",
                light: "bg-blue-500/10",
                lightBorder: "border-blue-500/20",
                lighter: "bg-blue-400/40",
                lighterBorder: "border-blue-400/40",
                shadow: "0 0 8px #3b82f6",
                shadowLarge: "0 0 15px -5px #3b82f6",
                crosshairOpacity: "opacity-20",
            }
    }
}

export function PulseLoading({ 
    variant = "default", 
    size, 
    className,
    message = "Chargement", 
    ...props 
}: Props & React.ComponentProps<"div">) {
  const [dots, setDots] = React.useState('')
  const colors = getVariantColors(variant)
  const mainSize = size ?? 56;
  const innerSize = mainSize / 2;

  React.useEffect(() => {
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.')
    }, 400)
    return () => clearInterval(interval)
  }, [])

  return (
    <div 
      className={cn('w-full h-screen bg-background flex flex-col justify-center items-center gap-4', className)} 
      {...props}
    >
      {/* Compact Mini-Hologram Loader */}
      <div className="relative flex items-center justify-center">
        <div className={cn("absolute inset-0 blur-xl rounded-full scale-150 animate-pulse", colors.light)} />
        
        <div className={cn("absolute inset-0 flex items-center justify-center", colors.crosshairOpacity)}>
            <div className={cn("absolute w-[1px]", colors.main)} style={{ height: mainSize }} />
            <div className={cn("absolute h-[1px]", colors.main)} style={{ width: mainSize }} />
        </div>

        {/* Main Ring System */}
        <div 
          className={cn(
            "relative p-2 border border-dashed rounded-full animate-[spin_2s_linear_infinite]",
            colors.lightBorder
          )}
          style={{ width: mainSize, height: mainSize }}
        >
            
            <div 
              className={cn(
                "border border-dashed rounded-full flex justify-center items-center animate-[spin_1.2s_linear_infinite_reverse]",
                colors.lighterBorder
              )}
              style={{ width: innerSize, height: innerSize }}
            >
                <div 
                  className={cn(
                    "relative z-10 p-1 bg-background rounded-full border",
                    colors.mainBorder
                  )}
                  style={{ boxShadow: colors.shadowLarge }}
                >
                    <PlusIcon 
                      size={size ? size / 3.5 : 16} 
                      className={cn("animate-[pulse_2s_ease-in-out_infinite]", colors.mainText)} 
                    />
                </div>
            </div>
            
            {/* 4 Orbiting Dots at Cardinal Points */}
            {/* Top */}
            <div className={cn("absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full", colors.main)} style={{ boxShadow: colors.shadow }} />
            {/* Bottom */}
            <div className={cn("absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 rounded-full", colors.lighter)} style={{ boxShadow: colors.shadow }} />
            {/* Left */}
            <div className={cn("absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full", colors.lighter)} style={{ boxShadow: colors.shadow }} />
            {/* Right */}
            <div className={cn("absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full", colors.main)} style={{ boxShadow: colors.shadow }} />
        </div>
      </div>

      <div className="flex flex-col items-center">
        <p className={cn("text-[10px] font-mono tracking-[0.3em] uppercase", colors.mainText)}>
          {message} {dots}
        </p>
      </div>
    </div>
  )
}
