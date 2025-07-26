import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import {
  ArrowLeftIcon,
  PaperAirplaneIcon,
  UserCircleIcon,
} from "@heroicons/react/24/solid";
import BottomNavigation from "../../../components/client/BottomNavigation";
import { useChat } from "../../../hooks/useChat";
import { useAuth } from "../../../context/AuthContext";

const ConversationPage: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { identity } = useAuth();
  const {
    currentConversation,
    messages,
    backgroundLoading, // Add backgroundLoading state
    error,
    sendMessage,
    loadConversation,
    markAsRead,
    sendingMessage,
    getUserName,
  } = useChat();

  const [messageText, setMessageText] = useState("");
  const [otherUserName, setOtherUserName] = useState<string>("");

  // Get conversation info from location state or use defaults
  useEffect(() => {
    if (location.state?.otherUserName) {
      setOtherUserName(location.state.otherUserName);
    } else if (location.state?.conversationId) {
      setOtherUserName("Chat");
    } else {
      setOtherUserName(clientId || "Client");
    }
  }, [location.state, clientId]);

  // Load conversation when conversationId changes
  useEffect(() => {
    const conversationId = location.state?.conversationId || clientId;
    if (conversationId && identity) {
      // Use non-silent load for initial conversation loading
      loadConversation(conversationId, false);
    }
  }, [clientId, location.state?.conversationId, identity, loadConversation]);

  // Update user name when conversation loads
  useEffect(() => {
    if (currentConversation && identity) {
      const currentUserId = identity.getPrincipal().toString();
      const otherUserId =
        currentConversation.clientId === currentUserId
          ? currentConversation.providerId
          : currentConversation.clientId;

      // Fetch the other user's name
      getUserName(otherUserId).then(setOtherUserName).catch(console.error);
    }
  }, [currentConversation, identity, getUserName]);

  // Mark messages as read when conversation loads
  useEffect(() => {
    if (currentConversation && messages.length > 0) {
      markAsRead(currentConversation.id);
    }
  }, [currentConversation, messages, markAsRead]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle sending a new message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !messageText.trim() ||
      !currentConversation ||
      !identity ||
      sendingMessage
    )
      return;

    try {
      // Determine the receiver ID (the other participant in the conversation)
      const currentUserId = identity.getPrincipal().toString();
      const receiverId =
        currentConversation.clientId === currentUserId
          ? currentConversation.providerId
          : currentConversation.clientId;

      await sendMessage(messageText.trim(), receiverId);
      setMessageText("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  // Format timestamp for display
  const formatTimestamp = (date: Date): string => {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Determine if message is from current user
  const isFromCurrentUser = (senderId: string): boolean => {
    if (!identity) return false;
    return senderId === identity.getPrincipal().toString();
  };

  if (error) {
    return (
      <div className="flex h-screen flex-col bg-gray-50">
        <header className="sticky top-0 z-10 flex items-center border-b border-gray-200 bg-white p-3">
          <button
            onClick={() => navigate(-1)}
            className="rounded-full p-2 hover:bg-gray-100"
          >
            <ArrowLeftIcon className="h-6 w-6 text-gray-700" />
          </button>
          <div className="ml-3">
            <h1 className="text-lg font-semibold text-gray-900">Error</h1>
          </div>
        </header>
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="mb-4 text-red-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </main>
        <div className="fixed bottom-0 left-0 z-30 w-full">
          <BottomNavigation />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center border-b border-gray-200 bg-white p-3">
        <button
          onClick={() => navigate(-1)}
          className="rounded-full p-2 hover:bg-gray-100"
        >
          <ArrowLeftIcon className="h-6 w-6 text-gray-700" />
        </button>
        <div className="ml-3 flex items-center">
          <div className="relative h-10 w-10">
            <UserCircleIcon className="h-10 w-10 text-gray-400" />
          </div>
          <div className="ml-3">
            <h1 className="text-lg font-semibold text-gray-900">
              {otherUserName}
            </h1>
            <p className="flex items-center text-xs text-gray-500">
              {currentConversation ? "Active" : "Loading..."}
              {backgroundLoading && (
                <span className="ml-2 flex items-center">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500"></div>
                  <span className="ml-1">Updating...</span>
                </span>
              )}
            </p>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 space-y-4 overflow-y-auto p-4 pb-32">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-gray-500">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const fromCurrentUser = isFromCurrentUser(message.senderId);
            return (
              <div
                key={message.id}
                className={`flex items-end gap-2 ${fromCurrentUser ? "justify-end" : "justify-start"}`}
              >
                {!fromCurrentUser && (
                  <div className="relative h-8 w-8 flex-shrink-0">
                    <UserCircleIcon className="h-8 w-8 text-gray-300" />
                  </div>
                )}
                <div
                  className={`max-w-xs rounded-2xl px-4 py-2 md:max-w-md lg:max-w-lg ${
                    fromCurrentUser
                      ? "rounded-br-none bg-blue-600 text-white"
                      : "rounded-bl-none border border-gray-200 bg-white text-gray-800"
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p
                    className={`mt-1 text-right text-xs ${
                      fromCurrentUser ? "text-blue-100" : "text-gray-400"
                    }`}
                  >
                    {formatTimestamp(message.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Message Input */}
      <footer className="fixed bottom-16 left-0 z-20 w-full border-t border-gray-200 bg-white p-3">
        <form
          onSubmit={handleSendMessage}
          className="mx-auto flex max-w-3xl items-center gap-3"
        >
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type a message..."
            maxLength={500}
            disabled={sendingMessage || !currentConversation}
            className="w-full flex-1 rounded-full border border-transparent bg-gray-100 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={
              sendingMessage || !messageText.trim() || !currentConversation
            }
            className="rounded-full bg-blue-600 p-3 text-white transition-colors hover:bg-blue-700 disabled:bg-gray-300"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </form>
        {messageText.length > 400 && (
          <p className="mt-1 text-center text-xs text-gray-500">
            {500 - messageText.length} characters remaining
          </p>
        )}
      </footer>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 z-30 w-full">
        <BottomNavigation />
      </div>
    </div>
  );
};

export default ConversationPage;
