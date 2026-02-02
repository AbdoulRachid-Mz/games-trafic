"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { InteractionButton } from "@/components/shared/interaction-button";
import { User as UserIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserInteractions } from "@/actions/interactions";
import { getUserById } from "@/actions/users";
import type { Interaction, User } from "@/database/schema";

interface FollowingListProps {
  userId: string;
  currentUserId?: string;
}

interface FollowingWithUser {
  interaction: Interaction;
  user: User | null;
}

export function FollowingList({ userId, currentUserId }: FollowingListProps) {
  const [following, setFollowing] = useState<FollowingWithUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFollowing();
  }, [userId]);

  const loadFollowing = async () => {
    try {
      // Get interactions where this user is following others
      const interactions = await getUserInteractions(
        userId,
        { types: ["FOLLOW"] },
        { includeDeleted: false },
      );

      // Filter for USER entity type and fetch user data
      const userFollowing = interactions.filter(
        (int) => int.entityType === "USER",
      );

      // Fetch user data for each following
      const followingWithUsers = await Promise.all(
        userFollowing.map(async (interaction) => {
          try {
            const user = await getUserById(interaction.entityId);
            return { interaction, user };
          } catch {
            return { interaction, user: null };
          }
        }),
      );

      setFollowing(followingWithUsers.filter((f) => f.user !== null));
    } catch (error) {
      console.error("Error loading following:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-9 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (following.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <UserIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <Typography variant="body-lg" theme="muted">
            Aucun abonnement pour le moment
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {following.map(({ interaction, user }, index) => {
        if (!user) return null;

        return (
          <motion.div
            key={interaction.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={user.image || ""}
                      alt={user.username + " avatar"}
                    />
                    <AvatarFallback>
                      <UserIcon className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <Typography variant="body-base" weight="semibold">
                      {user.username}
                    </Typography>
                    {user.fullName && (
                      <Typography variant="caption2" theme="muted">
                        {user.fullName}
                      </Typography>
                    )}
                  </div>

                  {currentUserId && currentUserId !== user.id && (
                    <InteractionButton
                      type="follow"
                      entityType="USER"
                      entityId={user.id}
                      variant="outline"
                      size="sm"
                    >
                      Suivre
                    </InteractionButton>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
