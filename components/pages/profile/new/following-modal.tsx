"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Typography } from "@/components/ui/typography";
import { InteractionButton } from "@/components/shared/interaction-button";
import { User, UserPlus, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getUserInteractions } from "@/actions/interactions";
import { getUserById } from "@/actions/users";
import type { Interaction, User as UserType } from "@/database/schema";

interface FollowingModalProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isOwnProfile?: boolean;
}

interface FollowingWithUser {
  interaction: Interaction;
  user: UserType | null;
}

export function FollowingModal({
  userId,
  open,
  onOpenChange,
  isOwnProfile,
}: FollowingModalProps) {
  const [following, setFollowing] = useState<FollowingWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (open) {
      loadFollowing();
    }
  }, [userId, open]);

  const loadFollowing = async () => {
    setLoading(true);
    try {
      const interactions = await getUserInteractions(
        userId,
        { types: ["FOLLOW"] },
        { includeDeleted: false }
      );

      const userFollowing = interactions.filter(
        (int) => int.entityType === "USER"
      );

      const followingWithUsers = await Promise.all(
        userFollowing.map(async (interaction) => {
          try {
            const user = await getUserById(interaction.entityId);
            return { interaction, user };
          } catch {
            return { interaction, user: null };
          }
        })
      );

      setFollowing(followingWithUsers.filter((f) => f.user !== null));
    } catch (error) {
      console.error("Error loading following:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFollowing = following.filter((f) => {
    if (!f.user) return false;
    const usernameMatch = f.user.username?.toLowerCase().includes(search.toLowerCase());
    const fullNameMatch = f.user.fullName?.toLowerCase().includes(search.toLowerCase());
    return usernameMatch || fullNameMatch;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Abonnements
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({following.length})
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="px-6 pb-4">
          <Input
            placeholder="Rechercher un abonnement..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
        </div>

        <ScrollArea className="h-[400px] px-6">
          <AnimatePresence mode="wait">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredFollowing.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center justify-center h-32 text-center"
              >
                <User className="h-12 w-12 text-muted-foreground mb-2" />
                <Typography variant="body-sm" theme="muted">
                  {search ? "Aucun résultat" : "Aucun abonnement pour le moment"}
                </Typography>
              </motion.div>
            ) : (
              <div className="space-y-2 pb-6">
                {filteredFollowing.map(({ interaction, user }, index) => {
                  if (!user) return null;

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
                        <AvatarImage src={user.image || ""} />
                        <AvatarFallback>
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <Typography variant="body-sm" weight="semibold" className="truncate">
                          {user.username}
                        </Typography>
                        {user.fullName && (
                          <Typography variant="caption2" theme="muted" className="truncate">
                            {user.fullName}
                          </Typography>
                        )}
                      </div>

                      {!isOwnProfile && (
                        <InteractionButton
                          type="follow"
                          entityType="USER"
                          entityId={user.id}
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