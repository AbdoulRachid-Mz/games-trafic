"use client";

import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { InteractionButton } from "@/components/shared/interaction-button";
import { User as UserIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useEntityInteractionsWithRelations } from "@/hooks/use-interactions";
import type { InteractionWithRelations } from "@/database/schema";

interface FollowersListProps {
  userId: string;
  currentUserId?: string;
}

export function FollowersList({ userId, currentUserId }: FollowersListProps) {
  const { data: followers = [], isLoading } = useEntityInteractionsWithRelations(
    userId,
    "USER",
    { types: ["FOLLOW"] },
    { populate: ["user"] }
  );

  if (isLoading) {
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

  if (followers.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <UserIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <Typography variant="body-lg" theme="muted">
            Aucun abonné pour le moment
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {followers.map((interaction: InteractionWithRelations, index) => {
        // The user who follows is in interaction.user (populated by getEntityInteractionsWithRelations)
        const follower = interaction.user;

        if (!follower) return null;

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
                      src={follower.image || ""}
                      alt={follower.username + " avatar"}
                    />
                    <AvatarFallback>
                      <UserIcon className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <Typography variant="body-base" weight="semibold">
                      {follower.username}
                    </Typography>
                    {follower.fullName && (
                      <Typography variant="caption2" theme="muted">
                        {follower.fullName}
                      </Typography>
                    )}
                  </div>

                  {currentUserId && currentUserId !== follower.id && (
                    <InteractionButton
                      type="follow"
                      entityType="USER"
                      entityId={follower.id}
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
