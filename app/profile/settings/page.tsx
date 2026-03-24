"use client";

import { useState } from "react";
import { useAuthContext } from "@/contexts/auth-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { Typography } from "@/components/ui/typography";
import { Progress } from "@/components/ui/progress";
import {
  User,
  Link2,
  Image,
  Shield,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useUserProfile } from "@/hooks/use-profile";
import { Skeleton } from "@/components/ui/skeleton";
import { ImagesForm } from "@/components/pages/profile/new/profile-settings/images-form";
import { PersonalInfoForm } from "@/components/pages/profile/new/profile-settings/personal-info-form";
import { SecurityForm } from "@/components/pages/profile/new/profile-settings/security-form";
import { SocialLinksForm } from "@/components/pages/profile/new/profile-settings/social-links-form";

export default function ProfileSettingsPage() {
  const { user } = useAuthContext();
  const { data: profile, loading, refresh } = useUserProfile({
    mode: "full",
  });
  const [activeTab, setActiveTab] = useState("personal");

  // Calculer la progression
  const calculateCompletion = () => {
    if (!profile) return 0;

    const fields = [
      profile.fullName,
      profile.bio,
      profile.image,
      profile.coverImage,
      profile.website,
      profile.socialMedia && Array.isArray(profile.socialMedia) && profile.socialMedia.length > 0,
      profile.country,
      profile.phoneNumber,
    ];

    const completed = fields.filter(Boolean).length;
    return Math.round((completed / fields.length) * 100);
  };

  const completion = calculateCompletion();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-12 w-64 mb-8" />
        <Skeleton className="h-4 w-full mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/profile">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <Typography variant="h2" weight="bold">
            Paramètres du profil
          </Typography>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progression du profil</span>
            <span className="font-medium">{completion}%</span>
          </div>
          <Progress value={completion} className="h-2" />
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 gap-2 w-full">
          <TabsTrigger value="personal" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Informations</span>
          </TabsTrigger>
          <TabsTrigger value="social" className="gap-2">
            <Link2 className="h-4 w-4" />
            <span className="hidden sm:inline">Réseaux</span>
          </TabsTrigger>
          <TabsTrigger value="images" className="gap-2">
            <Image className="h-4 w-4" />
            <span className="hidden sm:inline">Images</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Sécurité</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          {profile && <PersonalInfoForm user={profile} onUpdate={refresh} />}
        </TabsContent>

        <TabsContent value="social">
          {profile && <SocialLinksForm user={profile} onUpdate={refresh} />}
        </TabsContent>

        <TabsContent value="images">
          {profile && <ImagesForm user={profile} onUpdate={refresh} />}
        </TabsContent>

        <TabsContent value="security">
          {profile && <SecurityForm user={profile} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}