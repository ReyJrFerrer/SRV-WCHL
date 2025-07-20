import React from "react";
import {
  MapPinIcon,
  BellIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/solid";
import { useNavigate } from "react-router-dom";
import { FrontendProfile } from "../../services/authCanisterService";
import { useAuth } from "../../context/AuthContext";
import { useLogout } from "../../hooks/logout";

interface SPHeaderProps {
  provider: FrontendProfile | null;
  notificationCount?: number;
  className?: string;
}

const SPHeaderNextjs: React.FC<SPHeaderProps> = ({
  provider,
  notificationCount = 0,
  className = "",
}) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { logout, isLoggingOut } = useLogout(); // Use the hook

  const handleLogout = () => {
    logout();
  };

  if (!provider) {
    return (
      <header className={`provider-header bg-yellow-280 ${className}`}>
        <div className="flex items-center justify-center py-4">
          <div className="animate-pulse">
            <div className="h-8 w-48 rounded bg-yellow-200"></div>
          </div>
        </div>
      </header>
    );
  }

  /***
   * To add address map api functionality
   */

  return (
    <header className={`provider-header bg-white p-4 ${className} space-y-4`}>
      {/* Top Row: Welcome Info & Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img
            src="/logo.svg"
            alt="Logo"
            width={60}
            height={60}
            className="flex-shrink-0 rounded-full bg-white"
          />
        </div>

        <div className="flex items-center space-x-4">
          <button className="location-badge flex items-center rounded-full bg-yellow-200 px-4 py-2 shadow-sm transition-colors hover:bg-yellow-300">
            <span className="mr-3 inline-flex items-center justify-center rounded-full bg-blue-600 p-1">
              <MapPinIcon className="h-5 w-5 text-white" />
            </span>
            <span className="text-base font-medium text-black">
              Current Location: <span className="font-bold">Olongapo City</span>
            </span>
          </button>
          {notificationCount > 0 && (
            <button className="relative rounded-full bg-gray-100 p-3 transition-colors hover:bg-gray-200">
              <BellIcon className="h-6 w-6 text-gray-700" />
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                {notificationCount > 99 ? "99+" : notificationCount}
              </span>
            </button>
          )}
          {isAuthenticated && (
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center justify-center rounded-full bg-gray-100 p-3 text-gray-600 transition-colors hover:bg-red-100 hover:text-red-600 disabled:opacity-50"
            >
              {isLoggingOut ? (
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
              ) : (
                <ArrowRightOnRectangleIcon className="h-8 w-8" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Bottom Row: Expanded Location Bar */}
    </header>
  );
};

export default SPHeaderNextjs;
