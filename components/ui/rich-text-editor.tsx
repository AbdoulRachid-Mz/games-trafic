"use client";

import React, { useState, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Color from "@tiptap/extension-color";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Toolbar } from "./toolbar";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  disabled?: boolean;
  maxLength?: number;
  className?: string;
  showToolbar?: boolean;
  toolbarPosition?: 'top' | 'bottom' | 'floating';
  minHeight?: string;
  maxHeight?: string;
  variant?: 'default' | 'compact' | 'minimal';
  allowedFormats?: string[];
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Écrivez quelque chose...",
  onKeyDown,
  disabled = false,
  maxLength = 1000,
  className,
  showToolbar = true,
  toolbarPosition = 'top',
  minHeight = "100px",
  maxHeight = "400px",
  variant = 'default',
  allowedFormats = ['bold', 'italic', 'underline', 'link', 'image', 'list', 'heading'],
}: RichTextEditorProps) {
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const extensions = [
    StarterKit.configure({
      heading: allowedFormats.includes('heading') ? {
        levels: [1, 2, 3]
      } : false,
      code: allowedFormats.includes('code') ? {} : false,
      codeBlock: allowedFormats.includes('codeBlock') ? {} : false,
      blockquote: allowedFormats.includes('blockquote') ? {} : false,
      horizontalRule: allowedFormats.includes('hr') ? {} : false,
    }),
    ...(allowedFormats.includes('link') ? [Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: "text-primary underline hover:text-primary/80",
      },
    })] : []),
    ...(allowedFormats.includes('image') ? [Image] : []),
    Placeholder.configure({
      placeholder,
    }),
    ...(allowedFormats.includes('underline') ? [Underline] : []),
    ...(allowedFormats.includes('textAlign') ? [TextAlign.configure({
      types: ['heading', 'paragraph'],
    })] : []),
    ...(allowedFormats.includes('highlight') ? [Highlight] : []),
    ...(allowedFormats.includes('color') ? [Color] : []),
  ];

  const editor = useEditor({
    extensions,
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
    editable: !disabled,
    immediatelyRender: false,
  });

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    onKeyDown?.(e);
  }, [onKeyDown]);

  const addLink = () => {
    if (linkUrl && editor) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl("");
      setShowLinkDialog(false);
    }
  };

  const addImage = () => {
    if (imageUrl && editor) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl("");
      setShowImageDialog(false);
    }
  };

  const characterCount = editor?.storage.characterCount?.characters() || 0;

  if (!editor) {
    return null;
  }

  const editorClasses = cn(
    "rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background",
    "focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2",
    disabled && "cursor-not-allowed opacity-50",
    className
  );

  return (
    <div className="relative">
      {/* Top Toolbar */}
      {showToolbar && toolbarPosition === 'top' && editor && (
        <Toolbar
          editor={editor}
          variant={variant}
          allowedFormats={allowedFormats}
          onAddLink={() => setShowLinkDialog(true)}
          onAddImage={() => setShowImageDialog(true)}
        />
      )}

      {/* Editor Content */}
      <div
        className={editorClasses}
        style={{
          minHeight: minHeight,
          maxHeight: maxHeight,
          overflowY: 'auto'
        }}
      >
        <EditorContent
          editor={editor}
          onKeyDown={handleKeyDown}
        />
      </div>

      {/* Bottom Toolbar */}
      {showToolbar && toolbarPosition === 'bottom' && editor && (
        <Toolbar
          editor={editor}
          variant={variant}
          allowedFormats={allowedFormats}
          onAddLink={() => setShowLinkDialog(true)}
          onAddImage={() => setShowImageDialog(true)}
          className="mt-2"
        />
      )}

      {/* Floating Toolbar */}
      {showToolbar && toolbarPosition === 'floating' && editor && (
        <div className="absolute bottom-2 left-2 right-2">
          <Toolbar
            editor={editor}
            variant={variant}
            allowedFormats={allowedFormats}
            onAddLink={() => setShowLinkDialog(true)}
            onAddImage={() => setShowImageDialog(true)}
            className="bg-background/95 backdrop-blur-sm border rounded-lg p-2"
          />
        </div>
      )}

      {/* Character Counter */}
      {maxLength && (
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>Supporte les liens, images et mise en forme</span>
          <span className={cn(
            characterCount > maxLength * 0.9 && "text-amber-500",
            characterCount > maxLength && "text-red-500"
          )}>
            {characterCount}/{maxLength}
          </span>
        </div>
      )}

      {/* Link Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un lien</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="link-url">URL du lien</Label>
              <Input
                id="link-url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addLink();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
              Annuler
            </Button>
            <Button onClick={addLink} disabled={!linkUrl.trim()}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter une image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="image-url">URL de l'image</Label>
              <Input
                id="image-url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addImage();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImageDialog(false)}>
              Annuler
            </Button>
            <Button onClick={addImage} disabled={!imageUrl.trim()}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}