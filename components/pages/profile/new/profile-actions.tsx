"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { InteractionButton } from "@/components/shared/interaction-button";
import { Settings, Key, Edit3, UserPlus, Check, FingerprintPattern } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FingerprintIcon } from "@/components/icons/fingerprint";

interface ProfileActionsProps {
  userId: string;
  isOwnProfile: boolean;
  profileCompletion?: number;
}

export function ProfileActions({
  userId,
  isOwnProfile,
  profileCompletion = 0,
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
    return (
      <motion.div
        className="flex items-center gap-2"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        {/* Passkey button with tooltip */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handleAddPasskey}
                disabled={isAddingPasskey}
                className="relative"
              >
                <FingerprintIcon size={16} />
                {profileCompletion > 50 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ajouter une passkey pour sécuriser votre compte</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Complete profile button */}
        <Button asChild variant={profileCompletion < 100 ? "default" : "outline"}>
          <Link href="/profile/settings" className="gap-2">
            {profileCompletion < 100 ? (
              <>
                <Edit3 className="h-4 w-4" />
                Compléter mon profil ({profileCompletion}%)
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Profil complété
              </>
            )}
          </Link>
        </Button>

        {/* Settings button */}
        <Button variant="ghost" size="icon" asChild>
          <Link href="/profile/settings">
            <Settings className="h-4 w-4" />
          </Link>
        </Button>

        {/* dashboard */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" asChild>
                <Link href="/dashboard">
                  <UserPlus className="h-4 w-4" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Accéder au tableau de bord</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </motion.div>
    );
  }

  return (
    <motion.div
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
    </motion.div>
  );
}