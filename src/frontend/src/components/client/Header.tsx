import React, { useState, useEffect, useCallback } from "react";
import { MapPinIcon, UserCircleIcon } from "@heroicons/react/24/solid";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import authCanisterService, {
  FrontendProfile,
} from "../../services/authCanisterService";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

interface HeaderProps {
  className?: string;
}

// Fix leaflet marker icon (required for proper marker display)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

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
  const [searchQuery, setSearchQuery] = useState("");
  const [userAddress, setUserAddress] = useState<string>("Unknown");
  const [userProvince, setUserProvince] = useState<string>("");
  const [locationLoading, setLocationLoading] = useState(true);
  const searchPlaceholders = [
    "Looking for a plumber?",
    "Looking for an electrician?",
    "Looking for a cleaner?",
    "Looking for a tutor?",
    "Looking for a mechanic?",
    "Looking for a photographer?",
    "Looking for a pet sitter?",
    "Looking for a gardener?",
    "Looking for a painter?",
    "Looking for a babysitter?",
  ];
  const [placeholder, setPlaceholder] = useState(searchPlaceholders[0]);

  // New: Show/hide map modal
  const [showMap, setShowMap] = useState(false);

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
            const {
              house_number,
              building,
              road,
              suburb,
              city,
              town,
              village,
              county,
              state,
            } = data.address;
            const province =
              county ||
              state ||
              data.address.region ||
              data.address.province ||
              "";
            // Compose address with house number/building if available
            const houseOrBuilding = house_number || building || "";
            const streetPart = road || "";
            const areaPart = suburb || village || "";
            const cityPart = city || town || "";
            const fullAddress = [
              houseOrBuilding,
              streetPart,
              areaPart,
              cityPart,
            ]
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

    setPlaceholder(
      searchPlaceholders[Math.floor(Math.random() * searchPlaceholders.length)],
    );
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
    navigate("/client/profile");
  };

  const displayName = profile?.name ? profile.name.split(" ")[0] : "Guest";

  // --- New: Map Modal Component ---
  const MapModal: React.FC = () => {
    if (!location || locationStatus !== "allowed") return null;

    // Close modal if background is clicked
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        setShowMap(false);
      }
    };

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
      >
        <div className="relative flex h-[70vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-lg">
          {/* Close Button - always visible */}
          <button
            className="absolute top-3 right-3 z-10 rounded-full border border-gray-400 bg-gray-200 p-2 hover:bg-gray-300"
            onClick={() => setShowMap(false)}
            aria-label="Close map"
            tabIndex={0}
          >
            <span className="text-xl font-bold text-gray-700">&times;</span>
          </button>
          <div className="flex-1 overflow-hidden rounded-b-lg">
            <MapContainer
              center={[location.latitude, location.longitude]}
              zoom={16}
              scrollWheelZoom={true}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[location.latitude, location.longitude]}>
                <Popup>You are here</Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>
      </div>
    );
  };

  return (
    <header
      className={`w-full max-w-full space-y-4 rounded-lg bg-white p-4 shadow-sm ${className}`}
    >
      {/* --- Desktop Header --- */}
      <div className="hidden items-center justify-between md:flex">
        <div className="flex items-center space-x-4">
          <Link to="/client/home">
            <img
              src="/logo.svg"
              alt="SRV Logo"
              className="h-20 w-auto transition-all duration-300 hover:scale-110"
            />
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
            <UserCircleIcon className="h-8 w-8 text-blue-700 transition-colors group-hover:text-yellow-500" />
          </button>
        )}
      </div>

      {/* --- Mobile Header --- */}
      <div className="md:hidden">
        <div className="flex items-center justify-between">
          <Link to="/client/home">
            <img
              src="/logo.svg"
              alt="SRV Logo"
              className="h-16 w-auto transition-all duration-300 hover:scale-110"
            />
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
              // Make location text look normal but clickable
              <span
                role="button"
                tabIndex={0}
                className="cursor-pointer text-gray-800 select-text focus:outline-none"
                style={{ textDecoration: "none" }}
                onClick={() => setShowMap(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setShowMap(true);
                }}
                aria-label="Show my location on map"
              >
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
              className="mt-2 mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-yellow-300 to-yellow-400 px-6 py-2 text-base font-bold text-blue-800 shadow-md transition-all hover:scale-105 hover:from-yellow-400 hover:to-yellow-500 focus:ring-2 focus:ring-blue-300 focus:outline-none"
            >
              <MapPinIcon className="h-5 w-5 text-blue-600" />
              <span>Share Location</span>
            </button>
          )}

        {/* Search Bar */}
        <form
          className="mb-2 w-full"
          onSubmit={(e) => {
            e.preventDefault();
            if (searchQuery.trim()) {
              navigate(
                `/client/search-results?query=${encodeURIComponent(searchQuery)}`,
              );
            }
          }}
        >
          <div className="flex w-full items-center rounded-md bg-white p-3 shadow-sm">
            <input
              type="text"
              className="flex-1 border-none bg-transparent p-0 text-gray-800 placeholder-gray-500 focus:ring-0 focus:outline-none"
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>
      </div>

      {/* Map Modal */}
      {showMap && <MapModal />}
    </header>
  );
};

export default Header;
