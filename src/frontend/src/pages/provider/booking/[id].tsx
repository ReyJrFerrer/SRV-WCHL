import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  XCircleIcon,
  ArrowPathIcon,
  ClockIcon,
  InformationCircleIcon,
  StarIcon,
  CheckCircleIcon,
  PhoneIcon,
} from "@heroicons/react/24/solid";
import {
  ProviderEnhancedBooking,
  useProviderBookingManagement,
} from "../../../hooks/useProviderBookingManagement";
import BottomNavigationNextjs from "../../../components/provider/BottomNavigation";

const ProviderBookingDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [specificBooking, setSpecificBooking] =
    useState<ProviderEnhancedBooking | null>(null);
  const [localLoading, setLocalLoading] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);

  // Set document title
  useEffect(() => {
    if (specificBooking) {
      const serviceName =
        specificBooking?.serviceDetails?.description ||
        specificBooking?.packageName ||
        "Service";
      document.title = `Booking: ${serviceName} | SRV Provider`;
    } else {
      document.title = "Booking Details | SRV Provider";
    }
  }, [specificBooking]);

  const {
    bookings,
    acceptBookingById,
    declineBookingById,
    startBookingById,
    completeBookingById,
    isBookingActionInProgress,
    loading: hookLoading,
    error: hookError,
    refreshBookings,
    clearError,
  } = useProviderBookingManagement();

  // Find specific booking from the hook's bookings array
  useEffect(() => {
    if (id && typeof id === "string") {
      setLocalLoading(true);
      setLocalError(null);

      // Wait for bookings to load from the hook
      if (!hookLoading && bookings.length >= 0) {
        const foundBooking = bookings.find((booking) => booking.id === id);

        if (foundBooking) {
          setSpecificBooking(foundBooking);
        } else {
          setLocalError("Booking not found");
        }

        setLocalLoading(false);
      }
    }
  }, [id, bookings, hookLoading]);

  // Handle retry functionality
  const handleRetry = async () => {
    setLocalError(null);
    clearError();
    try {
      await refreshBookings();
    } catch (error) {
      console.error("❌ Failed to retry loading bookings:", error);
    }
  };

  // Action handlers
  const handleAcceptBooking = async () => {
    if (!specificBooking) return;
    const success = await acceptBookingById(specificBooking.id);
    if (success) {
      await refreshBookings();
      // Update local state
      const updatedBooking = bookings.find(
        (booking) => booking.id === specificBooking.id,
      );
      if (updatedBooking) {
        setSpecificBooking(updatedBooking);
      }
    }
  };

  const handleDeclineBooking = async () => {
    if (!specificBooking) return;
    const success = await declineBookingById(
      specificBooking.id,
      "Declined by provider",
    );
    if (success) {
      await refreshBookings();
      // Update local state
      const updatedBooking = bookings.find(
        (booking) => booking.id === specificBooking.id,
      );
      if (updatedBooking) {
        setSpecificBooking(updatedBooking);
      }
    }
  };

  const handleStartService = async () => {
    if (!specificBooking) return;
    const success = await startBookingById(specificBooking.id);
    if (success) {
      const actualStartTime = new Date().toISOString();
      navigate(
        `/provider/active-service/${specificBooking.id}?startTime=${actualStartTime}`,
      );
    }
  };

  const handleCompleteService = async () => {
    if (!specificBooking) return;
    const success = await completeBookingById(specificBooking.id);
    if (success) {
      await refreshBookings();
      // Update local state
      const updatedBooking = bookings.find(
        (booking) => booking.id === specificBooking.id,
      );
      if (updatedBooking) {
        setSpecificBooking(updatedBooking);
      }
    }
  };

  // Changed to messaging
  const handleContactClient = () => {
    if (!specificBooking) return;
    const clientContact =
      specificBooking.clientPhone || specificBooking.clientProfile?.phone;

    if (clientContact && clientContact !== "Contact not available") {
      window.location.href = `tel:${clientContact}`;
    } else {
      alert("Client contact information not available.");
    }
  };

  // Utility functions
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "N/A";
    try {
      return new Date(date).toLocaleString([], {
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

  const getStatusPillStyle = (status: string) => {
    switch (status?.toUpperCase()) {
      case "REQUESTED":
      case "PENDING":
        return "bg-yellow-100 text-yellow-700";
      case "ACCEPTED":
      case "CONFIRMED":
        return "bg-green-100 text-green-700";
      case "INPROGRESS":
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-700";
      case "COMPLETED":
        return "bg-indigo-100 text-indigo-700";
      case "CANCELLED":
        return "bg-red-100 text-red-700";
      case "DECLINED":
        return "bg-gray-100 text-gray-700";
      case "DISPUTED":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Determine loading state
  const isLoading = hookLoading || localLoading;

  // Determine error state
  const displayError = localError || hookError;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  // Error state - show if there's an error and no booking found
  if (displayError && !specificBooking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            {localError === "Booking not found"
              ? "Booking Not Found"
              : "Error Loading Booking"}
          </h1>
          <p className="mb-4 text-gray-600">{displayError}</p>
          <div className="space-x-3">
            <Link
              to="/provider/booking"
              className="rounded-lg bg-green-600 px-6 py-2 text-white transition-colors hover:bg-green-700"
            >
              Back to My Bookings
            </Link>
            <button
              onClick={handleRetry}
              disabled={isBookingActionInProgress("refresh", "refresh")}
              className="rounded-lg bg-gray-300 px-6 py-2 text-gray-700 transition-colors hover:bg-gray-400 disabled:opacity-50"
            >
              {isBookingActionInProgress("refresh", "refresh")
                ? "Retrying..."
                : "Retry"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No booking found (after loading completed)
  if (!specificBooking && !isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
        <h1 className="mb-4 text-xl font-semibold text-red-600">
          Booking Not Found
        </h1>
        <Link
          to="/provider/booking"
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Back to My Bookings
        </Link>
      </div>
    );
  }

  // Extract booking data
  const serviceName =
    specificBooking?.serviceDetails?.description ||
    specificBooking?.packageName ||
    "Service";
  const packageName = specificBooking?.packageName;
  const clientName = specificBooking?.clientName || "Unknown Client";
  const clientContact =
    specificBooking?.clientPhone ||
    specificBooking?.clientProfile?.phone ||
    "Contact not available";
  const bookingLocation =
    specificBooking?.formattedLocation || "Location not specified";
  const price = specificBooking?.price;
  const duration = specificBooking?.serviceDuration || "N/A";

  // Check booking states
  const canAcceptOrDecline =
    specificBooking?.canAccept && specificBooking?.canDecline;
  const canStart = specificBooking?.canStart;
  const canComplete = specificBooking?.canComplete;
  const isCompleted = specificBooking?.status === "Completed";
  const isDeclined = specificBooking?.status === "Declined";

  // Show booking details
  return (
    <div className="min-h-screen bg-gray-100 pb-20 md:pb-0">
      <header className="sticky top-0 z-30 bg-white shadow-sm">
        <div className="container mx-auto flex items-center px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="mr-2 rounded-full p-2 hover:bg-gray-100"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-700" />
          </button>
          <h1 className="truncate text-lg font-semibold text-slate-800">
            Booking Details
          </h1>
        </div>
      </header>

      <main className="container mx-auto space-y-6 p-4 sm:p-6">
        <div className="rounded-xl bg-white p-6 shadow-lg">
          <div className="mb-4 flex items-start justify-between">
            <h2 className="text-2xl font-bold text-slate-800">{clientName}</h2>
            <span
              className={`rounded-full px-3 py-1 text-sm font-semibold ${getStatusPillStyle(specificBooking?.status || "")}`}
            >
              {specificBooking?.status === "InProgress"
                ? "In Progress"
                : specificBooking?.status?.replace("_", " ") || "Unknown"}
            </span>
          </div>

          {packageName && (
            <h3 className="mb-2 text-xl font-semibold text-slate-700">
              {clientContact}
            </h3>
          )}

          <p className="mb-1 flex items-center text-sm text-gray-500">
            Service:{" "}
            <span className="ml-1 font-medium text-gray-700">
              {serviceName}
            </span>
          </p>

          {clientContact && clientContact !== "Contact not available" && (
            <p className="mb-4 text-sm text-gray-500">Package: {packageName}</p>
          )}

          <div className="space-y-3 border-t border-gray-200 pt-4 text-sm">
            <div className="flex items-start">
              <CalendarDaysIcon className="mt-0.5 mr-2 h-5 w-5 flex-shrink-0 text-blue-500" />
              <span>
                <strong className="font-medium text-gray-700">
                  Requested:
                </strong>{" "}
                {formatDate(
                  specificBooking?.requestedDate || specificBooking?.createdAt,
                )}
              </span>
            </div>

            <div className="flex items-start">
              <MapPinIcon className="mt-0.5 mr-2 h-5 w-5 flex-shrink-0 text-blue-500" />
              <span>
                <strong className="font-medium text-gray-700">Location:</strong>{" "}
                {bookingLocation}
              </span>
            </div>

            {price !== undefined && (
              <div className="flex items-start">
                <CurrencyDollarIcon className="mt-0.5 mr-2 h-5 w-5 flex-shrink-0 text-green-500" />
                <span>
                  <strong className="font-medium text-gray-700">
                    Payment:
                  </strong>{" "}
                  ₱{price.toFixed(2)}
                </span>
              </div>
            )}

            {duration !== "N/A" && (
              <div className="flex items-start">
                <ClockIcon className="mt-0.5 mr-2 h-5 w-5 flex-shrink-0 text-purple-500" />
                <span>
                  <strong className="font-medium text-gray-700">
                    Duration:
                  </strong>{" "}
                  {duration}
                </span>
              </div>
            )}

            {specificBooking?.packageDetails?.description && (
              <div className="flex items-start">
                <InformationCircleIcon className="mt-0.5 mr-2 h-5 w-5 flex-shrink-0 text-indigo-500" />
                <span>
                  <strong className="font-medium text-gray-700">
                    Package Details:
                  </strong>{" "}
                  {specificBooking.packageDetails.description}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 rounded-xl bg-white p-4 shadow-lg sm:flex sm:space-y-0 sm:space-x-3">
          {/* Contact Client - Always available for non-declined bookings */}
          {!isDeclined && (
            <button
              onClick={handleContactClient}
              className="flex w-full items-center justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition-colors hover:bg-slate-200 sm:flex-1"
            >
              <PhoneIcon className="mr-2 h-5 w-5" /> Contact Client
            </button>
          )}

          {/* Accept/Decline buttons for pending bookings */}
          {canAcceptOrDecline && (
            <>
              <button
                onClick={handleDeclineBooking}
                disabled={isBookingActionInProgress(
                  specificBooking?.id || "",
                  "decline",
                )}
                className="flex w-full items-center justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-slate-200 disabled:opacity-50 sm:flex-1"
              >
                <XCircleIcon className="mr-2 h-5 w-5" />
                {isBookingActionInProgress(specificBooking?.id || "", "decline")
                  ? "Declining..."
                  : "Decline"}
              </button>
              <button
                onClick={handleAcceptBooking}
                disabled={isBookingActionInProgress(
                  specificBooking?.id || "",
                  "accept",
                )}
                className="flex w-full items-center justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-green-500 transition-colors hover:bg-slate-100 disabled:opacity-50 sm:flex-1"
              >
                <CheckCircleIcon className="mr-2 h-5 w-5" />
                {isBookingActionInProgress(specificBooking?.id || "", "accept")
                  ? "Accepting..."
                  : "Accept"}
              </button>
            </>
          )}

          {/* Start Service button for accepted bookings */}
          {canStart && (
            <button
              onClick={handleStartService}
              disabled={isBookingActionInProgress(
                specificBooking?.id || "",
                "start",
              )}
              className="flex w-full items-center justify-center rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-600 disabled:opacity-50 sm:flex-1"
            >
              <ArrowPathIcon className="mr-2 h-5 w-5" />
              {isBookingActionInProgress(specificBooking?.id || "", "start")
                ? "Starting..."
                : "Start Service"}
            </button>
          )}

          {/* Complete Service button for in-progress bookings */}
          {canComplete && (
            <button
              onClick={handleCompleteService}
              disabled={isBookingActionInProgress(
                specificBooking?.id || "",
                "complete",
              )}
              className="flex w-full items-center justify-center rounded-lg bg-teal-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-600 disabled:opacity-50 sm:flex-1"
            >
              <CheckCircleIcon className="mr-2 h-5 w-5" />
              {isBookingActionInProgress(specificBooking?.id || "", "complete")
                ? "Completing..."
                : "Mark Completed"}
            </button>
          )}

          {/* View Reviews for completed bookings */}
          {isCompleted && (
            <Link
              to={`/provider/review/${specificBooking?.id}`}
              className="flex w-full items-center justify-center rounded-lg bg-yellow-500 px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-yellow-600 sm:flex-1"
            >
              <StarIcon className="mr-2 h-5 w-5" /> View Review
            </Link>
          )}
        </div>
      </main>

      <div className="md:hidden">
        <BottomNavigationNextjs />
      </div>
    </div>
  );
};

export default ProviderBookingDetailsPage;