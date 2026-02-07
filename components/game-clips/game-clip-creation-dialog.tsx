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
import { AdvancedMultiUpload } from "@/components/ui/advanced-multi-upload";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Loader2, Plus, Image, Video } from "lucide-react";
import { toast } from "sonner";
import { useGameClips } from "@/hooks/use-game-clips";
import { useAuthContext } from "@/contexts/auth-context";

export function GameClipCreationDialog() {
  const [open, setOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const { createClip, isCreating } = useGameClips();
  const { isAuthenticated } = useAuthContext();

  if (!isAuthenticated) return null;

  const handleSubmit = async () => {
    if (!videoUrl && imageUrls.length === 0) {
      toast.error("Ajoutez une vidéo ou au moins une image");
      return;
    }

    await createClip({
      caption,
      videoUrl,
      imageUrls: imageUrls.join(","),
      isPublic: true,
    });

    setOpen(false);
    setCaption("");
    setVideoUrl("");
    setImageUrls([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex flex-col items-center gap-1 hover:scale-105 transition">
          <div className="h-14 w-14 rounded-full border border-dashed border-primary/40 flex items-center justify-center bg-primary/5">
            <Plus className="h-6 w-6 text-primary" />
          </div>
          <span className="text-[11px] text-muted-foreground">Créer</span>
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px] rounded-xl">
        <DialogHeader>
          <DialogTitle>Nouveau Game Clip</DialogTitle>
        </DialogHeader>

        {/* Textarea */}
        <Textarea
          placeholder="Décris ton action 🔥 (optionnel)"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={3}
          className="resize-none border-none focus-visible:ring-0 text-base"
        />

        {/* Preview */}
        {(videoUrl || imageUrls.length > 0) && (
          <div className="rounded-lg overflow-hidden border bg-muted">
            {videoUrl ? (
              <video src={videoUrl} controls className="w-full" />
            ) : (
              <div className="grid grid-cols-3 gap-1 p-2">
                {imageUrls.map((img) => (
                  <img
                    key={img}
                    src={img}
                    className="aspect-square object-cover rounded"
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-2">
            {/* Video upload */}
            <Popover>
              <PopoverTrigger asChild>
                <Button size="icon" variant="ghost">
                  <Video className="h-5 w-5 text-primary" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px]">
                <AdvancedVideoUpload
                  value={videoUrl}
                  onChange={setVideoUrl}
                  maxSizeMB={20}
                />
              </PopoverContent>
            </Popover>

            {/* Image upload */}
            <Popover>
              <PopoverTrigger asChild>
                <Button size="icon" variant="ghost">
                  <Image className="h-5 w-5 text-primary" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px]">
                <AdvancedMultiUpload
                  value={imageUrls}
                  onChange={setImageUrls}
                  maxImages={5}
                  maxSizeMB={2}
                  uploadPath="game-clips"
                  internalImagesFolder="game-clips"
                  showInternalSelection
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isCreating}
            className="rounded-full px-6"
          >
            {isCreating && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Publier
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
