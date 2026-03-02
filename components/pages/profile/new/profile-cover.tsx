"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AdvancedUpload } from "@/components/ui/advanced-upload";
import { ImageViewer } from "@/components/shared/image-viewer";
import { Camera } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

interface ProfileCoverProps {
  src?: string | null;
  isOwnProfile?: boolean;
  onUpload?: (url: string) => void;
  className?: string;
  height?: number;
}

export function ProfileCover({
  src,
  isOwnProfile,
  onUpload,
  className,
  height = 300,
}: ProfileCoverProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showViewer, setShowViewer] = useState(false);

  return (
    <motion.div
      className={cn("relative w-full overflow-hidden rounded-xl", className)}
      style={{ height }}
      initial={{ scale: 1.05, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Image */}
      {src ? (
        <div
          className="w-full relative h-full cursor-pointer"
          onClick={() => !isOwnProfile && setShowViewer(true)}
        >
          <Image
            src={src}
            alt="Cover"
            fill
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          />
        </div>
      ) : (
        <div className="w-full h-full bg-gradient-to-r from-primary/20 to-secondary/20 flex items-center justify-center">
          <p className="text-muted-foreground">Aucune image de couverture</p>
        </div>
      )}

      {/* Overlay pour upload */}
      {isOwnProfile && isHovered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/40 flex items-center justify-center"
        >
          <div className="bg-background/80 backdrop-blur-sm rounded-full p-3">
            <Camera className="w-6 h-6" />
          </div>
        </motion.div>
      )}

      {/* Upload component */}
      {isOwnProfile && (
        <AdvancedUpload
          value={src || "/images/default-cover.jpg"}
          onChange={onUpload || (() => {})}
          className="absolute inset-0 opacity-0"
          maxSizeMB={5}
        />
      )}

      {/* Image Viewer pour profils publics */}
      {!isOwnProfile && src && (
        <ImageViewer
          images={[src]}
          trigger={<div className="hidden" />}
        //   open={showViewer}
        //   onOpenChange={setShowViewer}
        />
      )}
    </motion.div>
  );
}