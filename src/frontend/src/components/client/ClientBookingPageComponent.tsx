import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { DayOfWeek } from "../../services/serviceCanisterService";
import useBookRequest, { BookingRequest } from "../../hooks/bookRequest";

// Helper functions
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

interface SelectablePackage {
  id: string;
  title: string;
  description: string;
  price: number;
  checked: boolean;
}

interface ClientBookingPageComponentProps {
  serviceSlug: string;
}

const ClientBookingPageComponent: React.FC<ClientBookingPageComponentProps> = ({
  serviceSlug,
}) => {
  const navigate = useNavigate();

  // Use the booking hook
  const {
    service: hookService,
    packages: hookPackages,
    providerProfile: hookProviderProfile, // Add this
    loading: hookLoading,
    error: hookError,
    availableSlots: hookAvailableSlots,
    isSameDayAvailable,
    loadServiceData,
    getAvailableSlots,
    createBookingRequest,
    calculateTotalPrice,
  } = useBookRequest();

  // Local state for form management
  const [packages, setPackages] = useState<SelectablePackage[]>([]);
  const [concerns] = useState<string>("");
  const [bookingOption, setBookingOption] = useState<"sameday" | "scheduled">(
    "sameday",
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);

  // Location state
  const [houseNumber, setHouseNumber] = useState("");
  const [street, setStreet] = useState("");
  const [barangay, setBarangay] = useState("");
  const [municipalityCity, setMunicipalityCity] = useState("");
  const [province, setProvince] = useState("");
  const [currentLocationStatus, setCurrentLocationStatus] = useState("");
  const [useGpsLocation, setUseGpsLocation] = useState(false);
  const [showManualAddress, setShowManualAddress] = useState(false);

  // Load service data when component mounts
  useEffect(() => {
    if (serviceSlug) {
      loadServiceData(serviceSlug);
    }
  }, [serviceSlug, loadServiceData]);

  // Update local packages state when hook packages change
  useEffect(() => {
    if (hookPackages.length > 0) {
      setPackages(
        hookPackages.map((pkg) => ({
          id: pkg.id,
          title: pkg.title,
          description: pkg.description,
          price: pkg.price,
          checked: false,
        })),
      );
    }
  }, [hookPackages]);

  // Update booking option based on same-day availability
  useEffect(() => {
    if (!isSameDayAvailable && bookingOption === "sameday") {
      setBookingOption("scheduled");
    }
  }, [isSameDayAvailable, bookingOption]);

  // Load available slots when date is selected
  useEffect(() => {
    const loadSlots = async () => {
      if (hookService && selectedDate) {
        try {
          await getAvailableSlots(hookService.id, selectedDate);
        } catch (error) {
          console.error("Error loading slots:", error);
        }
      }
    };
    loadSlots();
  }, [hookService, selectedDate, getAvailableSlots]);

  // Event handlers
  const handlePackageChange = (packageId: string) => {
    setFormError(null);
    setPackages((prevPackages) =>
      prevPackages.map((pkg) =>
        pkg.id === packageId ? { ...pkg, checked: !pkg.checked } : pkg,
      ),
    );
  };

  const handleBookingOptionChange = (option: "sameday" | "scheduled") => {
    if (option === "sameday" && !isSameDayAvailable) return;
    setFormError(null);
    setBookingOption(option);
    if (option === "sameday") {
      setSelectedDate(null);
      setSelectedTime("");
    }
  };

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    if (!date) {
      setSelectedTime("");
    }
    if (formError?.includes("date")) {
      setFormError(null);
    }
  };

  const handleTimeChange = (time: string) => {
    setSelectedTime(time);
    if (formError?.includes("time")) {
      setFormError(null);
    }
  };

  const handleUseCurrentLocation = () => {
    setCurrentLocationStatus("Fetching location...");
    setUseGpsLocation(true);
    setShowManualAddress(false);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocationStatus(
            `📍 Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)} (Using this)`,
          );
          setHouseNumber("");
          setStreet("");
          setBarangay("");
          setMunicipalityCity("");
          setProvince("");
        },
        (error) => {
          setCurrentLocationStatus(
            `⚠️ Hindi makuha ang lokasyon. Ilagay nalang ito nang manu-mano. (Error: ${error.message})`,
          );
          setUseGpsLocation(false);
          setShowManualAddress(true);
        },
      );
    } else {
      setCurrentLocationStatus(
        "Hindi suportado ang geolocation. Ilagay nalang ang address nang manu-mano.",
      );
      setUseGpsLocation(false);
      setShowManualAddress(true);
    }
  };

  const toggleManualAddress = () => {
    setShowManualAddress(!showManualAddress);
    if (!showManualAddress) {
      setUseGpsLocation(false);
      setCurrentLocationStatus("");
    }
  };

  const handleConfirmBooking = async () => {
    setFormError(null);

    // Validate package selection
    const anyPackageSelected = packages.some((pkg) => pkg.checked);
    if (!anyPackageSelected) {
      setFormError("Pumili ng hindi bababa sa isang package ng serbisyo.");
      return;
    }

    // Validate scheduling
    if (bookingOption === "scheduled") {
      if (!selectedDate) {
        setFormError("Pumili ng petsa para sa iyong nakatakdang reservasyon.");
        return;
      }
      if (!selectedTime.trim()) {
        setFormError("Pumili ng oras para sa iyong nakatakdang reservasyon.");
        return;
      }
    } else if (!isSameDayAvailable) {
      setFormError("Reserbasyon ng kaparehong araw ay hindi maaari.");
      return;
    }

    // Validate location
    let finalAddress = "Walang tinukoy na address.";
    if (useGpsLocation) {
      finalAddress = currentLocationStatus;
    } else if (
      houseNumber ||
      street ||
      barangay ||
      municipalityCity ||
      province
    ) {
      const addressParts = [
        houseNumber,
        street,
        barangay,
        municipalityCity,
        province,
      ].filter(Boolean);
      finalAddress = addressParts.join(", ");
    } else {
      setFormError("Ibigay ang iyong lokasyon (GPS o manu-manong ilagay).");
      return;
    }

    // Prepare booking data with debugging
    const selectedPackageIds = packages
      .filter((pkg) => pkg.checked)
      .map((pkg) => pkg.id);

    let totalPrice = 0;
    try {
      totalPrice = calculateTotalPrice(selectedPackageIds, hookPackages);

      if (isNaN(totalPrice) || totalPrice < 0) {
        setFormError(
          "Hindi makuha ang kabuuang presyo. Mangyaring subukan muli.",
        );
        return;
      }
    } catch (error) {
      setFormError(
        "Hindi makuha ang kabuuang presyo. Mangyaring subukan muli.",
      );
      return;
    }

    const bookingData: BookingRequest = {
      serviceId: hookService!.id,
      serviceName: hookService!.title,
      providerId: hookService!.providerId.toString(),
      packages: packages.filter((pkg) => pkg.checked),
      totalPrice,
      bookingType: bookingOption,
      scheduledDate:
        bookingOption === "scheduled" ? selectedDate || undefined : undefined,
      scheduledTime: bookingOption === "scheduled" ? selectedTime : undefined,
      location: finalAddress,
      concerns:
        concerns.trim() || "Walang tiyak na mga alalahanin na nabanggit.",
    };

    try {
      const booking = await createBookingRequest(bookingData);
      if (booking) {
        // Prepare booking details for confirmation page
        const confirmationDetails = {
          serviceName: bookingData.serviceName,
          providerName:
            hookProviderProfile?.name || "Hindi Kilalang Tagapagbigay.",
          selectedPackages: bookingData.packages.map((pkg) => ({
            id: pkg.id,
            name: pkg.title,
          })),
          concerns: bookingData.concerns || "No specific concerns mentioned",
          bookingType:
            bookingData.bookingType === "sameday" ? "Same Day" : "Scheduled",
          date:
            bookingData.bookingType === "scheduled" && bookingData.scheduledDate
              ? bookingData.scheduledDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "Same Day",
          time:
            bookingData.bookingType === "scheduled" && bookingData.scheduledTime
              ? bookingData.scheduledTime
              : "As soon as possible",
          location: bookingData.location,
        };

        // Navigate to confirmation page with details
        navigate(
          `/client/booking/confirmation?details=${encodeURIComponent(JSON.stringify(confirmationDetails))}`,
        );
      } else {
        setFormError("Nabigo ang paglikha ng reservasyon. Subukan muli.");
      }
    } catch (error) {
      setFormError(
        "Nagkaroon ng error habang nililikha ang reservasyon. Subukan muli.",
      );
    }
  };

  if (hookLoading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">
            Naglo-load ang mga detalye ng serbisyo...
          </p>
        </div>
      </div>
    );
  }

  if (hookError) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{hookError}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!hookService) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Hindi natagpuan ang serbisyo</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Bumalik
          </button>
        </div>
      </div>
    );
  }

  const isConfirmDisabled =
    !packages.some((pkg) => pkg.checked) ||
    (bookingOption === "sameday" && !isSameDayAvailable) ||
    (bookingOption === "scheduled" && (!selectedDate || !selectedTime.trim()));

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <div className="flex-grow pb-28 md:pb-24">
        <div className="md:flex md:flex-row md:gap-x-6 md:p-4 lg:gap-x-8 lg:p-6">
          {/* Left Column Wrapper */}
          <div className="md:flex md:w-1/2 md:flex-col">
            {/* Package Selection Section */}
            <div className="border-b border-gray-200 bg-white p-4 md:rounded-t-xl md:border md:border-b-0 md:shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Pumili ng package *
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
                    <div className="text-sm font-medium text-green-600">
                      ₱{pkg.price}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            {/* Concerns Section */}
            {/* <div className="bg-white border-b border-gray-200 p-4 md:rounded-b-xl md:border-x md:border-b md:shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Concerns</h3>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg resize-none min-h-[80px] focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add any concerns or requests..."
                value={concerns}
                onChange={(e) => setConcerns(e.target.value)}
              />
            </div> */}
          </div>

          {/* Right Column Wrapper */}
          <div className="mt-4 md:mt-0 md:flex md:w-1/2 md:flex-col">
            {/* Booking Schedule Section */}
            <div className="border-b border-gray-200 bg-white p-4 md:rounded-t-xl md:border md:border-b-0 md:shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Iskedyul ng reserbasyon *
              </h3>

              {hookService.weeklySchedule &&
                hookService.weeklySchedule.length > 0 && (
                  <div className="mb-4 rounded bg-blue-50 p-2 text-center text-sm text-blue-700">
                    <strong>
                      Available:{" "}
                      {hookService.weeklySchedule
                        .filter((s) => s.availability.isAvailable)
                        .map((s) => s.day)
                        .join(", ")}{" "}
                      |
                      {hookService.weeklySchedule[0]?.availability?.slots
                        ?.map((slot) => `${slot.startTime}-${slot.endTime}`)
                        .join(", ") || "No time slots available"}
                    </strong>
                  </div>
                )}

              {(!hookService.weeklySchedule ||
                hookService.weeklySchedule.length === 0) && (
                <div className="mb-4 rounded bg-yellow-50 p-2 text-center text-sm text-yellow-700">
                  Walang itinakdang iskedyul ng availability para sa
                  tagapagbigay na ito.
                </div>
              )}

              <div className="mb-4 flex gap-3">
                <button
                  className={`flex-1 rounded-lg border p-3 text-center ${
                    bookingOption === "sameday"
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-300 bg-gray-50 text-gray-700"
                  } ${!isSameDayAvailable ? "cursor-not-allowed opacity-50" : "hover:bg-blue-500 hover:text-white"}`}
                  onClick={() => handleBookingOptionChange("sameday")}
                  disabled={!isSameDayAvailable}
                >
                  <div className="text-sm font-medium">Parehong araw</div>
                  {isSameDayAvailable && (
                    <div className="text-xs opacity-75">
                      Makakarating sa loob ng 20-45 mins
                    </div>
                  )}
                </button>
                <button
                  className={`flex-1 rounded-lg border p-3 text-center ${
                    bookingOption === "scheduled"
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-300 bg-gray-50 text-gray-700 hover:bg-blue-50"
                  }`}
                  onClick={() => handleBookingOptionChange("scheduled")}
                >
                  <div className="text-sm font-medium">Iskedyul nalang</div>
                </button>
              </div>

              {bookingOption === "scheduled" && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Pumili ng petsa:
                    </label>
                    <DatePicker
                      selected={selectedDate}
                      onChange={handleDateChange}
                      className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:ring-blue-500"
                      placeholderText="Click to select a date"
                      dateFormat="MMMM d, yyyy"
                      minDate={new Date()}
                      filterDate={(date) => {
                        if (!hookService.weeklySchedule) return false;
                        const dayName = dayIndexToName(date.getDay());
                        return hookService.weeklySchedule.some(
                          (scheduleItem) =>
                            scheduleItem.day === (dayName as DayOfWeek) &&
                            scheduleItem.availability.isAvailable,
                        );
                      }}
                    />
                  </div>

                  {selectedDate && hookAvailableSlots.length > 0 && (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Pumili ng oras:
                      </label>
                      <select
                        className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:ring-blue-500"
                        value={selectedTime}
                        onChange={(e) => handleTimeChange(e.target.value)}
                      >
                        <option value="">Choose a time</option>
                        {hookAvailableSlots
                          .filter((slot) => slot.isAvailable)
                          .map((slot, index) => {
                            const timeSlotValue = `${slot.timeSlot.startTime}-${slot.timeSlot.endTime}`;
                            return (
                              <option key={index} value={timeSlotValue}>
                                {slot.timeSlot.startTime} -{" "}
                                {slot.timeSlot.endTime}
                              </option>
                            );
                          })}
                      </select>
                    </div>
                  )}

                  {selectedDate && hookAvailableSlots.length === 0 && (
                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-700">
                      ⏰ Walang libreng oras para sa petsang ito. Subukan ang
                      ibang petsa.
                    </div>
                  )}

                  {!selectedDate && (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
                      📅 Pumili ng petsa muna upang makita ang mga libreng oras.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Location Section */}
            <div className="border-b border-gray-200 bg-white p-4 md:rounded-b-xl md:border-x md:border-b md:shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Lokasyon ng Serbisyo *
              </h3>

              <button
                onClick={handleUseCurrentLocation}
                className="mb-3 w-full rounded-lg bg-blue-600 p-3 text-sm text-white transition-colors hover:bg-blue-700"
              >
                📍 Gamitin ang kasalukuyang lokasyon.
              </button>

              {currentLocationStatus && (
                <div className="mb-3 rounded border border-blue-200 bg-blue-50 p-2 text-center text-xs text-blue-700">
                  {currentLocationStatus}
                </div>
              )}

              {!showManualAddress && (
                <button
                  onClick={toggleManualAddress}
                  className="w-full rounded-lg bg-gray-100 p-3 text-sm text-gray-700 transition-colors hover:bg-gray-200"
                >
                  Manu-manong ilagay
                </button>
              )}

              {showManualAddress && (
                <div className="mt-2 space-y-3">
                  <p className="text-xs text-gray-600">
                    Ilagay ang address ng manu-mano (Lahat ay kinakailangan.*):
                  </p>
                  <input
                    type="text"
                    placeholder="House No. / Unit / Building *"
                    value={houseNumber}
                    onChange={(e) => setHouseNumber(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Street Name *"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Barangay *"
                    value={barangay}
                    onChange={(e) => setBarangay(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Municipality / City *"
                    value={municipalityCity}
                    onChange={(e) => setMunicipalityCity(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Province *"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 px-4 md:mx-4 md:mt-6 md:px-0 lg:mx-6">
          <div className="bg-white p-4 md:rounded-xl md:border md:shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Magbayad
            </h3>
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
              💸 "Tanging cash lamang ang maaaring ipangbayad."
            </div>
          </div>

          {formError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-center text-sm text-red-700">
              {formError}
            </div>
          )}
        </div>
      </div>

      <div className="shadow-top-md sticky bottom-0 border-t border-gray-200 bg-white p-4">
        <button
          onClick={handleConfirmBooking}
          disabled={isConfirmDisabled}
          className={`w-full rounded-lg py-3 font-semibold text-white transition-colors md:py-4 ${
            isConfirmDisabled
              ? "cursor-not-allowed bg-gray-300"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          Kumpirmahin ang reserbasyon.
        </button>
      </div>
    </div>
  );
};

export default ClientBookingPageComponent;
