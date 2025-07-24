import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import {
  ArrowLeftIcon,
  PaperAirplaneIcon,
  UserCircleIcon,
} from "@heroicons/react/24/solid";
import BottomNavigation from "../../../components/provider/BottomNavigation"; // Adjust path as needed

// Mock data for demonstration purposes
const mockMessages = [
  {
    id: 1,
    text: "Hello! I'm interested in your cleaning service. Are you available this weekend?",
    sender: "client",
    timestamp: "10:30 AM",
  },
  {
    id: 2,
    text: "Hi there! Thanks for reaching out. Yes, I have some availability on Saturday. What time were you thinking?",
    sender: "provider",
    timestamp: "10:32 AM",
  },
  {
    id: 3,
    text: "Saturday afternoon would be great, maybe around 2 PM?",
    sender: "client",
    timestamp: "10:33 AM",
  },
  {
    id: 4,
    text: "2 PM on Saturday works for me! I'll go ahead and confirm that for you once you book the service.",
    sender: "provider",
    timestamp: "10:35 AM",
  },
  {
    id: 5,
    text: "Sounds great, thank you!",
    sender: "client",
    timestamp: "10:36 AM",
  },
];

const mockConversations = [
  {
    providerId: "1",
    providerName: "Jane Doe",
    providerImage: "/yanni.jpg",
    providerAvailability: "Available Saturday 2 PM",
  },
  {
    providerId: "2",
    providerName: "John Smith",
    providerImage: "/don.jpg",
    providerAvailability: "Available Tomorrow",
  },
  {
    providerId: "3",
    providerName: "Emily White",
    providerImage: "/hannah.jpg",
    providerAvailability: "Available Next Week",
  },
];

const ConversationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { providerId } = useParams();

  // Try to get provider info from state, else fallback to mockConversations
  let providerName = "Chat";
  let providerImage = undefined;
  let providerAvailability = "Not Available";
  if (location.state && location.state.providerName) {
    providerName = location.state.providerName;
    providerImage = location.state.providerImage;
    providerAvailability =
      location.state.providerAvailability || "Not Available";
  } else if (providerId) {
    const convo = mockConversations.find((c) => c.providerId === providerId);
    if (convo) {
      providerName = convo.providerName;
      providerImage = convo.providerImage;
      providerAvailability = convo.providerAvailability;
    }
  }

  const [messages, setMessages] = useState(mockMessages);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Automatically scroll to the latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // Handle sending a new message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === "") return;

    const message = {
      id: messages.length + 1,
      text: newMessage,
      sender: "client",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages([...messages, message]);
    setNewMessage("");
  };

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
            {providerImage ? (
              <img
                src={providerImage as string}
                alt={providerName as string}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <UserCircleIcon className="h-10 w-10 text-gray-400" />
            )}
          </div>
          <div className="ml-3">
            <h1 className="text-lg font-semibold text-gray-900">
              {providerName || "Chat"}
            </h1>
            <p className="text-xs text-gray-500">
              {providerAvailability || "Not Available"}
            </p>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 space-y-4 overflow-y-auto p-4 pb-32">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end gap-2 ${msg.sender === "client" ? "justify-end" : "justify-start"}`}
          >
            {msg.sender === "provider" && (
              <div className="relative h-8 w-8 flex-shrink-0">
                {providerImage ? (
                  <img
                    src={providerImage as string}
                    alt={providerName as string}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <UserCircleIcon className="h-8 w-8 text-gray-300" />
                )}
              </div>
            )}
            <div
              className={`max-w-xs rounded-2xl px-4 py-2 md:max-w-md lg:max-w-lg ${msg.sender === "client" ? "rounded-br-none bg-blue-600 text-white" : "rounded-bl-none border border-gray-200 bg-white text-gray-800"}`}
            >
              <p className="text-sm">{msg.text}</p>
              <p
                className={`mt-1 text-xs ${msg.sender === "client" ? "text-blue-100" : "text-gray-400"} text-right`}
              >
                {msg.timestamp}
              </p>
            </div>
          </div>
        ))}
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
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="w-full flex-1 rounded-full border border-transparent bg-gray-100 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-full bg-blue-600 p-3 text-white transition-colors hover:bg-blue-700 disabled:bg-gray-300"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </form>
      </footer>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 z-30 w-full">
        <BottomNavigation />
      </div>
    </div>
  );
};

export default ConversationPage;
