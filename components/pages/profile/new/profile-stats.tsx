"use client";

import { motion } from "framer-motion";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, FileText } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { FollowersModal } from "./followers-modal";
import { FollowingModal } from "./following-modal";

interface ProfileStatsProps {
  followersCount: number;
  followingCount: number;
  postsCount: number;
  userId: string;
  isOwnProfile?: boolean;
  className?: string;
}

export function ProfileStats({
  followersCount,
  followingCount,
  postsCount,
  userId,
  isOwnProfile,
  className,
}: ProfileStatsProps) {
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  const stats = [
    {
      label: "Publications",
      value: postsCount,
      icon: FileText,
      onClick: undefined,
    },
    {
      label: "Abonnés",
      value: followersCount,
      icon: Users,
      onClick: () => setShowFollowers(true),
    },
    {
      label: "Abonnements",
      value: followingCount,
      icon: UserPlus,
      onClick: () => setShowFollowing(true),
    },
  ];

  return (
    <>
      <motion.div
        className={cn("flex items-center gap-6", className)}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            whileHover={stat.onClick ? { scale: 1.05 } : {}}
            whileTap={stat.onClick ? { scale: 0.95 } : {}}
          >
            <Button
              variant="ghost"
              className={cn(
                "h-auto p-3 flex-col items-center gap-1",
                !stat.onClick && "cursor-default hover:bg-transparent"
              )}
              onClick={stat.onClick}
              disabled={!stat.onClick}
            >
              <div className="flex items-center gap-2">
                <stat.icon className="h-4 w-4 text-muted-foreground" />
                <Typography variant="h5" weight="bold" gradient>
                  {stat.value.toLocaleString()}
                </Typography>
              </div>
              <Typography variant="caption2" theme="muted">
                {stat.label}
              </Typography>
            </Button>
          </motion.div>
        ))}
      </motion.div>

      {/* Modals */}
      <FollowersModal
        userId={userId}
        open={showFollowers}
        onOpenChange={setShowFollowers}
        isOwnProfile={isOwnProfile}
      />

      <FollowingModal
        userId={userId}
        open={showFollowing}
        onOpenChange={setShowFollowing}
        isOwnProfile={isOwnProfile}
      />
    </>
  );
}