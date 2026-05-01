// app/game-clips/create/page.tsx
"use client";

import React, { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  ArrowLeft,
  Sparkles,
  Eye,
  CheckCircle,
  Film,
  Image as ImageIcon,
  Hash,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/contexts/auth-context";
import { useGameClips } from "@/hooks/use-game-clips";
// import { AdvancedVideoUpload } from "@/components/advanced-video-upload";
import { AdvancedMultiUpload } from "@/components/ui/advanced-multi-upload";
import { AdvancedVideoUpload } from "@/components/ui/advanced-video-upload";
import { GameVideoController } from "@/components/game-clips/game-video-controller";

export default function GameClipCreatePage() {
  const router = useRouter();

  const [caption, setCaption] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"video" | "images">("video");
  const [isFocused, setIsFocused] = useState(false);

  // Video controller state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setProgress((current / total) * 100);
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  }, []);

  const { isAuthenticated } = useAuthContext();
  const { createClip, isCreating } = useGameClips();

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      router.push("/sign-in?redirect=/game-clips/create");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async () => {
    if (!videoUrl && imageUrls.length === 0) {
      toast.error("Ajoutez une vidéo ou au moins une image");
      return;
    }

    try {
      const imageUrlsString = imageUrls.length > 0 ? imageUrls.join(",") : "";

      await createClip({
        caption,
        videoUrl: videoUrl ?? "",
        imageUrls: imageUrlsString ?? "",
        isPublic: true,
      });

      router.push("/game-clips");
    } catch (error) {
      console.error("Erreur lors de la création du clip:", error);
    }
  };

  const hasContent = videoUrl || imageUrls.length > 0;
  const isFormValid = hasContent && !isCreating;

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-2xl border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => router.back()}
              className="group flex items-center gap-2 px-3 py-2 rounded-xl bg-muted hover:bg-muted/80 transition-all duration-300"
            >
              <ArrowLeft className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">
                Retour
              </span>
            </button>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium text-primary">
                  Nouveau clip
                </span>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={!isFormValid}
                className={cn(
                  "rounded-xl px-6 font-bold transition-all duration-300",
                  "bg-gradient-to-r from-primary to-primary/80 hover:shadow-lg hover:shadow-primary/25",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                )}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Publication...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Publier
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column - Preview */}
          <div className="order-2 lg:order-1">
            <div className="sticky top-24">
              {/* Preview Card */}
              <div className="bg-card backdrop-blur-xl rounded-2xl border border-border overflow-hidden shadow-2xl">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Aperçu en direct
                    </span>
                  </div>
                  {hasContent && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                      <CheckCircle className="h-3 w-3 text-green-400" />
                      <span className="text-[10px] font-medium text-green-400 uppercase">
                        Prêt
                      </span>
                    </div>
                  )}
                </div>

                <div className="aspect-[9/16] bg-black/90 flex items-center justify-center relative overflow-hidden group">
                  <AnimatePresence mode="wait">
                    {videoUrl ? (
                      <motion.div
                        key="video"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full h-full relative cursor-pointer"
                        onClick={togglePlay}
                      >
                        <video
                          ref={videoRef}
                          src={videoUrl}
                          className="w-full h-full object-contain"
                          loop
                          playsInline
                          muted={isMuted}
                          onTimeUpdate={handleTimeUpdate}
                          onPlay={() => setIsPlaying(true)}
                          onPause={() => setIsPlaying(false)}
                        />
                        <GameVideoController
                          isPlaying={isPlaying}
                          isMuted={isMuted}
                          progress={progress}
                          onTogglePlay={() => {
                            togglePlay();
                          }}
                          onToggleMute={() => {
                            toggleMute();
                          }}
                        />
                      </motion.div>
                    ) : imageUrls.length > 0 ? (
                      <motion.div
                        key="images"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative w-full h-full"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imageUrls[0]}
                          alt="Preview"
                          className="w-full h-full object-contain"
                        />
                        {imageUrls.length > 1 && (
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs">
                            +{imageUrls.length - 1} autres
                          </div>
                        )}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center space-y-3"
                      >
                        <div className="w-20 h-20 mx-auto rounded-2xl bg-white/10 flex items-center justify-center">
                          <Film className="h-10 w-10 text-white/50" />
                        </div>
                        <p className="text-sm text-white/50">
                          Aucun média sélectionné
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Caption Preview */}
                {caption && (
                  <div className="px-5 py-4 border-t border-border bg-muted">
                    <p className="text-sm text-foreground line-clamp-2">
                      {caption}
                    </p>
                  </div>
                )}
              </div>

              {/* Tips Card */}
              <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/10">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-foreground">
                      Conseils pour réussir ton clip
                    </span>
                    <div className="mt-2 space-y-1.5">
                      {[
                        "Vidéo MP4 jusqu'à 50MB",
                        "Images de haute qualité (max 5)",
                        "Ajoute une description accrocheuse",
                        "Les vidéos sont automatiquement optimisées",
                      ].map((tip, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-primary/60" />
                          <span className="text-xs text-muted-foreground">{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="order-1 lg:order-2 space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <h1 className="text-2xl font-black tracking-tight text-foreground">
                Créer un clip
              </h1>
              <p className="text-sm text-muted-foreground">
                Partage tes meilleurs moments de jeu avec la communauté
              </p>
            </div>

            {/* Media Type Toggle */}
            <div className="flex gap-2 p-1 bg-muted rounded-xl border border-border">
              <button
                onClick={() => setActiveTab("video")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all duration-300",
                  activeTab === "video"
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Film className="h-4 w-4" />
                <span className="text-sm font-medium">Vidéo</span>
              </button>
              <button
                onClick={() => setActiveTab("images")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all duration-300",
                  activeTab === "images"
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <ImageIcon className="h-4 w-4" />
                <span className="text-sm font-medium">Images</span>
              </button>
            </div>

            {/* Upload Section */}
            <div className="space-y-4">
              {activeTab === "video" ? (
                <AdvancedVideoUpload
                  value={videoUrl}
                  onChange={setVideoUrl}
                  maxSizeMB={50}
                  uploadPath="game-clips/videos"
                  uploadPreset="games_trafics"
                  isAutoUpload={true}
                />
              ) : (
                <AdvancedMultiUpload
                  value={imageUrls}
                  onChange={setImageUrls}
                  maxSizeMB={2}
                  maxWidthOrHeight={1920}
                  maxImages={5}
                  uploadPath="game-clips/images"
                  uploadPreset="games_trafics"
                  isAutoUpload={true}
                  showInternalSelection={false}
                  internalImagesFolder="game-clips"
                />
              )}
            </div>

            {/* Caption Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Description
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {caption.length}/500
                </span>
              </div>
              <Textarea
                placeholder="Raconte ton action... (optionnel)"
                value={caption}
                onChange={(e) => setCaption(e.target.value.slice(0, 500))}
                rows={4}
                className={cn(
                  "resize-none bg-muted border-border rounded-xl focus-visible:ring-primary/50 text-base text-foreground",
                  "placeholder:text-muted-foreground transition-all duration-300",
                  isFocused && "border-primary/50 ring-1 ring-primary/20",
                )}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
              />
            </div>

            {/* Visibility Info */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border shadow-sm">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Users className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Visible par tout le monde
                </p>
                <p className="text-xs text-muted-foreground">
                  Les clips sont publics et peuvent être likés, commentés et partagés
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="flex-1 rounded-xl"
              >
                Annuler
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!isFormValid}
                className={cn(
                  "flex-1 rounded-xl font-bold transition-all duration-300",
                  "bg-gradient-to-r from-primary to-primary/80 hover:shadow-lg hover:shadow-primary/25",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                )}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Publication...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Publier
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}