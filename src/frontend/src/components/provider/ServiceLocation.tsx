import React, { useState, useEffect } from "react";
import { MapPinIcon } from "@heroicons/react/24/solid";
import { useAuth } from "../../context/AuthContext";

// Address data structure for Philippines (matching ClientBookingPageComponent)
type AddressDataType = {
  [province: string]: { [municipality: string]: string[] };
};

const addressData: AddressDataType = {
  Bulacan: {
    Pulilan: ["Poblacion", "Longos", "Dampol 1st", "Dampol 2nd"],
    Calumpit: ["Poblacion", "Canalate", "Gatbuca"],
  },
  Pampanga: {
    "San Fernando": ["Dolores", "San Agustin", "Santo Rosario"],
    "Angeles City": ["Balibago", "Malabanias", "Pandan"],
  },
  Benguet: {
    "Baguio City": ["Domoit Kanluran", "Isabang"],
    Atok: ["Barangay 1", "Barangay 2"],
    Bakun: ["Barangay 1", "Barangay 2"],
    Bokod: ["Barangay 1", "Barangay 2"],
    Buguias: ["Barangay 1", "Barangay 2"],
    Itogon: ["Barangay 1", "Barangay 2"],
    Kabayan: ["Barangay 1", "Barangay 2"],
    Kapangan: ["Barangay 1", "Barangay 2"],
    Kibungan: ["Barangay 1", "Barangay 2"],
    "La Trinidad": ["Barangay 1", "Barangay 2"],
    Mankayan: ["Barangay 1", "Barangay 2"],
    Sablan: ["Barangay 1", "Barangay 2"],
    Tuba: ["Barangay 1", "Barangay 2"],
    Tublay: ["Barangay 1", "Barangay 2"],
  },
  Pangasinan: {
    Dagupan: ["Barangay 1", "Barangay 2"],
    Alaminos: ["Barangay 1", "Barangay 2"],
    "San Carlos": ["Abanon", "Mabakbalino"],
    Urdaneta: ["Barangay 1", "Barangay 2"],
    Calasiao: ["Ambonao", "Bued"],
    "San Manuel": ["San Antonio‑Arzadon", "Guiset Norte"],
    Mangaldan: ["Alitaya", "Poblacion"],
    Sison: ["Agat", "Poblacion Central"],
    Agno: ["Barangay 1", "Barangay 2"],
  },
};

interface ServiceLocationProps {
  formData: {
    locationHouseNumber: string;
    locationStreet: string;
    locationBarangay: string;
    locationMunicipalityCity: string;
    locationProvince: string;
    locationCountry: string;
    locationPostalCode: string;
    locationLatitude: string;
    locationLongitude: string;
    locationAddress: string;
    serviceRadius: string;
    serviceRadiusUnit: "km" | "mi";
    [key: string]: any; // Allow additional properties for compatibility
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  validationErrors?: {
    locationMunicipalityCity?: string;
  };
}

const ServiceLocation: React.FC<ServiceLocationProps> = ({
  formData,
  setFormData,
  validationErrors,
}) => {
  const { location, locationStatus } = useAuth();
  const [displayAddress, setDisplayAddress] = useState<string>(
    "Detecting location...",
  );
  const [addressMode, setAddressMode] = useState<"context" | "manual">(
    "context",
  );
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedMunicipality, setSelectedMunicipality] = useState("");
  const [selectedBarangay, setSelectedBarangay] = useState("");
  const [street, setStreet] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [landmark, setLandmark] = useState("");

  // Initialize form data from existing location fields
  useEffect(() => {
    if (formData.locationProvince) {
      setSelectedProvince(formData.locationProvince);
      setAddressMode("manual");
    }
    if (formData.locationMunicipalityCity) {
      setSelectedMunicipality(formData.locationMunicipalityCity);
    }
    if (formData.locationBarangay) {
      setSelectedBarangay(formData.locationBarangay);
    }
    if (formData.locationStreet) {
      setStreet(formData.locationStreet);
    }
    if (formData.locationHouseNumber) {
      setHouseNumber(formData.locationHouseNumber);
    }
  }, []);

  // Handle GPS location detection and reverse geocoding (same as ClientBookingPageComponent)
  useEffect(() => {
    if (locationStatus === "allowed" && location) {
      fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}`,
      )
        .then((res) => res.json())
        .then((data) => {
          if (data && data.address) {
            const {
              road,
              suburb,
              village,
              city,
              town,
              county,
              state,
              municipality,
              district,
              region,
              province,
              country,
            } = data.address;
            const barangay = suburb || village || district || "";
            const cityPart = city || town || municipality || "";
            const provincePart = county || state || region || province || "";
            const formAddress = [road, barangay].filter(Boolean).join(", ");
            const fullAddress = [road, barangay, cityPart, provincePart]
              .filter(Boolean)
              .join(", ");

            setDisplayAddress(
              fullAddress ||
                `Lat: ${location.latitude}, Lon: ${location.longitude}`,
            );
            // Auto-populate form data with GPS coordinates
            setFormData((prev: any) => ({
              ...prev,
              locationLatitude: location.latitude.toString(),
              locationLongitude: location.longitude.toString(),
              locationAddress: formAddress,
              locationMunicipalityCity: cityPart,
              locationProvince: provincePart,
              locationCountry: country,
            }));
          } else {
            setDisplayAddress(
              `Lat: ${location.latitude}, Lon: ${location.longitude}`,
            );
          }
        })
        .catch(() =>
          setDisplayAddress(
            `Lat: ${location.latitude}, Lon: ${location.longitude}`,
          ),
        );
    } else if (locationStatus === "denied") {
      setDisplayAddress("Location not shared. Please enter manually.");
      setAddressMode("manual");
    } else {
      setDisplayAddress("Detecting location...");
    }
  }, [location, locationStatus, setFormData]);

  const handleLocationFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    // Update local state
    if (name === "locationProvince") {
      setSelectedProvince(value);
      setSelectedMunicipality("");
      setSelectedBarangay("");
    } else if (name === "locationMunicipalityCity") {
      setSelectedMunicipality(value);
      setSelectedBarangay("");
    } else if (name === "locationBarangay") {
      setSelectedBarangay(value);
    } else if (name === "locationStreet") {
      setStreet(value);
    } else if (name === "locationHouseNumber") {
      setHouseNumber(value);
    }

    // Update form data
    setFormData((prev: any) => {
      const updated = { ...prev, [name]: value };

      // Build complete address for manual mode
      if (addressMode === "manual") {
        const addressParts = [
          name === "locationHouseNumber" ? value : houseNumber,
          name === "locationStreet" ? value : street,
          name === "locationBarangay" ? value : selectedBarangay,
          name === "locationMunicipalityCity" ? value : selectedMunicipality,
          name === "locationProvince" ? value : selectedProvince,
          "Philippines",
        ].filter((part) => part && part.trim() !== "");
        updated.locationAddress = addressParts.join(", ");
      }

      return updated;
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-4">
      <section className="rounded-2xl border border-blue-100 bg-blue-50 p-6 shadow-md">
        <h3 className="mb-4 text-xl font-bold text-blue-700">
          Service Location<span className="text-base text-red-500">*</span>
        </h3>

        {/* Current Location Display */}
        <div className="mb-4 rounded-lg border border-gray-300 bg-gray-50 p-3">
          <div className="flex items-center">
            <MapPinIcon className="mr-3 h-6 w-6 flex-shrink-0 text-blue-600" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-500">
                {addressMode === "context"
                  ? "Using Your Current Location"
                  : "Using Manual Address"}
              </p>
              <p className="text-sm font-semibold break-words text-gray-800">
                {addressMode === "context" ? displayAddress : "See form below"}
              </p>
            </div>
          </div>
        </div>

        {/* Address Mode Toggle */}
        <button
          type="button"
          onClick={() =>
            setAddressMode(addressMode === "manual" ? "context" : "manual")
          }
          className="mb-4 w-full rounded-lg bg-gray-200 p-3 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-300"
        >
          {addressMode === "manual"
            ? "Use Current Location"
            : "Enter Address Manually"}
        </button>

        {/* Manual Address Form */}
        {addressMode === "manual" && (
          <div className="space-y-4">
            <p className="text-xs text-gray-600">
              Please enter your service address manually:
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {" "}
              {/* Added grid for responsiveness */}
              <select
                name="locationProvince"
                value={selectedProvince}
                onChange={(e) => {
                  setSelectedProvince(e.target.value);
                  setSelectedMunicipality("");
                  setSelectedBarangay("");
                  handleLocationFieldChange(e);
                }}
                className="w-full rounded-lg border border-gray-300 bg-white p-3 text-sm"
              >
                <option value="">Select Province</option>
                {Object.keys(addressData).map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </select>
              <select
                name="locationMunicipalityCity"
                value={selectedMunicipality}
                onChange={(e) => {
                  setSelectedMunicipality(e.target.value);
                  setSelectedBarangay("");
                  handleLocationFieldChange(e);
                }}
                disabled={!selectedProvince}
                className="w-full rounded-lg border border-gray-300 bg-white p-3 text-sm disabled:bg-gray-100"
              >
                <option value="">Select Municipality/City</option>
                {selectedProvince &&
                  Object.keys(addressData[selectedProvince]).map((mun) => (
                    <option key={mun} value={mun}>
                      {mun}
                    </option>
                  ))}
              </select>
            </div>

            <select
              name="locationBarangay"
              value={selectedBarangay}
              onChange={(e) => {
                setSelectedBarangay(e.target.value);
                handleLocationFieldChange(e);
              }}
              disabled={!selectedMunicipality}
              className="w-full rounded-lg border border-gray-300 bg-white p-3 text-sm disabled:bg-gray-100"
            >
              <option value="">Select Barangay</option>
              {selectedMunicipality &&
                addressData[selectedProvince][selectedMunicipality].map(
                  (brgy) => (
                    <option key={brgy} value={brgy}>
                      {brgy}
                    </option>
                  ),
                )}
            </select>

            <input
              type="text"
              name="locationStreet"
              placeholder="Street Name *"
              value={street}
              onChange={(e) => {
                setStreet(e.target.value);
                handleLocationFieldChange(e);
              }}
              className="w-full rounded-lg border border-gray-300 p-3 text-sm"
            />

            <input
              type="text"
              name="locationHouseNumber"
              placeholder="House No. / Unit / Building *"
              value={houseNumber}
              onChange={(e) => {
                setHouseNumber(e.target.value);
                handleLocationFieldChange(e);
              }}
              className="w-full rounded-lg border border-gray-300 p-3 text-sm"
            />

            <input
              type="text"
              placeholder="Landmark / Additional Info (Optional)"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-3 text-sm"
            />
          </div>
        )}

        {/* Validation Error Display */}
        {validationErrors?.locationMunicipalityCity && (
          <div className="mt-2 text-sm text-red-600">
            {validationErrors.locationMunicipalityCity}
          </div>
        )}
      </section>
    </div>
  );
};

export default ServiceLocation;
