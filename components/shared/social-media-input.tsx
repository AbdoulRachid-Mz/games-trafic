"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Link2,
  MessageSquare,
  Disc3,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SocialMediaInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  className?: string;
  disabled?: boolean;
}

export function SocialMediaInput({
  value,
  onChange,
  className,
  disabled = false,
}: SocialMediaInputProps) {
  const [newLink, setNewLink] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState("");

  const platforms = [
    {
      name: "Facebook",
      icon: <Facebook className="h-4 w-4" />,
      prefix: "https://facebook.com/",
    },
    {
      name: "Instagram",
      icon: <Instagram className="h-4 w-4" />,
      prefix: "https://instagram.com/",
    },
    {
      name: "Twitter",
      icon: <Twitter className="h-4 w-4" />,
      prefix: "https://twitter.com/",
    },
    {
      name: "TikTok",
      icon: <MessageSquare className="h-4 w-4" />,
      prefix: "https://tiktok.com/@",
    },
    {
      name: "YouTube",
      icon: <Youtube className="h-4 w-4" />,
      prefix: "https://youtube.com/",
    },
    {
      name: "Discord",
      icon: <Disc3 className="h-4 w-4" />,
      prefix: "https://discord.gg/",
    },
    { name: "Autre", icon: <Link2 className="h-4 w-4" />, prefix: "https://" },
  ];

  const addLink = () => {
    if (newLink.trim() && !disabled) {
      const fullLink =
        selectedPlatform === "Autre" || newLink.startsWith("http")
          ? newLink
          : platforms.find((p) => p.name === selectedPlatform)?.prefix +
            newLink;

      onChange([...value, fullLink]);
      setNewLink("");
      setIsAdding(false);
      setSelectedPlatform("");
    }
  };

  const removeLink = (index: number) => {
    if (!disabled) {
      onChange(value.filter((_, i) => i !== index));
    }
  };

  const startAdding = (platform: string) => {
    if (!disabled) {
      setSelectedPlatform(platform);
      setIsAdding(true);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap gap-2">
        {value.map((link, index) => (
          <div
            key={index}
            className={cn(
              "flex items-center gap-2 bg-muted px-3 py-1 rounded-full",
              disabled && "opacity-70"
            )}
          >
            <a
              href={link.startsWith("http") ? link : `https://${link}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm hover:underline flex items-center gap-1"
            >
              {platforms.find((p) =>
                link.includes(p.prefix.replace("https://", ""))
              )?.icon || <Link2 className="h-3 w-3" />}
              {link.length > 20 ? `${link.substring(0, 20)}...` : link}
            </a>
            {!disabled && (
              <button
                type="button"
                onClick={() => removeLink(index)}
                className="text-muted-foreground hover:text-destructive ml-1"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {!disabled && (
        <>
          {!isAdding ? (
            <div className="flex flex-wrap gap-2">
              {platforms.map((platform) => (
                <button
                  key={platform.name}
                  type="button"
                  onClick={() => startAdding(platform.name)}
                  className="flex items-center gap-2 px-3 py-2 border rounded-md text-sm hover:bg-accent"
                >
                  {platform.icon}
                  {platform.name}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex gap-2 items-center">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {platforms.find((p) => p.name === selectedPlatform)?.icon}
                {selectedPlatform}
              </div>
              <Input
                type="text"
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                placeholder={
                  selectedPlatform === "Autre"
                    ? "https://example.com"
                    : `nomdutilisateur`
                }
                className="flex-1"
                disabled={disabled}
              />
              <Button type="button" onClick={addLink} size="sm">
                Ajouter
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAdding(false);
                  setSelectedPlatform("");
                }}
                size="sm"
              >
                Annuler
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}