// Chat Conversation Page (Client)
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { ArrowLeftIcon, PaperAirplaneIcon } from "@heroicons/react/24/solid";
import BottomNavigation from "../../../components/client/BottomNavigation";
import { useChat } from "../../../hooks/useChat";
import { useAuth } from "../../../context/AuthContext";
import authCanisterService from "../../../services/authCanisterService";
import { ProfileImage } from "../../../components/common/ProfileImage";

const ConversationPage: React.FC = () => {
  // Default image for provider profile
  const DEFAULT_USER_IMAGE = "/default-provider.svg";
  // Router and context hooks
  const { providerId } = useParams<{ providerId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { identity } = useAuth();
  // Chat state and actions
  const {
    currentConversation,
    messages,
    error,
    sendMessage,
    loadConversation,
    markAsRead,
    sendingMessage,
    getUserName,
  } = useChat();
  // Local state for message input and provider info
  const [messageText, setMessageText] = useState("");
  const [otherUserName, setOtherUserName] = useState<string>("");
  const [otherUserImage, setOtherUserImage] =
    useState<string>(DEFAULT_USER_IMAGE);

  // Set provider name and image from navigation state or profile
  useEffect(() => {
    let isMounted = true;
    if (location.state?.otherUserName) {
      setOtherUserName(location.state.otherUserName);
    } else if (location.state?.conversationId) {
      setOtherUserName("Chat");
    } else {
      setOtherUserName(providerId || "Provider");
    }
    const navImage = location.state?.otherUserImage;
    const isDefault = !navImage || navImage === DEFAULT_USER_IMAGE;
    setOtherUserImage(isDefault ? DEFAULT_USER_IMAGE : navImage);
    // Fetch provider profile image if needed
    const principalRegex = /^[a-z0-9\-]{27,63}$/i;
    if (isDefault && providerId && principalRegex.test(providerId)) {
      authCanisterService
        .getProfile(providerId)
        .then((profile) => {
          if (
            isMounted &&
            profile &&
            profile.profilePicture &&
            profile.profilePicture.imageUrl
          ) {
            setOtherUserImage(profile.profilePicture.imageUrl);
          }
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [location.state, providerId]);

  // Load conversation when conversationId changes
  useEffect(() => {
    const conversationId = location.state?.conversationId || providerId;
    if (conversationId && identity) {
      loadConversation(conversationId, false);
    }
  }, [providerId, location.state?.conversationId, identity, loadConversation]);

  // Update provider name when conversation loads
  useEffect(() => {
    if (currentConversation && identity) {
      const currentUserId = identity.getPrincipal().toString();
      const otherUserId =
        currentConversation.clientId === currentUserId
          ? currentConversation.providerId
          : currentConversation.clientId;
      getUserName(otherUserId).then(setOtherUserName);
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

  // Send message handler
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
      const currentUserId = identity.getPrincipal().toString();
      const receiverId =
        currentConversation.clientId === currentUserId
          ? currentConversation.providerId
          : currentConversation.clientId;
      await sendMessage(messageText.trim(), receiverId);
      setMessageText("");
    } catch {}
  };

  // Format timestamp for display in chat bubbles
  const formatTimestamp = (date: Date): string => {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Check if message is sent by current user
  const isFromCurrentUser = (senderId: string): boolean => {
    if (!identity) return false;
    return senderId === identity.getPrincipal().toString();
  };

  // Error state UI
  if (error) {
    return (
      <div className="flex h-screen flex-col bg-gradient-to-b from-blue-50 to-gray-100">
        {/* Header: Error */}
        <header className="sticky top-0 z-10 flex items-center border-b border-gray-200 bg-white p-3 shadow-sm">
          <button
            onClick={() => navigate(-1)}
            className="rounded-full p-2 hover:bg-blue-100"
          >
            <ArrowLeftIcon className="h-6 w-6 text-blue-700" />
          </button>
          <div className="ml-3">
            <h1 className="text-lg font-bold text-blue-900">Error</h1>
          </div>
        </header>
        {/* Main: Error message */}
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
        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 z-30 w-full">
          <BottomNavigation />
        </div>
      </div>
    );
  }

  // Main chat UI
  return (
    <div className="flex h-screen flex-col bg-gradient-to-b from-blue-50 to-gray-100">
      {/* Header: Provider Info */}
      <header className="sticky top-0 z-10 flex items-center border-b border-gray-200 bg-white p-3 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="rounded-full p-2 hover:bg-yellow-100"
        >
          <ArrowLeftIcon className="h-6 w-6 text-blue-700 hover:text-yellow-600" />
        </button>
        <div className="ml-3 flex items-center">
          <div className="relative h-11 w-11">
            <ProfileImage
              profilePictureUrl={
                otherUserImage !== DEFAULT_USER_IMAGE
                  ? otherUserImage
                  : undefined
              }
              userName={otherUserName}
              size="h-11 w-11"
            />
          </div>
          <div className="ml-3">
            <h1 className="text-lg font-bold text-black">{otherUserName}</h1>
          </div>
        </div>
      </header>

      {/* Main: Messages Area */}
      <main className="flex-1 space-y-4 overflow-y-auto p-4 pb-32">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-lg text-gray-500 italic">
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
                {/* Message sender avatar (if not current user) */}
                {!fromCurrentUser && (
                  <div className="relative h-9 w-9 flex-shrink-0">
                    <ProfileImage
                      profilePictureUrl={
                        otherUserImage !== DEFAULT_USER_IMAGE
                          ? otherUserImage
                          : undefined
                      }
                      userName={otherUserName}
                      size="h-9 w-9"
                    />
                  </div>
                )}
                {/* Message bubble */}
                <div
                  className={`max-w-xs rounded-2xl px-5 py-3 shadow-sm md:max-w-md lg:max-w-lg ${
                    fromCurrentUser
                      ? "rounded-br-none bg-blue-600 text-white"
                      : "rounded-bl-none border border-gray-200 bg-white text-gray-800"
                  }`}
                  style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}
                >
                  <p className="overflow-wrap-anywhere text-base leading-snug break-words">
                    {message.content}
                  </p>
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

      {/* Message Input Area */}
      <footer className="fixed bottom-16 left-0 z-20 w-full border-t border-gray-200 bg-white p-3 shadow-md">
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
            className="w-full flex-1 rounded-full border border-transparent bg-gray-100 px-4 py-2 text-base focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={
              sendingMessage || !messageText.trim() || !currentConversation
            }
            className="rounded-full bg-blue-600 p-3 text-white shadow transition-colors hover:bg-blue-700 disabled:bg-gray-300"
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
