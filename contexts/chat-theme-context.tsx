// contexts/chat-theme-context.tsx
"use client";

import React, { createContext, useContext, type ReactNode } from "react";
import { useChatTheme } from "@/hooks/use-chat-theme";
import type { ChatTheme, ChatThemePreset, ChatSettings } from "@/types/chat";

interface ChatThemeContextValue {
  settings: ChatSettings;
  currentTheme: ChatTheme;
  isDark: boolean;
  setTheme: (themeId: ChatThemePreset) => void;
  toggleDarkMode: () => void;
  setDarkMode: (dark: boolean) => void;
  updateSetting: <K extends keyof ChatSettings>(
    key: K,
    value: ChatSettings[K]
  ) => void;
  updateSettings: (updates: Partial<ChatSettings>) => void;
  resetSettings: () => void;
}

const ChatThemeContext = createContext<ChatThemeContextValue | null>(null);

export function ChatThemeProvider({ children }: { children: ReactNode }) {
  const themeState = useChatTheme();

  return (
    <ChatThemeContext.Provider value={themeState}>
      {children}
    </ChatThemeContext.Provider>
  );
}

export function useChatThemeContext() {
  const context = useContext(ChatThemeContext);
  if (!context) {
    throw new Error(
      "useChatThemeContext must be used within ChatThemeProvider"
    );
  }
  return context;
}
