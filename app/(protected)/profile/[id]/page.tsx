"use client";

import { useEffect, useState } from "react";
import { useAuthContext } from "@/contexts/auth-context";
import { ProfileHeader } from "@/components/pages/profile/new/profile-header";
import { ProfileTabs } from "@/components/pages/profile/new/profile-tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserProfile } from "@/actions/users";
import { useEntityInteractionCounts } from "@/hooks/use-interactions";
import { notFound, useParams } from "next/navigation";
import type { UserWithAllRelations } from "@/actions/users";

export default function PublicProfilePage() {
  const { user: currentUser } = useAuthContext();
  const [profile, setProfile] = useState<UserWithAllRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();

  if (!id) {
    notFound();
  }

  const { data: counts } = useEntityInteractionCounts(id as string, "USER");

  useEffect(() => {
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    try {
      const user = await getUserProfile(id as string);
      if (!user) {
        notFound();
      }
      setProfile(user);
    } catch (error) {
      console.error("Error loading profile:", error);
      notFound();
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8">
        <Skeleton className="h-[300px] w-full rounded-xl" />
        <Skeleton className="h-32 w-32 rounded-full mx-auto" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-64 mx-auto" />
          <Skeleton className="h-4 w-96 mx-auto" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto p-4">
        <ProfileHeader
          user={profile}
          isOwnProfile={isOwnProfile}
          followersCount={counts?.FOLLOW || 0}
          followingCount={0}
          postsCount={profile.posts?.length || 0}
        />

        <ProfileTabs
          profileUser={profile}
          isOwnProfile={isOwnProfile}
          className="mt-6"
        />
      </div>
    </div>
  );
}
