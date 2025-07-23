import React, { useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useChat } from "../../hooks/useChat";

// Components
import BottomNavigation from "../../components/client/BottomNavigation";
import { UserCircleIcon } from "@heroicons/react/24/solid";

const ClientChatPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { conversations, loading, error, markAsRead } = useChat();

  // Set the document title when the component mounts
  useEffect(() => {
    document.title = "Messages | SRV";
  }, []);

  const handleConversationClick = async (
    conversationId: string,
    otherUserName: string,
    otherUserImage?: string,
  ) => {
    try {
      // Mark conversation as read when clicked
      await markAsRead(conversationId);

      // Navigate to the specific chat page and pass conversation info in the state
      navigate(`/client/chat/${conversationId}`, {
        state: {
          conversationId,
          otherUserName,
          otherUserImage,
        },
      });
    } catch (error) {
      console.error("Error handling conversation click:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl justify-center px-4 py-3">
          <h1 className="text-xl font-bold text-gray-900">Messages</h1>
        </div>
      </header>

      <div className="mx-auto mt-4 max-w-5xl">
        {isAuthenticated ? (
          loading ? (
            <div className="m-4 rounded-xl bg-white p-6 text-center shadow">
              <p className="text-lg text-gray-600">Loading conversations...</p>
            </div>
          ) : error ? (
            <div className="m-4 rounded-xl bg-white p-6 text-center shadow">
              <p className="mb-4 text-lg text-red-600">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : conversations.length > 0 ? (
            <div className="bg-white">
              <ul className="divide-y divide-gray-200">
                {conversations.map((conversationSummary) => {
                  const conversation = conversationSummary.conversation;
                  const lastMessage = conversationSummary.lastMessage;

                  // Determine who the "other" user is (not the current user)
                  const currentUserId = ""; // We'll need to get this from auth context
                  const isClient = conversation.clientId !== currentUserId;
                  const otherUserId = isClient
                    ? conversation.providerId
                    : conversation.clientId;
                  const otherUserName = `User ${otherUserId.slice(0, 8)}...`; // Placeholder name

                  // Get unread count for current user
                  const unreadEntry = conversation.unreadCount.find(
                    (entry) => entry.userId === currentUserId,
                  );
                  const unreadCount = unreadEntry?.count || 0;

                  // Format timestamp
                  const formatTimestamp = (date?: Date) => {
                    if (!date) return "";
                    const now = new Date();
                    const diffMs = now.getTime() - date.getTime();
                    const diffHours = diffMs / (1000 * 60 * 60);
                    const diffDays = diffHours / 24;

                    if (diffHours < 1) return "Just now";
                    if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
                    if (diffDays < 7) return `${Math.floor(diffDays)}d ago`;
                    return date.toLocaleDateString();
                  };

                  return (
                    <li
                      key={conversation.id}
                      onClick={() =>
                        handleConversationClick(conversation.id, otherUserName)
                      }
                      className="flex cursor-pointer items-center space-x-4 p-4 transition-colors hover:bg-gray-50"
                    >
                      <div className="relative h-12 w-12 flex-shrink-0">
                        <UserCircleIcon className="h-12 w-12 text-gray-300" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {otherUserName}
                          </p>
                          <p
                            className={`text-xs ${unreadCount > 0 ? "font-bold text-blue-600" : "text-gray-500"}`}
                          >
                            {formatTimestamp(lastMessage?.createdAt)}
                          </p>
                        </div>
                        <div className="mt-1 flex items-start justify-between">
                          <p className="truncate text-sm text-gray-500">
                            {lastMessage?.content || "No messages yet"}
                          </p>
                          {unreadCount > 0 && (
                            <span className="ml-2 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
                              {unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div className="m-4 rounded-xl bg-white p-6 text-center shadow">
              <p className="mb-4 text-lg text-gray-600">No conversations yet</p>
              <p className="text-sm text-gray-500">
                Your conversations with service providers will appear here after
                booking a service.
              </p>
            </div>
          )
        ) : (
          <div className="m-4 rounded-xl bg-white p-6 text-center shadow">
            <p className="mb-4 text-lg text-red-600">
              Please log in to access your messages
            </p>
            <button
              onClick={() => navigate("/login")} // Navigate to a login page
              className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            >
              Log In
            </button>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default ClientChatPage;
