"use client";

import { useState, useEffect } from "react";
import { useAuthContext } from "@/contexts/auth-context";
// import { ProfileHeader } from "@/components/profile/profile-header";
// import { ProfileTabs } from "@/components/profile/profile-tabs";
import { motion } from "framer-motion";
import { useUserProfile } from "@/hooks/use-profile";
import { Skeleton } from "@/components/ui/skeleton";
import { PasskeyRecommendation } from "@/components/auth/passkey-recommendation";
import { useEntityInteractionCounts } from "@/hooks/use-interactions";
import { ProfileHeader } from "@/components/pages/profile/new/profile-header";
import { ProfileTabs } from "@/components/pages/profile/new/profile-tabs";

export default function ProfilePage() {
  const { user: authUser } = useAuthContext();
  const { data: profile, loading, refresh } = useUserProfile({
    mode: "full",
  });
  const [showPasskeyPrompt, setShowPasskeyPrompt] = useState(false);

  const { data: counts } = useEntityInteractionCounts(
    profile?.id || "",
    "USER"
  );

  // Calculer le pourcentage de complétion du profil
  const calculateProfileCompletion = () => {
    if (!profile) return 0;

    const fields = [
      profile.fullName,
      profile.bio,
      profile.image || profile.profileImage,
      profile.coverImage || "/images/default-cover.jpg",
      profile.website,
      profile.socialMedia && Array.isArray(profile.socialMedia) && profile.socialMedia.length > 0,
      profile.country,
    ];

    const completed = fields.filter(Boolean).length;
    return Math.round((completed / fields.length) * 100);
  };

  const profileCompletion = calculateProfileCompletion();

  useEffect(() => {
    // Vérifier si l'utilisateur a des passkeys
    const checkPasskeys = async () => {
      // Logique pour vérifier les passkeys
      const hasPasskeys = false; // À implémenter
      setShowPasskeyPrompt(!hasPasskeys && profileCompletion > 50);
    };
    checkPasskeys();
  }, [profileCompletion]);

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

      {/* Main content */}
      <div className="mx-auto p-4">
        <ProfileHeader
          user={profile}
          isOwnProfile
          profileCompletion={profileCompletion}
          followersCount={counts?.FOLLOW || 0}
          followingCount={0} // À implémenter
          postsCount={profile.posts?.length || 0}
          onUpdateCover={async (url) => {
            // Logique de mise à jour
            await refresh();
          }}
          onUpdateAvatar={async (url) => {
            // Logique de mise à jour
            await refresh();
          }}
        />

        <ProfileTabs
          userId={profile.id}
          isOwnProfile
          className="mt-6"
        />

              {/* Passkey recommendation banner */}
      {showPasskeyPrompt && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="container mx-auto px-4 pt-4"
        >
          <PasskeyRecommendation onDismiss={() => setShowPasskeyPrompt(false)} />
        </motion.div>
      )}
      </div>
    </div>
  );
}

// "use client";

// import { useState } from "react";
// import { useAuthContext } from "@/contexts/auth-context";
// import { ProfileHeader } from "@/components/pages/profile/profile-header";
// import { FollowersList } from "@/components/pages/profile/followers-list";
// import { FollowingList } from "@/components/pages/profile/following-list";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Typography } from "@/components/ui/typography";
// import { motion } from "framer-motion";
// import { Users, UserPlus } from "lucide-react";
// import { useEntityInteractionCounts } from "@/hooks/use-interactions";

// export default function ProfilePage() {
//   const { user } = useAuthContext();
//   const [activeTab, setActiveTab] = useState("followers");

//   // Get followers and following counts
//   const { data: counts } = useEntityInteractionCounts(user?.id || "", "USER");
//   const followersCount = counts?.FOLLOW || 0;

//   // For following count, we'd need a different query
//   // For now using a placeholder
//   const followingCount = 0;

//   if (!user) {
//     return (
//       <div className="container mx-auto px-4 py-8">
//         <Typography variant="h3" theme="muted" className="text-center">
//           Veuillez vous connecter pour voir votre profil
//         </Typography>
//       </div>
//     );
//   }

//   return (
//     <div className="container mx-auto p-3 space-y-6">
//       {/* Header */}
//       <motion.div
//         initial={{ opacity: 0, y: -20 }}
//         animate={{ opacity: 1, y: 0 }}
//       >
//         <Typography variant="h1" weight="bold" className="mb-2">
//           Mon Profil
//         </Typography>
//         <Typography variant="body-base" theme="muted">
//           Gérez votre profil et vos abonnements
//         </Typography>
//       </motion.div>

//       {/* Profile Header */}
//       <ProfileHeader
//         user={user}
//         isOwnProfile={true}
//         followersCount={followersCount}
//         followingCount={followingCount}
//       />

//       {/* Tabs for Followers/Following */}
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ delay: 0.2 }}
//       >
//         <Tabs
//           value={activeTab}
//           onValueChange={setActiveTab}
//           className="space-y-6"
//         >
//           <TabsList className="grid w-full max-w-md grid-cols-2">
//             <TabsTrigger value="followers" className="gap-2">
//               <Users className="h-4 w-4" />
//               Abonnés
//               {followersCount > 0 && (
//                 <span className="ml-1 text-xs bg-primary/20 px-2 py-0.5 rounded-full">
//                   {followersCount}
//                 </span>
//               )}
//             </TabsTrigger>
//             <TabsTrigger value="following" className="gap-2">
//               <UserPlus className="h-4 w-4" />
//               Abonnements
//               {followingCount > 0 && (
//                 <span className="ml-1 text-xs bg-primary/20 px-2 py-0.5 rounded-full">
//                   {followingCount}
//                 </span>
//               )}
//             </TabsTrigger>
//           </TabsList>

//           <TabsContent value="followers" className="space-y-4">
//             <FollowersList userId={user.id} currentUserId={user.id} />
//           </TabsContent>

//           <TabsContent value="following" className="space-y-4">
//             <FollowingList userId={user.id} currentUserId={user.id} />
//           </TabsContent>
//         </Tabs>
//       </motion.div>
//     </div>
//   );
// }
