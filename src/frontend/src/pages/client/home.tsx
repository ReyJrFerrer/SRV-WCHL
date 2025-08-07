import React, { useEffect, useState } from "react";
import phLocations from "../../data/ph_locations.json";
import Header from "../../components/client/Header";
import Categories from "../../components/client/Categories";
import ServiceList from "../../components/client/ServiceListReact";
import BottomNavigation from "../../components/client/BottomNavigation";
import { useServiceManagement } from "../../hooks/serviceManagement";

// --- Client Home Page ---
const ClientHomePage: React.FC = () => {
  // --- State: Service category error ---
  const { error } = useServiceManagement();
  // --- State: Location permission and manual input modal ---
  const [, setLocationBlocked] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  // --- State: Province and municipality dropdown ---
  const [province, setProvince] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [municipalityOptions, setMunicipalityOptions] = useState<string[]>([]);
  // --- State: User's selected manual location ---
  const [userLocation, setUserLocation] = useState<{
    province: string;
    municipality: string;
  } | null>(() => {
    const saved = localStorage.getItem("manualLocation");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  // --- Effect: Set page title and check geolocation permission status on mount ---
  useEffect(() => {
    document.title = "Home | SRV";
    if (navigator.permissions) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        if (result.state === "denied") {
          setLocationBlocked(true);
        }
      });
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {},
        (err) => {
          if (err.code === 1) {
            setLocationBlocked(true);
          }
        },
      );
    }
  }, []);

  // --- Effect: Show manual location modal if no manual location is set ---
  useEffect(() => {
    if (!userLocation) {
      setShowLocationPrompt(true);
    } else {
      setShowLocationPrompt(false);
    }
  }, [userLocation]);

  // --- Effect: Update municipality dropdown when province changes ---
  useEffect(() => {
    if (province) {
      const found = phLocations.provinces.find((p) => p.name === province);
      if (found && Array.isArray(found.municipalities)) {
        // If municipalities are objects, extract their names
        setMunicipalityOptions(
          found.municipalities.map((mun: any) =>
            typeof mun === "object" && mun.name ? mun.name : mun,
          ),
        );
      } else {
        setMunicipalityOptions([]);
      }
      setMunicipality("");
    } else {
      setMunicipalityOptions([]);
      setMunicipality("");
    }
  }, [province]);

  // --- Handler: Manual location form submit ---
  const handleLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (province && municipality) {
      const location = { province, municipality };
      setUserLocation(location);
      localStorage.setItem("manualLocation", JSON.stringify(location));
      setShowLocationPrompt(false);
    }
  };

  // Remove redundant effect: location prompt is now managed by userLocation only

  // --- Render: Client Home Page Layout ---
  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-gray-50 pb-20">
      {/* Modal: Manual location input when geolocation is blocked */}
      {showLocationPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
            <h2 className="mb-4 text-center text-xl font-bold text-blue-700">
              Enter Your Location
            </h2>
            <p className="mb-4 text-center text-gray-700">
              Please enter your current province and municipality/city so we can
              show services near you.
            </p>
            <form
              onSubmit={handleLocationSubmit}
              className="flex flex-col gap-4"
            >
              {/* Province dropdown */}
              <div>
                <label
                  htmlFor="province"
                  className="mb-1 block font-semibold text-gray-700"
                >
                  Province
                </label>
                <select
                  id="province"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  required
                >
                  <option value="" disabled>
                    Select province
                  </option>
                  {phLocations.provinces.map((prov) => (
                    <option key={prov.name} value={prov.name}>
                      {prov.name}
                    </option>
                  ))}
                </select>
              </div>
              {/* Municipality/City dropdown */}
              <div>
                <label
                  htmlFor="municipality"
                  className="mb-1 block font-semibold text-gray-700"
                >
                  Municipality/City
                </label>
                <select
                  id="municipality"
                  value={municipality}
                  onChange={(e) => setMunicipality(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  required
                  disabled={!province}
                >
                  <option value="" disabled>
                    Select municipality/city
                  </option>
                  {municipalityOptions.map((mun) => (
                    <option key={mun} value={mun}>
                      {mun}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn-primary mt-2 w-full">
                Save Location
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Error: Service categories failed to load */}
      {error && (
        <div className="mx-4 mt-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
          <span className="block sm:inline">
            Failed to load categories: {error}
          </span>
        </div>
      )}
      {/* Main content: header, categories, service list */}
      <div className="w-full max-w-full px-4 pt-4 pb-16">
        {/* Header: displays welcome and location */}
        <Header
          className="mb-6 w-full max-w-full"
          manualLocation={userLocation}
        />
        {/* Categories section */}
        <h2 className="mb-2 text-left text-xl font-bold">Categories</h2>
        <Categories
          className="mb-8 w-full max-w-full"
          moreButtonImageUrl="/images/categories/more.svg"
          lessButtonImageUrl="/images/categories/more.svg"
        />
        {/* Service list section */}
        <ServiceList className="w-full max-w-full" />
      </div>
      {/* Bottom navigation bar */}
      <BottomNavigation />
    </div>
  );
};

export default ClientHomePage;
