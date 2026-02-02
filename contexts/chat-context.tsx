// contexts/chat-context.tsx
"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type {
  ChatContextState,
  ChatAction,
  Conversation,
  ChatMessage,
  ChatId,
  TypingIndicator,
  OnlineStatus,
  MessageStatus,
} from "@/types/chat";

// Initial state
const initialState: ChatContextState = {
  activeConversation: null,
  conversations: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  typingIndicators: new Map(),
  onlineStatuses: new Map(),
};

// Reducer
function chatReducer(
  state: ChatContextState,
  action: ChatAction
): ChatContextState {
  switch (action.type) {
    case "SET_ACTIVE_CONVERSATION":
      return {
        ...state,
        activeConversation: action.payload,
      };

    case "SET_CONVERSATIONS":
      return {
        ...state,
        conversations: action.payload,
        unreadCount: action.payload.reduce(
          (sum, conv) => sum + conv.unreadCount,
          0
        ),
      };

    case "UPDATE_CONVERSATION": {
      const conversations = state.conversations.map((conv) =>
        conv.chatId === action.payload.chatId ? action.payload : conv
      );
      return {
        ...state,
        conversations,
        unreadCount: conversations.reduce(
          (sum, conv) => sum + conv.unreadCount,
          0
        ),
        activeConversation:
          state.activeConversation?.chatId === action.payload.chatId
            ? action.payload
            : state.activeConversation,
      };
    }

    case "ADD_MESSAGE": {
      const { chatId, message } = action.payload;
      const conversations = state.conversations.map((conv) => {
        if (conv.chatId === chatId) {
          return {
            ...conv,
            lastMessage: message,
            lastMessageTime: message.createdAt,
          };
        }
        return conv;
      });
      return {
        ...state,
        conversations: conversations as Conversation[],
      };
    }

    case "UPDATE_MESSAGE_STATUS": {
      // This would update message status in the active conversation
      // Implementation depends on how messages are stored
      return state;
    }

    case "SET_TYPING": {
      const { chatId, userId, username, timestamp } = action.payload;
      const typingIndicators = new Map(state.typingIndicators);
      const chatTyping = typingIndicators.get(chatId) || [];

      // Remove existing indicator for this user
      const filtered = chatTyping.filter((t) => t.userId !== userId);

      // Add new indicator
      filtered.push({ userId, username, chatId, timestamp });
      typingIndicators.set(chatId, filtered);

      return {
        ...state,
        typingIndicators,
      };
    }

    case "REMOVE_TYPING": {
      const { chatId, userId } = action.payload;
      const typingIndicators = new Map(state.typingIndicators);
      const chatTyping = typingIndicators.get(chatId) || [];

      const filtered = chatTyping.filter((t) => t.userId !== userId);
      if (filtered.length > 0) {
        typingIndicators.set(chatId, filtered);
      } else {
        typingIndicators.delete(chatId);
      }

      return {
        ...state,
        typingIndicators,
      };
    }

    case "SET_ONLINE_STATUS": {
      const { userId, isOnline, lastSeen } = action.payload;
      const onlineStatuses = new Map(state.onlineStatuses);
      onlineStatuses.set(userId, { userId, isOnline, lastSeen });

      return {
        ...state,
        onlineStatuses,
      };
    }

    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };

    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
      };

    case "INCREMENT_UNREAD": {
      const conversations = state.conversations.map((conv) =>
        conv.chatId === action.payload
          ? { ...conv, unreadCount: conv.unreadCount + 1 }
          : conv
      );
      return {
        ...state,
        conversations,
        unreadCount: state.unreadCount + 1,
      };
    }

    case "CLEAR_UNREAD": {
      const conversations = state.conversations.map((conv) =>
        conv.chatId === action.payload ? { ...conv, unreadCount: 0 } : conv
      );
      const clearedConv = state.conversations.find(
        (c) => c.chatId === action.payload
      );
      const clearedCount = clearedConv?.unreadCount || 0;

      return {
        ...state,
        conversations,
        unreadCount: Math.max(0, state.unreadCount - clearedCount),
      };
    }

    default:
      return state;
  }
}

// Context
interface ChatContextValue extends ChatContextState {
  dispatch: React.Dispatch<ChatAction>;
  setActiveConversation: (conversation: Conversation | null) => void;
  setConversations: (conversations: Conversation[]) => void;
  updateConversation: (conversation: Conversation) => void;
  addMessage: (chatId: ChatId, message: ChatMessage) => void;
  updateMessageStatus: (messageId: string, status: MessageStatus) => void;
  setTyping: (indicator: TypingIndicator) => void;
  removeTyping: (chatId: ChatId, userId: string) => void;
  setOnlineStatus: (status: OnlineStatus) => void;
  incrementUnread: (chatId: ChatId) => void;
  clearUnread: (chatId: ChatId) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  // Action creators
  const setActiveConversation = useCallback(
    (conversation: Conversation | null) => {
      dispatch({ type: "SET_ACTIVE_CONVERSATION", payload: conversation });
    },
    []
  );

  const setConversations = useCallback((conversations: Conversation[]) => {
    dispatch({ type: "SET_CONVERSATIONS", payload: conversations });
  }, []);

  const updateConversation = useCallback((conversation: Conversation) => {
    dispatch({ type: "UPDATE_CONVERSATION", payload: conversation });
  }, []);

  const addMessage = useCallback((chatId: ChatId, message: ChatMessage) => {
    dispatch({ type: "ADD_MESSAGE", payload: { chatId, message } });
  }, []);

  const updateMessageStatus = useCallback(
    (messageId: string, status: MessageStatus) => {
      dispatch({
        type: "UPDATE_MESSAGE_STATUS",
        payload: { messageId, status },
      });
    },
    []
  );

  const setTyping = useCallback((indicator: TypingIndicator) => {
    dispatch({ type: "SET_TYPING", payload: indicator });
  }, []);

  const removeTyping = useCallback((chatId: ChatId, userId: string) => {
    dispatch({ type: "REMOVE_TYPING", payload: { chatId, userId } });
  }, []);

  const setOnlineStatus = useCallback((status: OnlineStatus) => {
    dispatch({ type: "SET_ONLINE_STATUS", payload: status });
  }, []);

  const incrementUnread = useCallback((chatId: ChatId) => {
    dispatch({ type: "INCREMENT_UNREAD", payload: chatId });
  }, []);

  const clearUnread = useCallback((chatId: ChatId) => {
    dispatch({ type: "CLEAR_UNREAD", payload: chatId });
  }, []);

  // Cleanup old typing indicators (older than 5 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const typingIndicators = new Map(state.typingIndicators);
      let hasChanges = false;

      typingIndicators.forEach((indicators, chatId) => {
        const filtered = indicators.filter((ind) => now - ind.timestamp < 5000);
        if (filtered.length !== indicators.length) {
          hasChanges = true;
          if (filtered.length > 0) {
            typingIndicators.set(chatId, filtered);
          } else {
            typingIndicators.delete(chatId);
          }
        }
      });

      if (hasChanges) {
        dispatch({ type: "SET_LOADING", payload: false }); // Trigger re-render
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [state.typingIndicators]);

  const value: ChatContextValue = {
    ...state,
    dispatch,
    setActiveConversation,
    setConversations,
    updateConversation,
    addMessage,
    updateMessageStatus,
    setTyping,
    removeTyping,
    setOnlineStatus,
    incrementUnread,
    clearUnread,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within ChatProvider");
  }
  return context;
}
