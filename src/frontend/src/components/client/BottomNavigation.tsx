import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  BellIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/solid";

// Assuming these hooks are available in your new project structure
// You may need to adjust the import paths
import { useNotifications } from "../../hooks/useNotifications";
import { useChatNotifications } from "../../hooks/useChatNotifications";

const BottomNavigation: React.FC = () => {
  // useLocation is the replacement for Next.js's useRouter to get the current path
  const location = useLocation();
  const { unreadCount } = useNotifications();
  const { unreadChatCount } = useChatNotifications();

  const navItems = [
    { to: "/client/home", label: "Home", icon: HomeIcon, count: 0 },
    {
      to: "/client/booking",
      label: "Bookings",
      icon: ClipboardDocumentListIcon,
      count: 0,
    },
    {
      to: "/client/chat",
      label: "Chat",
      icon: ChatBubbleOvalLeftEllipsisIcon,
      count: unreadChatCount,
    },
    {
      to: "/client/notifications",
      label: "Notifications",
      icon: BellIcon,
      count: unreadCount,
    },
    {
      to: "/client/settings",
      label: "Settings",
      icon: Cog6ToothIcon,
      count: 0,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 z-50 h-16 w-full border-t border-gray-200 bg-white">
      <div className="mx-auto grid h-full max-w-lg grid-cols-5 font-medium">
        {navItems.map((item) => {
          // Check if the current URL path starts with the link's path
          const isActive = location.pathname.startsWith(item.to);
          const IconComponent = item.icon;

          return (
            // Use the Link component from react-router-dom
            <Link
              key={item.label}
              to={item.to}
              className="group relative inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50"
            >
              <IconComponent
                className={`mb-1 h-6 w-6 ${isActive ? "text-blue-600" : "text-gray-500 group-hover:text-yellow-500"}`}
              />
              <span
                className={`text-xs ${isActive ? "text-blue-600" : "text-gray-500 group-hover:text-yellow-500"}`}
              >
                {item.label}
              </span>
              {/* Notification badge */}
              {item.count > 0 && (
                <span className="absolute top-1 right-5 block h-2 w-2 rounded-full bg-red-500"></span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;
