// Helper to format 24-hour time to 12-hour format with AM/PM
function formatTime12Hour(time: string): string {
  if (!time) return "";
  const [hourStr, minuteStr] = time.split(":");
  let hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  if (isNaN(hour) || isNaN(minute)) return time;
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minute.toString().padStart(2, "0")} ${ampm}`;
}
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  StarIcon,
  MapPinIcon,
  UserCircleIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/solid";
import { CameraIcon, DocumentCheckIcon } from "@heroicons/react/24/outline";

import useServiceById from "../../hooks/serviceDetail"; // Adjusted hook import
import { useServiceReviews } from "../../hooks/reviewManagement"; // Adjust path as needed
import { useServiceManagement } from "../../hooks/serviceManagement"; // Using the service management hook
import { useChat } from "../../hooks/useChat"; // Import the chat hook
import { useAuth } from "../../context/AuthContext"; // Import auth context
import BottomNavigation from "../../components/client/BottomNavigation"; // Adjust path as needed
import { ServicePackage } from "../../services/serviceCanisterService";

const ReputationScore: React.FC<{ score: number }> = ({ score }) => {
  let iconColor = "text-blue-600";
  let bgColor = "bg-blue-50";
  let textColor = "text-blue-700";
  if (score >= 80) {
    iconColor = "text-blue-600";
    bgColor = "bg-blue-50";
    textColor = "text-blue-700";
  } else if (score >= 60) {
    iconColor = "text-blue-400";
    bgColor = "bg-blue-100";
    textColor = "text-blue-700";
  } else if (score >= 40) {
    iconColor = "text-yellow-400";
    bgColor = "bg-yellow-50";
    textColor = "text-yellow-700";
  } else {
    iconColor = "text-yellow-600";
    bgColor = "bg-yellow-100";
    textColor = "text-yellow-700";
  }
  return (
    <span
      className={`mt-2 mb-2 flex items-center rounded-lg px-3 py-1 text-sm font-semibold ${bgColor} ${textColor}`}
      style={{ minWidth: 0 }}
    >
      <StarIcon className={`mr-2 h-5 w-5 ${iconColor}`} />
      <span className="mr-2">Reputation Score:</span>
      <span className="font-bold">{score}</span>
    </span>
  );
};

// --- Sub-component for Star Rating Display ---
const StarRatingDisplay: React.FC<{ rating: number; maxStars?: number }> = ({
  rating,
  maxStars = 5,
}) => {
  return (
    <div className="flex items-center">
      {[...Array(maxStars)].map((_, index) => {
        const starValue = index + 1;
        return (
          <StarIcon
            key={index}
            className={`h-5 w-5 ${starValue <= Math.round(rating) ? "text-yellow-400" : "text-gray-300"}`}
          />
        );
      })}
    </div>
  );
};

// --- Sub-component for the Reviews Section ---
const ReviewsSection: React.FC<{ serviceId: string }> = ({ serviceId }) => {
  const { reviews, loading, error, getAverageRating, getRatingDistribution } =
    useServiceReviews(serviceId);

  if (loading)
    return (
      <div className="p-4 text-center text-gray-500">Loading reviews...</div>
    );
  if (error)
    return (
      <div className="p-4 text-center text-red-500">
        Could not load reviews.
      </div>
    );

  const visibleReviews = reviews.filter((r) => r.status === "Visible");
  const averageRating = getAverageRating(visibleReviews);
  const ratingDistribution = getRatingDistribution(visibleReviews);
  const totalReviews = visibleReviews.length;

  return (
    <div className="mt-8 rounded-xl bg-white p-6 shadow-lg">
      <h3 className="mb-4 text-lg font-semibold text-gray-800">
        Reviews ({totalReviews})
      </h3>
      {totalReviews > 0 ? (
        <div>
          <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-8">
            <div className="mb-6 text-center lg:mb-0">
              <p className="text-4xl font-bold text-gray-800">
                {averageRating.toFixed(1)}
              </p>
              <div className="flex justify-center">
                <StarRatingDisplay rating={averageRating} />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                based on {totalReviews} reviews
              </p>
            </div>
            <div className="flex-1">
              <div className="space-y-1">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = ratingDistribution[star] || 0;
                  const percentage =
                    totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center text-sm">
                      <span className="w-12 text-gray-600">
                        {star} star{star > 1 ? "s" : ""}
                      </span>
                      <div className="mx-3 h-2 w-full rounded-full bg-gray-200">
                        <div
                          className="h-2 rounded-full bg-yellow-400"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="w-8 text-right text-gray-600">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="mt-8 space-y-6">
            {visibleReviews.slice(0, 3).map((review) => (
              <div key={review.id} className="border-t border-gray-100 pt-6">
                <div className="mb-2 flex items-center">
                  <div className="relative mr-3 flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gray-100">
                    <UserCircleIcon className="h-10 w-10 text-gray-300" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">A Client</p>
                    <div className="flex items-center">
                      <StarRatingDisplay rating={review.rating} />
                    </div>
                  </div>
                </div>
                <p className="text-sm break-words text-gray-600">
                  {review.comment}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-center text-gray-500">
          No reviews yet for this service.
        </p>
      )}
    </div>
  );
};

// --- Other Sub-Components ---
const ServiceGallerySection: React.FC = () => (
  <div className="mt-8 rounded-xl bg-white p-6 shadow-lg">
    <h3 className="mb-4 text-lg font-semibold text-gray-800">
      Service Gallery
    </h3>
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="flex aspect-square items-center justify-center rounded-lg bg-gray-100"
        >
          <CameraIcon className="h-10 w-10 text-gray-300" />
        </div>
      ))}
    </div>
    <p className="mt-4 text-center text-xs text-gray-500">
      The service provider will add photos of their work soon.
    </p>
  </div>
);

const CredentialsSection: React.FC<{ isVerified: boolean }> = ({
  isVerified,
}) => (
  <div className="mt-8 rounded-xl bg-white p-6 shadow-lg">
    <h3 className="mb-4 text-lg font-semibold text-gray-800">Credentials</h3>
    <div className="flex items-center rounded-lg bg-gray-50 p-4">
      <DocumentCheckIcon className="mr-4 h-10 w-10 text-gray-400" />
      <div>
        <p className="font-semibold text-gray-700">
          {isVerified ? "Provider Verified" : "Verification Pending"}
        </p>
        <p className="text-sm text-gray-500">
          {isVerified
            ? "Credentials have been successfully verified."
            : "Credentials will be displayed here once verified."}
        </p>
      </div>
    </div>
  </div>
);

// --- Main Page Component ---
const ServiceDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id: serviceId } = useParams<{ id: string }>();
  const { identity } = useAuth();

  const {
    service,
    loading: serviceLoading,
    error: serviceError,
  } = useServiceById(serviceId as string);
  const { getServicePackages } = useServiceManagement(); // Use the hook for package fetching
  const { conversations, createConversation, loading: chatLoading } = useChat(); // Add the useChat hook

  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState<boolean>(true);
  const [chatErrorMessage, setChatErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (service) {
      document.title = `SRV | ${service.name}`;
    }
  }, [service]);

  useEffect(() => {
    const fetchPackages = async () => {
      if (service?.id) {
        setLoadingPackages(true);
        try {
          // Fetch packages using the centralized hook
          const fetchedPackages = await getServicePackages(service.id);
          setPackages(fetchedPackages);
        } catch (error) {
          // Failed to fetch service packages
        } finally {
          setLoadingPackages(false);
        }
      }
    };
    fetchPackages();
  }, [service?.id, getServicePackages]);

  const handleBookNow = () => {
    if (!service) return;
    navigate(`/client/book/${service.id}`);
  };

  const handleChatProviderClick = async () => {
    if (!service?.providerId) {
      setChatErrorMessage("Provider information is missing.");
      return;
    }

    if (!identity) {
      setChatErrorMessage("You must be logged in to start a conversation.");
      return;
    }

    setChatErrorMessage(null);

    try {
      const currentUserId = identity.getPrincipal().toString();

      // Check if there's an existing conversation with this provider
      const existingConversation = conversations.find(
        (conv) =>
          (conv.conversation.clientId === currentUserId &&
            conv.conversation.providerId === service.providerId) ||
          (conv.conversation.providerId === currentUserId &&
            conv.conversation.clientId === service.providerId),
      );

      if (existingConversation) {
        // Navigate to existing conversation, use providerId (Principal) as route param
        navigate(`/client/chat/${service.providerId}`, {
          state: {
            conversationId: existingConversation.conversation.id,
            otherUserName: existingConversation.otherUserName,
            otherUserImage: service.providerAvatar,
          },
        });
      } else {
        // Create new conversation
        const newConversation = await createConversation(
          currentUserId,
          service.providerId,
        );

        if (newConversation) {
          // Navigate to new conversation, use providerId (Principal) as route param
          navigate(`/client/chat/${service.providerId}`, {
            state: {
              conversationId: newConversation.id,
              otherUserName: service.providerName,
              otherUserImage: service.providerAvatar,
            },
          });
        }
      }
    } catch (error) {
      setChatErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not start conversation. Please try again.",
      );
    }
  };

  if (serviceLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (serviceError || !service) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <h1 className="mb-4 text-2xl font-bold text-red-600">
          {serviceError ? "Error Loading Service" : "Service Not Found"}
        </h1>
        <button
          onClick={() => navigate("/client/home")}
          className="rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const { rating, providerName, providerAvatar, name, category, location } =
    service;
  // Debug: log service and availability (not isVerified)
  console.log("[DEBUG] service object:", service);
  console.log("[DEBUG] service.availability:", service.availability);
  // Use isVerified from service object only
  const isVerified = service.isVerified;
  const averageRating = rating?.average ?? 0;
  const reviewCount = rating?.count ?? 0;

  // --- Types and Component for the Availability Section ---
  type Availability = {
    isAvailableNow?: boolean;
    availableDays?: string[]; // e.g. ["Monday", "Tuesday"]
    availableTimeStart?: string; // e.g. "09:00"
    availableTimeEnd?: string; // e.g. "17:00"
    availableTimeRanges?: string[]; // e.g. ["09:00 - 12:00", "13:00 - 17:00"]
  };

  interface AvailabilitySectionProps {
    availability?: Availability;
  }

  const AvailabilitySection: React.FC<AvailabilitySectionProps> = ({
    availability,
  }) => {
    // Display all time slots as a comma-separated list if available
    const availableTimeRanges: string[] | undefined =
      availability?.availableTimeRanges;
    return (
      <div className="mt-8 rounded-xl bg-white p-6 shadow-lg">
        <h3 className="mb-4 text-lg font-semibold text-gray-800">
          Availability
        </h3>
        <div className="flex flex-col gap-2">
          <div>
            <span className="font-semibold text-gray-700">Days:</span>
            <span className="ml-2 text-gray-600">
              {availability?.availableDays &&
              availability.availableDays.length > 0
                ? availability.availableDays.join(", ")
                : "Not specified"}
            </span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Time(s):</span>
            <span className="ml-2 text-gray-600">
              {availableTimeRanges && availableTimeRanges.length > 0 ? (
                <span className="flex flex-col">
                  {availableTimeRanges.map((range, idx) => (
                    <span key={idx}>{range}</span>
                  ))}
                </span>
              ) : (
                (availability?.availableTimeStart || "Not specified") +
                " - " +
                (availability?.availableTimeEnd || "Not specified")
              )}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Map backend availability to frontend expected fields
  let mappedAvailability: Availability | undefined = undefined;
  if (service.availability) {
    const { schedule, timeSlots, isAvailableNow } = service.availability;
    console.log("[DEBUG] service.availability.timeSlots:", timeSlots);
    // Extract days (assume array of strings or objects with 'day' property)
    let availableDays: string[] | undefined = undefined;
    if (Array.isArray(schedule) && schedule.length > 0) {
      // Accept both string and object with day property
      availableDays = schedule
        .map((s: any) => {
          if (typeof s === "string") return s;
          if (typeof s === "object" && s.day) return s.day;
          return undefined;
        })
        .filter((d): d is string => typeof d === "string");
    }
    // Extract time ranges (assume array of objects with 'start' and 'end')
    let availableTimeStart: string | undefined = undefined;
    let availableTimeEnd: string | undefined = undefined;
    let availableTimeRanges: string[] | undefined = undefined;
    if (Array.isArray(timeSlots) && timeSlots.length > 0) {
      availableTimeRanges = timeSlots
        .map((slot: any) => {
          if (typeof slot === "string") {
            // If string is in the format 'HH:mm-HH:mm', split and format both
            const match = slot.match(/^(\d{2}:\d{2})-(\d{2}:\d{2})$/);
            if (match) {
              const [, start, end] = match;
              return `${formatTime12Hour(start)} - ${formatTime12Hour(end)}`;
            }
            // Otherwise, just format as a single time
            return formatTime12Hour(slot);
          } else if (
            slot &&
            typeof slot === "object" &&
            slot.start &&
            slot.end
          ) {
            return `${formatTime12Hour(slot.start)} - ${formatTime12Hour(slot.end)}`;
          }
          return undefined;
        })
        .filter((r): r is string => typeof r === "string");
      if (availableTimeRanges.length > 0) {
        const firstSlot = timeSlots[0];
        if (
          typeof firstSlot === "string" &&
          firstSlot.match(/^(\d{2}:\d{2})-(\d{2}:\d{2})$/)
        ) {
          const match = firstSlot.match(/^(\d{2}:\d{2})-(\d{2}:\d{2})$/);
          if (match) {
            availableTimeStart = formatTime12Hour(match[1]);
            availableTimeEnd = formatTime12Hour(match[2]);
          }
        } else if (
          firstSlot &&
          typeof firstSlot === "object" &&
          "start" in firstSlot &&
          "end" in firstSlot
        ) {
          const slotObj = firstSlot as { start: string; end: string };
          availableTimeStart = formatTime12Hour(slotObj.start);
          availableTimeEnd = formatTime12Hour(slotObj.end);
        } else if (typeof firstSlot === "string") {
          availableTimeStart = formatTime12Hour(firstSlot);
          availableTimeEnd = formatTime12Hour(firstSlot);
        }
      }
    }
    mappedAvailability = {
      isAvailableNow,
      availableDays,
      availableTimeStart,
      availableTimeEnd,
      availableTimeRanges,
    };
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-40">
      <div className="relative h-60 w-full">
        <img
          src={service.heroImage || "/../default-provider.svg"}
          alt={name}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="relative z-10 -mt-24 p-4">
        {/* Chat Error Message */}
        {chatErrorMessage && (
          <div className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
            <span className="block sm:inline">{chatErrorMessage}</span>
            <button
              onClick={() => setChatErrorMessage(null)}
              className="float-right ml-4 text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}
        <div className="flex flex-col lg:flex-row lg:justify-center lg:gap-8">
          {/* Left Column: Provider Info */}
          <div className="w-full lg:w-[400px]">
            <div className="h-full rounded-xl bg-white p-6 shadow-lg">
              <div className="mb-4 flex items-center">
                <div
                  className="relative mr-6 overflow-hidden rounded-full border-2 border-white"
                  style={{
                    width: "112px", // default (h-28 w-28)
                    height: "112px",
                    minWidth: "112px",
                    minHeight: "112px",
                    maxWidth: "128px",
                    maxHeight: "128px",
                    aspectRatio: "1/1",
                  }}
                >
                  <img
                    src={providerAvatar || "/../default-provider.svg"}
                    alt={providerName}
                    className="h-full w-full rounded-full object-cover"
                    style={{ borderRadius: "50%" }}
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {providerName}
                  </h2>
                  {/* Availability Badge */}
                  {service &&
                    service.availability &&
                    typeof service.availability.isAvailableNow ===
                      "boolean" && (
                      <span
                        className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${service.availability.isAvailableNow ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}
                      >
                        {service.availability.isAvailableNow
                          ? "Available"
                          : "Not Available"}
                      </span>
                    )}
                  {/* Reputation Score (below availability, above verification note) */}
                  <ReputationScore score={50} />
                  {/* Verification Note (below reputation score) */}
                  {isVerified === true && (
                    <span className="mt-2 flex items-center rounded-lg bg-blue-50 px-3 py-1 text-sm text-blue-600">
                      <CheckBadgeIcon className="mr-2 h-5 w-5" />
                      <span>This service provider is verified.</span>
                    </span>
                  )}
                </div>
              </div>
              {/* Compact provider info: only provider, category, availability */}
            </div>
          </div>

          {/* Right Column */}
          <div className="mt-6 w-full lg:mt-0 lg:w-[400px]">
            <div className="h-full rounded-xl bg-white p-6 shadow-lg">
              <h1 className="mb-2 text-2xl font-bold text-gray-900">{name}</h1>
              <p className="mb-2 text-base font-semibold text-gray-600">
                {category?.name ?? "General"}
              </p>
              <div className="mb-4 flex items-center text-sm text-gray-600">
                <MapPinIcon className="mr-1 h-5 w-5 text-gray-400" />
                <span>{location?.address || "Baguio City"}</span>
              </div>
              {/* Review count and verification note side by side */}
              <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                <span className="flex items-center">
                  <StarIcon className="mr-1 h-5 w-5 text-yellow-400" />
                  <span className="font-semibold">
                    {averageRating.toFixed(1)}
                  </span>
                  <span className="ml-1">({reviewCount} reviews)</span>
                </span>
                {/* Verification note removed from service info section as requested */}
              </div>
            </div>
          </div>
        </div>
        {/* Packages Section */}
        <div className="mt-8 rounded-xl bg-white p-6 shadow-lg">
          <h3 className="mb-4 text-lg font-semibold text-gray-800">
            Packages Offered
          </h3>
          {loadingPackages ? (
            <div className="p-4 text-center text-gray-500">
              Loading packages...
            </div>
          ) : packages.length > 0 ? (
            <div className="space-y-3">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="rounded-lg border border-yellow-500 bg-gray-50 p-4 transition-all duration-200 hover:scale-95 hover:shadow-md"
                  style={{ willChange: "transform" }}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-gray-800">{pkg.title}</h4>
                    <p className="text-lg font-bold text-blue-600">
                      ₱
                      {Number(pkg.price).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    {pkg.description}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              No packages available for this service.
            </div>
          )}
        </div>
        {/* Availability Section */}
        <AvailabilitySection availability={mappedAvailability} />
        {/* Gallery, Credentials, Reviews */}
        <ServiceGallerySection />
        <CredentialsSection isVerified={isVerified} />
        <ReviewsSection serviceId={service.id} />
      </div>

      {/* Sticky Footer for Actions */}
      <div className="shadow-t-lg fixed bottom-16 left-0 z-40 w-full border-t border-gray-200 bg-white p-3">
        <div className="mx-auto flex max-w-3xl items-center space-x-3">
          {/* Vouch button (Lefts) */}
          <button
            className="flex w-1/4 items-center justify-center rounded-lg bg-yellow-200 py-3 font-bold text-yellow-800 hover:bg-yellow-300"
            type="button"
            // TODO: Add vouching logic here
          >
            Vouch
          </button>

          {/* Book Now button (center, bigger) */}
          <button
            onClick={handleBookNow}
            disabled={packages.length === 0}
            className="w-2/4 rounded-lg bg-blue-600 py-3 font-bold text-white shadow-md transition-colors hover:bg-blue-700 disabled:bg-gray-300"
          >
            Book Now
          </button>
          {/* Chat button (Right) */}
          <button
            onClick={handleChatProviderClick}
            className="flex w-1/4 items-center justify-center rounded-lg bg-gray-200 py-3 font-bold text-gray-800 hover:bg-gray-300"
          >
            {chatLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                Creating Chat...
              </>
            ) : (
              <></>
            )}
            Chat
          </button>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default ServiceDetailPage;
