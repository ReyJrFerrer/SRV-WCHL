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

// --- Payment Section Sub-Component ---
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
            Change for how much?
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

// --- Main Booking Page Component ---
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

  // --- Memoize map center for performance ---
  const mapCenter = useMemo<[number, number]>(() => {
    if (markerPosition) return markerPosition;
    if (locationStatus === "allowed" && location) {
      return [location.latitude, location.longitude];
    }
    // Default to Baguio City if not available
    return [16.4023, 120.596];
  }, [markerPosition, location, locationStatus]);

  // --- State Management ---
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

  // --- Determine if Same Day is within service hours ---
  const isSameDayWithinServiceHours = React.useMemo(() => {
    if (!service || !service.weeklySchedule) return false;
    const now = new Date();
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
    const todayName = dayIndexToName(now.getDay()) as DayOfWeek;
    const todaySchedule = service.weeklySchedule.find(
      (s) => s.day === todayName && s.availability.isAvailable,
    );
    if (
      !todaySchedule ||
      !todaySchedule.availability.slots ||
      todaySchedule.availability.slots.length === 0
    )
      return false;
    // Check if any slot for today is still available (endTime > now)
    return todaySchedule.availability.slots.some((slot) => {
      const [endH, endM] = slot.endTime.split(":").map(Number);
      const end = new Date(now);
      end.setHours(endH, endM, 0, 0);
      return now < end;
    });
  }, [service]);
  const [displayAddress, setDisplayAddress] = useState<string>(
    "Detecting location...",
  );
  const [addressMode, setAddressMode] = useState<"context" | "manual">(
    "context",
  );
  // Remove province/municipality, only use barangay
  const [nearbyBarangays, setNearbyBarangays] = useState<string[]>([]);
  const [selectedBarangay, setSelectedBarangay] = useState("");
  const [street, setStreet] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [landmark, setLandmark] = useState("");
  const [notes, setNotes] = useState("");
  // Track notes word limit
  const NOTES_CHAR_LIMIT = 50;
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= NOTES_CHAR_LIMIT) {
      setNotes(value);
    } else {
      setNotes(value.slice(0, NOTES_CHAR_LIMIT));
    }
  };
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentError, setPaymentError] = useState<string | null>(null);
  // Add detectedMunicipality state
  const [detectedMunicipality, setDetectedMunicipality] = useState("");
  // Track detected province for manual address
  const [detectedProvince, setDetectedProvince] = useState("");

  // --- Effects ---
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
            const cityPart =
              data.address.city ||
              data.address.town ||
              data.address.municipality ||
              "";
            setDetectedMunicipality(cityPart);
            // Compose address as before
            const houseOrBuilding =
              [
                data.address.house_number,
                data.address.building,
                data.address.landmark,
                data.address.neighbourhood,
              ]
                .filter(Boolean)
                .join(" ") || "";
            const streetPart = data.address.road || data.address.street || "";
            const barangay =
              data.address.suburb ||
              data.address.village ||
              data.address.district ||
              "";
            const provincePart =
              data.address.county ||
              data.address.state ||
              data.address.region ||
              data.address.province ||
              "";
            setDetectedProvince(provincePart);
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
            if (addressMode === "manual" && cityPart) {
              fetch(
                `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&extratags=1&country=Philippines&city=${encodeURIComponent(
                  cityPart,
                )}&viewbox=${location.longitude - 0.05},${location.latitude - 0.05},${location.longitude + 0.05},${location.latitude + 0.05}&bounded=1`,
              )
                .then((res) => res.json())
                .then((results) => {
                  const brgySet = new Set<string>();
                  results.forEach((r: any) => {
                    if (
                      r.address &&
                      (r.address.suburb ||
                        r.address.village ||
                        r.address.district)
                    ) {
                      brgySet.add(
                        r.address.suburb ||
                          r.address.village ||
                          r.address.district,
                      );
                    }
                  });
                  setNearbyBarangays(Array.from(brgySet));
                });
            }
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
  }, [location, locationStatus, addressMode]);

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

  // --- Event Handlers ---
  const handlePackageChange = (packageId: string) => {
    setPackages((prev) =>
      prev.map((pkg) =>
        pkg.id === packageId ? { ...pkg, checked: !pkg.checked } : pkg,
      ),
    );
    setFormError(null);
  };
  const handleBookingOptionChange = (option: "sameday" | "scheduled") => {
    if (option === "sameday" && !isSameDayAvailable) return;
    setBookingOption(option);
    setFormError(null);
  };
  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    setSelectedTime("");
    setFormError(null);
  };
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d{0,2}$/.test(value)) setAmountPaid(value);
    setFormError(null);
  };

  // --- Reverse geocode on marker drag end ---
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
      if (!selectedBarangay || !street || !houseNumber) {
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
      finalAddress = `${houseNumber}, ${street}, ${selectedBarangay}, ${detectedMunicipality}, ${detectedProvince}`;
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
        notes: notes,
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

  // --- Render: Booking Page Layout ---
  if (loading)
    return <div className="p-10 text-center">Loading service details...</div>;
  if (error)
    return <div className="p-10 text-center text-red-500">{String(error)}</div>;
  if (!service)
    return <div className="p-10 text-center">Service not found.</div>;

  // Restore dayIndexToName function for scheduled booking
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

  // DEBUG: Show locationStatus and displayAddress for troubleshooting
  // Remove isLocationValid, not used for button state

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 via-white to-yellow-50">
      <style>
        {`
        .booking-calendar-wrapper .react-datepicker { width: 100%; border: none; box-shadow: none; }
        .booking-calendar-wrapper .react-datepicker__month-container { width: 100%; }
        .booking-calendar-wrapper .react-datepicker__header { background-color: #f3f4f6; border-bottom: none; border-radius: 0.75rem 0.75rem 0 0; }
        .booking-calendar-wrapper .react-datepicker__day-names, .booking-calendar-wrapper .react-datepicker__week { display: flex; justify-content: space-around; }
        .booking-calendar-wrapper .react-datepicker__day { margin: 0.25rem; border-radius: 0.5rem; transition: background 0.2s, color 0.2s; }
        .booking-calendar-wrapper .react-datepicker__day--selected, .booking-calendar-wrapper .react-datepicker__day--keyboard-selected {
          background-color: #2563eb !important;
          color: #fff !important;
          font-weight: bold;
        }
        .booking-calendar-wrapper .react-datepicker__day--disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .booking-calendar-wrapper .react-datepicker__day:hover:not(.react-datepicker__day--disabled) {
          background-color: #dbeafe;
          color: #1e40af;
        }
        .booking-calendar-wrapper .react-datepicker__current-month {
          font-weight: 600;
          color: #1e293b;
        }
      `}
      </style>
      <div className="flex-grow pb-36 md:pb-28">
        <div className="mx-auto max-w-5xl px-2 py-8 md:px-0">
          <div className="md:flex md:gap-x-8">
            <div className="space-y-6 md:w-1/2">
              <div className="glass-card rounded-2xl border border-blue-100 bg-white/70 p-6 shadow-xl backdrop-blur-md">
                <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-blue-900">
                  <span className="mr-2 inline-block h-6 w-2 rounded-full bg-blue-400"></span>
                  Select Package(s) <span className="text-red-500">*</span>
                </h3>
                {packages.map((pkg) => (
                  <label
                    key={pkg.id}
                    className="mb-3 flex cursor-pointer items-start space-x-3 rounded-xl p-3 transition hover:bg-blue-50"
                  >
                    <input
                      type="checkbox"
                      checked={pkg.checked}
                      onChange={() => handlePackageChange(pkg.id)}
                      className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="text-lg font-semibold text-gray-900">
                        {pkg.title}
                      </div>
                      <div className="mb-1 text-sm text-gray-600">
                        {pkg.description}
                      </div>
                      <div className="text-base font-bold text-blue-600">
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
            <div className="mt-8 space-y-6 md:mt-0 md:w-1/2">
              <div className="glass-card rounded-2xl border border-yellow-100 bg-white/70 p-6 shadow-xl backdrop-blur-md">
                <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-yellow-900">
                  <span className="mr-2 inline-block h-6 w-2 rounded-full bg-yellow-400"></span>
                  Booking Schedule <span className="text-red-500">*</span>
                </h3>
                <div className="mb-4 flex gap-3">
                  <button
                    className={`flex-1 rounded-xl border p-3 text-center font-semibold shadow-sm transition-colors ${
                      bookingOption === "sameday"
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-gray-200 bg-gray-50 text-gray-700 hover:border-yellow-200 hover:bg-yellow-100"
                    } ${!isSameDayAvailable || !isSameDayWithinServiceHours ? "cursor-not-allowed opacity-50" : ""}`}
                    onClick={() => handleBookingOptionChange("sameday")}
                    disabled={
                      !isSameDayAvailable || !isSameDayWithinServiceHours
                    }
                  >
                    <div className="text-base font-semibold">Same Day</div>
                  </button>
                  <button
                    className={`flex-1 rounded-xl border p-3 text-center font-semibold shadow-sm transition-colors ${
                      bookingOption === "scheduled"
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-gray-200 bg-gray-50 text-gray-700 hover:border-yellow-200 hover:bg-yellow-100"
                    }`}
                    onClick={() => handleBookingOptionChange("scheduled")}
                  >
                    <div className="text-base font-semibold">Scheduled</div>
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
                        renderCustomHeader={({
                          date,
                          decreaseMonth,
                          increaseMonth,
                          prevMonthButtonDisabled,
                          nextMonthButtonDisabled,
                        }) => (
                          <div className="flex items-center justify-between rounded-t-lg bg-gray-100 px-2 py-2">
                            <button
                              onClick={decreaseMonth}
                              disabled={prevMonthButtonDisabled}
                              className="rounded-full p-1 hover:bg-gray-200 disabled:opacity-30"
                              type="button"
                              aria-label="Previous Month"
                            >
                              <svg
                                className="h-5 w-5 text-gray-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 19l-7-7 7-7"
                                />
                              </svg>
                            </button>
                            <span className="text-base font-semibold text-gray-800">
                              {date.toLocaleString("default", {
                                month: "long",
                              })}{" "}
                              {date.getFullYear()}
                            </span>
                            <button
                              onClick={increaseMonth}
                              disabled={nextMonthButtonDisabled}
                              className="rounded-full p-1 hover:bg-gray-200 disabled:opacity-30"
                              type="button"
                              aria-label="Next Month"
                            >
                              <svg
                                className="h-5 w-5 text-gray-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </button>
                          </div>
                        )}
                        dayClassName={(date) => {
                          const isSelected =
                            selectedDate &&
                            date.toDateString() === selectedDate.toDateString();
                          const dayName = dayIndexToName(date.getDay());
                          const isAvailable = service.weeklySchedule
                            ? service.weeklySchedule.some(
                                (s) =>
                                  s.day === (dayName as DayOfWeek) &&
                                  s.availability.isAvailable,
                              )
                            : false;
                          return [
                            "transition-colors duration-150",
                            isSelected
                              ? "!bg-blue-600 !text-white !font-bold"
                              : "",
                            isAvailable
                              ? "hover:bg-blue-100 cursor-pointer"
                              : "opacity-40 cursor-not-allowed",
                          ].join(" ");
                        }}
                        calendarClassName="rounded-lg shadow-lg border border-gray-200 bg-white"
                        wrapperClassName="w-full"
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
                                const to12Hour = (t: string) => {
                                  const [h, m] = t.split(":").map(Number);
                                  const hour = h % 12 || 12;
                                  const ampm = h < 12 ? "AM" : "PM";
                                  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
                                };
                                const time = `${slot.timeSlot.startTime}-${slot.timeSlot.endTime}`;
                                const [start, end] = time.split("-");
                                const formatted = `${to12Hour(start)} - ${to12Hour(end)}`;
                                return (
                                  <button
                                    key={index}
                                    onClick={() => setSelectedTime(time)}
                                    className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                                      selectedTime === time
                                        ? "border-blue-600 bg-blue-600 text-white"
                                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                                    }`}
                                  >
                                    {formatted}
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
              <div className="glass-card rounded-2xl border border-gray-100 bg-white/70 p-6 shadow-xl backdrop-blur-md">
                <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900">
                  <span className="mr-2 inline-block h-6 w-2 rounded-full bg-gray-400"></span>
                  Service Location <span className="text-red-500">*</span>
                </h3>
                <div className="mb-3 rounded-xl border border-gray-200 bg-gray-50/80 p-3 shadow-sm">
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
                        style={{ height: 220, marginBottom: 24, zIndex: 0 }}
                      >
                        <MapContainer
                          center={mapCenter}
                          zoom={16}
                          scrollWheelZoom={false}
                          style={{ height: "100%", width: "100%", zIndex: 0 }}
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
                  className="w-full rounded-xl bg-gray-200 p-3 text-base font-medium text-gray-800 shadow-sm transition-colors hover:bg-gray-300"
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
                    <div className="mb-2 w-full rounded-xl border border-gray-200 bg-gray-100 p-3 text-sm">
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="mb-1 block text-xs text-gray-500">
                            Municipality/City
                          </label>
                          <input
                            type="text"
                            value={detectedMunicipality}
                            readOnly
                            className="w-full border-none bg-gray-100 font-semibold text-gray-700 capitalize"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="mb-1 block text-xs text-gray-500">
                            Province
                          </label>
                          <input
                            type="text"
                            value={detectedProvince}
                            readOnly
                            className="w-full border-none bg-gray-100 font-semibold text-gray-700 capitalize"
                          />
                        </div>
                      </div>
                    </div>
                    {nearbyBarangays.length > 0 ? (
                      <select
                        value={selectedBarangay}
                        onChange={(e) => setSelectedBarangay(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 bg-white p-3 text-sm capitalize"
                      >
                        <option value="">Select Barangay</option>
                        {nearbyBarangays.map((brgy) => (
                          <option key={brgy} value={brgy}>
                            {brgy}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="Enter Barangay *"
                        value={selectedBarangay}
                        onChange={(e) => setSelectedBarangay(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 bg-white p-3 text-sm capitalize"
                      />
                    )}
                    <input
                      type="text"
                      placeholder="Street Name *"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 bg-white p-3 text-sm capitalize"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="House/Unit No. *"
                        value={houseNumber}
                        onChange={(e) => setHouseNumber(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 bg-white p-3 text-sm capitalize"
                      />
                      <input
                        type="text"
                        placeholder="Landmark (optional)"
                        value={landmark}
                        onChange={(e) => setLandmark(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 bg-white p-3 text-sm capitalize"
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="glass-card rounded-2xl border border-blue-100 bg-white/70 p-6 shadow-xl backdrop-blur-md">
                <h3 className="mb-4 flex items-center text-xl font-bold text-blue-900">
                  <span className="mr-2 inline-block h-6 w-2 rounded-full bg-blue-400"></span>
                  Notes for Provider{" "}
                  <span className="text-base font-normal text-gray-400">
                    (Optional)
                  </span>
                </h3>
                <textarea
                  placeholder="e.g., Beware of the dog, please bring a ladder, etc. (max 30 characters)"
                  value={notes}
                  onChange={handleNotesChange}
                  rows={4}
                  maxLength={NOTES_CHAR_LIMIT}
                  className="w-full rounded-xl border border-gray-200 bg-white/80 p-3 text-base shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="mt-4 md:hidden">
                <PaymentSection
                  paymentMethod={paymentMethod}
                  setPaymentMethod={setPaymentMethod}
                  packages={packages}
                  amountPaid={amountPaid}
                  handleAmountChange={handleAmountChange}
                  paymentError={paymentError}
                  totalPrice={totalPrice}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="sticky bottom-0 z-20 border-t bg-white/80 p-4 shadow-xl backdrop-blur-md">
        <div className="mx-auto max-w-md">
          {formError && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-center text-base text-red-700 shadow-sm">
              {formError}
            </div>
          )}
          <button
            onClick={handleConfirmBooking}
            className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-yellow-400 px-8 py-4 text-lg font-bold text-white shadow-lg transition-colors hover:from-yellow-400 hover:to-blue-600 disabled:bg-gray-300 disabled:text-gray-400"
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
