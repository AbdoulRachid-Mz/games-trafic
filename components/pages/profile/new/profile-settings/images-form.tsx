"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdvancedUpload } from "@/components/ui/advanced-upload";
import { Typography } from "@/components/ui/typography";
import { updateUser } from "@/actions/users";
import { toast } from "sonner";
import type { UserWithAllRelations } from "@/actions/users";

interface ImagesFormProps {
  user: UserWithAllRelations;
  onUpdate: () => void;
}

export function ImagesForm({ user, onUpdate }: ImagesFormProps) {
  const handleAvatarUpdate = async (url: string) => {
    try {
      await updateUser(user.id, { image: url });
      toast.success("Photo de profil mise à jour");
      onUpdate();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleCoverUpdate = async (url: string) => {
    try {
      await updateUser(user.id, { coverImage: url });
      toast.success("Photo de couverture mise à jour");
      onUpdate();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Images du profil</CardTitle>
        <CardDescription>
          Gérez votre photo de profil et votre couverture
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Avatar */}
        <div className="space-y-4">
          <Typography variant="h6" weight="semibold">
            Photo de profil
          </Typography>
          <div className="flex items-center gap-8">
            <div className="w-32 h-32">
              <AdvancedUpload
                value={user.image || ""}
                onChange={handleAvatarUpdate}
                isRounded
                maxSizeMB={2}
                showInternalSelection
                internalImagesFolder="avatars"
              />
            </div>
            <div className="flex-1">
              <Typography variant="body-sm" theme="muted">
                Format recommandé : 500x500px, max 2MB
              </Typography>
            </div>
          </div>
        </div>

        {/* Cover */}
        <div className="space-y-4">
          <Typography variant="h6" weight="semibold">
            Photo de couverture
          </Typography>
          <div className="w-full h-48">
            <AdvancedUpload
              value={user.coverImage || ""}
              onChange={handleCoverUpdate}
              maxSizeMB={5}
              showInternalSelection
              internalImagesFolder="covers"
              className="h-full"
              previewClassName="h-48"
            />
          </div>
          <Typography variant="body-sm" theme="muted">
            Format recommandé : 1500x500px, max 5MB
          </Typography>
        </div>
      </CardContent>
    </Card>
  );
}