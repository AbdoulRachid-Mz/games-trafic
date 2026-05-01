// lib/get-chat-from-params.ts
import type { ChatEntityType, ChatId } from "@/types/chat";

const VALID_TYPES: ChatEntityType[] = ["user", "group", "shop", "tournament"];

export interface ChatFromParams {
  entityType: ChatEntityType;
  entityId: string;
  chatId: ChatId;
}

/**
 * Parse and validate chat parameters from URLSearchParams.
 * Returns null if params are missing or invalid.
 */
export function getChatFromParams(
  searchParams: URLSearchParams | null
): ChatFromParams | null {
  if (!searchParams) return null;

  const entityType = searchParams.get("entityType")?.toLowerCase().trim();
  const entityId = searchParams.get("entityId")?.trim();

  if (!entityType || !entityId) return null;

  if (!VALID_TYPES.includes(entityType as ChatEntityType)) {
    return null;
  }

  return {
    entityType: entityType as ChatEntityType,
    entityId,
    chatId: `${entityType}:${entityId}` as ChatId,
  };
}
