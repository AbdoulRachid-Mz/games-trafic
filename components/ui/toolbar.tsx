"use client";

import React, { JSX } from "react";
import { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Palette,
  Highlighter,
  Minus,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ToolbarProps {
  editor: Editor;
  variant?: 'default' | 'compact' | 'minimal';
  allowedFormats?: string[];
  onAddLink?: () => void;
  onAddImage?: () => void;
  className?: string;
}

export function Toolbar({ 
  editor, 
  variant = 'default', 
  allowedFormats = ['bold', 'italic', 'underline', 'link', 'image', 'list', 'heading'],
  onAddLink,
  onAddImage,
  className 
}: ToolbarProps) {
  if (!editor) {
    return null;
  }

  const ToolbarButton = ({
    onClick,
    isActive = false,
    disabled = false,
    children,
    title,
    activeVariant = "default",
  }: {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title: string;
    activeVariant?: "default" | "destructive";
  }) => (
    <Button
      variant={isActive ? activeVariant : "ghost"}
      size="sm"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "h-8 w-8 p-0",
        isActive && activeVariant === "default" && "bg-primary text-primary-foreground",
        isActive && activeVariant === "destructive" && "bg-destructive text-destructive-foreground",
      )}
    >
      {children}
    </Button>
  );

  const renderButton = (format: string, button: JSX.Element) => {
    if (!allowedFormats.includes(format)) return null;
    return button;
  };

  if (variant === 'minimal') {
    return (
      <div className={cn("flex items-center gap-1 p-2", className)}>
        {renderButton('bold', (
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
            title="Gras (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
        ))}
        
        {renderButton('italic', (
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
            title="Italique (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
        ))}
        
        {onAddLink && renderButton('link', (
          <ToolbarButton
            onClick={onAddLink}
            title="Insérer un lien"
          >
            <LinkIcon className="h-4 w-4" />
          </ToolbarButton>
        ))}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn("flex flex-wrap items-center gap-1 p-2", className)}>
        {/* Text Formatting */}
        <div className="flex gap-1">
          {renderButton('bold', (
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive("bold")}
              title="Gras"
            >
              <Bold className="h-4 w-4" />
            </ToolbarButton>
          ))}
          
          {renderButton('italic', (
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive("italic")}
              title="Italique"
            >
              <Italic className="h-4 w-4" />
            </ToolbarButton>
          ))}
          
          {renderButton('underline', (
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              isActive={editor.isActive("underline")}
              title="Souligné"
            >
              <UnderlineIcon className="h-4 w-4" />
            </ToolbarButton>
          ))}
        </div>

        {/* Headings */}
        {renderButton('heading', (
          <div className="flex gap-1">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              isActive={editor.isActive("heading", { level: 1 })}
              title="Titre 1"
            >
              <Heading1 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              isActive={editor.isActive("heading", { level: 2 })}
              title="Titre 2"
            >
              <Heading2 className="h-4 w-4" />
            </ToolbarButton>
          </div>
        ))}

        {/* Lists */}
        {renderButton('list', (
          <div className="flex gap-1">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive("bulletList")}
              title="Liste à puces"
            >
              <List className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive("orderedList")}
              title="Liste numérotée"
            >
              <ListOrdered className="h-4 w-4" />
            </ToolbarButton>
          </div>
        ))}

        {/* Insert */}
        <div className="flex gap-1">
          {onAddLink && renderButton('link', onAddLink && (
            <ToolbarButton
              onClick={onAddLink}
              title="Insérer un lien"
            >
              <LinkIcon className="h-4 w-4" />
            </ToolbarButton>
          ))}
          
          {onAddImage && renderButton('image', onAddImage && (
            <ToolbarButton
              onClick={onAddImage}
              title="Insérer une image"
            >
              <ImageIcon className="h-4 w-4" />
            </ToolbarButton>
          ))}
        </div>

        {/* Undo/Redo */}
        <div className="flex gap-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Annuler"
          >
            <Undo className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Rétablir"
          >
            <Redo className="h-4 w-4" />
          </ToolbarButton>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn("flex flex-wrap items-center gap-1 p-2 border-b", className)}>
      {/* Text Formatting */}
      <div className="flex gap-1 border-r pr-2">
        {renderButton('bold', (
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
            title="Gras"
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
        ))}
        
        {renderButton('italic', (
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
            title="Italique"
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
        ))}
        
        {renderButton('underline', (
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive("underline")}
            title="Souligné"
          >
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarButton>
        ))}
        
        {renderButton('strikethrough', (
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive("strike")}
            title="Barré"
          >
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>
        ))}
        
        {renderButton('code', (
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive("code")}
            title="Code"
          >
            <Code className="h-4 w-4" />
          </ToolbarButton>
        ))}
      </div>

      {/* Headings */}
      {renderButton('heading', (
        <div className="flex gap-1 border-r pr-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive("heading", { level: 1 })}
            title="Titre 1"
          >
            <Heading1 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive("heading", { level: 2 })}
            title="Titre 2"
          >
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive("heading", { level: 3 })}
            title="Titre 3"
          >
            <Heading3 className="h-4 w-4" />
          </ToolbarButton>
        </div>
      ))}

      {/* Lists */}
      {renderButton('list', (
        <div className="flex gap-1 border-r pr-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive("bulletList")}
            title="Liste à puces"
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive("orderedList")}
            title="Liste numérotée"
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive("blockquote")}
            title="Citation"
          >
            <Quote className="h-4 w-4" />
          </ToolbarButton>
        </div>
      ))}

      {/* Alignment */}
      {renderButton('textAlign', (
        <div className="flex gap-1 border-r pr-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            isActive={editor.isActive({ textAlign: "left" })}
            title="Aligner à gauche"
          >
            <AlignLeft className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            isActive={editor.isActive({ textAlign: "center" })}
            title="Centrer"
          >
            <AlignCenter className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            isActive={editor.isActive({ textAlign: "right" })}
            title="Aligner à droite"
          >
            <AlignRight className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("justify").run()}
            isActive={editor.isActive({ textAlign: "justify" })}
            title="Justifier"
          >
            <AlignJustify className="h-4 w-4" />
          </ToolbarButton>
        </div>
      ))}

      {/* Insert */}
      <div className="flex gap-1 border-r pr-2">
        {onAddLink && renderButton('link', onAddLink && (
          <ToolbarButton
            onClick={onAddLink}
            title="Insérer un lien"
          >
            <LinkIcon className="h-4 w-4" />
          </ToolbarButton>
        ))}
        
        {onAddImage && renderButton('image', onAddImage && (
          <ToolbarButton
            onClick={onAddImage}
            title="Insérer une image"
          >
            <ImageIcon className="h-4 w-4" />
          </ToolbarButton>
        ))}
        
        {renderButton('hr', (
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Ligne horizontale"
          >
            <Minus className="h-4 w-4" />
          </ToolbarButton>
        ))}
      </div>

      {/* Colors */}
      {renderButton('color', (
        <div className="flex gap-1 border-r pr-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().setColor('#958DF1').run()}
            isActive={editor.isActive("textStyle", { color: '#958DF1' })}
            title="Couleur du texte"
          >
            <Type className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            isActive={editor.isActive("highlight")}
            title="Surlignage"
          >
            <Highlighter className="h-4 w-4" />
          </ToolbarButton>
        </div>
      ))}

      {/* Undo/Redo */}
      <div className="flex gap-1">
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Annuler"
        >
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Rétablir"
        >
          <Redo className="h-4 w-4" />
        </ToolbarButton>
      </div>
    </div>
  );
}