"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { UserWithAllRelations } from "@/actions/users";
import { ProfileAvatar } from "./profile-avatar";
import { ProfileStats } from "./profile-stats";
import { ProfileInfo } from "./profile-info";
import { ProfileActions } from "./profile-actions";
import { ProfileCover } from "./profile-cover";
import { useScreenSize } from "@/hooks/use-screen";

interface ProfileHeaderProps {
  user: UserWithAllRelations;
  isOwnProfile?: boolean;
  profileCompletion?: number;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  className?: string;
  onUpdateCover?: (url: string) => Promise<void>;
  onUpdateAvatar?: (url: string) => Promise<void>;
  onUpdateInfo?: (data: Partial<UserWithAllRelations>) => Promise<void>;
}

export function ProfileHeader({
  user,
  isOwnProfile = false,
  profileCompletion = 0,
  followersCount = 0,
  followingCount = 0,
  postsCount = 0,
  className,
  onUpdateCover,
  onUpdateAvatar,
  onUpdateInfo,
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

      {/* Avatar and actions row */}
      <div className="relative px-4 sm:px-4 lg:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          {/* Avatar */}
          <ProfileAvatar
            src={user.image}
            username={user.username || user.fullName || 'utilisateur' }
            isOwnProfile={isOwnProfile}
            profileCompletion={profileCompletion}
            onUpload={onUpdateAvatar}
            className="-mt-16 sm:-mt-20 z-10"
            size={isMobile ? "md" : "lg"}
          />

          {/* Actions */}
          <div className="flex-1 flex justify-end pb-2">
            <ProfileActions
              userId={user.id}
              isOwnProfile={isOwnProfile}
              profileCompletion={profileCompletion}
            />
          </div>
        </div>

        {/* Info section */}
        <ProfileInfo
          user={user}
          isOwnProfile={isOwnProfile}
          onUpdate={onUpdateInfo}
          className="mt-4"
        />

        {/* Stats */}
        <ProfileStats
          followersCount={followersCount}
          followingCount={followingCount}
          postsCount={postsCount}
          className="mt-6"
          userId={user.id}
          isOwnProfile={isOwnProfile}
        />
      </div>
    </motion.div>
  );
}