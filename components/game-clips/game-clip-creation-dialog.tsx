"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AdvancedVideoUpload } from "@/components/ui/advanced-video-upload";
import { useGameClips } from "@/hooks/use-game-clips";
import { Loader2, Plus, Video } from "lucide-react";
import { toast } from "sonner";
import { useAuthContext } from "@/contexts/auth-context";
import { AdvancedMultiUpload } from "../ui/advanced-multi-upload";

export function GameClipCreationDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const { createClip, isCreating } = useGameClips();
  const { isAuthenticated } = useAuthContext();

  const handleSubmit = async () => {
    // Allow either video or images (at least one must be provided)
    if (!videoUrl && imageUrls.length === 0) {
      toast.error("Veuillez uploader une vidéo ou au moins une image");
      return;
    }

    try {
      await createClip({
        caption,
        videoUrl,
        imageUrls: imageUrls.join(","),
        isPublic: true,
      });
      setIsOpen(false);
      setCaption("");
      setVideoUrl("");
      setImageUrls([]);
    } catch (e) {}
  };

  if (!isAuthenticated) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="flex flex-col items-center gap-1 transition-transform hover:scale-105">
          <div className="h-16 w-16 rounded-full border-2 border-dashed border-primary/50 flex items-center justify-center bg-primary/5 group">
            <Plus className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
          </div>
          <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">
            Créer
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Créer un Game Clip</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Vidéo du clip</label>
            <AdvancedVideoUpload
              value={videoUrl}
              onChange={setVideoUrl}
              maxSizeMB={20}
              className="aspect-video"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Images du clip</label>
            <AdvancedMultiUpload
              value={imageUrls}
              onChange={setImageUrls}
              maxImages={5}
              maxSizeMB={2}
              maxWidthOrHeight={1920}
              uploadPath="game-clips"
              internalImagesFolder="game-clips"
              showInternalSelection={true}
              className="aspect-video"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Légende (optionnel)</label>
            <Textarea
              placeholder="Décrivez votre moment de jeu..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={isCreating || (!videoUrl && imageUrls.length === 0)}
            className="w-full"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création...
              </>
            ) : (
              "Publier le clip"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
