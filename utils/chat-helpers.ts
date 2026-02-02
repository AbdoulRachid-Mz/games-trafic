// utils/chat-helpers.ts
import type { ChatMessage, Conversation } from '@/types/chat';
import type { Message } from '@/database/schema';

/**
 * Group messages by date for display
 * @param messages - Array of messages
 * @returns Messages grouped by date
 */
export function groupMessagesByDate(messages: ChatMessage[]): Map<string, ChatMessage[]> {
  const grouped = new Map<string, ChatMessage[]>();

  messages.forEach((message) => {
    const date = message.createdAt ? new Date(message.createdAt) : new Date();
    const dateKey = date.toDateString();

    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }

    grouped.get(dateKey)!.push(message);
  });

  return grouped;
}

/**
 * Get last message from conversation
 * @param conversation - Conversation object
 * @returns Last message preview text
 */
export function getLastMessagePreview(conversation: Conversation): string {
  const lastMessage = conversation.lastMessage;

  if (!lastMessage) {
    return 'No messages yet';
  }

  // Handle images
  if (lastMessage.images && lastMessage.images.length > 0) {
    const count = lastMessage.images.length;
    return count === 1 ? '📷 Photo' : `📷 ${count} Photos`;
  }

  // Handle audio
  if (lastMessage.audioUrl) {
    return '🎤 Voice message';
  }

  // Handle text
  if (lastMessage.content) {
    return lastMessage.content.length > 50
      ? `${lastMessage.content.substring(0, 50)}...`
      : lastMessage.content;
  }

  return 'Message';
}

/**
 * Count unread messages for a user in a conversation
 * @param messages - Array of messages
 * @param userId - Current user ID
 * @returns Unread count
 */
export function getUnreadCount(messages: Message[], userId: string): number {
  return messages.filter(
    (msg) => msg.recipientId === userId && !msg.read && !msg.isDeleted
  ).length;
}

/**
 * Sort conversations by last message time
 * @param conversations - Array of conversations
 * @returns Sorted conversations
 */
export function sortConversationsByTime(conversations: Conversation[]): Conversation[] {
  return [...conversations].sort((a, b) => {
    const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
    const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
    return timeB - timeA; // Most recent first
  });
}

/**
 * Filter conversations by search query
 * @param conversations - Array of conversations
 * @param query - Search query
 * @returns Filtered conversations
 */
export function filterConversations(
  conversations: Conversation[],
  query: string
): Conversation[] {
  if (!query || query.trim() === '') {
    return conversations;
  }

  const lowerQuery = query.toLowerCase().trim();

  return conversations.filter((conversation) => {
    // Search in entity name
    const entityName = getEntityName(conversation);
    if (entityName.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    // Search in last message
    if (conversation.lastMessage?.content) {
      if (conversation.lastMessage.content.toLowerCase().includes(lowerQuery)) {
        return true;
      }
    }

    return false;
  });
}

/**
 * Get entity name from conversation
 * @param conversation - Conversation object
 * @returns Entity name
 */
export function getEntityName(conversation: Conversation): string {
  const { entity } = conversation;

  switch (entity.type) {
    case 'user':
      return entity.data.fullName || entity.data.username || 'Unknown User';
    case 'group':
      return entity.data.name || 'Unnamed Group';
    case 'shop':
      return entity.data.name || 'Unnamed Shop';
    case 'product':
      return entity.data.name || 'Unnamed Product';
    case 'post':
      return 'Post';
    default:
      return 'Unknown';
  }
}

/**
 * Get entity avatar from conversation
 * @param conversation - Conversation object
 * @returns Avatar URL or null
 */
export function getEntityAvatar(conversation: Conversation): string | null {
  const { entity } = conversation;

  switch (entity.type) {
    case 'user':
      return entity.data.profileImage || null;
    case 'group':
      return entity.data.image || null;
    case 'shop':
      return entity.data.profileImage || null;
    case 'product':
      return entity.data.featuredImage || null;
    default:
      return null;
  }
}

/**
 * Get initials from name for avatar fallback
 * @param name - Name string
 * @returns Initials (max 2 characters)
 */
export function getInitials(name: string): string {
  if (!name) return '?';

  const parts = name.trim().split(/\s+/);
  
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Check if user is online (last seen within 5 minutes)
 * @param lastSeen - Last seen date
 * @returns True if online
 */
export function isUserOnline(lastSeen: Date | null | undefined): boolean {
  if (!lastSeen) return false;

  const now = new Date();
  const diff = now.getTime() - new Date(lastSeen).getTime();
  const fiveMinutes = 5 * 60 * 1000;

  return diff < fiveMinutes;
}

/**
 * Format last seen time
 * @param lastSeen - Last seen date
 * @returns Formatted string
 */
export function formatLastSeen(lastSeen: Date | null | undefined): string {
  if (!lastSeen) return 'Offline';

  const now = new Date();
  const diff = now.getTime() - new Date(lastSeen).getTime();

  // Less than 5 minutes - online
  if (diff < 5 * 60 * 1000) {
    return 'Online';
  }

  // Less than 1 hour
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000));
    return `Last seen ${minutes}m ago`;
  }

  // Less than 24 hours
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    return `Last seen ${hours}h ago`;
  }

  // Less than 7 days
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    return `Last seen ${days}d ago`;
  }

  return 'Last seen a while ago';
}

/**
 * Merge and deduplicate messages
 * @param existing - Existing messages
 * @param newMessages - New messages to merge
 * @returns Merged messages
 */
export function mergeMessages(
  existing: ChatMessage[],
  newMessages: ChatMessage[]
): ChatMessage[] {
  const messageMap = new Map<string, ChatMessage>();

  // Add existing messages
  existing.forEach((msg) => {
    messageMap.set(msg.id, msg);
  });

  // Add/update with new messages
  newMessages.forEach((msg) => {
    messageMap.set(msg.id, msg);
  });

  // Convert back to array and sort by creation time
  return Array.from(messageMap.values()).sort(
    (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
  );
}

/**
 * Check if message should show sender name (in groups)
 * @param message - Current message
 * @param previousMessage - Previous message
 * @param isGroup - Is group conversation
 * @returns True if should show sender name
 */
export function shouldShowSenderName(
  message: ChatMessage,
  previousMessage: ChatMessage | null,
  isGroup: boolean
): boolean {
  if (!isGroup) return false;
  if (!previousMessage) return true;

  // Show name if different sender
  if (message.senderId !== previousMessage.senderId) {
    return true;
  }

  // Show name if time gap is more than 5 minutes
  const timeDiff =
    new Date(message.createdAt || 0).getTime() -
    new Date(previousMessage.createdAt || 0).getTime();
  
  return timeDiff > 5 * 60 * 1000;
}

/**
 * Check if message should show timestamp
 * @param message - Current message
 * @param previousMessage - Previous message
 * @returns True if should show timestamp
 */
export function shouldShowTimestamp(
  message: ChatMessage,
  previousMessage: ChatMessage | null
): boolean {
  if (!previousMessage) return true;

  // Show timestamp if time gap is more than 5 minutes
  const timeDiff =
    new Date(message.createdAt || 0).getTime() -
    new Date(previousMessage.createdAt || 0).getTime();

  return timeDiff > 5 * 60 * 1000;
}

/**
 * Get typing indicator text
 * @param typingUsers - Array of typing user names
 * @returns Formatted typing text
 */
export function getTypingIndicatorText(typingUsers: string[]): string {
  if (typingUsers.length === 0) return '';
  if (typingUsers.length === 1) return `${typingUsers[0]} is typing...`;
  if (typingUsers.length === 2) {
    return `${typingUsers[0]} and ${typingUsers[1]} are typing...`;
  }
  return `${typingUsers[0]} and ${typingUsers.length - 1} others are typing...`;
}

/**
 * Extract mentions from message content
 * @param content - Message content
 * @returns Array of mentioned usernames
 */
export function extractMentions(content: string): string[] {
  if (!content) return [];

  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]);
  }

  return mentions;
}

/**
 * Highlight mentions in message content
 * @param content - Message content
 * @returns Content with highlighted mentions
 */
export function highlightMentions(content: string): string {
  if (!content) return '';

  return content.replace(
    /@(\w+)/g,
    '<span class="text-primary font-semibold">@$1</span>'
  );
}
