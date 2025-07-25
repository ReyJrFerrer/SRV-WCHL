import React, { useState } from "react";

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
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  validationErrors?: {
    locationMunicipalityCity?: string;
  };
}

const ServiceLocation: React.FC<ServiceLocationProps> = ({
  formData,
  setFormData,
}) => {
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLocationFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev: any) => {
      const updated = { ...prev, [name]: value };
      const addressParts = [
        updated.locationHouseNumber,
        updated.locationStreet,
        updated.locationBarangay,
        updated.locationMunicipalityCity,
        updated.locationProvince,
        updated.locationCountry,
      ].filter((part) => part.trim() !== "");
      return { ...updated, locationAddress: addressParts.join(", ") };
    });
  };

  const [showAddressForm, setShowAddressForm] = useState(false);

  const handleDetectLocation = () => {
    setIsDetectingLocation(true);
    setError(null);
    setShowAddressForm(false); // Hide address form when using current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setFormData((prev: any) => ({
            ...prev,
            locationLatitude: latitude.toString(),
            locationLongitude: longitude.toString(),
          }));
          setIsDetectingLocation(false);
        },
        (error) => {
          setError(`Could not detect location: ${error.message}`);
          setIsDetectingLocation(false);
        },
      );
    } else {
      setError("Geolocation is not supported by this browser.");
      setIsDetectingLocation(false);
    }
  };

  // Mock data for Baguio City
  const provinceOptions = ["Benguet"];
  const municipalityOptions = ["Baguio City"];
  const barangayOptions = [
    "Asin Road",
    "Bakakeng Central",
    "Camp 7",
    "Guisad Central",
    "Loakan Proper",
    "Pacdal",
    "Scout Barrio",
    "Session Road Area",
    "Irisan",
    "Mines View",
    "San Vicente",
    "Upper Market Subdivision",
    "Other",
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-4">
      <section className="rounded-2xl border border-blue-100 bg-blue-50 p-6 shadow-md">
        <h3 className="mb-4 text-xl font-bold text-blue-700">
          Service Location
        </h3>
        <button
          type="button"
          onClick={handleDetectLocation}
          disabled={isDetectingLocation}
          className="mb-4 w-full rounded-lg bg-blue-600 px-4 py-3 text-base font-semibold text-white shadow hover:bg-blue-700 disabled:bg-blue-400"
        >
          {isDetectingLocation ? "Detecting..." : "📍 Use Current Location"}
        </button>
        {error && <p className="mb-4 text-xs text-red-600">{error}</p>}

        <div className="my-4 flex items-center">
          <div className="h-px flex-1 bg-gray-300" />
          <span className="mx-3 text-sm font-medium text-gray-500">or</span>
          <div className="h-px flex-1 bg-gray-300" />
        </div>

        {!showAddressForm && (
          <button
            type="button"
            onClick={() => setShowAddressForm(true)}
            className="mb-2 w-full rounded-lg border border-blue-600 bg-white px-4 py-3 text-base font-semibold text-blue-700 shadow hover:bg-blue-50"
          >
            Enter work address
          </button>
        )}

        {showAddressForm && (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <select
              name="locationProvince"
              value={formData.locationProvince}
              onChange={handleLocationFieldChange}
              required
              className="rounded-md border-gray-300 bg-white px-3 py-2 text-sm shadow-sm"
            >
              <option value="">Select Province*</option>
              {provinceOptions.map((prov) => (
                <option key={prov} value={prov}>
                  {prov}
                </option>
              ))}
            </select>
            <select
              name="locationMunicipalityCity"
              value={formData.locationMunicipalityCity}
              onChange={handleLocationFieldChange}
              required
              disabled={
                !formData.locationProvince || formData.locationProvince === ""
              }
              className={`rounded-md border-gray-300 px-3 py-2 text-sm shadow-sm ${!formData.locationProvince || formData.locationProvince === "" ? "cursor-not-allowed bg-gray-100" : "bg-white"}`}
            >
              <option value="">Select Municipality/City*</option>
              {municipalityOptions.map((mun) => (
                <option key={mun} value={mun}>
                  {mun}
                </option>
              ))}
            </select>
            <select
              name="locationBarangay"
              value={formData.locationBarangay}
              onChange={handleLocationFieldChange}
              required
              disabled={!formData.locationMunicipalityCity}
              className={`rounded-md border-gray-300 px-3 py-2 text-sm shadow-sm ${!formData.locationMunicipalityCity ? "cursor-not-allowed bg-gray-100" : "bg-white"}`}
            >
              <option value="">Select Barangay*</option>
              {barangayOptions.map((brgy) => (
                <option key={brgy} value={brgy}>
                  {brgy}
                </option>
              ))}
            </select>
            <input
              name="locationStreet"
              value={formData.locationStreet}
              onChange={handleLocationFieldChange}
              placeholder="Street*"
              required
              disabled={!formData.locationBarangay}
              className={`rounded-md border-gray-300 px-3 py-2 text-sm shadow-sm ${!formData.locationBarangay ? "cursor-not-allowed bg-gray-100" : "bg-white"}`}
            />
            <input
              name="locationHouseNumber"
              value={formData.locationHouseNumber}
              onChange={handleLocationFieldChange}
              placeholder="House/Bldg Number*"
              required
              disabled={!formData.locationStreet}
              className={`rounded-md border-gray-300 px-3 py-2 text-sm shadow-sm ${!formData.locationStreet ? "cursor-not-allowed bg-gray-100" : "bg-white"}`}
            />
          </div>
        )}
      </section>
    </div>
  );
};

export default ServiceLocation;
