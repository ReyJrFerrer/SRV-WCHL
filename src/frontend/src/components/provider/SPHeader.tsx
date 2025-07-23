import React from "react";
import { MapPinIcon } from "@heroicons/react/24/solid";
import { useNavigate } from "react-router-dom";
import { FrontendProfile } from "../../services/authCanisterService";
import { useAuth } from "../../context/AuthContext";
import { useLogout } from "../../hooks/logout";

interface SPHeaderProps {
  provider: FrontendProfile | null;
  notificationCount?: number;
  className?: string;
}

const SPHeader: React.FC<SPHeaderProps> = ({
  provider,
  notificationCount = 0,
  className = "",
}) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { logout, isLoggingOut } = useLogout();

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

  // Determine the name to display.
  // Use 'name' property from provider, fallback to "User" if not available.
  const userName = provider.name || "User"; // Fallback to "User" if no name is found

  return (
    // **** IMPORTANT CHANGE HERE: Replaced p-4 with px-4 pt-0 pb-4 ****
    <header
      className={`provider-header bg-white px-4 pt-0 pb-4 ${className} space-y-4`}
    >
      {/* Top Row: Welcome Info & Actions */}
      {/* **** IMPORTANT CHANGE HERE: Added py-4 to this div **** */}
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-4">
          <img
            src="/logo.svg"
            alt="SPU Logo"
            width={60}
            height={60}
            className="flex-shrink-0 rounded-full bg-white"
          />
          {/* Welcome back text */}
          <div className="text-base font-bold text-gray-900 sm:text-2xl lg:text-4xl">
            Welcome Back, {userName}
          </div>
        </div>

        {/* User Icon on the right */}
        <div className="flex items-center space-x-4">
          {/* This is the user icon. Assuming it's a simple circle for now. */}
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-lg font-bold text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-6 w-6"
            >
              <path
                fillRule="evenodd"
                d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Yellow Location Bar with Search Input INSIDE */}
      <div className="space-y-3 rounded-lg bg-[#FFDB6F] p-3 shadow-sm sm:p-4 lg:p-5">
        {" "}
        {/* Reduced lg:p from 8 to 5, sm:p from 5 to 4 */}
        <div className="flex items-center space-x-2">
          <MapPinIcon className="h-4 w-4 text-black sm:h-5 sm:w-5 lg:h-6 lg:w-6" />{" "}
          {/* Reduced sm:h/w from 6 to 5, lg:h/w from 8 to 6 */}
          <div className="text-xs font-semibold text-black sm:text-base lg:text-lg">
            My Location
          </div>{" "}
          {/* Reduced sm:text from lg to base, lg:text from 2xl to lg */}
        </div>
        <div className="pl-7 text-sm font-bold text-black sm:text-xl lg:text-2xl">
          Baguio City
        </div>{" "}
        {/* Reduced sm:text from 2xl to xl, lg:text from 4xl to 2xl */}
        {/* Search Bar now inside this div */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search for a service in your area"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none sm:px-4 sm:py-2.5 sm:text-sm lg:px-6 lg:py-3 lg:text-base" // Reduced sm:px/py, lg:px/py, and text sizes
            aria-label="Search for a service in your area"
          />
        </div>
      </div>
    </header>
  );
};

export default SPHeader;
