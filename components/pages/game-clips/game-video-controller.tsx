// components/game-clips/game-video-controller.tsx
"use client";

import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface GameVideoControllerProps {
  isPlaying: boolean;
  isMuted: boolean;
  progress: number;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  className?: string;
}

export function GameVideoController({
  isPlaying,
  isMuted,
  progress,
  onTogglePlay,
  onToggleMute,
  className,
}: GameVideoControllerProps) {
  return (
    <div className={cn("absolute inset-0 pointer-events-none z-10", className)}>
      {/* Progress Bar - Top */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-white/20 z-20">
        <div
          className="h-full bg-white transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Center Play/Pause Overlay */}
      <AnimatePresence>
        {!isPlaying && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <button
              onClick={onTogglePlay}
              className="bg-black/50 backdrop-blur-md p-5 rounded-full pointer-events-auto transition-all active:scale-95 hover:bg-black/60"
            >
              <Play className="w-10 h-10 text-white ml-1" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Controls */}
      <div className="absolute bottom-4 right-4 flex gap-2 pointer-events-auto">
        {/* Play/Pause Button */}
        <button
          onClick={onTogglePlay}
          className="p-2.5 rounded-full bg-black/50 backdrop-blur-md hover:bg-black/60 transition-all active:scale-95"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 text-white" />
          ) : (
            <Play className="w-5 h-5 text-white ml-0.5" />
          )}
        </button>

        {/* Mute/Unmute Button */}
        <button
          onClick={onToggleMute}
          className="p-2.5 rounded-full bg-black/50 backdrop-blur-md hover:bg-black/60 transition-all active:scale-95"
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5 text-white" />
          ) : (
            <Volume2 className="w-5 h-5 text-white" />
          )}
        </button>
      </div>
    </div>
  );
}