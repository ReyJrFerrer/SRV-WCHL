import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import {
  ProviderEnhancedBooking,
  useProviderBookingManagement,
} from "../../hooks/useProviderBookingManagement";
import {
  MapPinIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  CurrencyDollarIcon,
  PhoneIcon,
  InformationCircleIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  StarIcon,
} from "@heroicons/react/24/outline";

const calculateDuration = (
  start: string | Date,
  end: string | Date,
): string => {
  const startTime = new Date(start);
  const endTime = new Date(end);
  const durationMs = endTime.getTime() - startTime.getTime();
  if (isNaN(durationMs) || durationMs < 0) return "N/A";
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  let durationStr = "";
  if (hours > 0) durationStr += `${hours} hr${hours > 1 ? "s" : ""} `;
  if (minutes > 0) durationStr += `${minutes} min${minutes > 1 ? "s" : ""}`;
  return (
    durationStr.trim() ||
    (hours === 0 && minutes === 0 ? "Short duration" : "N/A")
  );
};

interface ProviderBookingItemCardProps {
  booking: ProviderEnhancedBooking;
}

const ProviderBookingItemCard: React.FC<ProviderBookingItemCardProps> = ({
  booking,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const navigate = useNavigate();
  const {
    acceptBookingById,
    declineBookingById,
    startBookingById,
    completeBookingById,
    isBookingActionInProgress,
    getStatusColor,
    formatBookingDate,
    formatBookingTime,
    refreshBookings,
  } = useProviderBookingManagement();

  // Debug validation
  if (!booking) {
    console.error(
      "CRITICAL: ProviderBookingItemCard received an undefined 'booking' prop!",
    );
    return (
      <div
        className="rounded-xl border border-red-400 bg-red-100 px-4 py-3 text-red-700 shadow-lg"
        role="alert"
      >
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline">
          {" "}
          Nawawala ang impormasyon sa booking na ito.
        </span>
      </div>
    );
  }

  if (!booking.id) {
    console.error(
      "CRITICAL: Booking object is missing 'id'. Booking data:",
      JSON.stringify(booking, null, 2),
    );
    return (
      <div
        className="rounded-xl border border-orange-400 bg-orange-100 px-4 py-3 text-orange-700 shadow-lg"
        role="alert"
      >
        <div className="flex items-center">
          <ExclamationTriangleIcon className="mr-2 h-5 w-5" />
          <strong className="font-bold">Data Issue!</strong>
        </div>
        <span className="block sm:inline">
          {" "}
          Details about this bookings is missing. (missing ID).
        </span>
      </div>
    );
  }

  // Extract booking data with proper property names for ProviderEnhancedBooking
  const clientName = booking.clientName || "Unknown Client";
  const clientContact =
    booking.clientPhone ||
    booking.clientProfile?.phone ||
    "Contact not available";
  const serviceTitle =
    booking.serviceDetails?.description || booking.packageName || "Service";
  const serviceImage = "/images/Tutoring-LanguageTutor1.jpg";
  const packageTitle = booking.packageName;
  const scheduledDate = booking.scheduledDate
    ? new Date(booking.scheduledDate)
    : null;
  const duration = booking.serviceDuration || "N/A";
  const price = booking.price;
  const priceLabel = "Service Price";
  const locationAddress = booking.formattedLocation || "Location not specified";
  const status = booking.status;

  // Format date function
  const formatDate = (date: Date | string | number) => {
    try {
      const dateObj = new Date(date);
      return dateObj.toLocaleDateString([], {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Date not available";
    }
  };

  // Status color mapping (enhanced version)
  const getEnhancedStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "REQUESTED":
      case "PENDING":
        return "text-yellow-600 bg-yellow-100";
      case "ACCEPTED":
      case "CONFIRMED":
        return "text-green-600 bg-green-100";
      case "INPROGRESS":
      case "IN_PROGRESS":
        return "text-blue-600 bg-blue-100";
      case "COMPLETED":
        return "text-indigo-600 bg-indigo-100";
      case "CANCELLED":
        return "text-red-600 bg-red-100";
      case "DECLINED":
        return "text-gray-600 bg-gray-100";
      case "DISPUTED":
        return "text-orange-600 bg-orange-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  // Action handlers using the hook's functions
  const handleAccept = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const success = await acceptBookingById(booking.id);
    if (success) {
      window.location.reload();
    } else {
      console.error(`❌ Failed to accept booking ${booking.id}`);
    }
  };

  const handleReject = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (window.confirm("Sigurado ka bang gusto mong idecline?")) {
      const success = await declineBookingById(
        booking.id,
        "Declined by provider",
      );
      if (success) {
        window.location.reload();
        // await refreshBookings();
      } else {
        console.error(`❌ Failed to decline booking ${booking.id}`);
      }
    }
  };

  const handleContactClient = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (clientContact && clientContact !== "Contact not available") {
      window.location.href = `tel:${clientContact}`;
    } else {
      alert("Contact information not available");
    }
  };

  const handleMarkAsCompleted = async (
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (window.confirm("Mark this booking as completed?")) {
      const success = await completeBookingById(booking.id);
      if (success) {
        await refreshBookings();
      } else {
        console.error(`❌ Failed to complete booking ${booking.id}`);
      }
    }
  };

  const handleStartService = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const success = await startBookingById(booking.id);
    if (success) {
      navigate(`/provider/active-service/${booking.id}`);
    } else {
      console.error(`❌ Failed to start service for booking ${booking.id}`);
    }
  };

  // Check booking states
  const canAcceptOrDecline = booking.canAccept && booking.canDecline;
  const canStart = booking.canStart;
  const canComplete = booking.canComplete;
  const isCompleted = status === "Completed";
  const isCancelled = status === "Cancelled";
  const isFinished = isCompleted || isCancelled;
  const isInProgress = status === "InProgress"; // ✅ Add this check

  return (
    <>
      {/* ✅ Conditionally render Link only for non-InProgress bookings */}
      {!isInProgress ? (
        <Link
          to={`/provider/booking/${booking.id}`}
          className="focus:ring-opacity-50 block cursor-pointer overflow-hidden rounded-xl bg-white shadow-lg transition-shadow duration-300 hover:shadow-xl focus:shadow-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <div className="md:flex">
            {serviceImage && (
              <div className="md:flex-shrink-0">
                <div className="relative h-48 w-full object-cover md:w-48">
                  <img
                    src={serviceImage}
                    alt={serviceTitle}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "/images/default-service.jpg";
                    }}
                  />
                </div>
              </div>
            )}

            <div className="flex flex-grow flex-col justify-between p-4 sm:p-5">
              <div>
                <div className="flex items-start justify-between">
                  <p className="text-xs font-semibold tracking-wider text-indigo-500 uppercase">
                    {clientContact}
                  </p>
                </div>

                <h3
                  className="mt-1 truncate text-lg font-bold text-slate-800 md:text-xl"
                  title={clientName}
                >
                  {clientName}
                </h3>

                <p className="mt-1 text-xs text-gray-500">
                  Service: {serviceTitle}
                </p>

                {packageTitle && (
                  <p className="mt-1 text-xs text-gray-500">
                    Package: {packageTitle}
                  </p>
                )}

                <div className="mt-3 space-y-1.5 text-xs text-gray-600">
                  <p className="flex items-center">
                    <CalendarDaysIcon className="mr-1.5 h-4 w-4 text-gray-400" />
                    {formatDate(booking.requestedDate)}
                  </p>

                  <p className="flex items-center">
                    <MapPinIcon className="mr-1.5 h-4 w-4 text-gray-400" />
                    {locationAddress}
                  </p>

                  {price !== undefined && (
                    <p className="flex items-center">
                      <CurrencyDollarIcon className="mr-1.5 h-4 w-4 text-gray-400" />
                      ₱{price.toFixed(2)}
                    </p>
                  )}

                  {duration !== "N/A" && (
                    <p className="flex items-center">
                      <ClockIcon className="mr-1.5 h-4 w-4 text-gray-400" />
                      Duration: {duration}
                    </p>
                  )}
                </div>

                {/* Expandable details section - HIDDEN ON SMALL SCREENS */}
                <div
                  className={`overflow-hidden transition-all duration-300 sm:block hidden`} 
                  style={{
                    maxHeight: showDetails ? 200 : 0,
                    opacity: showDetails ? 1 : 0,
                    marginTop: showDetails ? 8 : 0,
                  }}
                >
                  <div className="space-y-2 border-t border-gray-200 pt-2 text-xs text-gray-700">
                    <div className="flex items-center">
                      <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0 text-gray-400" />
                      <span>
                        Scheduled Date:{" "}
                        <span className="font-medium">
                          {formatBookingDate(booking.requestedDate)}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center">
                      <ClockIcon className="mr-2 h-4 w-4 flex-shrink-0 text-gray-400" />
                      <span>
                        Scheduled Time:{" "}
                        <span className="font-medium">
                          {formatBookingTime(booking.requestedDate)}
                        </span>
                      </span>
                    </div>
                    {booking.packageDetails?.description && (
                      <div className="flex items-start">
                        <InformationCircleIcon className="mt-0.5 mr-2 h-4 w-4 flex-shrink-0 text-gray-400" />
                        <span>
                          Package Description:{" "}
                          <span className="font-medium">
                            {booking.packageDetails.description}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-4 flex flex-col space-y-2 border-t border-gray-200 pt-3 sm:flex-row sm:justify-end sm:space-y-0 sm:space-x-2">
                {/* Show accept/reject buttons for pending bookings */}
                {canAcceptOrDecline && (
                  <>
                    <button
                      onClick={handleReject}
                      disabled={isBookingActionInProgress(
                        booking.id,
                        "decline",
                      )}
                      className="flex w-full items-center justify-center rounded-md bg-white px-3 py-2 text-xs font-medium text-red-500 transition-colors hover:bg-red-100  disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    >
                      <XCircleIcon className="mr-1.5 h-4 w-4" />
                      {isBookingActionInProgress(booking.id, "decline")
                        ? "Declining..."
                        : "Decline"}
                    </button>
                    <button
                      onClick={handleAccept}
                      disabled={isBookingActionInProgress(booking.id, "accept")}
                      className="flex w-full items-center justify-center rounded-md bg-white px-3 py-2 text-xs font-medium text-green-500 transition-colors hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    >
                      <CheckCircleIcon className="mr-1.5 h-4 w-4" />
                      {isBookingActionInProgress(booking.id, "accept")
                        ? "Accepting..."
                        : "Accept"}
                    </button>
                  </>
                )}

                {/* Show contact and start service buttons for accepted bookings */}
                {canStart && (
                  <>
                    <button
                      onClick={handleContactClient}
                      className="flex w-full items-center justify-center rounded-md bg-blue-500 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-600 sm:w-auto"
                    >
                      <PhoneIcon className="mr-1.5 h-4 w-4" />
                      Contact Client
                    </button>
                    <button
                      onClick={handleStartService}
                      disabled={isBookingActionInProgress(booking.id, "start")}
                      className="flex w-full items-center justify-center rounded-md bg-indigo-500 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    >
                      <ArrowPathIcon className="mr-1.5 h-4 w-4" />
                      {isBookingActionInProgress(booking.id, "start")
                        ? "Starting..."
                        : "Start Service"}
                    </button>
                  </>
                )}

                {/* Show contact and complete buttons for in-progress bookings */}
                {canComplete && (
                  <>
                    <button
                      onClick={handleContactClient}
                      className="flex w-full items-center justify-center rounded-md bg-blue-500 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-600 sm:w-auto"
                    >
                      <PhoneIcon className="mr-1.5 h-4 w-4" />
                      Contact Client
                    </button>
                    <button
                      onClick={handleMarkAsCompleted}
                      disabled={isBookingActionInProgress(
                        booking.id,
                        "complete",
                      )}
                      className="flex w-full items-center justify-center rounded-md bg-teal-500 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    >
                      <CheckCircleIcon className="mr-1.5 h-4 w-4" />
                      {isBookingActionInProgress(booking.id, "complete")
                        ? "Completing..."
                        : "Mark Completed"}
                    </button>
                  </>
                )}

                {/* Show contact and view reviews buttons for completed bookings */}
                {isCompleted && (
                  <>
                    <button
                      onClick={handleContactClient}
                      className="flex w-full items-center justify-center rounded-md bg-slate-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-slate-700 sm:w-auto"
                    >
                      <PhoneIcon className="mr-1.5 h-4 w-4" />
                      Contact Client
                    </button>
                    <Link
                      to={`/provider/review/${booking?.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex w-full items-center justify-center rounded-md bg-yellow-500 px-3 py-2 text-center text-xs font-medium text-white transition-colors hover:bg-yellow-600 sm:w-auto"
                    >
                      <StarIcon className="mr-1.5 h-4 w-4" />
                      View My Reviews
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </Link>
      ) : (
        // ✅ For InProgress bookings, render without Link wrapper
        <div className="focus:ring-opacity-50 block overflow-hidden rounded-xl bg-white shadow-lg transition-shadow duration-300 hover:shadow-xl focus:shadow-xl focus:ring-2 focus:ring-blue-500 focus:outline-none">
          <div className="md:flex">
            {serviceImage && (
              <div className="md:flex-shrink-0">
                <div className="relative h-48 w-full object-cover md:w-48">
                  <img
                    src={serviceImage}
                    alt={serviceTitle}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "/images/default-service.jpg";
                    }}
                  />
                </div>
              </div>
            )}

            <div className="flex flex-grow flex-col justify-between p-4 sm:p-5">
              <div>
                <div className="flex items-start justify-between">
                  <p className="text-xs font-semibold tracking-wider text-indigo-500 uppercase">
                    {clientContact}
                  </p>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${getEnhancedStatusColor(status)}`}
                  >
                    {status === "InProgress"}
                  </span>
                </div>

                <h3
                  className="mt-1 truncate text-lg font-bold text-slate-800 md:text-xl"
                  title={clientName}
                >
                  {clientName}
                </h3>

                <p className="mt-1 text-xs text-gray-500">
                  Service: {serviceTitle}
                </p>

                {packageTitle && (
                  <p className="mt-1 text-xs text-gray-500">
                    Package: {packageTitle}
                  </p>
                )}

                <div className="mt-3 space-y-1.5 text-xs text-gray-600">
                  <p className="flex items-center">
                    <CalendarDaysIcon className="mr-1.5 h-4 w-4 text-gray-400" />
                    {formatDate(booking.requestedDate)}
                  </p>

                  <p className="flex items-center">
                    <MapPinIcon className="mr-1.5 h-4 w-4 text-gray-400" />
                    {locationAddress}
                  </p>

                  {price !== undefined && (
                    <p className="flex items-center">
                      <CurrencyDollarIcon className="mr-1.5 h-4 w-4 text-gray-400" />
                      ₱{price.toFixed(2)}
                    </p>
                  )}

                  {duration !== "N/A" && (
                    <p className="flex items-center">
                      <ClockIcon className="mr-1.5 h-4 w-4 text-gray-400" />
                      Duration: {duration}
                    </p>
                  )}
                </div>

                {/* Expandable details section - HIDDEN ON SMALL SCREENS */}
                <div
                  className={`overflow-hidden transition-all duration-300 sm:block hidden`}
                  style={{
                    maxHeight: showDetails ? 200 : 0,
                    opacity: showDetails ? 1 : 0,
                    marginTop: showDetails ? 8 : 0,
                  }}
                >
                  <div className="space-y-2 border-t border-gray-200 pt-2 text-xs text-gray-700">
                    <div className="flex items-center">
                      <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0 text-gray-400" />
                      <span>
                        Scheduled Date:{" "}
                        <span className="font-medium">
                          {formatBookingDate(booking.requestedDate)}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center">
                      <ClockIcon className="mr-2 h-4 w-4 flex-shrink-0 text-gray-400" />
                      <span>
                        Scheduled Time:{" "}
                        <span className="font-medium">
                          {formatBookingTime(booking.requestedDate)}
                        </span>
                      </span>
                    </div>
                    {booking.packageDetails?.description && (
                      <div className="flex items-start">
                        <InformationCircleIcon className="mt-0.5 mr-2 h-4 w-4 flex-shrink-0 text-gray-400" />
                        <span>
                          Package Description:{" "}
                          <span className="font-medium">
                            {booking.packageDetails.description}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-4 flex flex-col space-y-2 border-t border-gray-200 pt-3 sm:flex-row sm:justify-end sm:space-y-0 sm:space-x-2">
                {/* Show accept/reject buttons for pending bookings */}
                {canAcceptOrDecline && (
                  <>
                    <button
                      onClick={handleReject}
                      disabled={isBookingActionInProgress(
                        booking.id,
                        "decline",
                      )}
                      className="flex w-full items-center justify-center rounded-md bg-red-500 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    >
                      <XCircleIcon className="mr-1.5 h-4 w-4" />
                      {isBookingActionInProgress(booking.id, "decline")
                        ? "Declining..."
                        : "Decline"}
                    </button>
                    <button
                      onClick={handleAccept}
                      disabled={isBookingActionInProgress(booking.id, "accept")}
                      className="flex w-full items-center justify-center rounded-md bg-green-500 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    >
                      <CheckCircleIcon className="mr-1.5 h-4 w-4" />
                      {isBookingActionInProgress(booking.id, "accept")
                        ? "Accepting..."
                        : "Accept"}
                    </button>
                  </>
                )}

                {/* Show contact and start service buttons for accepted bookings */}
                {canStart && (
                  <>
                    <button
                      onClick={handleContactClient}
                      className="flex w-full items-center justify-center rounded-md bg-blue-500 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-600 sm:w-auto"
                    >
                      <PhoneIcon className="mr-1.5 h-4 w-4" />
                      Contact Client
                    </button>
                    <button
                      onClick={handleStartService}
                      disabled={isBookingActionInProgress(booking.id, "start")}
                      className="flex w-full items-center justify-center rounded-md bg-indigo-500 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    >
                      <ArrowPathIcon className="mr-1.5 h-4 w-4" />
                      {isBookingActionInProgress(booking.id, "start")
                        ? "Starting..."
                        : "Start Service"}
                    </button>
                  </>
                )}

                {/* Show contact and complete buttons for in-progress bookings */}
                {canComplete && (
                  <>
                    <button
                      onClick={handleContactClient}
                      className="flex w-full items-center justify-center rounded-md bg-blue-500 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-600 sm:w-auto"
                    >
                      <PhoneIcon className="mr-1.5 h-4 w-4" />
                      Contact Client
                    </button>
                    <button
                      onClick={handleMarkAsCompleted}
                      disabled={isBookingActionInProgress(
                        booking.id,
                        "complete",
                      )}
                      className="flex w-full items-center justify-center rounded-md bg-teal-500 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    >
                      <CheckCircleIcon className="mr-1.5 h-4 w-4" />
                      {isBookingActionInProgress(booking.id, "complete")
                        ? "Completing..."
                        : "Mark Completed"}
                    </button>
                  </>
                )}

                {/* Show contact and view reviews buttons for completed bookings */}
                {isCompleted && (
                  <>
                    <button
                      onClick={handleContactClient}
                      className="flex w-full items-center justify-center rounded-md bg-slate-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-slate-700 sm:w-auto"
                    >
                      <PhoneIcon className="mr-1.5 h-4 w-4" />
                      Contact Client
                    </button>
                    <Link
                      to={`/provider/review/${booking?.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex w-full items-center justify-center rounded-md bg-yellow-500 px-3 py-2 text-center text-xs font-medium text-white transition-colors hover:bg-yellow-600 sm:w-auto"
                    >
                      <StarIcon className="mr-1.5 h-4 w-4" />
                      View My Reviews
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProviderBookingItemCard;