"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Typography } from "@/components/ui/typography";
import { InteractionButton } from "@/components/shared/interaction-button";
import { User, Users, Loader2 } from "lucide-react";
import { useEntityInteractionsWithRelations } from "@/hooks/use-interactions";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface FollowersModalProps {
    userId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    isOwnProfile?: boolean;
}

export function FollowersModal({
    userId,
    open,
    onOpenChange,
    isOwnProfile,
}: FollowersModalProps) {
    const [search, setSearch] = useState("");

    const { data: followers = [], isLoading } = useEntityInteractionsWithRelations(
        userId,
        "USER",
        { types: ["FOLLOW"] },
        { page: 1, limit: 50 },
        { populate: ["user"] }
    );

    const filteredFollowers = followers.filter((f) =>
        f.user?.username?.toLowerCase().includes(search.toLowerCase()) ||
        f.user?.fullName?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] p-0">
                <DialogHeader className="p-6 pb-4">
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Abonnés
                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                            ({followers.length})
                        </span>
                    </DialogTitle>
                </DialogHeader>

                {/* Search */}
                <div className="px-6 pb-4">
                    <Input
                        placeholder="Rechercher un abonné..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full"
                    />
                </div>

                <ScrollArea className="h-[400px] px-6">
                    <AnimatePresence mode="wait">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-32">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : filteredFollowers.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="flex flex-col items-center justify-center h-32 text-center"
                            >
                                <User className="h-12 w-12 text-muted-foreground mb-2" />
                                <Typography variant="body-sm" theme="muted">
                                    {search ? "Aucun résultat" : "Aucun abonné pour le moment"}
                                </Typography>
                            </motion.div>
                        ) : (
                            <div className="space-y-2 pb-6">
                                {filteredFollowers.map((interaction, index) => {
                                    const follower = interaction.user;
                                    if (!follower) return null;

                                    return (
                                        <motion.div
                                            key={interaction.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            transition={{ delay: index * 0.05 }}
                                            className={cn(
                                                "flex items-center gap-3 p-3 rounded-lg",
                                                "hover:bg-muted/50 transition-colors"
                                            )}
                                        >
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={follower.profileImage || ""} />
                                                <AvatarFallback>
                                                    <User className="h-5 w-5" />
                                                </AvatarFallback>
                                            </Avatar>

                                            <div className="flex-1 min-w-0">
                                                <Typography variant="body-sm" weight="semibold" className="truncate">
                                                    {follower.username}
                                                </Typography>
                                                {follower.fullName && (
                                                    <Typography variant="caption2" theme="muted" className="truncate">
                                                        {follower.fullName}
                                                    </Typography>
                                                )}
                                            </div>

                                            {!isOwnProfile && (
                                                <InteractionButton
                                                    type="follow"
                                                    entityType="USER"
                                                    entityId={follower.id}
                                                    variant="ghost"
                                                    size="sm"
                                                    iconOnly
                                                />
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </AnimatePresence>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}