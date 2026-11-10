// components/pages/chats/emoji-picker-wrapper.tsx
"use client";

import React from "react";
import dynamic from "next/dynamic";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Smile } from "lucide-react";
import { cn } from "@/lib/utils";

// Dynamically import emoji picker to reduce bundle size
const EmojiPicker = dynamic(
  () => import("emoji-picker-react").then((mod) => mod.default),
  { ssr: false }
);

interface EmojiPickerWrapperProps {
  onEmojiSelect: (emoji: string) => void;
  className?: string;
}

export function EmojiPickerWrapper({
  onEmojiSelect,
  className,
}: EmojiPickerWrapperProps) {
  const [open, setOpen] = React.useState(false);

  const handleEmojiClick = (emojiData: any) => {
    onEmojiSelect(emojiData.emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("h-9 w-9", className)}
        >
          <Smile className="h-5 w-5 text-[var(--chat-textMuted)] hover:text-[var(--chat-primary)]" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 border-[var(--chat-border)]"
        align="end"
        side="top"
      >
        <EmojiPicker
          onEmojiClick={handleEmojiClick}
          autoFocusSearch={false}
          theme={undefined}
          width={typeof window !== "undefined" ? Math.min(350, window.innerWidth - 32) : 350}
          height={400}
          previewConfig={{ showPreview: false }}
        />
      </PopoverContent>
    </Popover>
  );
}
