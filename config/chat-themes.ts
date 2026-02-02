// config/chat-themes.ts
import type { ChatTheme, ChatThemePreset } from '@/types/chat';

/**
 * Premium chat themes with dark and light variants
 * Each theme is carefully designed for optimal readability and aesthetics
 */

// ============================================================================
// OCEAN THEME - Blue and teal tones
// ============================================================================

const oceanLight: ChatTheme = {
  id: 'ocean-light',
  name: 'Ocean',
  description: 'Calm blue and teal tones inspired by the ocean',
  dark: false,
  premium: true,
  colors: {
    primary: '#0891b2', // cyan-600
    secondary: '#06b6d4', // cyan-500
    background: '#f0f9ff', // sky-50
    surface: '#ffffff',
    surfaceHover: '#e0f2fe', // sky-100
    text: '#0c4a6e', // sky-900
    textSecondary: '#075985', // sky-800
    textMuted: '#0369a1', // sky-700
    messageSent: '#0891b2', // cyan-600
    messageReceived: '#e0f2fe', // sky-100
    messageSentText: '#ffffff',
    messageReceivedText: '#0c4a6e',
    border: '#bae6fd', // sky-200
    borderLight: '#e0f2fe', // sky-100
    accent: '#06b6d4', // cyan-500
    accentHover: '#0891b2', // cyan-600
    success: '#10b981', // emerald-500
    error: '#ef4444', // red-500
    warning: '#f59e0b', // amber-500
    info: '#3b82f6', // blue-500
    online: '#10b981', // emerald-500
    offline: '#94a3b8', // slate-400
  },
};

const oceanDark: ChatTheme = {
  ...oceanLight,
  id: 'ocean-dark',
  dark: true,
  colors: {
    ...oceanLight.colors,
    background: '#0c4a6e', // sky-900
    surface: '#075985', // sky-800
    surfaceHover: '#0369a1', // sky-700
    text: '#f0f9ff', // sky-50
    textSecondary: '#e0f2fe', // sky-100
    textMuted: '#bae6fd', // sky-200
    messageSent: '#0891b2', // cyan-600
    messageReceived: '#0369a1', // sky-700
    messageSentText: '#ffffff',
    messageReceivedText: '#f0f9ff',
    border: '#075985', // sky-800
    borderLight: '#0369a1', // sky-700
  },
};

// ============================================================================
// FOREST THEME - Green and earthy tones
// ============================================================================

const forestLight: ChatTheme = {
  id: 'forest-light',
  name: 'Forest',
  description: 'Natural green tones inspired by the forest',
  dark: false,
  premium: true,
  colors: {
    primary: '#059669', // emerald-600
    secondary: '#10b981', // emerald-500
    background: '#f0fdf4', // green-50
    surface: '#ffffff',
    surfaceHover: '#dcfce7', // green-100
    text: '#064e3b', // emerald-900
    textSecondary: '#065f46', // emerald-800
    textMuted: '#047857', // emerald-700
    messageSent: '#059669', // emerald-600
    messageReceived: '#dcfce7', // green-100
    messageSentText: '#ffffff',
    messageReceivedText: '#064e3b',
    border: '#bbf7d0', // green-200
    borderLight: '#dcfce7', // green-100
    accent: '#10b981', // emerald-500
    accentHover: '#059669', // emerald-600
    success: '#10b981', // emerald-500
    error: '#ef4444', // red-500
    warning: '#f59e0b', // amber-500
    info: '#3b82f6', // blue-500
    online: '#10b981', // emerald-500
    offline: '#94a3b8', // slate-400
  },
};

const forestDark: ChatTheme = {
  ...forestLight,
  id: 'forest-dark',
  dark: true,
  colors: {
    ...forestLight.colors,
    background: '#064e3b', // emerald-900
    surface: '#065f46', // emerald-800
    surfaceHover: '#047857', // emerald-700
    text: '#f0fdf4', // green-50
    textSecondary: '#dcfce7', // green-100
    textMuted: '#bbf7d0', // green-200
    messageSent: '#059669', // emerald-600
    messageReceived: '#047857', // emerald-700
    messageSentText: '#ffffff',
    messageReceivedText: '#f0fdf4',
    border: '#065f46', // emerald-800
    borderLight: '#047857', // emerald-700
  },
};

// ============================================================================
// SUNSET THEME - Orange and warm tones
// ============================================================================

const sunsetLight: ChatTheme = {
  id: 'sunset-light',
  name: 'Sunset',
  description: 'Warm orange and pink tones like a beautiful sunset',
  dark: false,
  premium: true,
  colors: {
    primary: '#ea580c', // orange-600
    secondary: '#f97316', // orange-500
    background: '#fff7ed', // orange-50
    surface: '#ffffff',
    surfaceHover: '#ffedd5', // orange-100
    text: '#7c2d12', // orange-900
    textSecondary: '#9a3412', // orange-800
    textMuted: '#c2410c', // orange-700
    messageSent: '#ea580c', // orange-600
    messageReceived: '#ffedd5', // orange-100
    messageSentText: '#ffffff',
    messageReceivedText: '#7c2d12',
    border: '#fed7aa', // orange-200
    borderLight: '#ffedd5', // orange-100
    accent: '#f97316', // orange-500
    accentHover: '#ea580c', // orange-600
    success: '#10b981', // emerald-500
    error: '#ef4444', // red-500
    warning: '#f59e0b', // amber-500
    info: '#3b82f6', // blue-500
    online: '#10b981', // emerald-500
    offline: '#94a3b8', // slate-400
  },
};

const sunsetDark: ChatTheme = {
  ...sunsetLight,
  id: 'sunset-dark',
  dark: true,
  colors: {
    ...sunsetLight.colors,
    background: '#7c2d12', // orange-900
    surface: '#9a3412', // orange-800
    surfaceHover: '#c2410c', // orange-700
    text: '#fff7ed', // orange-50
    textSecondary: '#ffedd5', // orange-100
    textMuted: '#fed7aa', // orange-200
    messageSent: '#ea580c', // orange-600
    messageReceived: '#c2410c', // orange-700
    messageSentText: '#ffffff',
    messageReceivedText: '#fff7ed',
    border: '#9a3412', // orange-800
    borderLight: '#c2410c', // orange-700
  },
};

// ============================================================================
// MIDNIGHT THEME - Purple and indigo tones
// ============================================================================

const midnightLight: ChatTheme = {
  id: 'midnight-light',
  name: 'Midnight',
  description: 'Deep purple and indigo tones for a mysterious vibe',
  dark: false,
  premium: true,
  colors: {
    primary: '#7c3aed', // violet-600
    secondary: '#8b5cf6', // violet-500
    background: '#faf5ff', // violet-50
    surface: '#ffffff',
    surfaceHover: '#f3e8ff', // violet-100
    text: '#4c1d95', // violet-900
    textSecondary: '#5b21b6', // violet-800
    textMuted: '#6d28d9', // violet-700
    messageSent: '#7c3aed', // violet-600
    messageReceived: '#f3e8ff', // violet-100
    messageSentText: '#ffffff',
    messageReceivedText: '#4c1d95',
    border: '#ddd6fe', // violet-200
    borderLight: '#f3e8ff', // violet-100
    accent: '#8b5cf6', // violet-500
    accentHover: '#7c3aed', // violet-600
    success: '#10b981', // emerald-500
    error: '#ef4444', // red-500
    warning: '#f59e0b', // amber-500
    info: '#3b82f6', // blue-500
    online: '#10b981', // emerald-500
    offline: '#94a3b8', // slate-400
  },
};

const midnightDark: ChatTheme = {
  ...midnightLight,
  id: 'midnight-dark',
  dark: true,
  colors: {
    ...midnightLight.colors,
    background: '#4c1d95', // violet-900
    surface: '#5b21b6', // violet-800
    surfaceHover: '#6d28d9', // violet-700
    text: '#faf5ff', // violet-50
    textSecondary: '#f3e8ff', // violet-100
    textMuted: '#ddd6fe', // violet-200
    messageSent: '#7c3aed', // violet-600
    messageReceived: '#6d28d9', // violet-700
    messageSentText: '#ffffff',
    messageReceivedText: '#faf5ff',
    border: '#5b21b6', // violet-800
    borderLight: '#6d28d9', // violet-700
  },
};

// ============================================================================
// CLASSIC THEME - Neutral gray tones
// ============================================================================

const classicLight: ChatTheme = {
  id: 'classic-light',
  name: 'Classic',
  description: 'Clean and professional neutral tones',
  dark: false,
  premium: false,
  colors: {
    primary: '#475569', // slate-600
    secondary: '#64748b', // slate-500
    background: '#f8fafc', // slate-50
    surface: '#ffffff',
    surfaceHover: '#f1f5f9', // slate-100
    text: '#0f172a', // slate-900
    textSecondary: '#1e293b', // slate-800
    textMuted: '#334155', // slate-700
    messageSent: '#475569', // slate-600
    messageReceived: '#f1f5f9', // slate-100
    messageSentText: '#ffffff',
    messageReceivedText: '#0f172a',
    border: '#cbd5e1', // slate-300
    borderLight: '#e2e8f0', // slate-200
    accent: '#64748b', // slate-500
    accentHover: '#475569', // slate-600
    success: '#10b981', // emerald-500
    error: '#ef4444', // red-500
    warning: '#f59e0b', // amber-500
    info: '#3b82f6', // blue-500
    online: '#10b981', // emerald-500
    offline: '#94a3b8', // slate-400
  },
};

const classicDark: ChatTheme = {
  ...classicLight,
  id: 'classic-dark',
  dark: true,
  colors: {
    ...classicLight.colors,
    background: '#0f172a', // slate-900
    surface: '#1e293b', // slate-800
    surfaceHover: '#334155', // slate-700
    text: '#f8fafc', // slate-50
    textSecondary: '#f1f5f9', // slate-100
    textMuted: '#e2e8f0', // slate-200
    messageSent: '#475569', // slate-600
    messageReceived: '#334155', // slate-700
    messageSentText: '#ffffff',
    messageReceivedText: '#f8fafc',
    border: '#1e293b', // slate-800
    borderLight: '#334155', // slate-700
  },
};

// ============================================================================
// DEFAULT THEME - App's default colors
// ============================================================================

const defaultLight: ChatTheme = {
  id: 'default-light',
  name: 'Default',
  description: 'Application default theme',
  dark: false,
  premium: false,
  colors: {
    primary: 'hsl(var(--primary))',
    secondary: 'hsl(var(--secondary))',
    background: 'hsl(var(--background))',
    surface: 'hsl(var(--card))',
    surfaceHover: 'hsl(var(--accent))',
    text: 'hsl(var(--foreground))',
    textSecondary: 'hsl(var(--foreground))',
    textMuted: 'hsl(var(--muted-foreground))',
    messageSent: 'hsl(var(--primary))',
    messageReceived: 'hsl(var(--muted))',
    messageSentText: 'hsl(var(--primary-foreground))',
    messageReceivedText: 'hsl(var(--foreground))',
    border: 'hsl(var(--border))',
    borderLight: 'hsl(var(--border))',
    accent: 'hsl(var(--accent))',
    accentHover: 'hsl(var(--accent))',
    success: 'hsl(var(--success))',
    error: 'hsl(var(--destructive))',
    warning: 'hsl(var(--warning))',
    info: 'hsl(var(--info))',
    online: '#10b981',
    offline: '#94a3b8',
  },
};

const defaultDark: ChatTheme = {
  ...defaultLight,
  id: 'default-dark',
  dark: true,
};

// ============================================================================
// THEME REGISTRY
// ============================================================================

export const CHAT_THEMES: Record<ChatThemePreset, ChatTheme> = {
  'ocean-light': oceanLight,
  'ocean-dark': oceanDark,
  'forest-light': forestLight,
  'forest-dark': forestDark,
  'sunset-light': sunsetLight,
  'sunset-dark': sunsetDark,
  'midnight-light': midnightLight,
  'midnight-dark': midnightDark,
  'classic-light': classicLight,
  'classic-dark': classicDark,
  'default-light': defaultLight,
  'default-dark': defaultDark,
};

/**
 * Get all available themes
 */
export const getAllThemes = (): ChatTheme[] => {
  return Object.values(CHAT_THEMES);
};

/**
 * Get theme by ID
 */
export const getThemeById = (id: ChatThemePreset): ChatTheme => {
  return CHAT_THEMES[id] || CHAT_THEMES['default-light'];
};

/**
 * Get theme variant (light/dark)
 */
export const getThemeVariant = (themeId: ChatThemePreset, dark: boolean): ChatTheme => {
  const baseName = themeId.replace(/-light|-dark$/, '');
  const variantId = `${baseName}-${dark ? 'dark' : 'light'}` as ChatThemePreset;
  return CHAT_THEMES[variantId] || CHAT_THEMES['default-light'];
};

/**
 * Get premium themes only
 */
export const getPremiumThemes = (): ChatTheme[] => {
  return getAllThemes().filter(theme => theme.premium);
};

/**
 * Default chat settings
 */
export const DEFAULT_CHAT_SETTINGS = {
  themeId: 'default-light' as ChatThemePreset,
  darkMode: false,
  notifications: true,
  soundEnabled: true,
  enterToSend: true,
  showOnlineStatus: true,
  showTypingIndicators: true,
  showReadReceipts: true,
  compressImages: true,
};
