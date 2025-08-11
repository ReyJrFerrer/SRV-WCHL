import React, { useState, useEffect, useCallback } from "react";
import { MapPinIcon, BellIcon } from "@heroicons/react/24/solid"; // Import BellIcon
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import authCanisterService, {
  FrontendProfile,
} from "../../services/authCanisterService";
import { useProviderNotifications } from "../../hooks/useProviderNotifications"; // Import the hook
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// --- Fix leaflet marker icon for proper display ---
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface SPHeaderProps {
  className?: string;
}

const SPHeader: React.FC<SPHeaderProps> = ({ className = "" }) => {
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

  // --- State: Show/hide map modal ---
  const [showMap, setShowMap] = useState(false);

  // Use the provider notifications hook
  const { unreadCount } = useProviderNotifications();

  // --- Effect: Fetch user profile and update location address ---
  useEffect(() => {
    const loadInitialData = async () => {
      // Fetch user profile if authenticated
      if (isAuthenticated) {
        try {
          const userProfile = await authCanisterService.getMyProfile();
          setProfile(userProfile);
        } catch (error) {
          /* Profile fetch failed */
        }
      }

      // Handle location address display
      setLocationLoading(true);
      if (locationStatus === "allowed" && location) {
        // Check if we have cached address data
        const cachedAddress = localStorage.getItem(
          `address_${location.latitude}_${location.longitude}`,
        );
        if (cachedAddress) {
          try {
            const { address, province } = JSON.parse(cachedAddress);
            setUserAddress(address);
            setUserProvince(province);
            setLocationLoading(false);
            return;
          } catch {
            // Cache is corrupted, continue with API call
          }
        }

        // Fetch address from API
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}`,
          );
          const data = await res.json();
          if (data && data.address) {
            const { road, city, town, village, county, state } = data.address;
            const province =
              county ||
              state ||
              data.address.region ||
              data.address.province ||
              "";
            const streetPart = road || village;
            const cityPart = city || town || "";
            const fullAddress = [streetPart, cityPart]
              .filter(Boolean)
              .join(", ");
            const finalAddress = fullAddress || "Could not determine address";

            setUserAddress(finalAddress);
            setUserProvince(province);

            // Cache the address for faster subsequent loads
            localStorage.setItem(
              `address_${location.latitude}_${location.longitude}`,
              JSON.stringify({ address: finalAddress, province }),
            );
          } else {
            setUserAddress("Could not determine address");
            setUserProvince("");
          }
        } catch (error) {
          setUserAddress("Could not determine address");
          setUserProvince("");
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
        setUserProvince("");
      }
    };

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
          setLocationLoading(false);
        },
      );
    } else {
      setLocation("unsupported");
      setLocationLoading(false);
    }
  }, [setLocation]);

  // Changed to navigate to notifications
  const handleNotificationsClick = () => {
    navigate("/provider/notifications");
  };

  const displayName = profile?.name ? profile.name.split(" ")[0] : "Guest";

  // --- Map Modal: Shows user's detected location on a map ---
  const MapModal: React.FC = () => {
    if (!location || !location.latitude || !location.longitude) return null;

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
          {/* Close Button */}
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
      className={`space-y-4 rounded-lg bg-white p-4 shadow-sm ${className}`}
    >
      {/* --- Desktop Header --- */}
      <div className="hidden items-center justify-between md:flex">
        <div className="flex items-center space-x-4">
          <Link to="/client/home">
            <img src="/logo.svg" alt="SRV Logo" className="h-25 w-auto" />
          </Link>
          <div className="h-8 border-l border-gray-300"></div>
          <div className="text-2xl text-gray-700">
            <span className="font-bold">Welcome Back,</span> {displayName}
          </div>
        </div>
        {isAuthenticated && (
          // Changed button to point to notifications
          <button
            onClick={handleNotificationsClick}
            className="group relative rounded-full bg-gray-100 p-3 hover:bg-yellow-100"
          >
            <BellIcon className="h-8 w-8 text-blue-600 transition-colors group-hover:text-yellow-500" />
            {(unreadCount ?? 0) > 0 && (
              <span className="absolute -top-0 -right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                {unreadCount}
              </span>
            )}
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
            // Changed button to point to notifications
            <button
              onClick={handleNotificationsClick}
              className="group relative rounded-full bg-gray-100 p-3 hover:bg-yellow-100"
            >
              <BellIcon className="h-8 w-8 text-blue-600 transition-colors group-hover:text-yellow-500" />
              {(unreadCount ?? 0) > 0 && (
                <span className="absolute -top-0 -right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                  {unreadCount}
                </span>
              )}
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
        <div className="flex items-center">
          {" "}
          {/* New container for the icon and text */}
          <MapPinIcon className="h-6 w-6 text-blue-600" />
          <p className="ml-2 text-base font-bold text-gray-800">
            My Location
          </p>{" "}
          {/* Added ml-2 for spacing */}
        </div>
        <div className="flex flex-col">
          <div className="mb-1 flex items-center">
            {locationLoading || isAuthLoading ? (
              <span className="animate-pulse text-gray-500">
                Detecting location...
              </span>
            ) : locationStatus === "allowed" &&
              location &&
              userAddress &&
              userProvince ? (
              <button
                type="button"
                className="text-left font-medium text-blue-900 transition-all duration-200 hover:text-lg hover:text-blue-700 focus:outline-none"
                style={{ textDecoration: "none" }}
                onClick={() => setShowMap(true)}
              >
                {userAddress}, {userProvince}
              </button>
            ) : (
              <span className="text-gray-600">{userAddress}</span>
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

      {/* --- Map Modal for Location Display --- */}
      {showMap && <MapModal />}
    </header>
  );
};

export default SPHeader;
