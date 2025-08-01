import React, { useState, useEffect, useCallback } from "react";
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
  const {
    isAuthenticated,
    location,
    locationStatus,
    setLocation,
    isLoading: isAuthLoading,
  } = useAuth();
  const [profile, setProfile] = useState<FrontendProfile | null>(null);
  const [userAddress, setUserAddress] = useState<string>("Unknown");
  const [userProvince, setUserProvince] = useState<string>("");
  const [locationLoading, setLocationLoading] = useState(true);

  // --- REFACTORED: Combined data fetching into a single, efficient hook ---
  useEffect(() => {
    // This function will run only when authentication is no longer loading.
    const loadInitialData = async () => {
      // 1. Fetch User Profile if authenticated
      if (isAuthenticated) {
        try {
          const userProfile = await authCanisterService.getMyProfile();
          setProfile(userProfile);
        } catch (error) {
          console.error("Failed to fetch profile:", error);
        }
      }

      // 2. Determine and Set Location
      setLocationLoading(true);
      if (locationStatus === "allowed" && location) {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}`,
          );
          const data = await res.json();
          if (data && data.address) {
            const { road, suburb, city, town, village, county, state } =
              data.address;
            const province =
              county ||
              state ||
              data.address.region ||
              data.address.province ||
              "";
            const streetPart = road || "";
            const areaPart = suburb || village || "";
            const cityPart = city || town || "";
            const fullAddress = [streetPart, areaPart, cityPart]
              .filter(Boolean)
              .join(", ");
            setUserAddress(fullAddress || "Could not determine address");
            setUserProvince(province);
          } else {
            setUserAddress("Could not determine address");
          }
        } catch (error) {
          setUserAddress("Could not determine address");
        } finally {
          setLocationLoading(false);
        }
      } else {
        // Handle cases where location is not yet known or denied
        setLocationLoading(false);
        switch (locationStatus) {
          case "denied":
            setUserAddress("Location not shared");
            break;
          case "not_set":
          case "unsupported":
          default:
            setUserAddress("Location not set");
            break;
        }
      }
    };

    // Only run the data fetching logic after the initial auth check is complete.
    if (!isAuthLoading) {
      loadInitialData();
    }
  }, [isAuthenticated, isAuthLoading, location, locationStatus]);

  const handleRequestLocation = useCallback(() => {
    setLocationLoading(true);
    setUserAddress("Detecting location...");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation("allowed", { latitude, longitude });
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocation("denied");
        },
      );
    } else {
      setLocation("unsupported");
    }
  }, [setLocation]);

  const handleProfileClick = () => {
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
          <Link to="/client/home">
            <img src="/logo.svg" alt="SRV Logo" className="h-20 w-auto" />
          </Link>
          <div className="h-8 border-l border-gray-300"></div>
          <div className="text-2xl text-gray-700">
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
          <Link to="/client/home">
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

      {/* --- Location Section --- */}
      <div className="rounded-lg bg-yellow-200 p-4">
        <p className="text-sm font-bold text-gray-800">My Location</p>
        <div className="flex min-h-[2.5rem] flex-col">
          <div className="mb-1 flex items-center">
            <MapPinIcon className="mr-2 h-5 w-5 flex-shrink-0 text-gray-700" />
            {locationLoading || isAuthLoading ? (
              <span className="animate-pulse text-gray-500">
                Detecting location...
              </span>
            ) : (
              <span className="text-gray-800">
                {userAddress}, {userProvince}
              </span>
            )}
          </div>
        </div>

        {!locationLoading &&
          (locationStatus === "denied" ||
            locationStatus === "not_set" ||
            locationStatus === "unsupported") && (
            <button
              onClick={handleRequestLocation}
              className="mt-2 w-full rounded-lg bg-yellow-300 p-2 text-center text-sm font-semibold text-blue-700 transition-colors hover:bg-yellow-400"
            >
              Share Location
            </button>
          )}
      </div>
    </header>
  );
};

export default Header;
