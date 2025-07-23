import React, { useEffect, useState } from "react";

// Components
import Header from "../../components/client/Header";
import Categories from "../../components/client/Categories";
import ServiceList from "../../components/client/ServiceListReact";
import BottomNavigation from "../../components/client/BottomNavigation";
import { MapPinIcon } from "@heroicons/react/24/solid";

// Hooks
import { useServiceManagement } from "../../hooks/serviceManagement";

// --- NEW: Location Modal Component ---
type LocationModalProps = {
  onAllow: () => void;
  onDeny: () => void;
};

const LocationModal: React.FC<LocationModalProps> = ({ onAllow, onDeny }) => (
  <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-white">
    <div className="m-4 max-w-sm rounded-lg bg-white p-6 text-center shadow-xl">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
        <MapPinIcon className="h-6 w-6 text-yellow-400" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">
        Enable Location Services
      </h3>
      <p className="mt-2 text-sm text-gray-600">
        To provide you with the best-localized services and results, please
        allow us to access your current location.
      </p>
      <div className="mt-6 flex space-x-3">
        <button
          onClick={onDeny}
          className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300"
        >
          Maybe Later
        </button>
        <button
          onClick={onAllow}
          className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Allow
        </button>
      </div>
    </div>
  </div>
);

const ClientHomePage: React.FC = () => {
  const { loadingCategories, error } = useServiceManagement();
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Set the document title when the component mounts
  useEffect(() => {
    document.title = "SRV | Find Local Service Providers";

    // Check if location permission has already been handled
    const locationPermissionStatus = localStorage.getItem("locationPermission");
    if (!locationPermissionStatus) {
      setShowLocationModal(true);
    }
  }, []);

  const handleAllowLocation = () => {
    setShowLocationModal(false);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // You can now use the coordinates
          const { latitude, longitude } = position.coords;
          console.log("Location obtained:", { latitude, longitude });

          // Save the coordinates to localStorage for use in Header
          localStorage.setItem(
            "userCoordinates",
            JSON.stringify({ latitude, longitude }),
          );
          localStorage.setItem("locationPermission", "granted");
        },
        (error) => {
          console.error("Error getting location:", error);
          // Handle cases where the user denies permission from the browser prompt
          localStorage.setItem("locationPermission", "denied");
        },
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
      localStorage.setItem("locationPermission", "unsupported");
    }
  };

  const handleDenyLocation = () => {
    // User chose not to decide now.
    setShowLocationModal(false);
    // You might want to set a temporary flag to not ask again for a short time
    sessionStorage.setItem("locationPrompted", "true");
  };

  // Display a loading spinner while categories are being fetched by the hook.
  if (loadingCategories) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* --- NEW: Render the location modal conditionally --- */}
      {showLocationModal && (
        <LocationModal
          onAllow={handleAllowLocation}
          onDeny={handleDenyLocation}
        />
      )}

      {/* Display an error message if fetching categories failed */}
      {error && (
        <div className="mx-4 mt-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
          <span className="block sm:inline">
            Failed to load categories: {error}
          </span>
        </div>
      )}

      <div className="px-4 pt-4 pb-16">
        <Header className="mb-6" />
        <Categories
          className="mb-8"
          moreButtonImageUrl="/images/categories/more.png"
          lessButtonImageUrl="/images/categories/more.png"
        />
        <ServiceList />
      </div>

      <BottomNavigation />
    </div>
  );
};

export default ClientHomePage;
