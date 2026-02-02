"use client";

import { useState, useEffect } from "react";
import { useAuthContext } from "@/contexts/auth-context";
import { ProfileHeader } from "@/components/pages/profile/profile-header";
import { FollowersList } from "@/components/pages/profile/followers-list";
import { FollowingList } from "@/components/pages/profile/following-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Typography } from "@/components/ui/typography";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Users, UserPlus } from "lucide-react";
import { useEntityInteractionCounts } from "@/hooks/use-interactions";
import { getUserById } from "@/actions/users";
import { notFound } from "next/navigation";
import type { User } from "@/database/schema";

export default function UserProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const { user: currentUser } = useAuthContext();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("followers");

  // Get followers count
  const { data: counts } = useEntityInteractionCounts(params.id, "USER");
  const followersCount = counts?.FOLLOW || 0;
  const followingCount = 0; // Placeholder

  useEffect(() => {
    loadUser();
  }, [params.id]);

  const loadUser = async () => {
    try {
      const user = await getUserById(params.id);
      if (!user) {
        notFound();
      }
      setProfileUser(user);
    } catch (error) {
      console.error("Error loading user:", error);
      notFound();
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!profileUser) {
    return null;
  }

  const isOwnProfile = currentUser?.id === profileUser.id;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Typography variant="h1" weight="bold" className="mb-2">
          {isOwnProfile ? "Mon Profil" : `Profil de ${profileUser.username}`}
        </Typography>
        <Typography variant="body-base" theme="muted">
          {isOwnProfile
            ? "Gérez votre profil et vos abonnements"
            : "Consultez le profil de cet utilisateur"}
        </Typography>
      </motion.div>

      {/* Profile Header */}
      <ProfileHeader
        user={profileUser}
        isOwnProfile={isOwnProfile}
        followersCount={followersCount}
        followingCount={followingCount}
      />

      {/* Tabs for Followers/Following */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="followers" className="gap-2">
              <Users className="h-4 w-4" />
              Abonnés
              {followersCount > 0 && (
                <span className="ml-1 text-xs bg-primary/20 px-2 py-0.5 rounded-full">
                  {followersCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="following" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Abonnements
              {followingCount > 0 && (
                <span className="ml-1 text-xs bg-primary/20 px-2 py-0.5 rounded-full">
                  {followingCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="followers" className="space-y-4">
            <FollowersList
              userId={profileUser.id}
              currentUserId={currentUser?.id}
            />
          </TabsContent>

          <TabsContent value="following" className="space-y-4">
            <FollowingList
              userId={profileUser.id}
              currentUserId={currentUser?.id}
            />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
