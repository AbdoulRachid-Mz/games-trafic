// components/pages/chats/message-input.tsx
"use client";

import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmojiPickerWrapper } from "./emoji-picker-wrapper";
import { cn } from "@/lib/utils";
import { Send, Image as ImageIcon, X, Mic, Paperclip, Smile } from "lucide-react";
import { useChatMedia } from "@/hooks/use-chat-media";
import { useChatThemeContext } from "@/contexts/chat-theme-context";
import type { User } from "@/database/schema";
import type { ChatMessage } from "@/types/chat";
import { toast } from "sonner";
import { VoiceRecorder } from "./voice-recorder";
import Image from "next/image";
import { uploadToCloudinary } from "@/utils/image-upload-utils";

interface MessageInputProps {
  user: User | null;
  onSendMessage: (content: string, images?: string[], audioUrl?: string) => void;
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
  placeholder = "Écrivez un message...",
  disabled = false,
  className,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { settings } = useChatThemeContext();
  const { uploadFiles, validateFile, limits, isUploading: isUploadingMedia } = useChatMedia(user);
  const isUploading = isUploadingMedia || isUploadingAudio || isUploadingImages;

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
        `Vous ne pouvez envoyer que ${limits.maxImagesPerMessage} images par message`
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
      setIsUploadingImages(true);
      let imageUrls: string[] = [];

      // Upload images if any
      if (selectedFiles.length > 0) {
        const uploadPromises = selectedFiles.map(file => 
          uploadToCloudinary(file, {
            uploadPath: "chat_images",
            resourceType: "image"
          })
        );
        const results = await Promise.all(uploadPromises);
        imageUrls = results.filter(r => r.success && r.url).map(r => r.url as string);
        
        if (imageUrls.length !== selectedFiles.length) {
          toast.warning("Certaines images n'ont pas pu être envoyées");
        }
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
      console.error("erreur lors de l'envoi du message:", error);
      toast.error("erreur lors de l'envoi du message");
    } finally {
      setIsUploadingImages(false);
    }
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (settings.enterToSend && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle voice record
  const handleVoiceRecord = () => {
    setIsRecording(true);
  };

  const handleSendAudio = async (audioFile: File) => {
    setIsUploadingAudio(true);
    try {
      const result = await uploadToCloudinary(audioFile, {
        uploadPath: "chat_audio",
        resourceType: "auto",
      });

      if (result.success && result.url) {
        onSendMessage("", [], result.url);
        setIsRecording(false);
      } else {
        toast.error("Échec de l'envoi de l'audio");
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi audio:", error);
      toast.error("Erreur lors de l'envoi audio");
    } finally {
      setIsUploadingAudio(false);
    }
  };

  if (isRecording) {
    return (
      <div className={cn("p-2 bg-[var(--chat-surface)]", className)}>
        <VoiceRecorder 
          onSend={handleSendAudio} 
          onCancel={() => setIsRecording(false)} 
        />
      </div>
    );
  }

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
              Réponse à {replyTo.sender?.fullName || "Inconnu"}
            </p>
            <p className="text-xs text-[var(--chat-textMuted)] truncate">
              {replyTo.content}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0"
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
              <Image
                src={URL.createObjectURL(file)}
                alt={`Preview ${index + 1}`}
                width={80}
                height={80}
                className="h-20 w-20 object-cover rounded-lg"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 h-9 w-9 p-0 rounded-full"
                onClick={() => handleRemoveFile(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="flex items-center gap-2">
        {/* Attachment menu */}
        <div className="flex items-center gap-1">
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
            className="h-11 w-11 flex-shrink-0 text-[var(--chat-textMuted)] hover:text-[var(--chat-primary)] hover:bg-transparent"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          
          <EmojiPickerWrapper onEmojiSelect={handleEmojiSelect} />
        </div>

        {/* Text input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isUploading}
            className={cn(
              "min-h-[44px] max-h-[150px] resize-none py-3 px-4",
              "bg-[var(--chat-background)]",
              "border-none rounded-2xl shadow-inner",
              "text-[var(--chat-text)]",
              "placeholder:text-[var(--chat-textMuted)]",
              "focus-visible:ring-1 focus-visible:ring-[var(--chat-primary)]"
            )}
            rows={1}
          />
        </div>

        {/* Action button (Send or Mic) */}
        <Button
          onClick={message.trim() || selectedFiles.length > 0 ? handleSend : handleVoiceRecord}
          disabled={disabled || isUploading}
          className={cn(
            "h-11 w-11 rounded-full p-0 flex-shrink-0 shadow-lg transition-all duration-200",
            message.trim() || selectedFiles.length > 0 
              ? "bg-[var(--chat-primary)] hover:bg-[var(--chat-accentHover)] scale-100" 
              : "bg-[var(--chat-primary)] hover:bg-[var(--chat-accentHover)]"
          )}
        >
          {isUploading ? (
            <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : message.trim() || selectedFiles.length > 0 ? (
            <Send className="h-5 w-5 ml-0.5 text-white" />
          ) : (
            <Mic className="h-5 w-5 text-white" />
          )}
        </Button>
      </div>

      {/* Helper text */}
      {settings.enterToSend && (
        <p className="text-xs text-[var(--chat-textMuted)] mt-2">
          Appuyez sur Entrée pour envoyer, Shift+Entrée pour une nouvelle ligne
        </p>
      )}
    </div>
  );
}
