// components/pages/home/floating-elements.tsx
"use client";

import { motion } from "framer-motion";
import { Trophy, ShoppingBag, Users, Gamepad2, Star, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export function FloatingElements() {
  const elements = [
    {
      icon: Trophy,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
      size: "w-12 h-12",
      delay: 0,
      duration: 3,
      x: "10%",
      y: "20%",
    },
    {
      icon: ShoppingBag,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      size: "w-10 h-10",
      delay: 0.5,
      duration: 4,
      x: "85%",
      y: "30%",
    },
    {
      icon: Users,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      size: "w-14 h-14",
      delay: 1,
      duration: 3.5,
      x: "15%",
      y: "70%",
    },
    {
      icon: Gamepad2,
      color: "text-green-500",
      bg: "bg-green-500/10",
      size: "w-11 h-11",
      delay: 1.5,
      duration: 4.5,
      x: "75%",
      y: "60%",
    },
    {
      icon: Star,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      size: "w-9 h-9",
      delay: 2,
      duration: 3,
      x: "90%",
      y: "80%",
    },
    {
      icon: Zap,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      size: "w-13 h-13",
      delay: 2.5,
      duration: 4,
      x: "5%",
      y: "40%",
    },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {elements.map((element, index) => (
        <motion.div
          key={index}
          className={cn(
            "absolute flex items-center justify-center rounded-2xl backdrop-blur-sm border border-white/10",
            element.bg,
            element.size
          )}
          style={{
            left: element.x,
            top: element.y,
          }}
          animate={{
            y: [0, -30, 0],
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: element.duration,
            delay: element.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <element.icon className={cn("w-1/2 h-1/2", element.color)} />
        </motion.div>
      ))}

      {/* Floating Particles */}
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-1 h-1 bg-primary/30 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.random() * 50 - 25, 0],
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}