"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SocialMediaInput } from "@/components/shared/social-media-input";
import { updateUser } from "@/actions/users";
import { toast } from "sonner";
import type { UserWithAllRelations } from "@/actions/users";

interface SocialLinksFormProps {
  user: UserWithAllRelations;
  onUpdate: () => void;
}

export function SocialLinksForm({ user, onUpdate }: SocialLinksFormProps) {
  const handleUpdate = async (links: string[]) => {
    try {
      await updateUser(user.id, { socialMedia: links });
      toast.success("Réseaux sociaux mis à jour");
      onUpdate();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Réseaux sociaux</CardTitle>
        <CardDescription>
          Ajoutez vos liens vers vos réseaux sociaux
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SocialMediaInput
          value={Array.isArray(user.socialMedia) ? user.socialMedia : []}
          onChange={handleUpdate}
        />
      </CardContent>
    </Card>
  );
}