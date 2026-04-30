// hooks/use-chat-theme.ts
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ChatTheme, ChatThemePreset, ChatSettings } from '@/types/chat';
import { 
  CHAT_THEMES, 
  getThemeById, 
  getThemeVariant,
  DEFAULT_CHAT_SETTINGS 
} from '@/config/chat-themes';
import { useTheme } from 'next-themes';

const STORAGE_KEY = 'chat-settings';

/**
 * Hook for managing chat theme and settings
 * Persists theme selection to localStorage
 */
export function useChatTheme() {
  // Initialize settings from localStorage or defaults
  const [settings, setSettings] = useState<ChatSettings>(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_CHAT_SETTINGS;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_CHAT_SETTINGS, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load chat settings:', error);
    }

    return DEFAULT_CHAT_SETTINGS;
  });

  const { resolvedTheme } = useTheme();

  // Sync with global theme
  useEffect(() => {
    if (resolvedTheme === 'dark' || resolvedTheme === 'light') {
      const isDark = resolvedTheme === 'dark';
      if (settings.darkMode !== isDark) {
        setSettings((prev) => ({ ...prev, darkMode: isDark }));
      }
    }
  }, [resolvedTheme]);

  // Get current theme based on settings
  const currentTheme = useMemo<ChatTheme>(() => {
    return getThemeVariant(settings.themeId, settings.darkMode);
  }, [settings.themeId, settings.darkMode]);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save chat settings:', error);
    }
  }, [settings]);

  // Apply theme CSS variables to document
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    const colors = currentTheme.colors;

    // Apply all theme colors as CSS variables
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--chat-${key}`, value);
    });

    // Add dark mode class if needed
    if (currentTheme.dark) {
      root.classList.add('chat-dark');
    } else {
      root.classList.remove('chat-dark');
    }

    return () => {
      // Cleanup: remove chat-specific classes
      root.classList.remove('chat-dark');
    };
  }, [currentTheme]);

  /**
   * Set theme by ID
   */
  const setTheme = useCallback((themeId: ChatThemePreset) => {
    setSettings((prev) => ({
      ...prev,
      themeId,
    }));
  }, []);

  /**
   * Toggle dark mode
   */
  const toggleDarkMode = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      darkMode: !prev.darkMode,
    }));
  }, []);

  /**
   * Set dark mode explicitly
   */
  const setDarkMode = useCallback((dark: boolean) => {
    setSettings((prev) => ({
      ...prev,
      darkMode: dark,
    }));
  }, []);

  /**
   * Update a specific setting
   */
  const updateSetting = useCallback(<K extends keyof ChatSettings>(
    key: K,
    value: ChatSettings[K]
  ) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  /**
   * Update multiple settings at once
   */
  const updateSettings = useCallback((updates: Partial<ChatSettings>) => {
    setSettings((prev) => ({
      ...prev,
      ...updates,
    }));
  }, []);

  /**
   * Reset to default settings
   */
  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_CHAT_SETTINGS);
  }, []);

  /**
   * Get theme preview (for theme selector)
   */
  const getThemePreview = useCallback((themeId: ChatThemePreset): ChatTheme => {
    return getThemeById(themeId);
  }, []);

  return {
    // Current state
    settings,
    currentTheme,
    isDark: settings.darkMode,

    // Theme actions
    setTheme,
    toggleDarkMode,
    setDarkMode,
    getThemePreview,

    // Settings actions
    updateSetting,
    updateSettings,
    resetSettings,

    // All available themes
    themes: CHAT_THEMES,
  };
}
