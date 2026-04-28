// components/game-clips/game-trafics-loader.tsx
"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export function GameTraficsLoader() {
  return (
    <div className="fixed inset-0 bg-[#0a0a0b] flex items-center justify-center overflow-hidden">
      
      {/* Background glow */}
      <div className="absolute inset-0">
        <div className="absolute w-[400px] h-[400px] bg-primary/20 blur-[120px] rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
      </div>

      {/* Content */}
      <div className="relative flex flex-col items-center gap-6">

        {/* Logo / Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: [0.9, 1.1, 1], opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative"
        >
          <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
          </div>

          {/* Glow ring */}
          <motion.div
            className="absolute inset-0 rounded-2xl border border-primary/30"
            animate={{
              scale: [1, 1.4],
              opacity: [0.6, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-white text-lg font-bold tracking-wide"
        >
          Game Trafics
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-white/40 text-sm"
        >
          Chargement des clips...
        </motion.p>

        {/* Progress bar fake */}
        <div className="w-48 h-[3px] bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </div>
      </div>
    </div>
  );
}