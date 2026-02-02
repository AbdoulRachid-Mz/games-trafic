// components/pages/chats/theme-selector.tsx
"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useChatThemeContext } from "@/contexts/chat-theme-context";
import { getAllThemes } from "@/config/chat-themes";
import type { ChatThemePreset } from "@/types/chat";
import { cn } from "@/lib/utils";
import { Check, Moon, Sun, Palette } from "lucide-react";
import { motion } from "framer-motion";
import {Sheet, SheetContent, SheetHeader, SheetFooter, SheetDescription, SheetTitle, SheetClose, SheetTrigger} from "@/components/ui/sheet"

interface ThemeSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ThemeSelector({ open, onOpenChange }: ThemeSelectorProps) {
  const { settings, currentTheme, setTheme, isDark, toggleDarkMode } =
    useChatThemeContext();
  const [previewTheme, setPreviewTheme] = useState<ChatThemePreset | null>(
    null
  );

  const themes = getAllThemes();

  // Group themes by base name
  const themeGroups = themes.reduce((acc, theme) => {
    const baseName = theme.id.replace(/-light|-dark$/, "");
    if (!acc[baseName]) {
      acc[baseName] = [];
    }
    acc[baseName].push(theme);
    return acc;
  }, {} as Record<string, typeof themes>);

  const handleThemeSelect = (themeId: ChatThemePreset) => {
    setTheme(themeId);
    setPreviewTheme(null);
  };

  const handlePreview = (themeId: ChatThemePreset) => {
    setPreviewTheme(themeId);
  };

  const displayTheme = previewTheme
    ? themes.find((t) => t.id === previewTheme) || currentTheme
    : currentTheme;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="max-md:w-[95%]  h-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Chat Themes
          </SheetTitle>
          <SheetDescription>
            Choose a theme to customize your chat experience
          </SheetDescription>
        </SheetHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100%-80px)]">
          {/* Theme Preview */}
          <div className="md:col-span-1">
            <div className="sticky top-0 space-y-4">
              <div className="flex items-center justify-between">
                <Label>Dark Mode</Label>
                <Switch checked={isDark} onCheckedChange={toggleDarkMode} />
              </div>

              <div
                className="rounded-lg border-2 p-4 space-y-3"
                style={{
                  backgroundColor: displayTheme.colors.background,
                  borderColor: displayTheme.colors.border,
                }}
              >
                <div className="flex items-center gap-2">
                  {isDark ? (
                    <Moon
                      className="h-4 w-4"
                      style={{ color: displayTheme.colors.text }}
                    />
                  ) : (
                    <Sun
                      className="h-4 w-4"
                      style={{ color: displayTheme.colors.text }}
                    />
                  )}
                  <span
                    className="font-semibold text-sm"
                    style={{ color: displayTheme.colors.text }}
                  >
                    {displayTheme.name}
                  </span>
                </div>

                {/* Preview messages */}
                <div className="space-y-2">
                  <div className="flex justify-end">
                    <div
                      className="px-3 py-2 rounded-lg text-xs max-w-[80%]"
                      style={{
                        backgroundColor: displayTheme.colors.messageSent,
                        color: displayTheme.colors.messageSentText,
                      }}
                    >
                      Sent message preview
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div
                      className="px-3 py-2 rounded-lg text-xs max-w-[80%]"
                      style={{
                        backgroundColor: displayTheme.colors.messageReceived,
                        color: displayTheme.colors.messageReceivedText,
                      }}
                    >
                      Received message preview
                    </div>
                  </div>
                </div>

                <div
                  className="text-xs"
                  style={{ color: displayTheme.colors.textMuted }}
                >
                  {displayTheme.description}
                </div>
              </div>
            </div>
          </div>

          {/* Theme List */}
          <div className="md:col-span-2">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-4">
                {Object.entries(themeGroups).map(([baseName, groupThemes]) => {
                  const lightTheme = groupThemes.find((t) => !t.dark);
                  const darkTheme = groupThemes.find((t) => t.dark);
                  const themeToShow = isDark ? darkTheme : lightTheme;

                  if (!themeToShow) return null;

                  const isActive = currentTheme.id === themeToShow.id;
                  const isPremium = themeToShow.premium;

                  return (
                    <motion.div
                      key={baseName}
                      whileHover={{ scale: 1.02 }}
                      className={cn(
                        "relative rounded-lg border-2 p-4 cursor-pointer transition-all",
                        isActive && "ring-2 ring-offset-2"
                      )}
                      style={{
                        backgroundColor: themeToShow.colors.surface,
                        borderColor: isActive
                          ? themeToShow.colors.primary
                          : themeToShow.colors.border,
                        // ringColor removed - handled by Tailwind ring classes
                      }}
                      onClick={() =>
                        handleThemeSelect(themeToShow.id as ChatThemePreset)
                      }
                      onMouseEnter={() =>
                        handlePreview(themeToShow.id as ChatThemePreset)
                      }
                      onMouseLeave={() => setPreviewTheme(null)}
                    >
                      {/* Active indicator */}
                      {isActive && (
                        <div
                          className="absolute top-2 right-2 rounded-full p-1"
                          style={{
                            backgroundColor: themeToShow.colors.primary,
                          }}
                        >
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}

                      {/* Premium badge */}
                      {isPremium && (
                        <div className="absolute top-2 left-2">
                          <span
                            className="text-xs font-semibold px-2 py-1 rounded-full"
                            style={{
                              backgroundColor: themeToShow.colors.accent,
                              color: themeToShow.colors.messageSentText,
                            }}
                          >
                            Premium
                          </span>
                        </div>
                      )}

                      <div className="space-y-3 mt-6">
                        <h3
                          className="font-semibold"
                          style={{ color: themeToShow.colors.text }}
                        >
                          {themeToShow.name}
                        </h3>

                        {/* Color palette preview */}
                        <div className="flex gap-2">
                          <div
                            className="h-8 w-8 rounded-full border"
                            style={{
                              backgroundColor: themeToShow.colors.primary,
                              borderColor: themeToShow.colors.border,
                            }}
                          />
                          <div
                            className="h-8 w-8 rounded-full border"
                            style={{
                              backgroundColor: themeToShow.colors.messageSent,
                              borderColor: themeToShow.colors.border,
                            }}
                          />
                          <div
                            className="h-8 w-8 rounded-full border"
                            style={{
                              backgroundColor:
                                themeToShow.colors.messageReceived,
                              borderColor: themeToShow.colors.border,
                            }}
                          />
                          <div
                            className="h-8 w-8 rounded-full border"
                            style={{
                              backgroundColor: themeToShow.colors.accent,
                              borderColor: themeToShow.colors.border,
                            }}
                          />
                        </div>

                        <p
                          className="text-sm"
                          style={{ color: themeToShow.colors.textMuted }}
                        >
                          {themeToShow.description}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
