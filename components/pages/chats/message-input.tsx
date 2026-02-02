// components/pages/chats/message-input.tsx
"use client";

import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmojiPickerWrapper } from "./emoji-picker-wrapper";
import { cn } from "@/lib/utils";
import { Send, Image as ImageIcon, X } from "lucide-react";
import { useChatMedia } from "@/hooks/use-chat-media";
import { useChatThemeContext } from "@/contexts/chat-theme-context";
import type { User } from "@/database/schema";
import type { ChatMessage } from "@/types/chat";
import { toast } from "sonner";

interface MessageInputProps {
  user: User | null;
  onSendMessage: (content: string, images?: string[]) => void;
  replyTo?: ChatMessage | null;
  onCancelReply?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function MessageInput({
  user,
  onSendMessage,
  replyTo,
  onCancelReply,
  placeholder = "Type a message...",
  disabled = false,
  className,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { settings } = useChatThemeContext();
  const { uploadFiles, validateFile, limits, isUploading } = useChatMedia(user);

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    // Auto-resize
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
  };

  // Handle emoji selection
  const handleEmojiSelect = useCallback((emoji: string) => {
    setMessage((prev) => prev + emoji);
    textareaRef.current?.focus();
  }, []);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Validate each file
    const validFiles: File[] = [];
    for (const file of files) {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        toast.error(validation.error);
      }
    }

    // Check total count
    const totalFiles = selectedFiles.length + validFiles.length;
    if (totalFiles > limits.maxImagesPerMessage) {
      toast.error(
        `You can only upload ${limits.maxImagesPerMessage} images per message`
      );
      return;
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Remove selected file
  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Send message
  const handleSend = async () => {
    if (!message.trim() && selectedFiles.length === 0) {
      return;
    }

    if (disabled || isUploading) {
      return;
    }

    try {
      let imageUrls: string[] = [];

      // Upload images if any
      if (selectedFiles.length > 0) {
        imageUrls = await uploadFiles(selectedFiles);
      }

      // Send message
      onSendMessage(message.trim(), imageUrls);

      // Clear input
      setMessage("");
      setSelectedFiles([]);

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    }
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (settings.enterToSend && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={cn(
        "border-t border-[var(--chat-border)] bg-[var(--chat-surface)] p-4",
        className
      )}
    >
      {/* Reply preview */}
      {replyTo && (
        <div className="mb-2 p-2 bg-[var(--chat-messageReceived)] rounded-lg flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[var(--chat-primary)]">
              Replying to {replyTo.sender?.fullName || "Unknown"}
            </p>
            <p className="text-xs text-[var(--chat-textMuted)] truncate">
              {replyTo.content}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onCancelReply}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Selected images preview */}
      {selectedFiles.length > 0 && (
        <div className="mb-2 flex gap-2 overflow-x-auto">
          {selectedFiles.map((file, index) => (
            <div key={index} className="relative flex-shrink-0">
              <img
                src={URL.createObjectURL(file)}
                alt={`Preview ${index + 1}`}
                className="h-20 w-20 object-cover rounded-lg"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                onClick={() => handleRemoveFile(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2">
        {/* Image upload button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          disabled={disabled || isUploading}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 flex-shrink-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
        >
          <ImageIcon className="h-5 w-5 text-[var(--chat-textMuted)] hover:text-[var(--chat-primary)]" />
        </Button>

        {/* Emoji picker */}
        <EmojiPickerWrapper onEmojiSelect={handleEmojiSelect} />

        {/* Text input */}
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isUploading}
          className={cn(
            "min-h-[40px] max-h-[150px] resize-none",
            "bg-[var(--chat-background)]",
            "border-[var(--chat-border)]",
            "text-[var(--chat-text)]",
            "placeholder:text-[var(--chat-textMuted)]",
            "focus-visible:ring-[var(--chat-primary)]"
          )}
          rows={1}
        />

        {/* Send button */}
        <Button
          onClick={handleSend}
          disabled={
            (!message.trim() && selectedFiles.length === 0) ||
            disabled ||
            isUploading
          }
          className="h-9 w-9 p-0 flex-shrink-0 bg-[var(--chat-primary)] hover:bg-[var(--chat-accentHover)] text-[var(--chat-messageSentText)]"
        >
          {isUploading ? (
            <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Helper text */}
      {settings.enterToSend && (
        <p className="text-xs text-[var(--chat-textMuted)] mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      )}
    </div>
  );
}
