"use client";

import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { User, MapPin, Calendar, Link as LinkIcon, Edit } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { InteractionButton } from "@/components/shared/interaction-button";
import type { User as UserType } from "@/database/schema";

interface ProfileHeaderProps {
  user: UserType;
  isOwnProfile: boolean;
  followersCount: number;
  followingCount: number;
  postsCount?: number;
}

export function ProfileHeader({
  user,
  isOwnProfile,
  followersCount,
  followingCount,
  postsCount = 0,
}: ProfileHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card className="border-2">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Avatar */}
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Avatar className="h-32 w-32 border-4 border-primary/20">
                <AvatarImage src={user.image || ""} alt={user.username + " avatar"} />
                <AvatarFallback className="text-4xl">
                  <User className="h-16 w-16" />
                </AvatarFallback>
              </Avatar>
            </motion.div>

            {/* Info */}
            <div className="flex-1 space-y-4">
              {/* Name & Actions */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <Typography variant="h2" weight="bold" className="mb-1">
                    {user.username}
                  </Typography>
                  {user.fullName && (
                    <Typography variant="body-base" theme="muted">
                      {user.fullName}
                    </Typography>
                  )}
                </div>

                <div className="flex gap-2">
                  {isOwnProfile ? (
                    <Button className="gap-2">
                      <Edit className="h-4 w-4" />
                      Modifier le profil
                    </Button>
                  ) : (
                    <InteractionButton
                      type="follow"
                      entityType="USER"
                      entityId={user.id}
                      variant="default"
                      size="md"
                    >
                      Suivre
                    </InteractionButton>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-6">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="text-center cursor-pointer"
                >
                  <Typography variant="h4" weight="bold" gradient>
                    {postsCount}
                  </Typography>
                  <Typography variant="caption2" theme="muted">
                    Publications
                  </Typography>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="text-center cursor-pointer"
                >
                  <Typography variant="h4" weight="bold" gradient>
                    {followersCount}
                  </Typography>
                  <Typography variant="caption2" theme="muted">
                    Abonnés
                  </Typography>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="text-center cursor-pointer"
                >
                  <Typography variant="h4" weight="bold" gradient>
                    {followingCount}
                  </Typography>
                  <Typography variant="caption2" theme="muted">
                    Abonnements
                  </Typography>
                </motion.div>
              </div>

              {/* Bio */}
              {user.bio && (
                <Typography variant="body-base" className="max-w-2xl">
                  {user.bio}
                </Typography>
              )}

              {/* Meta Info */}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {/* {user.address. && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {user.address}
                  </div>
                )} */}

                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Inscrit le {formatDate(user.createdAt)}
                </div>

                {user.website && (
                  <a
                    href={user.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    <LinkIcon className="h-4 w-4" />
                    Site web
                  </a>
                )}
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {user.emailVerified && (
                  <Badge variant="default" className="gap-1">
                    ✓ Vérifié
                  </Badge>
                )}
                {user.accountTypes && (
                  <Badge variant="secondary">{user.accountTypes}</Badge>
                )}
                {user.level && (
                  <Badge variant="outline">Niveau {user.level}</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
