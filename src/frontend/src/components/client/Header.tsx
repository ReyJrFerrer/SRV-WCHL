// --- Imports ---
import React, { useState, useEffect, useCallback } from "react";
import { MapPinIcon, UserCircleIcon } from "@heroicons/react/24/solid";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import authCanisterService from "../../services/authCanisterService";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// --- Props ---
export interface HeaderProps {
  className?: string;
  manualLocation?: { province: string; municipality: string } | null;
}

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

// --- Main Header Component ---
const Header: React.FC<HeaderProps> = ({ className }) => {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    isLoading: isAuthLoading,
    location,
    setLocation,
    locationStatus,
  } = useAuth();

  // --- State: User profile ---
  const [profile, setProfile] = useState<any>(null);

  // --- State: Search bar ---
  const [searchQuery, setSearchQuery] = useState("");
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

  // --- State: Location display ---
  const [userAddress, setUserAddress] = useState<string>("");
  const [userProvince, setUserProvince] = useState<string>("");
  const [locationLoading, setLocationLoading] = useState(true);

  // --- State: Modal for denied location permission ---
  const [showDeniedModal, setShowDeniedModal] = useState(false);

  // --- State: Show/hide map modal ---
  const [showMap, setShowMap] = useState(false);
  const handleRequestLocation = useCallback(() => {
    setLocationLoading(true);
    setUserAddress("Detecting location...");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation("allowed", { latitude, longitude });
        },
        () => {
          setLocation("denied");
          setLocationLoading(false);
        },
      );
    } else {
      setLocation("unsupported");
      setLocationLoading(false);
    }
  }, [setLocation]);

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
            handleRequestLocation();
            break;
        }
        setUserProvince("");
      }
    };

    if (!isAuthLoading) {
      loadInitialData();
    }
  }, [isAuthenticated, isAuthLoading, location, locationStatus]);

  // --- Effect: Randomize search bar placeholder after location loads ---
  useEffect(() => {
    if (!locationLoading && !isAuthLoading) {
      setPlaceholder(
        searchPlaceholders[
          Math.floor(Math.random() * searchPlaceholders.length)
        ],
      );
    }
  }, [locationLoading, isAuthLoading]);

  // --- Handler: go to profile page ---
  const handleProfileClick = () => {
    navigate("/client/profile");
  };

  // --- Display name for welcome message ---
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

  // --- Render: Header layout ---
  return (
    <header
      className={`w-full max-w-full space-y-6 rounded-2xl border border-blue-100 bg-gradient-to-br from-yellow-50 via-white to-blue-50 p-6 shadow-lg ${className}`}
    >
      {/* --- Desktop Header: Logo, Welcome, Profile Button --- */}
      <div className="hidden items-center justify-between md:flex">
        <div className="flex items-center space-x-6">
          <Link to="/client/home">
            <img
              src="/logo.svg"
              alt="SRV Logo"
              className="h-20 w-auto drop-shadow-md transition-all duration-300 hover:scale-110"
            />
          </Link>
          <div className="h-10 border-l-2 border-blue-100"></div>
          <div className="flex flex-col">
            <span className="text-2xl font-semibold tracking-wide text-blue-700">
              Welcome Back,{" "}
              <span className="text-2xl font-bold text-gray-800">
                {displayName}
              </span>
            </span>
          </div>
        </div>
        {isAuthenticated && (
          <button
            onClick={handleProfileClick}
            className="group relative rounded-full bg-gradient-to-br from-blue-100 to-yellow-100 p-3 shadow transition-all hover:scale-105 hover:from-yellow-200 hover:to-blue-200"
          >
            <UserCircleIcon className="h-10 w-10 text-blue-700 transition-colors group-hover:text-yellow-500" />
          </button>
        )}
      </div>

      {/* --- Mobile Header: Logo, Welcome, Profile Button --- */}
      <div className="md:hidden">
        <div className="flex items-center justify-between">
          <Link to="/client/home">
            <img
              src="/logo.svg"
              alt="SRV Logo"
              className="h-16 w-auto drop-shadow-md transition-all duration-300 hover:scale-110"
            />
          </Link>
          {isAuthenticated && (
            <button
              onClick={handleProfileClick}
              className="group relative rounded-full bg-gradient-to-br from-blue-100 to-yellow-100 p-3 shadow transition-all hover:scale-105 hover:from-yellow-200 hover:to-blue-200"
            >
              <UserCircleIcon className="h-8 w-8 text-blue-600 transition-colors group-hover:text-yellow-500" />
            </button>
          )}
        </div>
        <hr className="my-4 border-blue-100" />
        <div className="flex flex-row flex-wrap items-baseline gap-x-2 gap-y-0">
          <span className="text-xl font-semibold tracking-wide text-blue-700">
            Welcome Back,
          </span>
          <span className="text-xl font-bold text-gray-800">{displayName}</span>
        </div>
      </div>

      {/* --- Location & Search Section --- */}
      <div className="rounded-2xl border border-blue-100 bg-yellow-200 p-6 shadow">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <MapPinIcon className="h-6 w-6 text-blue-600" />
            <span className="text-base font-bold text-gray-800">
              My Location
            </span>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex w-full items-center justify-start">
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
        {/* {!locationLoading &&
          (locationStatus === "denied" ||
            locationStatus === "not_set" ||
            locationStatus === "unsupported") && (
            <button
              onClick={handleRequestLocation}
              className="mt-2 w-full rounded-lg bg-yellow-300 p-2 text-center text-sm font-semibold text-blue-700 transition-colors hover:bg-yellow-400"
            >
              Share Location
            </button>
          )} */}
        {/* --- Search Bar for Service Queries --- */}
        <form
          className="mt-4 w-full"
          onSubmit={(e) => {
            e.preventDefault();
            if (searchQuery.trim()) {
              navigate(
                `/client/search-results?query=${encodeURIComponent(searchQuery)}`,
              );
            }
          }}
        >
          <div className="flex w-full items-center rounded-xl border border-blue-100 bg-white p-4 shadow-md focus-within:ring-2 focus-within:ring-yellow-300">
            <input
              type="text"
              className="flex-1 border-none bg-transparent p-0 text-lg text-gray-800 placeholder-gray-500 focus:ring-0 focus:outline-none"
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>
      </div>

      {/* --- Map Modal for Location Display --- */}
      {showMap && <MapModal />}

      {/* --- Modal: Location Permission Denied Instructions --- */}
      {showDeniedModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDeniedModal(false);
          }}
        >
          <div className="relative w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
            <button
              className="absolute top-3 right-3 rounded-full border border-gray-400 bg-gray-200 p-2 hover:bg-gray-300"
              onClick={() => setShowDeniedModal(false)}
              aria-label="Close"
              tabIndex={0}
            >
              <span className="text-xl font-bold text-gray-700">&times;</span>
            </button>
            <h2 className="mb-4 text-xl font-bold text-blue-700">
              Location Permission Blocked
            </h2>
            <p className="mb-2 text-gray-700">
              You have previously blocked location access for this site. To
              share your location, please enable location permissions in your
              browser settings and reload the page.
            </p>
            <ul className="mb-4 list-disc pl-5 text-sm text-gray-600">
              <li>
                Chrome: Click the lock icon in the address bar &gt; Site
                settings &gt; Allow Location
              </li>
              <li>
                Brave: Click the lion icon in the address bar &gt; Shields &gt;
                Allow Location, or use Site settings via the lock icon
              </li>
              <li>
                Safari: Go to Preferences &gt; Websites &gt; Location &gt; Allow
                for this site
              </li>
              <li>
                Firefox: Click the lock icon &gt; Permissions &gt; Allow
                Location
              </li>
            </ul>
            <button
              className="mt-2 w-full rounded bg-blue-600 py-2 font-bold text-white hover:bg-blue-700"
              onClick={() => setShowDeniedModal(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
