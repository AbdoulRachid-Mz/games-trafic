// components/advanced-video-upload.tsx
"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, VideoIcon, Loader2, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { formatBytes } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AdvancedVideoUploadProps {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  maxSizeMB?: number;
  uploadPath?: string;
  uploadPreset?: string;
  className?: string;
  previewClassName?: string;
  emptyPreview?: React.ReactNode;
  isAutoUpload?: boolean;
  showFullPreview?: boolean;
}

export function AdvancedVideoUpload({
  value,
  onChange,
  disabled = false,
  maxSizeMB = 50,
  uploadPath = "videos",
  uploadPreset = "games_trafics",
  className,
  previewClassName,
  emptyPreview,
  isAutoUpload = true,
  showFullPreview = true,
}: AdvancedVideoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [originalSize, setOriginalSize] = useState<number | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "duathyzaj";

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Vérification du type de fichier
      const validVideoTypes = [
        "video/mp4",
        "video/webm",
        "video/quicktime",
        "video/x-m4v",
        "video/avi",
        "video/x-msvideo",
        "video/mpeg",
      ];

      if (!validVideoTypes.includes(file.type)) {
        setError("Veuillez sélectionner un fichier vidéo valide (MP4, WebM, MOV, AVI, MPEG)");
        return;
      }

      // Vérification de la taille
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`La vidéo ne doit pas dépasser ${maxSizeMB}MB`);
        return;
      }

      try {
        setIsUploading(true);
        setUploadProgress(10);
        setFileName(file.name);
        setOriginalSize(file.size);
        setError(null);

        if (isAutoUpload) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("upload_preset", uploadPreset);
          formData.append("folder", uploadPath);

          // Utilisation de XMLHttpRequest pour suivre la progression
          const xhr = new XMLHttpRequest();
          
          xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              setUploadProgress(progress);
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const data = JSON.parse(xhr.responseText);
                setUploadProgress(100);
                onChange(data.secure_url);
                
                // Reset après un court délai pour voir la progression complète
                setTimeout(() => {
                  setUploadProgress(0);
                  setIsUploading(false);
                }, 1000);
              } catch (parseError) {
                setError("Erreur lors de la lecture de la réponse du serveur");
                setIsUploading(false);
              }
            } else {
              setError(`Erreur lors de l'upload: ${xhr.status} ${xhr.statusText}`);
              setIsUploading(false);
            }
          });

          xhr.addEventListener("error", () => {
            setError("Erreur réseau lors de l'upload");
            setIsUploading(false);
          });

          xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`);
          xhr.send(formData);
        } else {
          // Mode upload différé - création d'une URL temporaire
          const objectUrl = URL.createObjectURL(file);
          onChange(objectUrl);
          setUploadProgress(100);
          setTimeout(() => {
            setUploadProgress(0);
            setIsUploading(false);
          }, 1000);
        }

      } catch (error) {
        console.error("Erreur lors de l'upload:", error);
        setUploadProgress(0);
        setError(error instanceof Error ? error.message : "Erreur inconnue lors de l'upload");
        setIsUploading(false);
      }
    },
    [maxSizeMB, onChange, uploadPath, uploadPreset, cloudName, isAutoUpload]
  );

  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setOriginalSize(null);
    setFileName(null);
    setError(null);
    setIsPlaying(false);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, [onChange]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
  };

  const handleVideoPlay = () => {
    setIsPlaying(true);
  };

  const handleVideoPause = () => {
    setIsPlaying(false);
  };

  const openFullPreview = () => {
    setShowPreviewModal(true);
  };

  const closeFullPreview = () => {
    setShowPreviewModal(false);
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className={cn(
        "relative overflow-hidden border border-border rounded-md group",
        !value ? "border-dashed" : "",
        "cursor-pointer transition-all duration-200",
        disabled && "opacity-50 cursor-not-allowed"
      )} onClick={() => !disabled && !value && inputRef.current?.click()}>
        <Input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime,video/x-m4v,video/avi,video/x-msvideo,video/mpeg"
          onChange={handleFileSelect}
          disabled={disabled || isUploading}
          className="hidden"
        />
        
        {value ? (
          <>
            <div className={cn(
              "aspect-video relative bg-black",
              previewClassName
            )}>
              <video
                ref={videoRef}
                src={value}
                className="w-full h-full object-contain"
                onEnded={handleVideoEnd}
                onPlay={handleVideoPlay}
                onPause={handleVideoPause}
                playsInline
                preload="metadata"
              />
              
              {/* Overlay de contrôle */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    onClick={togglePlay}
                    className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30"
                  >
                    {isPlaying ? (
                      <Pause className="h-6 w-6 text-white" />
                    ) : (
                      <Play className="h-6 w-6 text-white ml-1" />
                    )}
                  </Button>
                  
                  {showFullPreview && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={openFullPreview}
                      className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white"
                    >
                      Plein écran
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Indicateur de lecture */}
              {isPlaying && (
                <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                  Lecture...
                </div>
              )}
            </div>
            
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={handleRemove}
                disabled={disabled}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Supprimer la vidéo</span>
              </Button>
            </div>
            
            {fileName && (
              <div className="p-3 bg-background/90 backdrop-blur-sm text-sm">
                <div className="flex justify-between items-center">
                  <p className="font-medium truncate flex-1">{fileName}</p>
                  {originalSize !== null && (
                    <span className="text-muted-foreground text-xs whitespace-nowrap ml-2">
                      {formatBytes(originalSize)}
                    </span>
                  )}
                </div>
                {!isAutoUpload && (
                  <p className="text-xs text-yellow-600 mt-1">
                    Vidéo en attente d'upload définitif
                  </p>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="p-6 h-48 flex flex-col items-center justify-center space-y-3">
            {isUploading ? (
              <div className="w-full space-y-4 text-center">
                <div className="flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
                <Progress value={uploadProgress} className="h-2 w-full" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {uploadProgress < 50 ? "Préparation..." : "Upload en cours..."}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {uploadProgress}% complet
                  </p>
                </div>
              </div>
            ) : emptyPreview ? (
              <div className="w-full h-full flex items-center justify-center">
                {emptyPreview}
              </div>
            ) : (
              <>
                <div className="p-3 rounded-full bg-muted">
                  <VideoIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium">Cliquez pour uploader une vidéo</p>
                  <p className="text-xs text-muted-foreground">
                    Formats supportés: MP4, WebM, MOV, AVI, MPEG
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Taille max: {maxSizeMB}MB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled || isUploading}
                  onClick={(e) => {
                    e.stopPropagation();
                    inputRef.current?.click();
                  }}
                  className="mt-2"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Sélectionner une vidéo
                </Button>
                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 text-center">
                    <p className="text-xs text-destructive font-medium">{error}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setError(null)}
                      className="mt-1 text-xs h-6"
                    >
                      Fermer
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Modal de prévisualisation plein écran */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-4xl h-[80vh] bg-black p-0 border-none">
          <DialogHeader className="sr-only">
            <DialogTitle>Prévisualisation de la vidéo</DialogTitle>
          </DialogHeader>
          
          <div className="relative h-full flex items-center justify-center">
            <video
              src={value}
              className="w-full h-full object-contain"
              controls
              autoPlay
            />
            
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={closeFullPreview}
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}