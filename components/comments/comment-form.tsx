"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, Loader2, X, Smile, Image, Link, Hash } from "lucide-react";
import { toast } from "sonner";
import { useAuthContext } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { useCreateMessage, useMessages, useUpdateMessage } from "@/hooks/use-messages";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { NewMessage } from "@/database/schema";
import { createMessage, updateMessage } from "@/actions/messages";
// import { RichTextEditor } from "./rich-text-editor";

interface CommentFormProps {
  entityId: string;
  entityType: string;
  parentId?: string;
  initialContent?: string;
  commentId?: string;
  onCommentAdded?: () => void;
  onCancel?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  showActions?: boolean;
}

export function CommentForm({
  entityId,
  entityType,
  parentId,
  initialContent = "",
  commentId,
  onCommentAdded,
  onCancel,
  placeholder = "Qu'en pensez-vous ?",
  autoFocus = false,
  className,
  showActions = true,
}: CommentFormProps) {
  const [content, setContent] = useState(initialContent);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { user } = useAuthContext();
  const formRef = useRef<HTMLFormElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);



  const isEditMode = !!commentId;

  useEffect(() => {
    if (autoFocus && formRef.current) {
      const textarea = formRef.current.querySelector("textarea");
      textarea?.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEmojiClick = (emojiData: any) => {
    setContent(prev => prev + emojiData.emoji);
  };

  const { mutate: createComment } = useCreateMessage();
  const { mutate: updateComment } = useUpdateMessage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedContent = content.trim();

    if (!trimmedContent) {
      toast.error("Le commentaire ne peut pas être vide");
      return;
    }

    if (!user) {
      toast.error("Vous devez être connecté pour commenter.");
      return;
    }

    setIsSubmitting(true);

    if (isEditMode && commentId) {
      updateComment(
        { id: commentId, data: { content: trimmedContent } },
        {
          onSuccess: () => {
            setContent("");
            if (onCommentAdded) onCommentAdded();
            if (onCancel) onCancel();
            setIsSubmitting(false);
          },
          onError: () => {
            setIsSubmitting(false);
          },
        }
      );
    } else {
      createComment(
        {
          content: trimmedContent,
          senderId: parentId,
          entityId,
          entityType,
          parentId,
        } as NewMessage,
        {
          onSuccess: () => {
            setContent("");
            if (onCommentAdded) onCommentAdded();
            if (onCancel) onCancel();
            setIsSubmitting(false);
          },
          onError: () => {
            setIsSubmitting(false);
          },
        }
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
    if (e.key === "Escape" && onCancel) {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className={cn("relative", className)}
    >
      <div className="relative rounded-2xl border border-input bg-background p-3 shadow-sm transition-colors focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
        <RichTextEditor
          value={content}
          onChange={setContent}
          placeholder={placeholder}
          onKeyDown={handleKeyDown}
          disabled={isSubmitting}
          maxLength={1000}
          className="min-h-[80px]"
          variant="compact"
          toolbarPosition="bottom"
          allowedFormats={['bold', 'italic', 'underline', 'link', 'image']}
          minHeight="80px"
          maxHeight="200px"
        />

        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <Smile className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <Image className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <Link className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <Hash className="h-4 w-4" />
            </Button>

            <span className="text-xs text-muted-foreground ml-2">
              {content.length}/1000
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
            )}

            <Button
              type="submit"
              size="sm"
              disabled={!content.trim() || isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {isEditMode ? "Modifier" : "Commenter"}
            </Button>
          </div>
        </div>
      </div>

      {showEmojiPicker && (
        <div ref={emojiPickerRef} className="absolute z-50 bottom-14 left-0">
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            autoFocusSearch={false}
            theme={Theme.AUTO}
            previewConfig={{ showPreview: false }}
            width={300}
          />
        </div>
      )}

      {showActions && (
        <div className="mt-2 text-xs text-muted-foreground">
          <span>
            Appuyez sur <kbd className="px-1 py-0.5 bg-muted rounded">⌘ + Enter</kbd>{" "}
            pour envoyer
          </span>
        </div>
      )}
    </form>
  );
}