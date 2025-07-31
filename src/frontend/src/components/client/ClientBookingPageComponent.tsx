import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import {
  CurrencyDollarIcon,
  CreditCardIcon,
  GlobeAltIcon,
  ExclamationCircleIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";

// Hooks and Services
import useBookRequest, { BookingRequest } from "../../hooks/bookRequest";
import { useAuth } from "../../context/AuthContext";
import { DayOfWeek } from "../../services/serviceCanisterService";

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

// Helper Data and Types
const dayIndexToName = (dayIndex: number): string => {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[dayIndex] || "";
};
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

// --- Sub-Components ---
type PaymentSectionProps = {
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  packages: {
    id: string;
    title: string;
    description: string;
    price: number;
    checked: boolean;
  }[];
  amountPaid: string;
  handleAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  paymentError: string | null;
  totalPrice: number;
};

const PaymentSection: React.FC<PaymentSectionProps> = ({
  paymentMethod,
  setPaymentMethod,
  packages,
  amountPaid,
  handleAmountChange,
  paymentError,
  totalPrice,
}) => (
  <div className="mt-4 bg-white p-4 md:rounded-xl md:shadow-sm">
    <h3 className="mb-4 text-lg font-semibold text-gray-900">Payment Method</h3>
    <div className="space-y-3">
      <div
        onClick={() => setPaymentMethod("cash")}
        className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 ${
          paymentMethod === "cash"
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300"
        }`}
      >
        <div className="flex items-center">
          <CurrencyDollarIcon className="mr-3 h-6 w-6 text-green-500" />
          <span className="font-medium text-gray-800">Cash</span>
        </div>
        {paymentMethod === "cash" && (
          <CheckCircleIcon className="h-6 w-6 text-blue-500" />
        )}
      </div>
      {paymentMethod === "cash" && packages.some((p) => p.checked) && (
        <div className="pt-2 pl-4">
          <label className="text-sm font-medium text-gray-700">
            Amount to Pay
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={amountPaid}
            onChange={handleAmountChange}
            placeholder={`e.g., ${totalPrice.toFixed(2)}`}
            className={`mt-1 w-full rounded-md border p-2 ${
              paymentError ? "border-red-500" : "border-gray-300"
            }`}
          />
          {paymentError && amountPaid && (
            <p className="mt-1 flex items-center text-xs text-red-600">
              <ExclamationCircleIcon className="mr-1 h-4 w-4" />
              {paymentError}
            </p>
          )}
        </div>
      )}
      <div className="flex cursor-not-allowed items-center justify-between rounded-lg border p-3 opacity-50">
        <div className="flex items-center">
          <img
            src="/images/external logo/g-cash-logo.svg"
            alt="GCash"
            width={24}
            height={24}
            className="mr-3"
          />
          <span className="font-medium text-gray-500">GCash</span>
        </div>
        <span className="text-xs text-gray-400">Soon</span>
      </div>
      <div className="flex cursor-not-allowed items-center justify-between rounded-lg border p-3 opacity-50">
        <div className="flex items-center">
          <CreditCardIcon className="mr-3 h-6 w-6 text-gray-400" />
          <span className="font-medium text-gray-500">Debit/Credit Card</span>
        </div>
        <span className="text-xs text-gray-400">Soon</span>
      </div>
      <div className="flex cursor-not-allowed items-center justify-between rounded-lg border p-3 opacity-50">
        <div className="flex items-center">
          <GlobeAltIcon className="mr-3 h-6 w-6 text-gray-400" />
          <span className="font-medium text-gray-500">Web3 Wallet</span>
        </div>
        <span className="text-xs text-gray-400">Soon</span>
      </div>
    </div>
  </div>
);

// --- Main Page Component ---
const ClientBookingPageComponent: React.FC = () => {
  const navigate = useNavigate();
  const { id: serviceId } = useParams<{ id: string }>();
  const { location, locationStatus } = useAuth();
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(
    null,
  );

  const {
    service,
    packages: hookPackages,
    providerProfile,
    loading,
    error,
    availableSlots,
    isSameDayAvailable,
    loadServiceData,
    getAvailableSlots,
    createBookingRequest,
    calculateTotalPrice,
  } = useBookRequest();

  // Memoize map center for performance
  const mapCenter = useMemo<[number, number]>(() => {
    if (markerPosition) return markerPosition;
    if (locationStatus === "allowed" && location) {
      return [location.latitude, location.longitude];
    }
    // Default to Baguio City if not available
    return [16.4023, 120.596];
  }, [markerPosition, location, locationStatus]);

  // State Management
  const [packages, setPackages] = useState<
    {
      id: string;
      title: string;
      description: string;
      price: number;
      checked: boolean;
    }[]
  >([]);
  const [bookingOption, setBookingOption] = useState<
    "sameday" | "scheduled" | null
  >(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
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
  const [concerns, setConcerns] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Effects
  useEffect(() => {
    if (serviceId) loadServiceData(serviceId);
  }, [serviceId, loadServiceData]);

  useEffect(() => {
    if (hookPackages.length > 0) {
      setPackages(hookPackages.map((pkg) => ({ ...pkg, checked: false })));
    }
  }, [hookPackages]);

  useEffect(() => {
    if (locationStatus === "allowed" && location) {
      setMarkerPosition([location.latitude, location.longitude]);
    }
  }, [location, locationStatus]);

  useEffect(() => {
    if (locationStatus === "allowed" && location) {
      fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}`,
      )
        .then((res) => res.json())
        .then((data) => {
          if (data && data.address) {
            // Extract address parts, including more possible fields
            const {
              house_number,
              building,
              landmark,
              neighbourhood,
              road,
              street,
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
            } = data.address;
            // Compose a more complete address
            const houseOrBuilding =
              [house_number, building, landmark, neighbourhood]
                .filter(Boolean)
                .join(" ") || "";
            const streetPart = road || street || "";
            const barangay = suburb || village || district || "";
            const cityPart = city || town || municipality || "";
            const provincePart = county || state || region || province || "";
            const fullAddress = [
              houseOrBuilding,
              streetPart,
              barangay,
              cityPart,
              provincePart,
            ]
              .filter(Boolean)
              .join(", ");
            setDisplayAddress(
              fullAddress ||
                data.display_name ||
                `Lat: ${location.latitude}, Lon: ${location.longitude}`,
            );
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
  }, [location, locationStatus]);

  useEffect(() => {
    if (service && selectedDate) getAvailableSlots(service.id, selectedDate);
  }, [service, selectedDate, getAvailableSlots]);

  const totalPrice = useMemo(() => {
    return packages
      .filter((p) => p.checked)
      .reduce((sum, pkg) => sum + pkg.price, 0);
  }, [packages, hookPackages, calculateTotalPrice]);

  useEffect(() => {
    if (paymentMethod === "cash" && packages.some((p) => p.checked)) {
      const paidAmount = parseFloat(amountPaid);
      if (amountPaid && (isNaN(paidAmount) || paidAmount < totalPrice)) {
        setPaymentError(`Amount must be at least ₱${totalPrice.toFixed(2)}`);
      } else {
        setPaymentError(null);
      }
    } else {
      setPaymentError(null);
    }
  }, [amountPaid, totalPrice, paymentMethod, packages]);

  // Event Handlers
  const handlePackageChange = (packageId: string) => {
    setPackages((prev) =>
      prev.map((pkg) =>
        pkg.id === packageId ? { ...pkg, checked: !pkg.checked } : pkg,
      ),
    );
  };
  const handleBookingOptionChange = (option: "sameday" | "scheduled") => {
    if (option === "sameday" && !isSameDayAvailable) return;
    setBookingOption(option);
  };
  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    setSelectedTime("");
  };
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d{0,2}$/.test(value)) setAmountPaid(value);
  };

  // Reverse geocode on marker drag end
  const handleMarkerDragEnd = async (e: L.LeafletEvent) => {
    const marker = e.target;
    const latlng = marker.getLatLng();
    setMarkerPosition([latlng.lat, latlng.lng]);
    // Reverse geocode to update displayAddress
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`,
      );
      const data = await res.json();
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
        } = data.address;
        const barangay = suburb || village || district || "";
        const cityPart = city || town || municipality || "";
        const provincePart = county || state || region || province || "";
        const fullAddress = [road, barangay, cityPart, provincePart]
          .filter(Boolean)
          .join(", ");
        setDisplayAddress(
          fullAddress || `Lat: ${latlng.lat}, Lon: ${latlng.lng}`,
        );
      } else {
        setDisplayAddress(`Lat: ${latlng.lat}, Lon: ${latlng.lng}`);
      }
    } catch {
      setDisplayAddress(`Lat: ${latlng.lat}, Lon: ${latlng.lng}`);
    }
  };

  const handleConfirmBooking = async () => {
    setFormError(null);
    // Validate all required fields and show specific error messages
    if (!bookingOption) {
      setFormError("Please select a booking schedule (Same Day or Scheduled).");
      return;
    }
    if (!packages.some((pkg) => pkg.checked)) {
      setFormError("Please select at least one package.");
      return;
    }
    if (bookingOption === "scheduled" && (!selectedDate || !selectedTime)) {
      setFormError("Please select a date and time for your booking.");
      return;
    }
    // Location validation
    if (addressMode === "context") {
      if (
        locationStatus === undefined ||
        locationStatus === null ||
        locationStatus === "not_set"
      ) {
        setFormError(
          `Location status is not set. Please wait for location detection or enter your address manually. [locationStatus: ${locationStatus}]`,
        );
        return;
      }
      if (locationStatus !== "allowed") {
        setFormError(
          `Please allow location access or enter your address manually. [locationStatus: ${locationStatus}]`,
        );
        return;
      }
      if (
        !displayAddress ||
        displayAddress.trim() === "" ||
        displayAddress.trim() === "Detecting location..."
      ) {
        setFormError(
          `A valid location must be detected before proceeding. [locationStatus: ${locationStatus}, displayAddress: ${displayAddress}]`,
        );
        return;
      }
    } else if (addressMode === "manual") {
      if (
        !selectedProvince ||
        !selectedMunicipality ||
        !selectedBarangay ||
        !street ||
        !houseNumber
      ) {
        setFormError("Please complete all required address fields.");
        return;
      }
    } else {
      setFormError(
        "Please provide your location by enabling it or entering it manually.",
      );
      return;
    }
    // Payment validation
    if (paymentMethod === "cash" && packages.some((p) => p.checked)) {
      const paidAmount = parseFloat(amountPaid);
      if (!amountPaid) {
        setFormError("Please enter the amount to pay.");
        return;
      }
      if (isNaN(paidAmount) || paidAmount < totalPrice) {
        setFormError(`Amount must be at least ₱${totalPrice.toFixed(2)}`);
        return;
      }
    }
    setIsSubmitting(true);
    let finalAddress = "Address not specified.";
    if (addressMode === "context" && locationStatus === "allowed") {
      finalAddress = displayAddress;
    } else if (addressMode === "manual") {
      finalAddress = `${houseNumber}, ${street}, ${selectedBarangay}, ${selectedMunicipality}, ${selectedProvince}`;
    }
    try {
      let finalScheduledDate: Date | undefined = undefined;
      if (bookingOption === "scheduled" && selectedDate && selectedTime) {
        const [startTime] = selectedTime.split("-");
        const [hours, minutes] = startTime.split(":").map(Number);
        finalScheduledDate = new Date(selectedDate);
        finalScheduledDate.setHours(hours, minutes, 0, 0);
      }
      const bookingData: BookingRequest = {
        serviceId: service!.id,
        serviceName: service!.title,
        providerId: service!.providerId.toString(),
        packages: packages.filter((pkg) => pkg.checked),
        totalPrice,
        bookingType: bookingOption,
        scheduledDate: finalScheduledDate,
        scheduledTime: bookingOption === "scheduled" ? selectedTime : undefined,
        location: finalAddress,
        concerns: concerns,
      };
      const booking = await createBookingRequest(bookingData);
      if (booking) {
        const confirmationDetails = {
          ...bookingData,
          providerName: providerProfile?.name,
          date: finalScheduledDate
            ? finalScheduledDate.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : "Same Day",
          time: bookingData.scheduledTime || "As soon as possible",
          // For receipt page compatibility:
          packagePrice: totalPrice.toFixed(2),
          amountToPay:
            paymentMethod === "cash"
              ? amountPaid || totalPrice.toFixed(2)
              : totalPrice.toFixed(2),
          landmark: landmark || "None",
        };
        navigate("/client/booking/confirmation", {
          state: { details: confirmationDetails },
        });
      } else {
        setFormError("Failed to create booking. Please try again.");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred.";
      setFormError(
        `An error occurred while creating the booking: ${errorMessage}`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Render Logic ---
  if (loading)
    return <div className="p-10 text-center">Loading service details...</div>;
  if (error)
    return <div className="p-10 text-center text-red-500">{String(error)}</div>;
  if (!service)
    return <div className="p-10 text-center">Service not found.</div>;

  // DEBUG: Show locationStatus and displayAddress for troubleshooting
  // Remove isLocationValid, not used for button state

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <style>
        {`
                .booking-calendar-wrapper .react-datepicker { width: 100%; border: 1; }
                .booking-calendar-wrapper .react-datepicker__month-container { width: 100%; }
                .booking-calendar-wrapper .react-datepicker__header { background-color: #f3f4f6; }
                .booking-calendar-wrapper .react-datepicker__day-names, .booking-calendar-wrapper .react-datepicker__week { display: flex; justify-content: space-around; }
                .booking-calendar-wrapper .react-datepicker__day { margin: 0.25rem; }
                `}
      </style>
      <div className="flex-grow pb-28 md:pb-24">
        <div className="md:flex md:flex-row md:gap-x-8 md:p-6">
          <div className="md:w-1/2">
            <div className="bg-white p-4 md:rounded-xl md:shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Select Package(s) *
              </h3>
              {packages.map((pkg) => (
                <label
                  key={pkg.id}
                  className="mb-3 flex cursor-pointer items-start space-x-3 rounded-md p-2 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={pkg.checked}
                    onChange={() => handlePackageChange(pkg.id)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{pkg.title}</div>
                    <div className="text-sm text-gray-600">
                      {pkg.description}
                    </div>
                    <div className="text-sm font-medium text-blue-600">
                      ₱
                      {pkg.price.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                </label>
              ))}
            </div>
            <div className="hidden md:block">
              <PaymentSection
                {...{
                  paymentMethod,
                  setPaymentMethod,
                  packages,
                  amountPaid,
                  handleAmountChange,
                  paymentError,
                  totalPrice,
                }}
              />
            </div>
          </div>
          <div className="mt-4 md:mt-0 md:w-1/2">
            <div className="bg-white p-4 md:rounded-xl md:shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Booking Schedule *
              </h3>
              <div className="mb-4 flex gap-3">
                <button
                  className={`flex-1 rounded-lg border p-3 text-center transition-colors ${bookingOption === "sameday" ? "bg-blue-600 text-white" : "bg-gray-50 text-gray-700 hover:border-yellow-200 hover:bg-yellow-100"} ${!isSameDayAvailable ? "cursor-not-allowed opacity-50" : ""}`}
                  onClick={() => handleBookingOptionChange("sameday")}
                  disabled={!isSameDayAvailable}
                >
                  <div className="text-sm font-medium">Same Day</div>
                </button>
                <button
                  className={`flex-1 rounded-lg border p-3 text-center transition-colors ${bookingOption === "scheduled" ? "bg-blue-600 text-white" : "bg-gray-50 text-gray-700 hover:border-yellow-200 hover:bg-yellow-100"}`}
                  onClick={() => handleBookingOptionChange("scheduled")}
                >
                  <div className="text-sm font-medium">Scheduled</div>
                </button>
              </div>
              {bookingOption === "scheduled" && (
                <div className="space-y-4">
                  <div className="booking-calendar-wrapper">
                    <DatePicker
                      selected={selectedDate}
                      onChange={handleDateChange}
                      minDate={
                        new Date(new Date().setDate(new Date().getDate() + 1))
                      }
                      filterDate={(date) => {
                        const dayName = dayIndexToName(date.getDay());
                        return service.weeklySchedule
                          ? service.weeklySchedule.some(
                              (s) =>
                                s.day === (dayName as DayOfWeek) &&
                                s.availability.isAvailable,
                            )
                          : false;
                      }}
                      inline
                    />
                  </div>
                  {selectedDate && (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Select a time:
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {availableSlots.length > 0 ? (
                          availableSlots
                            .filter((slot) => slot.isAvailable)
                            .map((slot, index) => {
                              const time = `${slot.timeSlot.startTime}-${slot.timeSlot.endTime}`;
                              return (
                                <button
                                  key={index}
                                  onClick={() => setSelectedTime(time)}
                                  className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${selectedTime === time ? "border-blue-600 bg-blue-600 text-white" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}`}
                                >
                                  {time}
                                </button>
                              );
                            })
                        ) : (
                          <p className="text-sm text-gray-500">
                            No available slots for this day.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* --- REFACTORED LOCATION SECTION --- */}
            <div className="mt-4 bg-white p-4 md:rounded-xl md:shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Service Location *
              </h3>
              <div className="mb-3 rounded-lg border border-gray-300 bg-gray-50 p-3">
                <div className="flex items-center">
                  <MapPinIcon className="mr-3 h-6 w-6 flex-shrink-0 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500">
                      {addressMode === "context"
                        ? "Using Your Current Location"
                        : "Using Manual Address"}
                    </p>
                    <p className="text-sm font-semibold text-gray-800">
                      {addressMode === "context"
                        ? displayAddress
                        : "See form below"}
                    </p>
                  </div>
                </div>
                {/* --- OpenStreetMap Visual with Draggable Marker --- */}
                {addressMode === "context" &&
                  locationStatus === "allowed" &&
                  markerPosition && (
                    <div
                      className="mt-3 overflow-hidden rounded-lg"
                      style={{ height: 220 }}
                    >
                      <MapContainer
                        center={mapCenter}
                        zoom={16}
                        scrollWheelZoom={false}
                        style={{ height: "100%", width: "100%" }}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker
                          position={markerPosition}
                          draggable={true}
                          eventHandlers={{
                            dragend: handleMarkerDragEnd,
                          }}
                        >
                          <Popup>Drag me to adjust your location!</Popup>
                        </Marker>
                      </MapContainer>
                    </div>
                  )}
                {/* --- End OpenStreetMap Visual --- */}
              </div>
              <button
                onClick={() =>
                  setAddressMode(
                    addressMode === "manual" ? "context" : "manual",
                  )
                }
                className="w-full rounded-lg bg-gray-200 p-3 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-300"
              >
                {addressMode === "manual"
                  ? "Use Current Location"
                  : "Enter Address Manually"}
              </button>
              {addressMode === "manual" && (
                <div className="mt-2 space-y-3">
                  <p className="text-xs text-gray-600">
                    Please enter your address manually:
                  </p>
                  <select
                    value={selectedProvince}
                    onChange={(e) => {
                      setSelectedProvince(e.target.value);
                      setSelectedMunicipality("");
                      setSelectedBarangay("");
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
                    value={selectedMunicipality}
                    onChange={(e) => {
                      setSelectedMunicipality(e.target.value);
                      setSelectedBarangay("");
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
                  <select
                    value={selectedBarangay}
                    onChange={(e) => setSelectedBarangay(e.target.value)}
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
                    placeholder="Street Name *"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 p-3 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="House No. / Unit / Building *"
                    value={houseNumber}
                    onChange={(e) => setHouseNumber(e.target.value)}
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
            </div>
            <div className="mt-4 bg-white p-4 md:rounded-xl md:shadow-sm">
              <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
                <PencilSquareIcon className="mr-2 h-5 w-5 text-gray-500" />
                Notes for Provider (Optional)
              </h3>
              <textarea
                placeholder="e.g., Beware of the dog, please bring a ladder, etc."
                value={concerns}
                onChange={(e) => setConcerns(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="md:hidden">
              <PaymentSection
                {...{
                  paymentMethod,
                  setPaymentMethod,
                  packages,
                  amountPaid,
                  handleAmountChange,
                  paymentError,
                  totalPrice,
                }}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="sticky bottom-0 border-t bg-white p-4">
        <div className="mx-auto max-w-md">
          {formError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-center text-sm text-red-700">
              {formError}
            </div>
          )}
          <button
            onClick={handleConfirmBooking}
            className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-yellow-500 disabled:bg-gray-300"
          >
            {isSubmitting && (
              <div className="mr-3 h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
            )}
            {isSubmitting ? "Submitting..." : "Confirm Booking"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientBookingPageComponent;
