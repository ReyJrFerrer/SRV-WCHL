import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  HomeIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import {
  HomeIcon as HomeIconSolid,
  ClipboardDocumentListIcon as BookingIconSolid,
} from "@heroicons/react/24/solid";

const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    return currentPath.startsWith(path);
  };

  return (
    <div className="fixed right-0 bottom-0 left-0 z-40 bg-white shadow-lg">
      <div className="flex h-16 items-center justify-around">
        <Link
          to="/client/home"
          className="flex h-full w-full flex-col items-center justify-center"
        >
          <div
            className={`flex flex-col items-center ${isActive("/client/home") ? "text-blue-600" : "text-gray-500"}`}
          >
            {isActive("/client/home") ? (
              <HomeIconSolid className="h-6 w-6" />
            ) : (
              <HomeIcon className="h-6 w-6" />
            )}
            <span className="mt-1 text-xs">Home</span>
          </div>
        </Link>

        <Link
          to="/client/booking"
          className="flex h-full w-full flex-col items-center justify-center"
        >
          <div
            className={`flex flex-col items-center ${isActive("/client/booking") ? "text-blue-600" : "text-gray-500"}`}
          >
            {isActive("/client/booking") ? (
              <BookingIconSolid className="h-6 w-6" />
            ) : (
              <ClipboardDocumentListIcon className="h-6 w-6" />
            )}
            <span className="mt-1 text-xs">Bookings</span>
          </div>
        </Link>
        {/* 
        <Link to="/client/chat" className="flex flex-col items-center justify-center w-full h-full">
          <div className={`flex flex-col items-center ${isActive('/client/chat') ? 'text-green-600' : 'text-gray-500'}`}>
            {isActive('/client/chat') ? (
              <ChatIconSolid className="h-6 w-6" />
            ) : (
              <ChatBubbleLeftRightIcon className="h-6 w-6" />
            )}
            <span className="text-xs mt-1">Chat</span>
          </div>
        </Link> */}
      </div>
    </div>
  );
};

export default BottomNavigation;
