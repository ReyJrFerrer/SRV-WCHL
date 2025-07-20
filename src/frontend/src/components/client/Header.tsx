import React from "react";
import {
  MapPinIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/solid";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import SearchBar from "./SearchBar";
// Import the hook and service
import { useAllServicesWithProviders } from "../../hooks/serviceInformation";
import { useLogout } from "../../hooks/logout";

interface HeaderProps {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ className = "" }) => {
  const { isAuthenticated } = useAuth();
  const { logout, isLoggingOut } = useLogout();
  // Use the hook to fetch all services
  const { services } = useAllServicesWithProviders();

  const handleLogout = () => {
    logout();
  };

  return (
    <header
      className={`space-y-4 rounded-lg bg-white p-4 shadow-sm ${className}`}
    >
      {/* Top Row: Logo + Home | Logout*/}
      <div className="flex items-center justify-between">
        <Link to="/client/home" className="flex items-center" aria-label="Home">
          <img
            src="/logo.svg"
            alt="SRV Logo"
            width={100}
            height={40}
            className="object-contain"
          />
        </Link>
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

      {/* Location Section */}
      <div className="rounded-lg bg-yellow-200 p-4">
        <p className="text-sm font-medium text-gray-800">Aking Lokasyon</p>
        <div className="flex items-center">
          <MapPinIcon className="mr-2 h-5 w-5 text-gray-700" />
          <span className="text-gray-800">Olongapo City</span>
        </div>

        {/* Search Bar with padding above */}
        <div className="mt-4 w-full">
          <SearchBar
            placeholder="Maghanap ng Serbisyo"
            redirectToSearchResultsPage={true}
            servicesList={services}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
