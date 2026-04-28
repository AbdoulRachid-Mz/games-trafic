"use client";

import { useAuthContext } from "@/contexts/auth-context";
import { useUserProfile } from "@/hooks/use-profile";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfileCompletion } from "@/hooks/use-profile-completion";
import { useEntityInteractionCounts, useInteractionStats } from "@/hooks/use-interactions";
import { ProfileHeader } from "@/components/pages/profile/new/profile-header";
import { ProfileTabs } from "@/components/pages/profile/new/profile-tabs";

export default function ProfilePage() {
  const { user: authUser } = useAuthContext();
  const { data: profile, loading, refresh } = useUserProfile({
    mode: "minimal",
  });

  const profileCompletion = useProfileCompletion(profile);

  const { data: counts } = useEntityInteractionCounts(
    profile?.id || "",
    "USER"
  );

  const { data: stats } = useInteractionStats({
    userId: profile?.id || "",
  });

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
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground">Profil non trouvé</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto p-4">
        <ProfileHeader
          user={profile}
          isOwnProfile
          profileCompletion={profileCompletion}
          followersCount={counts?.FOLLOW || 0}
          followingCount={stats?.follows || 0}
          postsCount={profile.posts?.length || 0}
          onUpdateCover={async () => {
            await refresh();
          }}
          onUpdateAvatar={async () => {
            await refresh();
          }}
        />

        <ProfileTabs
          profileUser={profile}
          isOwnProfile
          className="mt-6"
        />
      </div>
    </div>
  );
}
