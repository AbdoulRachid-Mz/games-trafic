"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { InteractionButton } from "@/components/shared/interaction-button";
import {
  Settings,
  Edit3,
  LayoutDashboard,
  MoreVertical,
  Fingerprint,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    return (
      <motion.div
        className="flex items-center gap-2"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        {/* Edit Profile button (always visible) */}
        <Button variant="outline" size="sm" asChild className="gap-2">
          <Link href="/profile/settings">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Paramètres</span>
          </Link>
        </Button>

        {/* Dropdown for more options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-9 w-9">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {/* Complete profile - only if < 70% */}
            {profileCompletion < 70 && (
              <DropdownMenuItem
                onClick={() => router.push("/profile/settings")}
                className="gap-2 cursor-pointer"
              >
                <Edit3 className="h-4 w-4" />
                <span>Compléter mon profil ({profileCompletion}%)</span>
              </DropdownMenuItem>
            )}

            {/* Add passkey - only if no passkey */}
            {!hasPasskey && (
              <DropdownMenuItem
                onClick={handleAddPasskey}
                disabled={isAddingPasskey}
                className="gap-2 cursor-pointer"
              >
                <Fingerprint className="h-4 w-4" />
                <span>{isAddingPasskey ? "Configuration..." : "Ajouter une passkey"}</span>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            {/* Dashboard */}
            <DropdownMenuItem
              onClick={() => router.push("/dashboard")}
              className="gap-2 cursor-pointer"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Tableau de bord</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>
    );
  }

  // Public profile - show follow button
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