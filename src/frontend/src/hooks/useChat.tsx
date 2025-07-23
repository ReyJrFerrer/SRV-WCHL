import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import chatCanisterService, {
  FrontendConversationSummary,
  FrontendMessage,
  FrontendConversation,
  FrontendMessagePage,
} from "../services/chatCanisterService";

/**
 * Custom hook to manage chat functionality including conversations and messaging
 */
export const useChat = () => {
  const { isAuthenticated, identity } = useAuth();

  // State management
  const [conversations, setConversations] = useState<
    FrontendConversationSummary[]
  >([]);
  const [currentConversation, setCurrentConversation] =
    useState<FrontendConversation | null>(null);
  const [messages, setMessages] = useState<FrontendMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Auto-refresh interval
  const refreshInterval = useRef<NodeJS.Timeout | null>(null);
  const AUTO_REFRESH_INTERVAL = 5000; // 5 seconds

  /**
   * Fetch all conversations for the current user
   */
  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated || !identity) {
      setConversations([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fetchedConversations =
        await chatCanisterService.getMyConversations();
      setConversations(fetchedConversations);
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
      setError("Could not load conversations.");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, identity]);

  /**
   * Fetch messages for a specific conversation
   * @param conversationId The ID of the conversation
   * @param limit Number of messages to fetch (default: 50)
   * @param offset Starting position for pagination (default: 0)
   */
  const fetchMessages = useCallback(
    async (
      conversationId: string,
      limit: number = 50,
      offset: number = 0,
    ): Promise<FrontendMessagePage> => {
      if (!isAuthenticated || !identity) {
        throw new Error("Authentication required");
      }

      try {
        const messagePage = await chatCanisterService.getConversationMessages(
          conversationId,
          limit,
          offset,
        );
        return messagePage;
      } catch (err) {
        console.error("Failed to fetch messages:", err);
        throw new Error("Could not load messages.");
      }
    },
    [isAuthenticated, identity],
  );

  /**
   * Load messages for the current conversation
   * @param conversationId The ID of the conversation
   */
  const loadConversation = useCallback(
    async (conversationId: string) => {
      if (!isAuthenticated || !identity) {
        setCurrentConversation(null);
        setMessages([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch conversation details
        const conversation =
          await chatCanisterService.getConversation(conversationId);
        setCurrentConversation(conversation);

        // Fetch messages for this conversation
        const messagePage = await fetchMessages(conversationId);
        setMessages(messagePage.messages);

        // Mark messages as read
        await chatCanisterService.markMessagesAsRead(conversationId);

        // Refresh conversations to update unread counts
        await fetchConversations();
      } catch (err) {
        console.error("Failed to load conversation:", err);
        setError("Could not load conversation.");
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, identity, fetchMessages, fetchConversations],
  );

  /**
   * Send a message in the current conversation
   * @param content The message content (max 500 characters)
   * @param receiverId The receiver's Principal ID
   */
  const sendMessage = useCallback(
    async (content: string, receiverId: string) => {
      if (!isAuthenticated || !identity || !currentConversation) {
        throw new Error("Authentication and active conversation required");
      }

      // Validate message content
      if (content.trim().length === 0) {
        throw new Error("Message cannot be empty");
      }

      if (content.length > 500) {
        throw new Error("Message cannot exceed 500 characters");
      }

      setSendingMessage(true);
      setError(null);

      try {
        const newMessage = await chatCanisterService.sendMessage(
          currentConversation.id,
          receiverId,
          content.trim(),
        );

        if (newMessage) {
          // Add the new message to the local state immediately for better UX
          setMessages((prevMessages) => [...prevMessages, newMessage]);

          // Refresh conversations to update last message and timestamps
          await fetchConversations();
        }

        return newMessage;
      } catch (err) {
        console.error("Failed to send message:", err);
        setError(
          err instanceof Error ? err.message : "Could not send message.",
        );
        throw err;
      } finally {
        setSendingMessage(false);
      }
    },
    [isAuthenticated, identity, currentConversation, fetchConversations],
  );

  /**
   * Create a new conversation
   * @param clientId Client's Principal ID
   * @param providerId Provider's Principal ID
   * @param bookingId Booking ID that initiated this conversation
   */
  const createConversation = useCallback(
    async (clientId: string, providerId: string, bookingId: string) => {
      if (!isAuthenticated || !identity) {
        throw new Error("Authentication required");
      }

      setLoading(true);
      setError(null);

      try {
        const newConversation = await chatCanisterService.createConversation(
          clientId,
          providerId,
          bookingId,
        );

        if (newConversation) {
          // Refresh conversations to include the new one
          await fetchConversations();
        }

        return newConversation;
      } catch (err) {
        console.error("Failed to create conversation:", err);
        setError("Could not create conversation.");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, identity, fetchConversations],
  );

  /**
   * Mark messages in a conversation as read
   * @param conversationId The ID of the conversation
   */
  const markAsRead = useCallback(
    async (conversationId: string) => {
      if (!isAuthenticated || !identity) {
        return;
      }

      try {
        await chatCanisterService.markMessagesAsRead(conversationId);
        // Refresh conversations to update unread counts
        await fetchConversations();
      } catch (err) {
        console.error("Failed to mark messages as read:", err);
      }
    },
    [isAuthenticated, identity, fetchConversations],
  );

  /**
   * Get total unread message count across all conversations
   */
  const getUnreadCount = useCallback((): number => {
    if (!identity) return 0;

    return conversations.reduce((total, convoSummary) => {
      const userUnreadEntry = convoSummary.conversation.unreadCount.find(
        (entry) => entry.userId === identity.getPrincipal().toString(),
      );
      return total + (userUnreadEntry?.count || 0);
    }, 0);
  }, [conversations, identity]);

  /**
   * Start auto-refresh for real-time updates
   */
  const startAutoRefresh = useCallback(() => {
    if (refreshInterval.current) {
      clearInterval(refreshInterval.current);
    }

    refreshInterval.current = setInterval(() => {
      if (isAuthenticated && identity) {
        // Silently refresh conversations
        fetchConversations().catch(console.error);

        // If we have a current conversation, refresh its messages
        if (currentConversation) {
          fetchMessages(currentConversation.id)
            .then((messagePage) => {
              setMessages(messagePage.messages);
            })
            .catch(console.error);
        }
      }
    }, AUTO_REFRESH_INTERVAL);
  }, [
    isAuthenticated,
    identity,
    currentConversation,
    fetchConversations,
    fetchMessages,
  ]);

  /**
   * Stop auto-refresh
   */
  const stopAutoRefresh = useCallback(() => {
    if (refreshInterval.current) {
      clearInterval(refreshInterval.current);
      refreshInterval.current = null;
    }
  }, []);

  /**
   * Clear current conversation and messages
   */
  const clearCurrentConversation = useCallback(() => {
    setCurrentConversation(null);
    setMessages([]);
    setError(null);
  }, []);

  // Initialize and fetch conversations on auth state change
  useEffect(() => {
    if (isAuthenticated && identity) {
      fetchConversations();
      startAutoRefresh();
    } else {
      setConversations([]);
      clearCurrentConversation();
      stopAutoRefresh();
    }

    // Cleanup on unmount or auth change
    return () => {
      stopAutoRefresh();
    };
  }, [
    isAuthenticated,
    identity,
    fetchConversations,
    startAutoRefresh,
    clearCurrentConversation,
    stopAutoRefresh,
  ]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, []);

  return {
    // State
    conversations,
    currentConversation,
    messages,
    loading,
    error,
    sendingMessage,

    // Actions
    fetchConversations,
    loadConversation,
    sendMessage,
    createConversation,
    markAsRead,
    clearCurrentConversation,

    // Utilities
    getUnreadCount,
    fetchMessages,

    // Auto-refresh controls
    startAutoRefresh,
    stopAutoRefresh,
  };
};

export default useChat;
