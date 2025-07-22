import React, { useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

// Components
import BottomNavigation from "../../components/client/BottomNavigation"; // Adjust path as needed
import { UserCircleIcon } from "@heroicons/react/24/solid";

// Mock data for the list of conversations
const mockConversations = [
  {
    providerId: "1",
    providerName: "Jane Doe",
    providerImage: "/yanni.jpg", // Ensure these images are in your /public folder
    lastMessage: "2 PM on Saturday works for me!",
    timestamp: "10:35 AM",
    unreadCount: 1,
  },
  {
    providerId: "2",
    providerName: "John Smith",
    providerImage: "/don.jpg",
    lastMessage: "Yes, the replacement part just arrived.",
    timestamp: "Yesterday",
    unreadCount: 0,
  },
  {
    providerId: "3",
    providerName: "Emily White",
    providerImage: "/hannah.jpg",
    lastMessage: "You're welcome! Glad I could help.",
    timestamp: "2d ago",
    unreadCount: 0,
  },
];

const ClientChatPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  // useNavigate is the hook for programmatic navigation in react-router-dom
  const navigate = useNavigate();

  // Set the document title when the component mounts
  useEffect(() => {
    document.title = "Messages | SRV";
  }, []);

  const handleConversationClick = (convo: (typeof mockConversations)[0]) => {
    // Navigate to the specific chat page and pass provider info in the state
    navigate(`/client/chat/${convo.providerId}`, {
      state: {
        providerName: convo.providerName,
        providerImage: convo.providerImage,
      },
    });
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
          <div className="bg-white">
            <ul className="divide-y divide-gray-200">
              {mockConversations.map((convo) => (
                <li
                  key={convo.providerId}
                  onClick={() => handleConversationClick(convo)}
                  className="flex cursor-pointer items-center space-x-4 p-4 transition-colors hover:bg-gray-50"
                >
                  <div className="relative h-12 w-12 flex-shrink-0">
                    {convo.providerImage ? (
                      // Use the standard <img> tag instead of Next.js <Image>
                      <img
                        src={convo.providerImage}
                        alt={convo.providerName}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <UserCircleIcon className="h-12 w-12 text-gray-300" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {convo.providerName}
                      </p>
                      <p
                        className={`text-xs ${convo.unreadCount > 0 ? "font-bold text-blue-600" : "text-gray-500"}`}
                      >
                        {convo.timestamp}
                      </p>
                    </div>
                    <div className="mt-1 flex items-start justify-between">
                      <p className="truncate text-sm text-gray-500">
                        {convo.lastMessage}
                      </p>
                      {convo.unreadCount > 0 && (
                        <span className="ml-2 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
                          {convo.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
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
