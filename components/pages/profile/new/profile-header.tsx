"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { UserWithAllRelations } from "@/actions/users";
import { ProfileAvatar } from "./profile-avatar";
import { ProfileStats } from "./profile-stats";
import { ProfileActions } from "./profile-actions";
import { ProfileCover } from "./profile-cover";
import { useScreenSize } from "@/hooks/use-screen";
import { Typography } from "@/components/ui/typography";

interface ProfileHeaderProps {
  user: UserWithAllRelations;
  isOwnProfile?: boolean;
  profileCompletion?: number;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  className?: string;
  onTabChange?: (tab: string) => void;
  onUpdateCover?: (url: string) => Promise<void>;
  onUpdateAvatar?: (url: string) => Promise<void>;
}

export function ProfileHeader({
  user,
  isOwnProfile = false,
  profileCompletion = 0,
  followersCount = 0,
  followingCount = 0,
  postsCount = 0,
  className,
  onTabChange,
  onUpdateCover,
  onUpdateAvatar,
}: ProfileHeaderProps) {
  const { isMobile } = useScreenSize();

  return (
    <motion.div
      className={cn("space-y-4", className)}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Cover */}
      <ProfileCover
        src={user.coverImage}
        isOwnProfile={isOwnProfile}
        onUpload={onUpdateCover}
        height={isMobile ? 200 : 300}
      />

      {/* Avatar, Name, Actions row */}
      <div className="relative px-4 sm:px-4 lg:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          {/* Avatar */}
          <ProfileAvatar
            src={user.image}
            username={user.username || user.fullName || "utilisateur"}
            isOwnProfile={isOwnProfile}
            profileCompletion={profileCompletion}
            onUpload={onUpdateAvatar}
            className="-mt-16 sm:-mt-20 z-10"
            size={isMobile ? "md" : "lg"}
          />

          {/* Name + Username + Actions */}
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-col">
              <Typography variant="h3" weight="bold">
                {user.fullName || user.username || "Utilisateur"}
              </Typography>
              {user.username && (
                <Typography variant="body-sm" theme="muted">
                  @{user.username}
                </Typography>
              )}
            </div>

            {/* Actions */}
            <ProfileActions
              userId={user.id}
              isOwnProfile={isOwnProfile}
              profileCompletion={profileCompletion}
              hasPasskey={user.hasPasskey ?? false}
            />
          </div>
        </div>

        {/* Stats */}
        <ProfileStats
          followersCount={followersCount}
          followingCount={followingCount}
          postsCount={postsCount}
          className="mt-4"
          userId={user.id}
          isOwnProfile={isOwnProfile}
          onTabChange={onTabChange}
        />
      </div>
    </motion.div>
  );
}