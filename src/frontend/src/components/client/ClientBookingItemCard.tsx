// frontend/src/components/client/ClientBookingItemCard.tsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EnhancedBooking } from "../../hooks/bookingManagement";
import { reviewCanisterService } from "../../services/reviewCanisterService";
import { authCanisterService } from "../../services/authCanisterService";
import {
  CalendarDaysIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  XCircleIcon,
  ArrowPathIcon,
  StarIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/solid";

interface ClientBookingItemCardProps {
  booking: EnhancedBooking;
  onCancelBooking?: (bookingId: string) => void;
  onUpdateStatus?: (bookingId: string, status: string) => Promise<void>;
}

const ClientBookingItemCard: React.FC<ClientBookingItemCardProps> = ({
  booking,
  onCancelBooking,
  onUpdateStatus,
}) => {
  const navigate = useNavigate();

  // Add state for review status
  const [canUserReview, setCanUserReview] = useState<boolean | null>(null);
  const [checkingReviewStatus, setCheckingReviewStatus] = useState(false);

  // Check review status when booking is finished
  useEffect(() => {
    const checkReviewStatus = async () => {
      // Only check for completed bookings (exclude cancelled)
      if (booking.status !== "Completed" || !booking.id) {
        // For cancelled bookings, explicitly set to false
        if (booking.status === "Cancelled") {
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
          booking.id,
          userProfile.id,
        );
        setCanUserReview(canReview);
      } catch (error) {
        // Default to allowing review if check fails (only for completed bookings)
        setCanUserReview(true);
      } finally {
        setCheckingReviewStatus(false);
      }
    };

    checkReviewStatus();
  }, [booking.id, booking.status]);

  // Extract booking data with fallbacks
  const serviceTitle = booking.serviceName;
  const serviceImage =
    booking.providerProfile?.profilePicture?.imageUrl || "/default.svg";
  const providerName = booking.providerProfile?.name;

  const bookingLocation =
    booking.formattedLocation ||
    (typeof booking.location === "string"
      ? booking.location
      : "Location not specified");

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

  // Status color mapping
  const getStatusColor = (status: string) => {
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

  // Event handlers
  const handleCancelClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (window.confirm("Are you sure you want to cancel this booking?")) {
      try {
        if (onUpdateStatus) {
          await onUpdateStatus(booking.id, "Cancelled");
        } else if (onCancelBooking) {
          onCancelBooking(booking.id);
        } else {
          alert(
            `Mock: Request Cancel for Booking ID: ${booking.id} (Handler not passed)`,
          );
        }
      } catch (error) {
        alert("Failed to cancel booking. Please try again.");
      }
    }
  };

  const handleBookAgainClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (booking.serviceId) {
      navigate(`/client/book/${booking.serviceId}`);
    } else {
      alert("Service information not available to book again.");
      navigate("/client/home");
    }
  };

  // Add handler for viewing reviews when already reviewed
  const handleViewReviews = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (booking.serviceId) {
      navigate(`/client/service/reviews/${booking.serviceId}`);
    } else {
      alert("Service information not available.");
    }
  };

  // Check if booking can be cancelled
  const canCancel = ["Requested", "Pending", "Accepted", "Confirmed"].includes(
    booking.status,
  );

  // Check if booking is completed/cancelled for actions
  const isCompleted = booking.status === "Completed";
  const isCancelled = booking.status === "Cancelled";
  const isFinished = isCompleted || isCancelled;

  // Update the review button content logic
  const getReviewButtonContent = () => {
    // Handle cancelled bookings first
    if (isCancelled) {
      return {
        text: "Service Cancelled",
        icon: <XCircleIcon className="mr-1.5 h-4 w-4" />,
        className: "bg-gray-400 cursor-not-allowed",
        disabled: true,
        onClick: undefined,
        href: undefined,
        tooltip: "Cannot review cancelled bookings",
      };
    }

    // Only show review options for completed bookings
    if (!isCompleted) {
      return null; // Don't show review button for non-completed bookings
    }

    if (checkingReviewStatus) {
      return {
        text: "Checking...",
        icon: (
          <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
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
        icon: <CheckCircleIcon className="mr-1.5 h-4 w-4" />,
        className: "bg-green-500 hover:bg-green-600",
        disabled: false,
        onClick: handleViewReviews,
        href: undefined,
      };
    }

    if (canUserReview === true) {
      // User can submit a review
      return {
        text: "Rate Provider",
        icon: <StarIcon className="mr-1.5 h-4 w-4" />,
        className: "bg-yellow-500 hover:bg-yellow-600",
        disabled: false,
        onClick: undefined,
        href: {
          pathname: `/client/review/${booking.id}`,
          query: { providerName: providerName },
        },
      };
    }

    // Default state (null - still loading or error)
    return {
      text: "Rate Provider",
      icon: <StarIcon className="mr-1.5 h-4 w-4" />,
      className: "bg-yellow-500 hover:bg-yellow-600",
      disabled: false,
      onClick: undefined,
      href: {
        pathname: `/client/review/${booking.id}`,
        query: { providerName: providerName },
      },
    };
  };

  const reviewButtonContent = getReviewButtonContent();

  // Update the render logic for the buttons section
  return (
    <Link
      to={`/client/booking/${booking.id}`}
      className="focus:ring-opacity-50 block cursor-pointer overflow-hidden rounded-xl bg-white shadow-lg transition-shadow duration-300 hover:shadow-xl focus:shadow-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
    >
      <div className="md:flex">
        {serviceImage && (
          <div className="md:flex-shrink-0">
            <div className="relative h-48 w-full object-cover md:w-48">
              <img
                src={serviceImage}
                alt={serviceTitle!}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/default.svg";
                }}
              />
            </div>
          </div>
        )}

        <div className="flex flex-grow flex-col justify-between p-4 sm:p-5">
          <div>
            <div className="flex items-start justify-between">
              <p className="text-xs font-semibold tracking-wider text-indigo-500 uppercase">
                {serviceTitle}
              </p>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(booking.status)}`}
              >
                {booking.status.replace("_", " ")}
              </span>
            </div>

            <h3
              className="mt-1 truncate text-lg font-bold text-slate-800 md:text-xl"
              title={serviceTitle}
            >
              {booking.packageName}
            </h3>

            <p className="mt-1 text-xs text-gray-500">
              Provided by: {providerName}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Contact: {booking.providerProfile?.phone}
            </p>

            <div className="mt-3 space-y-1.5 text-xs text-gray-600">
              <p className="flex items-center">
                <CalendarDaysIcon className="mr-1.5 h-4 w-4 text-gray-400" />
                {formatDate(booking.requestedDate || booking.createdAt)}
              </p>

              <p className="flex items-center">
                <MapPinIcon className="mr-1.5 h-4 w-4 text-gray-400" />
                <span className="truncate">{bookingLocation}</span>
              </p>

              {booking.price && (
                <p className="flex items-center">
                  <CurrencyDollarIcon className="mr-1.5 h-4 w-4 text-gray-400" />
                  <span className="font-semibold text-green-600">
                    ₱{booking.price.toFixed(2)}
                  </span>
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-col space-y-2 border-t border-gray-200 pt-3 sm:flex-row sm:justify-end sm:space-y-0 sm:space-x-2">
            {canCancel && (
              <button
                onClick={handleCancelClick}
                className="flex w-full items-center justify-center rounded-md bg-red-500 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-red-600 sm:w-auto"
              >
                <XCircleIcon className="mr-1.5 h-4 w-4" /> Ikansela ang booking
              </button>
            )}

            {/* Only show "Book Again" for completed bookings, not cancelled */}
            {isCompleted && booking.serviceId && (
              <button
                onClick={handleBookAgainClick}
                className="flex w-full items-center justify-center rounded-md bg-green-500 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-green-600 sm:w-auto"
              >
                <ArrowPathIcon className="mr-1.5 h-4 w-4" /> Book Now ulit
              </button>
            )}

            {/* Enhanced review button with validation for cancelled bookings */}
            {isFinished && reviewButtonContent && (
              <div className="relative">
                {reviewButtonContent.href ? (
                  <Link
                    to={reviewButtonContent.href.pathname}
                    state={{ providerName }}
                    className={`flex w-full items-center justify-center rounded-md px-3 py-2 text-xs font-medium text-white transition-colors sm:w-auto ${reviewButtonContent.className}`}
                    onClick={(e) => {
                      if (reviewButtonContent.disabled) {
                        e.preventDefault();
                      }
                    }}
                  >
                    {reviewButtonContent.icon}
                    {reviewButtonContent.text}
                  </Link>
                ) : (
                  <button
                    onClick={reviewButtonContent.onClick}
                    disabled={reviewButtonContent.disabled}
                    className={`flex w-full items-center justify-center rounded-md px-3 py-2 text-xs font-medium text-white transition-colors sm:w-auto ${reviewButtonContent.className}`}
                    title={reviewButtonContent.tooltip}
                  >
                    {reviewButtonContent.icon}
                    {reviewButtonContent.text}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ClientBookingItemCard;
