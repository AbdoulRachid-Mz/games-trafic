"use client";

import { motion } from "framer-motion";
import { Users, UserPlus, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import {StatsCarousel} from "@/components/shared/stats-carousel";

interface ProfileStatsProps {
  followersCount: number;
  followingCount: number;
  postsCount: number;
  userId: string;
  isOwnProfile?: boolean;
  className?: string;
  onTabChange?: (tab: string) => void;
}

export function ProfileStats({
  followersCount,
  followingCount,
  postsCount,
  userId,
  isOwnProfile,
  className,
  onTabChange,
}: ProfileStatsProps) {
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
      onClick: () => onTabChange?.("followers"),
    },
    {
      label: "Abonnements",
      value: followingCount,
      icon: UserPlus,
      onClick: () => onTabChange?.("following"),
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
        <StatsCarousel
          data={stats.map((stat) => ({
            title: stat.label,
            value: stat.value.toLocaleString(),
            icon: <stat.icon className="w-5 h-5" />,
            onClick: stat.onClick,
            className: cn(
              "h-auto p-2 flex-col items-center gap-1",
              !stat.onClick && "cursor-default hover:bg-transparent"
            ),
          }))}
          mode="auto"
          itemsPerView={{ mobile: 1, md: 2, lg: 3, xl: 3 }}
          gap={12}
          withNavButtons={false}
          dragFree={true}
          loop={false}
          showScrollbar={false}
        />
      </motion.div>
    </>
  );
}
