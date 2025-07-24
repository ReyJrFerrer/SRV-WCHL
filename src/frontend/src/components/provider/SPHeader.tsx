import React, { useState, useEffect } from "react";
import { MapPinIcon, UserCircleIcon } from "@heroicons/react/24/solid";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import authCanisterService, {
  FrontendProfile,
} from "../../services/authCanisterService";

interface HeaderProps {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ className = "" }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<FrontendProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      if (isAuthenticated) {
        try {
          const userProfile = await authCanisterService.getMyProfile();
          setProfile(userProfile);
        } catch (error) {
          console.error("Failed to fetch profile:", error);
        }
      }
    };
    fetchProfile();
  }, [isAuthenticated]);

  const handleProfileClick = () => {
    // Navigate to the user's profile page
    navigate("/provider/profile");
  };

  const displayName = profile?.name ? profile.name.split(" ")[0] : "Guest";

  return (
    <header
      className={`space-y-4 rounded-lg bg-white p-4 shadow-sm ${className}`}
    >
      {/* --- Desktop Header --- */}
      <div className="hidden items-center justify-between md:flex">
        <div className="flex items-center space-x-4">
          <Link to="/provider/home">
            <img src="/logo.svg" alt="SRV Logo" className="h-20 w-auto" />
          </Link>
          <div className="h-8 border-l border-gray-300"></div>
          <div className="text-2xl text-black-500">
            <span className="font-bold">Welcome Back,</span> {displayName}
          </div>
        </div>
        {isAuthenticated && (
          <button
            onClick={handleProfileClick}
            className="group relative rounded-full bg-gray-100 p-3 hover:bg-yellow-100"
          >
            <UserCircleIcon className="h-8 w-8 text-blue-600 transition-colors group-hover:text-yellow-500" />
          </button>
        )}
      </div>

      {/* --- Mobile Header --- */}
      <div className="md:hidden">
        <div className="flex items-center justify-between">
          <Link to="/provider/home">
            <img src="/logo.svg" alt="SRV Logo" className="h-10 w-auto" />
          </Link>
          {isAuthenticated && (
            <button
              onClick={handleProfileClick}
              className="group relative rounded-full bg-gray-100 p-3 hover:bg-yellow-100"
            >
              <UserCircleIcon className="h-8 w-8 text-blue-600 transition-colors group-hover:text-yellow-500" />
            </button>
          )}
        </div>
        <hr className="my-4 border-gray-200" />
        <div className="text-2xl text-gray-700">
          <span className="font-bold">Welcome Back,</span> {displayName}
        </div>
      </div>

      {/* Location Section */}
      <div className="rounded-lg bg-yellow-200 p-4">
        <p className="text-sm font-bold text-gray-800">My Location</p>
        <div className="flex items-center">
          <MapPinIcon className="mr-2 h-5 w-5 text-gray-700" />
          <span className="text-gray-800">Baguio City</span>
        </div>

        {/* Search Bar with padding above */}
        <form
          className="mt-4 w-full"
          onSubmit={(e) => {
            e.preventDefault();
            if (searchQuery.trim()) {
              navigate(
                `/provider/search-results?query=${encodeURIComponent(searchQuery)}`,
              );
            }
          }}
        >
          <div className="flex w-full items-center rounded-md bg-white p-3 shadow-sm">
            <input
              type="text"
              className="flex-1 border-none bg-transparent p-0 text-gray-800 placeholder-gray-500 focus:ring-0"
              placeholder="Search for service"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>
      </div>
    </header>
  );
};

export default Header;
