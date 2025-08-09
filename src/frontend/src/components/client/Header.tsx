// --- Imports ---
import React, { useState, useEffect } from "react";
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
const Header: React.FC<HeaderProps> = ({ className, manualLocation }) => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  // --- State: Geolocation for map modal ---
  const [geoLocation, setGeoLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

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

  // Effect: fetch user profile and location info after auth
  // --- Effect: Fetch user profile and detect location on mount ---
  useEffect(() => {
    // Helper: retry fetch with delay (for OpenStreetMap reverse geocoding)
    const fetchWithRetry = async (
      url: string,
      attempts: number,
      delayMs: number,
    ): Promise<any> => {
      for (let i = 0; i < attempts; i++) {
        try {
          const res = await fetch(url);
          if (!res.ok) throw new Error("Fetch failed");
          return await res.json();
        } catch (err) {
          if (i < attempts - 1) {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          }
        }
      }
      throw new Error("All fetch attempts failed");
    };

    // Main: load profile and location
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
      setLocationLoading(true);
      // Request geolocation from browser
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            setGeoLocation({ latitude, longitude });
            try {
              const data = await fetchWithRetry(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
                3, // attempts
                1500, // delay ms
              );
              const province =
                data.address.county ||
                data.address.state ||
                data.address.region ||
                data.address.province ||
                "";
              const municipality =
                data.address.city ||
                data.address.town ||
                data.address.village ||
                "";
              setUserProvince(province);
              setUserAddress(municipality);
              setLocationLoading(false);
            } catch (err) {
              setUserAddress("Could not determine address");
              setUserProvince("");
              setLocationLoading(false);
            }
          },
          () => {
            // Permission denied or error
            setLocationLoading(false);
            setUserAddress("");
            setUserProvince("");
            setGeoLocation(null);
          },
        );
      } else {
        setLocationLoading(false);
        setUserAddress("");
        setUserProvince("");
        setGeoLocation(null);
      }
    };
    if (!isAuthLoading) {
      loadInitialData();
    }
    // Only run once after auth loads
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isAuthLoading]);

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
    if (!geoLocation || !geoLocation.latitude || !geoLocation.longitude)
      return null;
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
              center={[geoLocation.latitude, geoLocation.longitude]}
              zoom={16}
              scrollWheelZoom={true}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[geoLocation.latitude, geoLocation.longitude]}>
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
          {locationLoading || isAuthLoading ? (
            <span className="animate-pulse text-gray-500">
              Detecting location...
            </span>
          ) : userAddress && userProvince ? (
            <button
              type="button"
              className="font-medium text-blue-900 transition-all duration-200 hover:text-lg hover:text-blue-700 focus:outline-none"
              style={{ textDecoration: "none" }}
              onClick={() => setShowMap(true)}
            >
              {userAddress}, {userProvince}
            </button>
          ) : manualLocation &&
            manualLocation.municipality &&
            manualLocation.province ? (
            <span className="font-medium text-blue-900">
              {manualLocation.municipality}, {manualLocation.province}
            </span>
          ) : (
            <span className="text-gray-500">Location not set</span>
          )}
        </div>
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
