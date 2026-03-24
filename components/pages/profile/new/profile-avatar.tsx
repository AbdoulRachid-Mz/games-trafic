"use client";

import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CircularProgress } from "@/components/shared/circular-progress";
import { User, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdvancedUpload } from "@/components/ui/advanced-upload";
import { ImageViewer } from "@/components/shared/image-viewer";
import { useState } from "react";

interface ProfileAvatarProps {
  src?: string | null;
  username: string;
  isOwnProfile?: boolean;
  profileCompletion?: number; // 0-100
  onUpload?: (url: string) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function ProfileAvatar({
  src,
  username,
  isOwnProfile,
  profileCompletion = 0,
  onUpload,
  className,
  size = "md",
}: ProfileAvatarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showViewer, setShowViewer] = useState(false);

  const sizeClasses = {
    sm: "w-20 h-20 border-4",
    md: "w-32 h-32 border-4",
    lg: "w-40 h-40 border-4",
  };

  const avatarSize = {
    sm: 80,
    md: 128,
    lg: 160,
  };

  return (
    <motion.div
      className={cn("relative", className)}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* Progress circulaire */}
      <CircularProgress
        value={profileCompletion}
        size={avatarSize[size] + 8}
        strokeWidth={3}
        className="absolute -inset-1"
        gradient={{ from: "#3b82f6", to: "#8b5cf6" }}
      />

      {/* Avatar */}
      <div
        className={cn(
          "relative rounded-full overflow-hidden cursor-pointer",
          sizeClasses[size]
        )}
        onClick={() => !isOwnProfile && setShowViewer(true)}
      >
        <Avatar className="w-full h-full">
          <AvatarImage src={src || "/images/icons/avatar/man.png"} alt={username} />
          <AvatarFallback className="text-2xl">
            <User className="w-1/2 h-1/2" />
          </AvatarFallback>
        </Avatar>

        {/* Overlay hover pour upload */}
        {isOwnProfile && isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/50 flex items-center justify-center"
          >
            <Camera className="w-8 h-8 text-white" />
          </motion.div>
        )}

        {/* Upload overlay */}
        {isOwnProfile && (
          <AdvancedUpload
            value={src || "/images/default-avatar.jpg"}
            onChange={onUpload || (() => {})}
            className="absolute inset-0 opacity-0"
            isRounded
            maxSizeMB={2}
          />
        )}
      </div>

      {/* Image Viewer pour les profils publics */}
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