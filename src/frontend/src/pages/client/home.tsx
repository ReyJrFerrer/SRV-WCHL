import React, { useEffect, useState } from "react";
import phLocations from "../../data/ph_locations.json";

// Components
import Header from "../../components/client/Header";
import Categories from "../../components/client/Categories";
import ServiceList from "../../components/client/ServiceListReact";
import BottomNavigation from "../../components/client/BottomNavigation";

// Hooks
import { useServiceManagement } from "../../hooks/serviceManagement";

const ClientHomePage: React.FC = () => {
  const { error } = useServiceManagement();
  const [locationBlocked, setLocationBlocked] = React.useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = React.useState(false);
  const [province, setProvince] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [municipalityOptions, setMunicipalityOptions] = useState<string[]>([]);
  const [userLocation, setUserLocation] = React.useState<{
    province: string;
    municipality: string;
  } | null>(null);

  useEffect(() => {
    document.title = "Home | SRV";
    // Check geolocation permission status
    if (navigator.permissions) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        if (result.state === "denied") {
          setLocationBlocked(true);
        }
      });
    } else {
      // Fallback: try to get location, catch error
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          () => {},
          (err) => {
            if (err.code === 1) {
              setLocationBlocked(true);
            }
          },
        );
      }
    }
  }, []);

  // Example: Call this when location permission is blocked
  useEffect(() => {
    if (locationBlocked) {
      setShowLocationPrompt(true);
    }
  }, [locationBlocked]);

  useEffect(() => {
    // Update municipality options when province changes
    if (province) {
      const found = phLocations.provinces.find((p) => p.name === province);
      setMunicipalityOptions(found ? found.municipalities : []);
      setMunicipality("");
    } else {
      setMunicipalityOptions([]);
      setMunicipality("");
    }
  }, [province]);

  const handleLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (province && municipality) {
      setUserLocation({ province, municipality });
      setShowLocationPrompt(false);
    }
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-gray-50 pb-20">
      {/* Location prompt modal */}
      {showLocationPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
            <h2 className="mb-4 text-center text-xl font-bold text-blue-700">
              Location Access Blocked
            </h2>
            <p className="mb-4 text-center text-gray-700">
              Please enter your current province and municipality/city so we can
              show services near you.
            </p>
            <form
              onSubmit={handleLocationSubmit}
              className="flex flex-col gap-4"
            >
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
      {error && (
        <div className="mx-4 mt-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
          <span className="block sm:inline">
            Failed to load categories: {error}
          </span>
        </div>
      )}
      <div className="w-full max-w-full px-4 pt-4 pb-16">
        <Header
          className="mb-6 w-full max-w-full"
          manualLocation={userLocation}
        />
        <h2 className="mb-2 text-left text-xl font-bold">Categories</h2>
        <Categories
          className="mb-8 w-full max-w-full"
          moreButtonImageUrl="/images/categories/more.svg"
          lessButtonImageUrl="/images/categories/more.svg"
        />
        <ServiceList className="w-full max-w-full" />
      </div>
      <BottomNavigation />
    </div>
  );
};

export default ClientHomePage;
