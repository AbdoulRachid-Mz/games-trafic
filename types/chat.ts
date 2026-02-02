// types/chat.ts
import type { User, Group, Message, Shop, Product } from '@/database/schema';

/**
 * Chat entity types that can be used in conversations
 */
export type ChatEntityType = 'user' | 'group' | 'shop' | 'product' | 'post';

/**
 * Chat ID format: "{type}:{id}"
 * Examples: "user:123", "group:456", "shop:789"
 */
export type ChatId = `${ChatEntityType}:${string}`;

/**
 * Parsed chat ID structure
 */
export interface ParsedChatId {
  type: ChatEntityType;
  id: string;
}

/**
 * Message status for delivery tracking
 */
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

/**
 * Extended message with status and metadata
 */
export interface ChatMessage extends Message {
  status?: MessageStatus;
  isOptimistic?: boolean;
  sender?: Pick<User, 'id' | 'username' | 'fullName' | 'profileImage'>;
  replyTo?: Pick<Message, 'id' | 'content' | 'senderId'>;
}

/**
 * Conversation metadata
 */
export interface ConversationMetadata {
  chatId: ChatId;
  entityType: ChatEntityType;
  entityId: string;
  lastMessage?: ChatMessage;
  lastMessageTime?: Date;
  unreadCount: number;
  isPinned?: boolean;
  isMuted?: boolean;
  isArchived?: boolean;
  isBlocked?: boolean;
}

/**
 * Conversation with entity details
 */
export interface Conversation extends ConversationMetadata {
  entity: ConversationEntity;
  participants?: User[];
}

/**
 * Union type for conversation entities
 */
export type ConversationEntity = 
  | { type: 'user'; data: User }
  | { type: 'group'; data: Group & { memberCount?: number } }
  | { type: 'shop'; data: Shop }
  | { type: 'product'; data: Product }
  | { type: 'post'; data: any };

/**
 * Conversation filter options
 */
export type ConversationFilter = 'all' | 'groups' | 'users' | 'unread' | 'archived';

/**
 * Typing indicator state
 */
export interface TypingIndicator {
  userId: string;
  username: string;
  chatId: ChatId;
  timestamp: number;
}

/**
 * Online status
 */
export interface OnlineStatus {
  userId: string;
  isOnline: boolean;
  lastSeen?: Date;
}

/**
 * Media upload limits by user type
 */
export interface MediaUploadLimits {
  maxFileSize: number; // in bytes
  maxFileSizeCompressed: number; // in bytes
  maxImagesPerMessage: number;
  allowedTypes: string[];
}

/**
 * User permission levels for chat features
 */
export type ChatUserRole = 'regular' | 'vip' | 'admin';

/**
 * Group creation limits
 */
export interface GroupLimits {
  maxGroups: number;
  maxMembersPerGroup: number;
  canCreatePrivateGroups: boolean;
}

/**
 * Chat theme color scheme
 */
export interface ChatThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  surfaceHover: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  messageSent: string;
  messageReceived: string;
  messageSentText: string;
  messageReceivedText: string;
  border: string;
  borderLight: string;
  accent: string;
  accentHover: string;
  success: string;
  error: string;
  warning: string;
  info: string;
  online: string;
  offline: string;
}

/**
 * Chat theme configuration
 */
export interface ChatTheme {
  id: string;
  name: string;
  description: string;
  colors: ChatThemeColors;
  dark: boolean;
  premium?: boolean;
  preview?: string;
}

/**
 * Chat theme preset IDs
 */
export type ChatThemePreset = 
  | 'ocean-light' | 'ocean-dark'
  | 'forest-light' | 'forest-dark'
  | 'sunset-light' | 'sunset-dark'
  | 'midnight-light' | 'midnight-dark'
  | 'classic-light' | 'classic-dark'
  | 'default-light' | 'default-dark';

/**
 * Chat settings stored in localStorage
 */
export interface ChatSettings {
  themeId: ChatThemePreset;
  darkMode: boolean;
  notifications: boolean;
  soundEnabled: boolean;
  enterToSend: boolean;
  showOnlineStatus: boolean;
  showTypingIndicators: boolean;
  showReadReceipts: boolean;
  compressImages: boolean;
}

/**
 * Message input state
 */
export interface MessageInputState {
  text: string;
  replyTo?: ChatMessage;
  images: File[];
  isUploading: boolean;
  uploadProgress: number;
}

/**
 * Chat context state
 */
export interface ChatContextState {
  activeConversation: Conversation | null;
  conversations: Conversation[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  typingIndicators: Map<ChatId, TypingIndicator[]>;
  onlineStatuses: Map<string, OnlineStatus>;
}

/**
 * Chat action types
 */
export type ChatAction =
  | { type: 'SET_ACTIVE_CONVERSATION'; payload: Conversation | null }
  | { type: 'SET_CONVERSATIONS'; payload: Conversation[] }
  | { type: 'UPDATE_CONVERSATION'; payload: Conversation }
  | { type: 'ADD_MESSAGE'; payload: { chatId: ChatId; message: ChatMessage } }
  | { type: 'UPDATE_MESSAGE_STATUS'; payload: { messageId: string; status: MessageStatus } }
  | { type: 'SET_TYPING'; payload: TypingIndicator }
  | { type: 'REMOVE_TYPING'; payload: { chatId: ChatId; userId: string } }
  | { type: 'SET_ONLINE_STATUS'; payload: OnlineStatus }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'INCREMENT_UNREAD'; payload: ChatId }
  | { type: 'CLEAR_UNREAD'; payload: ChatId };

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Group creation data
 */
export interface CreateGroupData {
  name: string;
  description?: string;
  image?: File;
  memberIds: string[];
  isPrivate: boolean;
}

/**
 * Message send data
 */
export interface SendMessageData {
  chatId: ChatId;
  content?: string;
  images?: File[];
  replyToId?: string;
}

/**
 * Search result
 */
export interface ChatSearchResult {
  conversations: Conversation[];
  messages: ChatMessage[];
}
