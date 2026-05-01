"use client";

import { motion } from "framer-motion";
import { InteractionButton } from "@/components/shared/interaction-button";
import { Settings, Edit3, LayoutDashboard, Fingerprint, MessageSquare } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { ResponsiveTab, ResponsiveTabs } from "@/components/ui/responsive-tabs";
import { Button } from "@/components/ui/button";

interface ProfileActionsProps {
  userId: string;
  isOwnProfile: boolean;
  profileCompletion?: number;
  hasPasskey?: boolean;
}

export function ProfileActions({
  userId,
  isOwnProfile,
  profileCompletion = 0,
  hasPasskey = false,
}: ProfileActionsProps) {
  const router = useRouter();
  const [isAddingPasskey, setIsAddingPasskey] = useState(false);

  const handleAddPasskey = async () => {
    setIsAddingPasskey(true);
    try {
      const { error } = await authClient.passkey.addPasskey({
        authenticatorAttachment: "platform",
      });

      if (error) {
        toast.error("Erreur lors de l'ajout de la passkey");
      } else {
        toast.success("Passkey ajoutée avec succès !");
        router.refresh();
      }
    } finally {
      setIsAddingPasskey(false);
    }
  };

  if (isOwnProfile) {
    const tabs: ResponsiveTab[] = [
      {
        value: "settings",
        label: "Paramètres",
        icon: <Settings className="h-4 w-4" />,
      },
      ...(profileCompletion < 70
        ? [
            {
              value: "complete-profile",
              label: `Compléter (${profileCompletion}%)`,
              icon: <Edit3 className="h-4 w-4" />,
            },
          ]
        : []),
      ...(hasPasskey
        ? []
        : [
            {
              value: "add-passkey",
              label: isAddingPasskey ? "Configuration..." : "Passkey",
              icon: <Fingerprint className="h-4 w-4" />,
            },
          ]),
      {
        value: "dashboard",
        label: "Tableau de bord",
        icon: <LayoutDashboard className="h-4 w-4" />,
      },
      {
        value: "messages",
        label: "Messages",
        icon: <MessageSquare className="h-4 w-4" />,
      },
    ];

    return (
      <motion.div
        className="flex w-full items-center gap-2"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <ResponsiveTabs
          tabs={tabs}
          defaultValue="settings"
          desktopCount={5}
          tabletCount={4}
          mobileCount={3}
          onValueChange={(value) => {
            if (value === "settings") router.push("/profile/settings");
            if (value === "complete-profile") router.push("/profile/settings");
            if (value === "add-passkey") handleAddPasskey();
            if (value === "dashboard") router.push("/dashboard");
            if (value === "messages") router.push("/chats");
          }}
        />
      </motion.div>
    );
  }

  // Public profile - show follow and chat buttons
  return (
    <motion.div
      className="flex items-center gap-2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
    >
      <InteractionButton
        type="follow"
        entityType="USER"
        entityId={userId}
        variant="default"
        size="md"
        withCount
      >
        Suivre
      </InteractionButton>
      
      <Button
        variant="outline"
        size="default"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          router.push(`/chats?entityType=user&entityId=${userId}`);
        }}
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        Discuter
      </Button>
    </motion.div>
  );
}
