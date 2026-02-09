// @/components/game-clips/game-clip-creation-dialog.tsx
"use client";

import React, { useState, useEffect } from "react";
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
import { Loader2, Plus, Image, Video, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { useGameClips } from "@/hooks/use-game-clips";
import { useAuthContext } from "@/contexts/auth-context";
import { useSearchParams, useRouter } from "next/navigation";

export function GameClipCreationDialog() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const shouldOpen = searchParams.get("create") === "true";

  const [open, setOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const { createClip, isCreating } = useGameClips();
  const { isAuthenticated } = useAuthContext();

  // Handle auto-open via search params
  useEffect(() => {
    if (shouldOpen && !open) {
      setOpen(true);
    }
  }, [shouldOpen, open]);

  // Cleanup search params when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen && shouldOpen) {
      const params = new URLSearchParams(searchParams);
      params.delete("create");
      router.replace(`${window.location.pathname}?${params.toString()}`);
    }
  };

  if (!isAuthenticated) return null;

  const handleSubmit = async () => {
    if (!videoUrl && imageUrls.length === 0) {
      toast.error("Ajoutez une vidéo ou au moins une image");
      return;
    }

    try {
      await createClip({
        caption,
        videoUrl,
        imageUrls: imageUrls.join(","),
        isPublic: true,
      });

      handleOpenChange(false);
      setCaption("");
      setVideoUrl("");
      setImageUrls([]);
    } catch (error) {
      // Error handled by hook toast
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className="flex flex-col items-center gap-2 group hover:scale-105 transition-all duration-300">
          <div className="h-14 w-14 rounded-full border-2 border-dashed border-primary/40 flex items-center justify-center bg-primary/5 group-hover:bg-primary/10 group-hover:border-primary/60 transition-all">
            <PlusCircle className="h-6 w-6 text-primary" />
          </div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-primary/60 group-hover:text-primary transition-colors">Clip IT</span>
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[550px] rounded-3xl border-white/5 bg-background/95 backdrop-blur-xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary" />
            Nouveau Game Clip
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Textarea */}
          <div className="space-y-2">
            <Typography variant="caption" className="uppercase tracking-[0.2em] font-bold text-white/40 ml-1">Caption</Typography>
            <Textarea
              placeholder="Décris ton action 🔥 (optionnel)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
              className="resize-none bg-white/5 border-white/10 rounded-2xl focus-visible:ring-primary/50 text-base"
            />
          </div>

          {/* Preview */}
          {(videoUrl || imageUrls.length > 0) ? (
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/40 shadow-inner group relative">
              {videoUrl ? (
                <video src={videoUrl} controls className="w-full" />
              ) : (
                <div className="grid grid-cols-3 gap-2 p-3">
                  {imageUrls.map((img) => (
                    <img
                      key={img}
                      src={img}
                      className="aspect-square object-cover rounded-xl border border-white/10"
                    />
                  ))}
                </div>
              )}
              <button
                onClick={() => { setVideoUrl(""); setImageUrls([]); }}
                className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white/70 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="h-32 rounded-2xl border-2 border-dashed border-white/5 bg-white/5 flex flex-col items-center justify-center text-white/20 gap-2">
              <Video className="h-8 w-8 opacity-20" />
              <Typography variant="body-xs" className="uppercase tracking-widest font-black">Media Preview</Typography>
            </div>
          )}

          {/* Actions Bar */}
          <div className="flex items-center justify-between pt-2 bg-white/5 p-4 rounded-3xl border border-white/5">
            <div className="flex gap-3">
              {/* Video upload */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button size="icon" variant="ghost" className="hover:bg-primary/10 rounded-xl transition-colors">
                    <Video className="h-5 w-5 text-primary" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] rounded-2xl shadow-2xl border-white/10 p-4">
                  <Typography variant="body-sm" className="font-bold mb-3">Télécharger une vidéo</Typography>
                  <AdvancedVideoUpload
                    value={videoUrl}
                    onChange={(val) => { setVideoUrl(val); setImageUrls([]); }}
                    maxSizeMB={20}
                  />
                </PopoverContent>
              </Popover>

              {/* Image upload */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button size="icon" variant="ghost" className="hover:bg-purple-500/10 rounded-xl transition-colors">
                    <Image className="h-5 w-5 text-purple-400" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] rounded-2xl shadow-2xl border-white/10 p-4">
                  <Typography variant="body-sm" className="font-bold mb-3">Ajouter des images (max 5)</Typography>
                  <AdvancedMultiUpload
                    value={imageUrls}
                    onChange={(val) => { setImageUrls(val); setVideoUrl(""); }}
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
              className="rounded-2xl px-8 py-6 font-bold uppercase tracking-widest text-xs h-auto shadow-lg shadow-primary/20"
            >
              {isCreating && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Publier le Clip
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper Typography import fix or internal def
const Typography = ({ children, variant, className }: any) => {
  const classes = {
    h4: "text-lg font-bold",
    caption: "text-[10px]",
    "body-xs": "text-[10px]",
    "body-sm": "text-sm"
  } as any;
  return <div className={cn(classes[variant], className)}>{children}</div>;
};

import { X } from "lucide-react";import { cn } from "@/lib/utils";

