import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  UserCircleIcon,
  ChatBubbleLeftEllipsisIcon,
  XCircleIcon,
  ArrowPathIcon,
  StarIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/solid";
import {
  EnhancedBooking,
  useBookingManagement,
} from "../../../hooks/bookingManagement";
import { reviewCanisterService } from "../../../services/reviewCanisterService"; // ✅ Add this import
import { authCanisterService } from "../../../services/authCanisterService"; // ✅ Add this import
import BottomNavigationNextjs from "../../../components/client/BottomNavigation";

// Import BookingStatus from the hook's types if it's exported, or define it locally
type BookingStatus =
  | "Requested"
  | "Accepted"
  | "Completed"
  | "Cancelled"
  | "InProgress"
  | "Declined"
  | "Disputed";

const BookingDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [specificBooking, setSpecificBooking] =
    useState<EnhancedBooking | null>(null);
  const [localLoading, setLocalLoading] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);

  // ✅ Add state for review status
  const [canUserReview, setCanUserReview] = useState<boolean | null>(null);
  const [checkingReviewStatus, setCheckingReviewStatus] = useState(false);

  const bookingManagement = useBookingManagement();

  const {
    bookings,
    updateBookingStatus: updateBookingStatusHook,
    loading: hookLoading,
    error: hookError,
    refreshBookings,
    clearError,
    isOperationInProgress,
  } = bookingManagement;

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

  // Set document title
  useEffect(() => {
    if (specificBooking) {
      document.title = `Booking Details - ${specificBooking.serviceName || "Service"} - SRV Client`;
    } else {
      document.title = "Booking Details - SRV Client";
    }
  }, [specificBooking]);

  // ✅ Check review status when booking is found
  useEffect(() => {
    const checkReviewStatus = async () => {
      if (!specificBooking?.id) return;

      // ✅ Only check for completed bookings (exclude cancelled)
      if (specificBooking.status !== "Completed") {
        // For cancelled bookings, explicitly set to false
        if (specificBooking.status === "Cancelled") {
          setCanUserReview(false);
        }
        return;
      }

      try {
        setCheckingReviewStatus(true);

        // Get current user ID
        const userProfile = await authCanisterService.getMyProfile();
        if (!userProfile?.id) {
          setCanUserReview(false);
          return;
        }

        // Check if user can review this booking
        const canReview = await reviewCanisterService.canUserReviewBooking(
          specificBooking.id,
          userProfile.id,
        );
        setCanUserReview(canReview);

        console.log(`Review status for booking ${specificBooking.id}:`, {
          canReview,
          userId: userProfile.id,
          bookingStatus: specificBooking.status,
        });
      } catch (error) {
        console.error("Error checking review status:", error);
        // Default to allowing review if check fails (only for completed bookings)
        setCanUserReview(true);
      } finally {
        setCheckingReviewStatus(false);
      }
    };

    checkReviewStatus();
  }, [specificBooking]);

  // Handle booking status updates using the hook
  const handleUpdateBookingStatus = async (
    bookingId: string,
    newStatus: BookingStatus,
  ) => {
    try {
      console.log(`🔄 Updating booking ${bookingId} status to ${newStatus}`);

      // Use the hook's update function
      await updateBookingStatusHook(bookingId, newStatus);

      // The hook will automatically update the bookings array
      // Find the updated booking and update local state
      const updatedBooking = bookings.find(
        (booking) => booking.id === bookingId,
      );
      if (updatedBooking) {
        setSpecificBooking(updatedBooking);
        console.log("✅ Local booking state updated");
      }
    } catch (error) {
      console.error("❌ Failed to update booking status:", error);
      // Error is already handled by the hook
    }
  };

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

  // Event handlers for the new UI
  const handleCancelBooking = async () => {
    if (!specificBooking) return;

    const serviceName = specificBooking.serviceName || "this service";
    if (
      window.confirm(
        `Are you sure you want to cancel your booking for "${serviceName}"?`,
      )
    ) {
      await handleUpdateBookingStatus(specificBooking.id, "Cancelled");
      alert(`Booking for "${serviceName}" has been cancelled successfully.`);
    }
  };

  const handleContactProvider = () => {
    if (!specificBooking) return;
    const providerName = specificBooking.providerProfile?.name;

    // You can integrate actual contact functionality here
    alert(
      `Mock: Contacting provider ${providerName}. Contact functionality would be implemented here.`,
    );
  };

  // ✅ Add handler for viewing reviews when already reviewed
  const handleViewReviews = () => {
    if (specificBooking?.serviceId) {
      navigate(`/client/service/reviews/${specificBooking.serviceId}`);
    } else {
      alert("Service information not available.");
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

  // ✅ Add function to determine review button content
  const getReviewButtonContent = () => {
    if (!specificBooking) return null;

    const providerName = specificBooking.providerProfile?.name;

    // ✅ Handle cancelled bookings first
    if (specificBooking.status === "Cancelled") {
      return null;
    }

    // Only show review options for completed bookings
    if (specificBooking.status !== "Completed") {
      return null; // Don't show review button for non-completed bookings
    }

    if (checkingReviewStatus) {
      return {
        text: "Checking...",
        icon: (
          <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
        ),
        className: "bg-gray-400 cursor-not-allowed",
        disabled: true,
        onClick: undefined,
        href: undefined,
      };
    }

    if (canUserReview === false) {
      // User has already reviewed
      return {
        text: "View Reviews",
        icon: <CheckCircleIcon className="mr-2 h-5 w-5" />,
        className: "bg-green-500 hover:bg-green-600",
        disabled: false,
        onClick: handleViewReviews,
        href: undefined,
      };
    }

    // User can submit a review (canUserReview === true or null)
    return {
      text: "Rate Provider",
      icon: <StarIcon className="mr-2 h-5 w-5" />,
      className: "bg-yellow-500 hover:bg-yellow-600",
      disabled: false,
      onClick: undefined,
      href: {
        pathname: `/client/review/${specificBooking.id}`,
        query: { providerName: providerName },
      },
    };
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
              to="/client/booking"
              className="rounded-lg bg-green-600 px-6 py-2 text-white transition-colors hover:bg-green-700"
            >
              Back to My Bookings
            </Link>
            <button
              onClick={handleRetry}
              disabled={isOperationInProgress("refreshBookings")}
              className="rounded-lg bg-gray-300 px-6 py-2 text-gray-700 transition-colors hover:bg-gray-400 disabled:opacity-50"
            >
              {isOperationInProgress("refreshBookings")
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
          to="/client/booking"
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Back to My Bookings
        </Link>
      </div>
    );
  }

  // Extract booking data
  const serviceName = specificBooking?.serviceName;
  const providerName = specificBooking?.providerProfile?.name;
  const bookingLocation =
    specificBooking?.formattedLocation || "Location not specified";

  // Check if booking can be cancelled
  const canCancel = ["Requested", "Pending", "Accepted", "Confirmed"].includes(
    specificBooking?.status || "",
  );

  // Check if booking is completed/cancelled for actions
  const isFinished = ["Completed", "Cancelled"].includes(
    specificBooking?.status || "",
  );

  // ✅ Get review button content
  const reviewButtonContent = getReviewButtonContent();

  // Show booking details
  return (
    <>
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
              <h2 className="text-2xl font-bold text-slate-800">
                {serviceName}
              </h2>
              <span
                className={`rounded-full px-3 py-1 text-sm font-semibold ${getStatusPillStyle(specificBooking?.status || "")}`}
              >
                {specificBooking?.status?.replace("_", " ") || "Unknown"}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-slate-800">
              {specificBooking?.packageName}
            </h3>
            <p className="mb-1 flex items-center text-sm text-gray-500">
              <UserCircleIcon className="mr-1.5 h-4 w-4 text-gray-400" />
              Provider:{" "}
              <span className="ml-1 font-medium text-gray-700">
                {providerName}
              </span>
            </p>
            <p className="mb-4 text-sm text-gray-500">
              Contact: {specificBooking?.providerProfile?.phone}
            </p>

            <div className="space-y-3 border-t border-gray-200 pt-4 text-sm">
              <div className="flex items-start">
                <CalendarDaysIcon className="mt-0.5 mr-2 h-5 w-5 flex-shrink-0 text-blue-500" />
                <span>
                  <strong className="font-medium text-gray-700">
                    Scheduled:
                  </strong>{" "}
                  {formatDate(
                    specificBooking?.requestedDate ||
                      specificBooking?.createdAt,
                  )}
                </span>
              </div>

              <div className="flex items-start">
                <MapPinIcon className="mt-0.5 mr-2 h-5 w-5 flex-shrink-0 text-blue-500" />
                <span>
                  <strong className="font-medium text-gray-700">
                    Location:
                  </strong>{" "}
                  {bookingLocation}
                </span>
              </div>

              {specificBooking?.price && (
                <div className="flex items-start">
                  <CurrencyDollarIcon className="mt-0.5 mr-2 h-5 w-5 flex-shrink-0 text-green-500" />
                  <span>
                    <strong className="font-medium text-gray-700">
                      Payment:
                    </strong>{" "}
                    ₱{specificBooking.price.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 rounded-xl bg-white p-4 shadow-lg sm:flex sm:space-y-0 sm:space-x-3">
            <button
              onClick={handleContactProvider}
              className="flex w-full items-center justify-center rounded-lg bg-slate-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-700 sm:flex-1"
            >
              <ChatBubbleLeftEllipsisIcon className="mr-2 h-5 w-5" /> Contact
              Provider
            </button>

            {canCancel && (
              <button
                onClick={handleCancelBooking}
                disabled={isOperationInProgress(
                  `update-${specificBooking?.id}`,
                )}
                className="flex w-full items-center justify-center rounded-lg bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50 sm:flex-1"
              >
                <XCircleIcon className="mr-2 h-5 w-5" />
                {isOperationInProgress(`update-${specificBooking?.id}`)
                  ? "Cancelling..."
                  : "Cancel Booking"}
              </button>
            )}

            {isFinished && (
              <>
                {/* ✅ Keep "Book Again" button for both completed and cancelled bookings */}
                {specificBooking?.serviceId && (
                  <Link
                    to={`/client/book/${specificBooking.serviceId}`}
                    className="flex w-full items-center justify-center rounded-lg bg-green-500 px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-green-600 sm:flex-1"
                  >
                    <ArrowPathIcon className="mr-2 h-5 w-5" /> Book Again
                  </Link>
                )}

                {/* ✅ Enhanced review button with validation */}
                {reviewButtonContent && (
                  <div className="w-full sm:flex-1">
                    {(reviewButtonContent as any).href ? (
                      <Link
                        to={
                          typeof (reviewButtonContent as any).href === "string"
                            ? (reviewButtonContent as any).href
                            : `${(reviewButtonContent as any).href.pathname}${(reviewButtonContent as any).href.query?.providerName ? `?providerName=${encodeURIComponent((reviewButtonContent as any).href.query.providerName)}` : ""}`
                        }
                        className={`flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-center text-sm font-medium text-white transition-colors ${reviewButtonContent.className}`}
                      >
                        {reviewButtonContent.icon} {reviewButtonContent.text}
                      </Link>
                    ) : (
                      <button
                        onClick={reviewButtonContent.onClick}
                        disabled={reviewButtonContent.disabled}
                        className={`flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors ${reviewButtonContent.className} ${reviewButtonContent.disabled ? "cursor-not-allowed" : ""}`}
                      >
                        {reviewButtonContent.icon} {reviewButtonContent.text}
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        <div className="md:hidden">
          <BottomNavigationNextjs />
        </div>
      </div>
    </>
  );
};

export default BookingDetailsPage;
