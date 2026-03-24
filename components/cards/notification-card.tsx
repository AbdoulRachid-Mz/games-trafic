//@/components/cards/notification-card.tsx
"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import {
    Bell,
    MessageSquare,
    Trophy,
    Users,
    ShoppingBag, Star,
    Clock,
    CheckCircle,
    XCircle,
    Info, Gamepad2, Shield, Gift,
    AlertCircle,
    Mail, Settings,
    FileText, Target, Package, CreditCard, Image,
    Store,
    BookOpen,
    User,
    Palette,
    Newspaper,
    Handshake
} from "lucide-react";
import type { Notification } from "@/database/schema";

// Types
type NotificationType = "info" | "success" | "warning" | "error" | "system";
type ViewMode = "grid" | "list" | "compact";

interface NotificationCardProps {
    notification: Notification & {
        sender?: {
            id: string;
            username?: string;
            profileImage?: string;
            fullName?: string;
        };
        relatedEntity?: {
            type: string;
            id: string;
            title?: string;
            image?: string;
        };
    };
    viewMode?: ViewMode;
    showDetails?: boolean;
    showActions?: boolean;
    showMarkAsRead?: boolean;
    showDeleteButton?: boolean;
    onMarkAsRead?: (notificationId: string) => void;
    onDelete?: (notificationId: string) => void;
    onClick?: (notificationId: string) => void;
    className?: string;
}

export function NotificationCard({
    notification,
    viewMode = "list",
    showDetails = true,
    showActions = true,
    showMarkAsRead = true,
    showDeleteButton = true,
    onMarkAsRead,
    onDelete,
    onClick,
    className,
}: NotificationCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [isRead, setIsRead] = useState(notification.read || false);
    const isGrid = viewMode === "grid";
    const isList = viewMode === "list";
    const isCompact = viewMode === "compact";

    const typeConfig = {
        info: {
            label: "Information",
            color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
            icon: Info
        },
        success: {
            label: "Succès",
            color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
            icon: CheckCircle
        },
        warning: {
            label: "Avertissement",
            color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
            icon: AlertCircle
        },
        error: {
            label: "Erreur",
            color: "bg-red-500/10 text-red-600 border-red-500/20",
            icon: XCircle
        },
        system: {
            label: "Système",
            color: "bg-purple-500/10 text-purple-600 border-purple-500/20",
            icon: Shield
        },
    };

    const entityIcons = {
        PRODUCT: ShoppingBag,
        POST: MessageSquare,
        TOURNAMENT: Trophy,
        USER: Users,
        SHOP: Store,
        BLOG: FileText,
        MATCH: Target,
        TEAM: Users,
        MESSAGE: Mail,
        ORDER: Package,
        TRANSACTION: CreditCard,
        GAME: Gamepad2,
        ANNOUNCEMENT: Bell,
        SERVICE: Settings,
        GUIDE: BookOpen,
        COMMENT: MessageSquare,
        GAME_ITEM: Gift,
        GROUP: Users,
        THEME: Palette,
        NEWS: Newspaper,
        PARTNER: Handshake,
        EDITION: Star,
    };

    const handleMarkAsRead = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsRead(true);
        if (onMarkAsRead) {
            onMarkAsRead(notification.id);
        }
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onDelete) {
            onDelete(notification.id);
        }
    };

    const handleClick = () => {
        if (onClick) {
            onClick(notification.id);
        }
    };

    const formatTimeAgo = (date: Date) => {
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return "À l'instant";
        if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
        if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)} h`;
        if (diffInSeconds < 604800) return `Il y a ${Math.floor(diffInSeconds / 86400)} j`;

        return date.toLocaleDateString("fr-FR");
    };

    // Render sender avatar
    const renderAvatar = () => {
        const sender = notification.sender;
        if (!sender?.profileImage) {
            return (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary/60" />
                </div>
            );
        }

        return (
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-primary/10 to-primary/20">
                <img
                    src={sender.profileImage}
                    alt={sender.username || "Utilisateur"}
                    width={40}
                    height={40}
                    className="object-cover w-full h-full"
                />
            </div>
        );
    };

    // Render entity image
    const renderEntityImage = () => {
        const entity = notification.relatedEntity;
        if (!entity?.image) {
            const IconComponent = entityIcons[entity?.type as keyof typeof entityIcons] || Bell;
            return (
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center">
                    <IconComponent className="w-6 h-6 text-primary/60" />
                </div>
            );
        }

        return (
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-primary/20">
                <img
                    src={entity.image}
                    alt={entity.title || "Image"}
                    width={48}
                    height={48}
                    className="object-cover w-full h-full"
                />
            </div>
        );
    };

    // Render content based on view mode
    const renderContent = () => {
        if (isCompact) {
            return (
                <div className="flex items-center gap-3">
                    {renderAvatar()}
                    <div className="flex-1 min-w-0">
                        <Typography variant="body-sm" weight="semibold" className="truncate">
                            {notification.title}
                        </Typography>
                        <div className="flex items-center gap-2 mt-1">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <Typography variant="caption1" theme="muted">
                                {formatTimeAgo(new Date(notification.createdAt || Date.now()))}
                            </Typography>
                        </div>
                    </div>
                    {!isRead && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                </div>
            );
        }

        return (
            <div className="space-y-3">
                {/* Header with type badge and time */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Badge
                            variant="outline"
                            className={cn(
                                "text-xs",
                                typeConfig[notification.type as NotificationType]?.color || typeConfig.info.color
                            )}
                        >
                            {React.createElement(
                                typeConfig[notification.type as NotificationType]?.icon || Info,
                                { className: "w-3 h-3 mr-1" }
                            )}
                            {typeConfig[notification.type as NotificationType]?.label || "Information"}
                        </Badge>
                        {!isRead && (
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        )}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <Typography variant="caption1">
                            {formatTimeAgo(new Date(notification.createdAt || Date.now()))}
                        </Typography>
                    </div>
                </div>

                {/* Sender and title */}
                <div className="flex items-start gap-3">
                    {renderAvatar()}
                    <div className="flex-1 min-w-0">
                        <Typography variant="body-base" weight="semibold" className="line-clamp-2">
                            {notification.title}
                        </Typography>
                        {showDetails && notification.message && (
                            <Typography
                                variant="body-sm"
                                theme="muted"
                                className="line-clamp-3 mt-1 leading-relaxed"
                            >
                                {notification.message}
                            </Typography>
                        )}
                    </div>
                    {notification.relatedEntity && renderEntityImage()}
                </div>

                {/* Actions */}
                {showActions && (
                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
                        <div className="flex items-center gap-2">
                            {notification.sender && (
                                <Typography variant="caption1" theme="muted">
                                    De: {notification.sender.fullName || notification.sender.username}
                                </Typography>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {showMarkAsRead && !isRead && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={handleMarkAsRead}
                                    className="h-7 px-2"
                                >
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Marquer comme lu
                                </Button>
                            )}
                            {showDeleteButton && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={handleDelete}
                                    className="h-7 px-2 text-destructive hover:text-destructive"
                                >
                                    <XCircle className="w-3 h-3" />
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Render based on view mode
    if (isGrid) {
        return (
            <motion.div
                whileHover={{ y: -2 }}
                className="h-full"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <Card
                    className={cn(
                        "group cursor-pointer h-full overflow-hidden transition-all hover:shadow-lg border-border/50",
                        !isRead && "border-primary/50 bg-primary/5",
                        className
                    )}
                    onClick={handleClick}
                >
                    <CardContent className="p-4 space-y-4">
                        {renderContent()}
                    </CardContent>
                </Card>
            </motion.div>
        );
    }

    if (isList) {
        return (
            <Card
                className={cn(
                    "group cursor-pointer transition-all hover:shadow-md",
                    !isRead && "border-primary/50 bg-primary/5",
                    className
                )}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={handleClick}
            >
                <CardContent className="p-4">
                    {renderContent()}
                </CardContent>
            </Card>
        );
    }

    // Compact mode
    return (
        <Card
            className={cn(
                "cursor-pointer hover:shadow-sm",
                !isRead && "border-primary/50 bg-primary/5",
                className
            )}
            onClick={handleClick}
        >
            <CardContent className="p-3">
                {renderContent()}
            </CardContent>
        </Card>
    );
}
