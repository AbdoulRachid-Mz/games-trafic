"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { ArrowRight, CheckCircle, Star, Shield, Zap, Sparkles } from "lucide-react";
import Link from "next/link";
import { Service } from "@/database/schema";
import { useRouter } from "next/router";

// Types simplifiés
type ViewMode = "grid" | "list" | "compact";
type CardVariant = "default" | "premium" | "admin";

interface ServiceCardProps {
    service: Service;
    className?: string;
    viewMode?: ViewMode;
    variant?: CardVariant;
    onView?: (serviceId: string) => void;
}

export function ServiceCard({ service, className, viewMode = "grid", variant = "default", onView }: ServiceCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    const router = useRouter();

    const handleView = () => {
        if (onView) {
            onView(service.id);
        } else {
            router.push(`/services/${service.id}`);
        }
    };

    const isCompact = viewMode === "compact";
    const isList = viewMode === "list";
    const isPremium = variant === "premium";
    const isAdmin = variant === "admin";

    const cardContentClass = cn(
        "p-4 space-y-4 relative z-10",
        isCompact && "p-2 space-y-2",
        isList && "p-3 space-y-3"
    );

    const iconClass = cn(
        "rounded-2xl flex items-center justify-center text-3xl transition-all duration-500",
        isHovered
            ? "bg-primary text-primary-foreground scale-110 rotate-3 shadow-lg shadow-primary/30"
            : "bg-primary/10 text-primary",
        isCompact && "w-10 h-10 text-xl",
        isList && "w-12 h-12 text-2xl",
        !isCompact && !isList && "w-16 h-16"
    );

    const titleVariant = isCompact ? "h4" : "h3";
    const titleClass = cn(
        "tracking-tight group-hover:text-primary transition-colors",
        isCompact && "text-base",
        isList && "text-lg",
        !isCompact && !isList && "text-2xl"
    );

    const descLines = isCompact ? 2 : isList ? 2 : 3;

    return (
        <motion.div
            whileHover={{ y: -8 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="h-full"
        >
            <Card className={cn(
                "group relative h-full overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-500 hover:shadow-2xl hover:shadow-primary/20 hover:border-primary/50 rounded-[2rem]",
                isCompact && "rounded-xl",
                isList && "rounded-2xl",
                isPremium && "ring-2 ring-amber-400/50",
                isAdmin && "ring-2 ring-red-400/50",
                className
            )}>
                {/* Decorative Background */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-primary/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-secondary/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

                <CardContent className={cardContentClass}>
                    {/* Icon & Badges */}
                    <div className={cn("flex items-start justify-between", isList && "items-center")}>
                        <div className={iconClass}>
                            {service.icon || "✨"}
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                            {isPremium && (
                                <Badge variant="outline" className="bg-background/50 backdrop-blur-md border-primary/20 text-primary gap-1 px-3 py-1 rounded-full">
                                    <Sparkles className="w-3 h-3" />
                                    Premium
                                </Badge>
                            )}
                            {isAdmin && (
                                <Badge variant="outline" className="bg-background/50 backdrop-blur-md border-red-500/20 text-red-500 gap-1 px-3 py-1 rounded-full">
                                    <Shield className="w-3 h-3" />
                                    Admin
                                </Badge>
                            )}
                            {!isCompact && (
                                <div className="flex items-center gap-1 text-amber-500 text-xs font-bold bg-amber-500/10 px-2 py-1 rounded-full border border-amber-500/20">
                                    <Star className="w-3 h-3 fill-current" />
                                    5.0
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-3">
                        <Typography
                            variant={titleVariant}
                            weight="bold"
                            className={titleClass}
                        >
                            {service.title}
                        </Typography>
                        <Typography
                            variant="body-base"
                            theme="muted"
                            className={cn("leading-relaxed", `line-clamp-${descLines}`)}
                        >
                            {service.description}
                        </Typography>
                    </div>

                    {/* Features Preview */}
                    {!isCompact && (
                        <div className={cn(
                            "gap-3 pt-2",
                            isList ? "flex" : "grid grid-cols-2"
                        )}>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/20 p-2 rounded-xl border border-border/50">
                                <Shield className="w-3.5 h-3.5 text-primary" />
                                <span>Sécurisé</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/20 p-2 rounded-xl border border-border/50">
                                <Zap className="w-3.5 h-3.5 text-primary" />
                                <span>Rapide</span>
                            </div>
                        </div>
                    )}

                    {/* CTA */}
                    <div className="pt-4">
                        {onView ? (
                            <Button
                                onClick={handleView}
                                className={cn(
                                    "w-full rounded-2xl h-12 text-base font-bold transition-all duration-500 group-hover:gap-4",
                                    isCompact && "h-8 text-sm rounded-xl",
                                    isList && "h-10 text-sm rounded-xl",
                                    isHovered
                                        ? "bg-primary text-primary-foreground shadow-xl shadow-primary/40"
                                        : "bg-secondary/50 text-foreground hover:bg-secondary"
                                )}
                            >
                                Explorer le service
                                <ArrowRight className={cn(
                                    "transition-transform duration-500",
                                    isCompact && "w-4 h-4",
                                    isList && "w-4 h-4",
                                    !isCompact && !isList && "w-5 h-5",
                                    isHovered && "translate-x-1"
                                )} />
                            </Button>
                        ) : (
                            <Link href={`/services/${service.id}`} className="block">
                                <Button
                                    className={cn(
                                        "w-full rounded-2xl h-12 text-base font-bold transition-all duration-500 group-hover:gap-4",
                                        isCompact && "h-8 text-sm rounded-xl",
                                        isList && "h-10 text-sm rounded-xl",
                                        isHovered
                                            ? "bg-primary text-primary-foreground shadow-xl shadow-primary/40"
                                            : "bg-secondary/50 text-foreground hover:bg-secondary"
                                    )}
                                >
                                    Explorer le service
                                    <ArrowRight className={cn(
                                        "transition-transform duration-500",
                                        isCompact && "w-4 h-4",
                                        isList && "w-4 h-4",
                                        !isCompact && !isList && "w-5 h-5",
                                        isHovered && "translate-x-1"
                                    )} />
                                </Button>
                            </Link>
                        )}
                    </div>
                </CardContent>

                {/* Bottom Border Accent */}
                <div className={cn(
                    "absolute bottom-0 left-0 h-1 bg-primary transition-all duration-700",
                    isHovered ? "w-full" : "w-0"
                )} />
            </Card>
        </motion.div>
    );
}
