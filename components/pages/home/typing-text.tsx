// components/pages/home/typing-text.tsx
"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface TypingTextProps {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
  onComplete?: () => void;
  loop?: boolean;
}

export function TypingText({
  text,
  speed = 50,
  delay = 0,
  className,
  onComplete,
  loop = false,
}: TypingTextProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (delay > 0) {
      const timeout = setTimeout(() => {
        startTyping();
      }, delay);
      return () => clearTimeout(timeout);
    } else {
      startTyping();
    }
  }, [delay]);

  const startTyping = () => {
    const timeout = setTimeout(() => {
      handleTyping();
    }, speed);

    return () => clearTimeout(timeout);
  };

  const handleTyping = () => {
    if (!isDeleting) {
      // Typing forward
      if (currentIndex < text.length) {
        const nextChar = text[currentIndex];
        setDisplayedText(prev => prev + nextChar);
        setCurrentIndex(prev => prev + 1);
      } else {
        // Finished typing
        setIsComplete(true);
        onComplete?.();
        
        if (loop) {
          setTimeout(() => {
            setIsDeleting(true);
            setIsComplete(false);
          }, 2000);
        }
      }
    } else {
      // Deleting backward
      if (currentIndex > 0) {
        setDisplayedText(prev => prev.slice(0, -1));
        setCurrentIndex(prev => prev - 1);
      } else {
        // Finished deleting
        setIsDeleting(false);
        // Restart loop
        if (loop) {
          setTimeout(() => {
            startTyping();
          }, 500);
        }
      }
    }

    // Continue animation
    if (!isComplete || loop) {
      const timeout = setTimeout(() => {
        handleTyping();
      }, isDeleting ? speed / 2 : speed);

      return () => clearTimeout(timeout);
    }
  };

  return (
    <div className={cn("inline-block", className)}>
      <span className="relative">
        {displayedText}
        <span className="ml-1 animate-pulse">|</span>
      </span>
      <span className="invisible">{text}</span>
    </div>
  );
}

interface MultiTypingTextProps {
  texts: string[];
  speed?: number;
  delay?: number;
  className?: string;
  loop?: boolean;
}

export function MultiTypingText({
  texts,
  speed = 50,
  delay = 0,
  className,
  loop = true,
}: MultiTypingTextProps) {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  const handleComplete = () => {
    setTimeout(() => {
      setCurrentTextIndex((prev) => (prev + 1) % texts.length);
    }, 1500);
  };

  return (
    <div className={className}>
      <TypingText
        text={texts[currentTextIndex]}
        speed={speed}
        delay={delay}
        onComplete={handleComplete}
        loop={loop}
      />
    </div>
  );
}