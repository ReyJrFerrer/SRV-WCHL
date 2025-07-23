import { useState, useEffect, useCallback } from "react";

// A key to store the read status in the browser's local storage.
const HAS_UNREAD_CHATS_KEY = "hasUnreadChats";
// A custom event name to communicate across components when chats are read.
const CHATS_READ_EVENT = "chats-read";

/**
 * A custom hook to manage the state of chat notifications.
 * It simulates unread messages and provides a way to mark them as read.
 */
export const useChatNotifications = () => {
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  /**
   * Checks the local storage to see if there are unread chats.
   * If the flag is not explicitly 'false', it simulates 2 unread messages.
   */
  const checkUnreadStatus = () => {
    const hasUnread = localStorage.getItem(HAS_UNREAD_CHATS_KEY);
    if (hasUnread !== "false") {
      // Simulate having 2 unread messages for demonstration
      setUnreadChatCount(2);
    } else {
      setUnreadChatCount(0);
    }
  };

  // This effect runs once when the component using the hook mounts.
  useEffect(() => {
    // Check the initial status.
    checkUnreadStatus();

    // This function will be called when the 'chats-read' event is dispatched.
    const handleChatsRead = () => {
      setUnreadChatCount(0);
    };

    // Listen for the custom event to update the state.
    window.addEventListener(CHATS_READ_EVENT, handleChatsRead);

    // Cleanup function: remove the event listener when the component unmounts.
    return () => {
      window.removeEventListener(CHATS_READ_EVENT, handleChatsRead);
    };
  }, []);

  /**
   * Marks all chats as read.
   * This updates local storage and dispatches a global event so other components can react.
   */
  const markChatsAsRead = useCallback(() => {
    localStorage.setItem(HAS_UNREAD_CHATS_KEY, "false");
    window.dispatchEvent(new CustomEvent(CHATS_READ_EVENT));
  }, []);

  return { unreadChatCount, markChatsAsRead };
};
