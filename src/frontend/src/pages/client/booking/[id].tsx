import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  UserCircleIcon,
  ChatBubbleLeftRightIcon,
  XCircleIcon,
  StarIcon,
  CheckCircleIcon,
  PhoneIcon,
  BriefcaseIcon,
  ArchiveBoxIcon,
} from "@heroicons/react/24/solid";
import {
  EnhancedBooking,
  useBookingManagement,
} from "../../../hooks/bookingManagement";
import { reviewCanisterService } from "../../../services/reviewCanisterService";
import { authCanisterService } from "../../../services/authCanisterService";
import BottomNavigation from "../../../components/client/BottomNavigation";

type BookingStatus =
  | "Requested"
  | "Accepted"
  | "InProgress"
  | "Completed"
  | "Cancelled"
  | "Declined"
  | "Disputed";

// Progress tracker for booking status
const BookingProgressTracker: React.FC<{ currentStatus: BookingStatus }> = ({
  currentStatus,
}) => {
  const statuses: BookingStatus[] = [
    "Requested",
    "Accepted",
    "InProgress",
    "Completed",
  ];
  const currentIndex = statuses.findIndex((status) => status === currentStatus);

  if (currentIndex === -1) {
    return (
      <div className="py-4 text-center">
        <p className="font-medium text-gray-600">
          This booking is not in an active progress state.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-start justify-between">
        {statuses.map((status, index) => {
          const isActive = index <= currentIndex;
          return (
            <React.Fragment key={status}>
              <div
                className="flex flex-col items-center text-center"
                style={{ width: "65px" }}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    isActive
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-300 bg-gray-200 text-gray-500"
                  }`}
                >
                  {index < currentIndex ? (
                    <CheckCircleIcon className="h-5 w-5" />
                  ) : (
                    <strong>{index + 1}</strong>
                  )}
                </div>
                <p
                  className={`mt-2 text-xs font-medium ${isActive ? "text-blue-700" : "text-gray-500"}`}
                >
                  {status === "InProgress" ? "In Progress" : status}
                </p>
              </div>
              {index < statuses.length - 1 && (
                <div className="mt-3.5 flex-1">
                  <div
                    className={`h-1 transition-colors duration-300 ${isActive && index < currentIndex ? "bg-blue-600" : "bg-gray-300"}`}
                  ></div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

const BookingDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>(); // Get booking ID from URL params
  const [specificBooking, setSpecificBooking] =
    useState<EnhancedBooking | null>(null);
  const [localLoading, setLocalLoading] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);
  const [canUserReview, setCanUserReview] = useState<boolean | null>(null);
  const [checkingReviewStatus, setCheckingReviewStatus] = useState(false);

  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState<number | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const {
    bookings,
    updateBookingStatus: updateBookingStatusHook,
    loading: hookLoading,
    refreshBookings,
    clearError,
    isOperationInProgress,
  } = useBookingManagement();

  // Set document title
  useEffect(() => {
    document.title = `Booking: ${specificBooking?.serviceName || "Details"} | SRV Client`;
  }, [specificBooking?.serviceName]);

  // Find the specific booking from the list once bookings are loaded
  useEffect(() => {
    if (id && typeof id === "string" && !hookLoading) {
      const foundBooking = bookings.find((booking) => booking.id === id);
      if (foundBooking) {
        setSpecificBooking(foundBooking);
      } else {
        setLocalError("Booking not found");
      }
      setLocalLoading(false);
    }
  }, [id, bookings, hookLoading]);

  // Fetch review statistics for the service
  useEffect(() => {
    const fetchReviewStats = async () => {
      if (specificBooking?.serviceId) {
        setLoadingStats(true);
        try {
          const [avgRating, reviews] = await Promise.all([
            reviewCanisterService.calculateServiceRating(
              specificBooking.serviceId,
            ),
            reviewCanisterService.getServiceReviews(specificBooking.serviceId),
          ]);
          setAverageRating(avgRating);
          setReviewCount(reviews.length);
        } catch (error) {
          console.error("Failed to fetch review stats:", error);
          setAverageRating(null);
          setReviewCount(null);
        } finally {
          setLoadingStats(false);
        }
      }
    };
    fetchReviewStats();
  }, [specificBooking?.serviceId]);

  // Check if the current user can review this booking
  useEffect(() => {
    const checkReviewStatus = async () => {
      if (!specificBooking?.id || specificBooking.status !== "Completed") {
        setCanUserReview(false);
        return;
      }
      setCheckingReviewStatus(true);
      try {
        const userProfile = await authCanisterService.getMyProfile();
        if (!userProfile?.id) {
          setCanUserReview(false);
          return;
        }
        const canReview = await reviewCanisterService.canUserReviewBooking(
          specificBooking.id,
          userProfile.id,
        );
        setCanUserReview(canReview);
      } catch (error) {
        console.error("Error checking review status:", error);
        setCanUserReview(true); // Default to true if check fails to allow user to try
      } finally {
        setCheckingReviewStatus(false);
      }
    };
    checkReviewStatus();
  }, [specificBooking]);

  const handleUpdateBookingStatus = async (
    bookingId: string,
    newStatus: BookingStatus,
  ) => {
    await updateBookingStatusHook(bookingId, newStatus);
    const updatedBooking = bookings.find((b) => b.id === bookingId);
    if (updatedBooking) setSpecificBooking(updatedBooking);
  };

  const handleRetry = () => {
    setLocalError(null);
    clearError();
    refreshBookings();
  };

  const handleCancelBooking = async () => {
    if (!specificBooking) return;
    // NOTE: window.confirm is blocking. Consider a custom modal for better UX.
    if (window.confirm(`Are you sure you want to cancel this booking?`)) {
      await handleUpdateBookingStatus(specificBooking.id, "Cancelled");
      // NOTE: window.alert is blocking. Consider a toast notification.
      alert(`Booking has been cancelled.`);
    }
  };

  const handleChatWithProvider = () => {
    if (specificBooking?.providerProfile?.id) {
      navigate(`/client/chat/${specificBooking.providerProfile.id}`);
    } else {
      alert("Provider information is not available to start a chat.");
    }
  };

  const handleViewReviews = () => {
    if (specificBooking?.serviceId)
      navigate(`/client/service/reviews/${specificBooking.serviceId}`);
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString([], {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusPillStyle = (status: string) => {
    const styles: { [key: string]: string } = {
      REQUESTED: "bg-yellow-100 text-yellow-700",
      ACCEPTED: "bg-green-100 text-green-700",
      INPROGRESS: "bg-blue-100 text-blue-700",
      COMPLETED: "bg-indigo-100 text-indigo-700",
      CANCELLED: "bg-red-100 text-red-700",
    };
    return styles[status?.toUpperCase()] || "bg-gray-100 text-gray-700";
  };

  const getReviewButtonContent = () => {
    if (!specificBooking || specificBooking.status !== "Completed") return null;
    if (checkingReviewStatus) {
      return {
        text: "Checking...",
        icon: (
          <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
        ),
        disabled: true,
        className: "bg-gray-400",
      };
    }
    if (canUserReview === false) {
      return {
        text: "View Your Review",
        icon: <CheckCircleIcon className="mr-2 h-5 w-5" />,
        onClick: handleViewReviews,
        className: "bg-green-500 hover:bg-green-600",
      };
    }
    return {
      text: "Rate Provider",
      icon: <StarIcon className="mr-2 h-5 w-5" />,
      to: `/client/review/${specificBooking.id}`,
      state: { providerName: specificBooking.providerProfile?.name },
      className: "bg-yellow-500 hover:bg-yellow-600",
    };
  };

  if (hookLoading || localLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (localError && !specificBooking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 text-center">
        <div>
          <h1 className="mb-2 text-2xl font-bold text-red-600">
            Error Loading Booking
          </h1>
          <p className="mb-4 text-gray-600">{localError}</p>
          <button
            onClick={handleRetry}
            className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!specificBooking) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
        <h1 className="mb-4 text-xl font-semibold text-red-600">
          Booking Not Found
        </h1>
        <Link
          to="/client/booking"
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Back to Bookings
        </Link>
      </div>
    );
  }

  const {
    serviceName,
    providerProfile,
    packageName,
    requestedDate,
    createdAt,
    formattedLocation,
    price,
    status,
  } = specificBooking;
  const canCancel = ["Requested", "Accepted"].includes(status || "");
  const reviewButtonContent = getReviewButtonContent();

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
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Section 1: Provider Details */}
          <div className="h-fit rounded-xl bg-white p-5 shadow-lg lg:col-span-2">
            <h3 className="mb-4 text-lg font-bold text-slate-800">
              Provider Details
            </h3>
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                {providerProfile?.profilePicture ? (
                  <img
                    src={
                      providerProfile.profilePicture.imageUrl ||
                      providerProfile.profilePicture.thumbnailUrl ||
                      ""
                    }
                    alt={providerProfile.name || "Provider"}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <UserCircleIcon className="h-16 w-16 text-gray-300" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-800">
                  {providerProfile?.name || "N/A"}
                </p>
                <p className="flex items-center text-sm text-gray-500">
                  <PhoneIcon className="mr-1.5 h-4 w-4" />
                  {providerProfile?.phone || "No contact number"}
                </p>
                <div className="mt-2 flex items-center space-x-2">
                  {loadingStats ? (
                    <p className="text-sm text-gray-400">Loading reviews...</p>
                  ) : averageRating != null && reviewCount != null ? (
                    <>
                      <div className="flex items-center text-sm font-bold text-yellow-500">
                        <StarIcon className="mr-1 h-4 w-4" />
                        <span>{averageRating.toFixed(1)}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        ({reviewCount}{" "}
                        {reviewCount === 1 ? "review" : "reviews"})
                      </span>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400">No reviews yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Service Details */}
          <div className="h-fit rounded-xl bg-white p-5 shadow-lg lg:col-span-3">
            <div className="flex items-start justify-between">
              <h3 className="mb-4 text-lg font-bold text-slate-800">
                Service Details
              </h3>
              <span
                className={`rounded-full px-3 py-1 text-sm font-semibold ${getStatusPillStyle(status || "")}`}
              >
                {status?.replace("_", " ") || "Unknown"}
              </span>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-start">
                <BriefcaseIcon className="mt-0.5 mr-2 h-5 w-5 text-gray-500" />
                <span>
                  <strong>Service:</strong> {serviceName}
                </span>
              </div>
              <div className="flex items-start">
                <ArchiveBoxIcon className="mt-0.5 mr-2 h-5 w-5 text-gray-500" />
                <span>
                  <strong>Package:</strong> {packageName}
                </span>
              </div>
              <div className="flex items-start">
                <CalendarDaysIcon className="mt-0.5 mr-2 h-5 w-5 text-blue-500" />
                <span>
                  <strong>Scheduled:</strong>{" "}
                  {formatDate(requestedDate || createdAt)}
                </span>
              </div>
              <div className="flex items-start">
                <MapPinIcon className="mt-0.5 mr-2 h-5 w-5 text-blue-500" />
                <span>
                  <strong>Location:</strong>{" "}
                  {formattedLocation || "Not specified"}
                </span>
              </div>
              {price != null && (
                <div className="flex items-start">
                  <CurrencyDollarIcon className="mt-0.5 mr-2 h-5 w-5 text-green-500" />
                  <span>
                    <strong>Payment:</strong> ₱{price.toFixed(2)} (Cash)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Progress Tracker */}
        <div className="rounded-xl bg-white p-5 shadow-lg">
          <h3 className="mb-5 text-lg font-bold text-slate-800">
            Booking Progress
          </h3>
          <BookingProgressTracker currentStatus={status as BookingStatus} />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 rounded-xl bg-white p-4 shadow-lg">
          <button
            onClick={handleChatWithProvider}
            className="flex min-w-[150px] flex-1 items-center justify-center rounded-lg bg-slate-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            <ChatBubbleLeftRightIcon className="mr-2 h-5 w-5" /> Chat with
            Provider
          </button>

          {canCancel && (
            <button
              onClick={handleCancelBooking}
              disabled={isOperationInProgress(`update-${id}`)}
              className="flex min-w-[150px] flex-1 items-center justify-center rounded-lg bg-red-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
            >
              <XCircleIcon className="mr-2 h-5 w-5" />
              {isOperationInProgress(`update-${id}`)
                ? "Cancelling..."
                : "Cancel"}
            </button>
          )}

          {reviewButtonContent &&
            (reviewButtonContent.to ? (
              <Link
                to={reviewButtonContent.to}
                state={reviewButtonContent.state}
                className={`flex min-w-[150px] flex-1 items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-white ${reviewButtonContent.className}`}
              >
                {reviewButtonContent.icon} {reviewButtonContent.text}
              </Link>
            ) : (
              <button
                onClick={reviewButtonContent.onClick}
                disabled={reviewButtonContent.disabled}
                className={`flex min-w-[150px] flex-1 items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-white ${reviewButtonContent.className} ${reviewButtonContent.disabled ? "cursor-not-allowed" : ""}`}
              >
                {reviewButtonContent.icon} {reviewButtonContent.text}
              </button>
            ))}
        </div>
      </main>

      <div>
        <BottomNavigation />
      </div>
    </div>
  );
};

export default BookingDetailsPage;
