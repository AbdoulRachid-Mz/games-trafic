// lib/chat-utils.ts
import type { 
  ChatId, 
  ParsedChatId, 
  ChatEntityType, 
  MediaUploadLimits, 
  GroupLimits,
  ChatUserRole,
  ValidationResult 
} from '@/types/chat';
import type { User } from '@/database/schema';

/**
 * Format a chat ID from entity type and ID
 * @param type - Entity type
 * @param id - Entity ID
 * @returns Formatted chat ID
 */
export function formatChatId(type: ChatEntityType, id: string): ChatId {
  if (!type || !id) {
    throw new Error('Invalid chat ID parameters');
  }
  return `${type}:${id}` as ChatId;
}

/**
 * Parse a chat ID into its components
 * @param chatId - Chat ID to parse
 * @param userId - Current user ID for DM resolution
 * @returns Parsed chat ID or null if invalid
 */
export function parseChatId(chatId: string, userId?: string): ParsedChatId | null {
  if (!chatId || typeof chatId !== 'string') {
    return null;
  }

  const parts = chatId.split(':');
  if (parts.length !== 2) {
    return null;
  }

  const [type, id] = parts;
  // Support dm:user1-user2 format
  let mappedType: ChatEntityType = type as ChatEntityType;
  let mappedId = id;
  
  if (type === 'dm') {
    // Pour les DMs, on considère que c'est une conversation user
    mappedType = 'user';
    const ids = id.split('-');

    if (userId) {
      mappedId = ids.find(pid => pid !== userId) || ids[0];
    } else {
      mappedId = ids[0];
    }
  }
  
  const validTypes: ChatEntityType[] = ['user', 'group', 'shop', 'tournament'];
  
  if (!validTypes.includes(mappedType)) {
    return null;
  }

  return {
    type: mappedType,
    id: mappedId,
  };
}

/**
 * Validate a chat ID
 * @param chatId - Chat ID to validate
 * @param userId - Current user ID for DM resolution
 * @returns Validation result
 */
export function validateChatId(chatId: string, userId?: string): ValidationResult {
  const parsed = parseChatId(chatId, userId);
  
  if (!parsed) {
    return {
      valid: false,
      error: 'Invalid chat ID format. Expected format: "type:id"',
    };
  }

  if (!parsed.id || parsed.id.trim() === '') {
    return {
      valid: false,
      error: 'Chat ID cannot be empty',
    };
  }

  return { valid: true };
}

/**
 * Get user role for chat permissions
 * @param user - User object
 * @returns User role
 */
export function getUserRole(user: User | null): ChatUserRole {
  if (!user) return 'regular';
  if (user.isAdmin) return 'admin';
  if (user.isVip) return 'vip';
  return 'regular';
}

/**
 * Get media upload limits based on user role
 * @param user - User object
 * @returns Media upload limits
 */
export function getMediaUploadLimits(user: User | null): MediaUploadLimits {
  const role = getUserRole(user);

  const limits: Record<ChatUserRole, MediaUploadLimits> = {
    regular: {
      maxFileSize: 5 * 1024 * 1024, // 5MB
      maxFileSizeCompressed: 1 * 1024 * 1024, // 1MB
      maxImagesPerMessage: 3,
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    },
    vip: {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFileSizeCompressed: 2 * 1024 * 1024, // 2MB
      maxImagesPerMessage: 10,
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
    },
    admin: {
      maxFileSize: 20 * 1024 * 1024, // 20MB
      maxFileSizeCompressed: 5 * 1024 * 1024, // 5MB
      maxImagesPerMessage: 20,
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/bmp'],
    },
  };

  return limits[role];
}

/**
 * Get group creation limits based on user role
 * @param user - User object
 * @returns Group limits
 */
export function getGroupLimits(user: User | null): GroupLimits {
  const role = getUserRole(user);

  const limits: Record<ChatUserRole, GroupLimits> = {
    regular: {
      maxGroups: 2,
      maxMembersPerGroup: 50,
      canCreatePrivateGroups: false,
    },
    vip: {
      maxGroups: 5,
      maxMembersPerGroup: 200,
      canCreatePrivateGroups: true,
    },
    admin: {
      maxGroups: Infinity,
      maxMembersPerGroup: 500,
      canCreatePrivateGroups: true,
    },
  };

  return limits[role];
}

/**
 * Check if user can upload media
 * @param user - User object
 * @param fileSize - File size in bytes
 * @param fileType - MIME type
 * @returns Validation result
 */
export function canUploadMedia(
  user: User | null,
  fileSize: number,
  fileType: string
): ValidationResult {
  const limits = getMediaUploadLimits(user);

  if (fileSize > limits.maxFileSize) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed (${formatBytes(limits.maxFileSize)})`,
    };
  }

  if (!limits.allowedTypes.includes(fileType)) {
    return {
      valid: false,
      error: `File type ${fileType} is not allowed`,
    };
  }

  return { valid: true };
}

/**
 * Check if user can create more groups
 * @param user - User object
 * @param currentGroupCount - Current number of groups created by user
 * @returns Validation result
 */
export function canCreateGroup(
  user: User | null,
  currentGroupCount: number
): ValidationResult {
  if (!user) {
    return {
      valid: false,
      error: 'You must be logged in to create groups',
    };
  }

  const limits = getGroupLimits(user);

  if (currentGroupCount >= limits.maxGroups) {
    const role = getUserRole(user);
    if (role === 'regular') {
      return {
        valid: false,
        error: 'Vous avez atteint la limite maximale de groupes. Passez au statut VIP pour créer jusqu\'à 5 groupes.',
      };
    }
    return {
      valid: false,
      error: `Vous avez atteint la limite maximale de groupes (${limits.maxGroups})`,
    };
  }

  return { valid: true };
}

/**
 * Format bytes to human-readable string
 * @param bytes - Number of bytes
 * @param decimals - Number of decimal places
 * @returns Formatted string
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Format message timestamp
 * @param timestamp - Date or timestamp
 * @returns Formatted time string
 */
export function formatMessageTime(timestamp: Date | string | number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // Less than 1 minute
  if (diff < 60 * 1000) {
    return 'À l\'instant';
  }

  // Less than 1 hour
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000));
    return `Il y a ${minutes}m`;
  }

  // Today
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Hier';
  }

  // This week
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    return date.toLocaleDateString('fr-FR', { weekday: 'short' });
  }

  // This year
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('fr-FR', {
      month: 'short',
      day: 'numeric',
    });
  }

  // Older
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format full date for message separators
 * @param timestamp - Date or timestamp
 * @returns Formatted date string
 */
export function formatMessageDate(timestamp: Date | string | number): string {
  const date = new Date(timestamp);
  const now = new Date();

  // Today
  if (date.toDateString() === now.toDateString()) {
    return 'Aujourd\'hui';
  }

  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Hier';
  }

  // This year
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('fr-FR', {
      month: 'long',
      day: 'numeric',
    });
  }

  // Older
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Truncate text to specified length
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

/**
 * Sanitize message content (basic XSS prevention)
 * @param content - Message content
 * @returns Sanitized content
 */
export function sanitizeMessageContent(content: string): string {
  if (!content) return '';
  
  // Remove script tags and event handlers
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
}

/**
 * Generate a unique optimistic message ID
 * @returns Unique ID
 */
export function generateOptimisticId(): string {
  return `optimistic-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Check if message ID is optimistic
 * @param id - Message ID
 * @returns True if optimistic
 */
export function isOptimisticId(id: string): boolean {
  return id.startsWith('optimistic-');
}

/**
 * Debounce function
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 * @param func - Function to throttle
 * @param limit - Time limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
