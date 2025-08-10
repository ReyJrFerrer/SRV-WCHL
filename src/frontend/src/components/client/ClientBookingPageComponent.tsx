import React, { useState, useEffect, useMemo } from "react";
import phLocations from "../../data/ph_locations.json";
import { useNavigate, useParams } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  CurrencyDollarIcon,
  CreditCardIcon,
  GlobeAltIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import useBookRequest, { BookingRequest } from "../../hooks/bookRequest";

// --- Payment Section Sub-Component ---

// Payment method selection and input for cash change
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
  // --- Booking state ---
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
  // --- Address and notes state ---
  const [street, setStreet] = useState<string>("");
  const [houseNumber, setHouseNumber] = useState<string>("");
  const [landmark, setLandmark] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const NOTES_CHAR_LIMIT = 50;
  // --- Payment state ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentError, setPaymentError] = useState<string | null>(null);
  // --- Routing ---
  const navigate = useNavigate();
  const { id: serviceId } = useParams<{ id: string }>();
  // --- Location detection state ---
  const [locationStatus, setLocationStatus] = useState<
    "detecting" | "allowed" | "denied"
  >("detecting");
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(
    null,
  );
  const [displayMunicipality, setDisplayMunicipality] = useState<string>("");
  const [displayProvince, setDisplayProvince] = useState<string>("");
  // --- Detect location on mount ---
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus("denied");
      return;
    }
    setLocationStatus("detecting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationStatus("allowed");
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setMarkerPosition([pos.coords.latitude, pos.coords.longitude]);
      },
      () => {
        setLocationStatus("denied");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);
  // --- Reverse geocode to get municipality/city and province ---
  useEffect(() => {
    if (locationStatus === "allowed" && location) {
      fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}`,
      )
        .then((res) => res.json())
        .then((data) => {
          if (data && data.address) {
            const {
              city,
              town,
              municipality,
              village,
              county,
              state,
              region,
              province,
            } = data.address;
            setDisplayMunicipality(
              city || town || municipality || village || "",
            );
            setDisplayProvince(county || state || region || province || "");
          }
        })
        .catch(() => {
          setDisplayMunicipality("");
          setDisplayProvince("");
        });
    }
  }, [locationStatus, location]);
  // --- Service and booking data (from hook) ---
  const {
    service,
    packages: hookPackages,
    providerProfile,
    loading,
    error,
    availableSlots,
    loadServiceData,
    getAvailableSlots,
    createBookingRequest,
    calculateTotalPrice,
  } = useBookRequest();
  // --- Barangay dropdown options ---
  const [barangayOptions, setBarangayOptions] = useState<string[]>([]);
  const [selectedBarangay, setSelectedBarangay] = useState<string>("");
  const [otherBarangay, setOtherBarangay] = useState("");
  useEffect(() => {
    let foundBarangays: string[] = [];
    const cityNorm = (displayMunicipality || "").trim().toLowerCase();
    const provinceNorm = (displayProvince || "").trim().toLowerCase();

    // Special case: Baguio City in Benguet or Cordillera region
    if (
      (cityNorm === "baguio" || cityNorm === "baguio city") &&
      ["benguet", "cordillera administrative region", "car", "region"].includes(
        provinceNorm,
      )
    ) {
      const benguet = phLocations.provinces.find(
        (prov: any) => prov.name.trim().toLowerCase() === "benguet",
      );
      const baguio = benguet?.municipalities.find(
        (muni: any) => muni.name.trim().toLowerCase() === "baguio city",
      );
      if (baguio && Array.isArray(baguio.barangays)) {
        foundBarangays = baguio.barangays;
      }
    }
    // Special case: La Trinidad in Benguet
    else if (
      (cityNorm === "la trinidad" || cityNorm === "latrinidad") &&
      provinceNorm === "benguet"
    ) {
      const benguet = phLocations.provinces.find(
        (prov: any) => prov.name.trim().toLowerCase() === "benguet",
      );
      const laTrinidad = benguet?.municipalities.find(
        (muni: any) => muni.name.trim().toLowerCase() === "la trinidad",
      );
      if (laTrinidad && Array.isArray(laTrinidad.barangays)) {
        foundBarangays = laTrinidad.barangays;
      }
    }
    // Special case: Itogon in Benguet
    else if (cityNorm === "itogon" && provinceNorm === "benguet") {
      const benguet = phLocations.provinces.find(
        (prov: any) => prov.name.trim().toLowerCase() === "benguet",
      );
      const itogon = benguet?.municipalities.find(
        (muni: any) => muni.name.trim().toLowerCase() === "itogon",
      );
      if (itogon && Array.isArray(itogon.barangays)) {
        foundBarangays = itogon.barangays;
      }
    }
    // Special case: Tuba in Benguet
    else if (cityNorm === "tuba" && provinceNorm === "benguet") {
      const benguet = phLocations.provinces.find(
        (prov: any) => prov.name.trim().toLowerCase() === "benguet",
      );
      const tuba = benguet?.municipalities.find(
        (muni: any) => muni.name.trim().toLowerCase() === "tuba",
      );
      if (tuba && Array.isArray(tuba.barangays)) {
        foundBarangays = tuba.barangays;
      }
    }
    // Special case: Pangasinan municipalities
    else if (
      (provinceNorm === "pangasinan" &&
        [
          "mapandan",
          "manaoag",
          "san fabian",
          "mangaldan",
          "sta. barbara",
          "san jacinto",
          "calasiao",
        ].includes(cityNorm)) ||
      (cityNorm === "dagupan" && provinceNorm === "region 1")
    ) {
      // Use Pangasinan province for Dagupan as well
      const pangasinan = phLocations.provinces.find(
        (prov: any) => prov.name.trim().toLowerCase() === "pangasinan",
      );
      const muni = pangasinan?.municipalities.find(
        (m: any) => m.name.trim().toLowerCase() === cityNorm,
      );
      if (muni && Array.isArray(muni.barangays)) {
        foundBarangays = muni.barangays;
      }
    }
    // General lookup for other cities/municipalities
    else if (cityNorm) {
      let matched = false;
      for (const province of phLocations.provinces) {
        for (const muni of province.municipalities) {
          if (
            typeof muni === "object" &&
            muni.name.trim().toLowerCase() === cityNorm &&
            Array.isArray(muni.barangays)
          ) {
            foundBarangays = muni.barangays as string[];
            matched = true;
            break;
          }
        }
        if (matched) break;
      }
    }
    if (foundBarangays.length > 0) {
      // Add 'Others' option for barangay selection
      setBarangayOptions([...foundBarangays, "Others"]);
    } else if (cityNorm) {
      setBarangayOptions([
        ...Array.from({ length: 10 }, (_, i) => `Barangay ${i + 1}`),
        "Others",
      ]);
    } else {
      setBarangayOptions([]);
    }
    setSelectedBarangay("");
    // --- Notes change handler ---
  }, [displayMunicipality, displayProvince]);
  // --- Load service and packages on mount ---
  useEffect(() => {
    if (serviceId) loadServiceData(serviceId);
  }, [serviceId, loadServiceData]);
  useEffect(() => {
    if (hookPackages.length > 0) {
      setPackages(hookPackages.map((pkg: any) => ({ ...pkg, checked: false })));
    }
  }, [hookPackages]);
  // --- Load available slots when date changes ---
  useEffect(() => {
    if (service && selectedDate) getAvailableSlots(service.id, selectedDate);
  }, [service, selectedDate, getAvailableSlots]);

  // --- Calculate total price for selected packages ---
  const totalPrice = useMemo(() => {
    return packages
      .filter((p: any) => p.checked)
      .reduce((sum: number, pkg: any) => sum + pkg.price, 0);
  }, [packages, hookPackages, calculateTotalPrice]);

  // --- Validate payment amount ---
  useEffect(() => {
    if (paymentMethod === "cash" && packages.some((p: any) => p.checked)) {
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

  // --- Package selection handler ---
  const handlePackageChange = (packageId: string) => {
    setPackages((prev) =>
      prev.map((pkg) =>
        pkg.id === packageId ? { ...pkg, checked: !pkg.checked } : pkg,
      ),
    );
    setFormError(null);
  };
  // --- Booking option handler ---
  const handleBookingOptionChange = (option: "sameday" | "scheduled") => {
    setBookingOption(option);
    setFormError(null);
  };
  // --- Date selection handler ---
  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    setSelectedTime("");
    setFormError(null);
  };
  // --- Payment amount handler ---
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value: string = e.target.value;
    if (/^\d*\.?\d{0,2}$/.test(value)) setAmountPaid(value);
    setFormError(null);
  };

  // --- Notes change handler ---
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
    setFormError(null);
  };

  // --- Confirm booking handler ---
  const handleConfirmBooking = async () => {
    setFormError(null);
    setIsSubmitting(true);
    try {
      // Validate required address fields
      if (selectedBarangay === "__other__") {
        if (
          !otherBarangay ||
          otherBarangay.trim().length < 3 ||
          otherBarangay.trim().length > 20
        ) {
          setFormError(
            "Please enter a valid barangay name (3-20 characters) for 'Others'.",
          );
          setIsSubmitting(false);
          return;
        }
      } else if (!selectedBarangay.trim()) {
        setFormError("Please select your Barangay before proceeding.");
        setIsSubmitting(false);
        return;
      }
      if (street.trim().length < 3 || street.trim().length > 20) {
        setFormError("Street Name must be between 3 and 20 characters.");
        setIsSubmitting(false);
        return;
      }
      if (
        !houseNumber.trim() ||
        houseNumber.length > 15 ||
        !/\d/.test(houseNumber)
      ) {
        setFormError(
          "House/Unit No. must be at most 15 characters and contain at least one number.",
        );
        setIsSubmitting(false);
        return;
      }
      // Require cash amount input if payment method is cash
      if (paymentMethod === "cash" && packages.some((pkg) => pkg.checked)) {
        const paidAmount = parseFloat(amountPaid);
        if (!amountPaid.trim()) {
          setFormError("Please enter the cash amount before proceeding.");
          setIsSubmitting(false);
          return;
        }
        if (isNaN(paidAmount) || paidAmount < totalPrice) {
          setFormError(
            `Cash amount must be at least ₱${totalPrice.toFixed(2)}.`,
          );
          setIsSubmitting(false);
          return;
        }
      }
      // Validate at least one package is selected
      if (!packages.some((pkg) => pkg.checked)) {
        setFormError("Please select at least one package before proceeding.");
        setIsSubmitting(false);
        return;
      }
      if (!bookingOption) {
        setFormError("Please select a booking type (Same Day or Scheduled).");
        setIsSubmitting(false);
        return;
      }
      let finalScheduledDate: Date | undefined = undefined;
      if (bookingOption === "sameday") {
        finalScheduledDate = new Date();
      } else if (bookingOption === "scheduled" && selectedDate) {
        finalScheduledDate = selectedDate;
      }
      // Build address string from manual entry and header context
      const barangayValue =
        selectedBarangay === "__other__" ? otherBarangay : selectedBarangay;
      const finalAddress = [
        houseNumber,
        street,
        barangayValue,
        displayMunicipality,
        displayProvince,
        landmark,
      ]
        .filter(Boolean)
        .join(", ");
      const bookingData: BookingRequest = {
        serviceId: service!.id,
        serviceName: service!.title,
        providerId: service!.providerId.toString(),
        packages: packages.filter((pkg) => pkg.checked),
        totalPrice,
        bookingType: bookingOption as "sameday" | "scheduled",
        scheduledDate: finalScheduledDate,
        scheduledTime: bookingOption === "scheduled" ? selectedTime : undefined,
        location: finalAddress,
        notes: notes,
      };
      const booking = await createBookingRequest(bookingData);
      if (booking) {
        setFormError(null); // Clear error after successful booking
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
  // --- Clear error message when user edits required address fields ---
  useEffect(() => {
    setFormError(null);
  }, [selectedBarangay, street, houseNumber]);

  // --- Render: Booking Page Layout ---
  // Loading, error, and not found states
  if (loading)
    return <div className="p-10 text-center">Loading service details...</div>;
  if (error)
    return <div className="p-10 text-center text-red-500">{String(error)}</div>;
  if (!service)
    return <div className="p-10 text-center">Service not found.</div>;
  // Helper: Convert day index to name (for calendar)
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
              {/* --- Booking Schedule Section (with calendar and slot selection) --- */}
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
                    }`}
                    onClick={() => handleBookingOptionChange("sameday")}
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
                        filterDate={(date: Date) => {
                          const dayName = dayIndexToName(date.getDay());
                          return service.weeklySchedule
                            ? service.weeklySchedule.some(
                                (s) =>
                                  s.day === dayName &&
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
                        dayClassName={(date: Date) => {
                          const isSelected =
                            selectedDate &&
                            date.toDateString() === selectedDate.toDateString();
                          const dayName = dayIndexToName(date.getDay());
                          const isAvailable = service.weeklySchedule
                            ? service.weeklySchedule.some(
                                (s) =>
                                  s.day === dayName &&
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
                              .filter((slot: any) => slot.isAvailable)
                              .map((slot: any, index: number) => {
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
              {/* --- Service Location Section --- */}
              <div className="glass-card rounded-2xl border border-gray-100 bg-white/70 p-6 shadow-xl backdrop-blur-md">
                {/* --- Service Location Section (uses location from Header.tsx context) --- */}
                <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900">
                  <span className="mr-2 inline-block h-6 w-2 rounded-full bg-gray-400"></span>
                  Service Location <span className="text-red-500">*</span>
                </h3>
                <div className="mt-2 space-y-3">
                  {/* The Municipality/City and Province below are sourced from Header.tsx context */}
                  <p className="text-xs text-gray-600">
                    Your location is automatically detected.
                  </p>
                  <div className="mb-2 w-full rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="mb-1 block text-xs text-blue-700">
                          Municipality/City
                        </label>
                        <input
                          type="text"
                          value={
                            locationStatus === "detecting"
                              ? "Detecting..."
                              : displayMunicipality || ""
                          }
                          readOnly
                          className="w-full border-none bg-blue-50 font-semibold text-blue-900 capitalize"
                          placeholder="Municipality/City"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="mb-1 block text-xs text-blue-700">
                          Province
                        </label>
                        <input
                          type="text"
                          value={
                            locationStatus === "detecting"
                              ? "Detecting..."
                              : displayProvince || ""
                          }
                          readOnly
                          className="w-full border-none bg-blue-50 font-semibold text-blue-900 capitalize"
                          placeholder="Province"
                        />
                      </div>
                    </div>
                  </div>
                  {locationStatus === "allowed" && markerPosition && (
                    <div className="mb-2"></div>
                  )}

                  {/* Barangay dropdown populated from ph_locations.json */}
                  <select
                    value={selectedBarangay}
                    onChange={(e) => setSelectedBarangay(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white p-3 text-sm capitalize"
                  >
                    <option value="" disabled>
                      Select Barangay *
                    </option>
                    {barangayOptions.map((barangay, idx) => (
                      <option key={idx} value={barangay}>
                        {barangay}
                      </option>
                    ))}
                    <option value="__other__">Others</option>
                  </select>
                  {selectedBarangay === "__other__" && (
                    <input
                      type="text"
                      placeholder="Enter your Barangay *"
                      value={otherBarangay}
                      onChange={(e) => setOtherBarangay(e.target.value)}
                      className="mt-3 w-full rounded-xl border border-blue-400 bg-white p-3 text-sm text-gray-700 capitalize"
                      minLength={3}
                      maxLength={20}
                      required
                    />
                  )}
                  {/* Street Name input, enabled after barangay selection */}
                  <input
                    type="text"
                    placeholder="Street Name *"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className={`w-full rounded-xl border p-3 text-sm capitalize transition-colors ${!selectedBarangay ? "cursor-not-allowed border-gray-300 bg-gray-200 text-gray-400" : "border-gray-300 bg-white text-gray-700"}`}
                    disabled={!selectedBarangay}
                    minLength={3}
                    maxLength={20}
                  />
                  {/* House/Unit No. input, enabled after street name input */}
                  <input
                    type="text"
                    placeholder="House/Unit No. *"
                    value={houseNumber}
                    onChange={(e) => setHouseNumber(e.target.value)}
                    className={`mt-3 w-full rounded-xl border p-3 text-sm capitalize transition-colors ${!street ? "cursor-not-allowed border-gray-300 bg-gray-200 text-gray-400" : "border-gray-300 bg-white text-gray-700"}`}
                    disabled={!street}
                    maxLength={15}
                  />
                  {/* Landmark input, always enabled */}
                  <input
                    type="text"
                    placeholder="Building / Subdivision / Sitio / etc. (optional)"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    className="mt-3 w-full rounded-xl border border-gray-300 bg-white p-3 text-sm capitalize"
                  />
                </div>
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
