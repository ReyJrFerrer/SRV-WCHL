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
  Squares2X2Icon,
  TagIcon,
} from "@heroicons/react/24/solid";
import { CameraIcon, DocumentCheckIcon } from "@heroicons/react/24/outline";

import useServiceById from "../../hooks/serviceDetail"; // Adjusted hook import
import { useServiceReviews } from "../../hooks/reviewManagement"; // Adjust path as needed
import { useServiceManagement } from "../../hooks/serviceManagement"; // Using the service management hook
import { useChat } from "../../hooks/useChat"; // Import the chat hook
import { useAuth } from "../../context/AuthContext"; // Import auth context
import { useReputation } from "../../hooks/useReputation"; // Import reputation hook
import BottomNavigation from "../../components/client/BottomNavigation"; // Adjust path as needed
import { ServicePackage } from "../../services/serviceCanisterService";

const ReputationScore: React.FC<{ providerId: string }> = ({ providerId }) => {
  const { fetchUserReputation } = useReputation();
  const [reputationScore, setReputationScore] = useState<number>(50); // Default score
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadReputation = async () => {
      try {
        setLoading(true);
        const reputation = await fetchUserReputation(providerId);
        if (reputation) {
          setReputationScore(Math.round(reputation.trustScore));
        } else {
          setReputationScore(50); // Fallback to default
        }
      } catch (error) {
        console.error("Failed to fetch provider reputation:", error);
        setReputationScore(50); // Fallback to default on error
      } finally {
        setLoading(false);
      }
    };

    if (providerId) {
      loadReputation();
    }
  }, [providerId, fetchUserReputation]);

  const score = reputationScore;
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

  if (loading) {
    return (
      <span
        className="mt-2 mb-2 flex items-center rounded-lg bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-600"
        style={{ minWidth: 0 }}
      >
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-gray-600"></div>
        <span className="mr-2">Loading reputation...</span>
      </span>
    );
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
import { Link } from "react-router-dom";

const ReviewsSection: React.FC<{ serviceId: string }> = ({ serviceId }) => {
  const { reviews, loading, error, getAverageRating, getRatingDistribution } =
    useServiceReviews(serviceId);

  if (loading)
    return (
      <div className="mt-8 rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-yellow-50 p-6 text-center text-gray-500 shadow-2xl">
        Loading reviews...
      </div>
    );
  if (error)
    return (
      <div className="mt-8 rounded-3xl border border-red-200 bg-gradient-to-br from-red-50 via-white to-yellow-50 p-6 text-center text-red-500 shadow-2xl">
        Could not load reviews.
      </div>
    );

  const visibleReviews = reviews.filter((r) => r.status === "Visible");
  const averageRating = getAverageRating(visibleReviews);
  const ratingDistribution = getRatingDistribution(visibleReviews);
  const totalReviews = visibleReviews.length;

  // Icon for reviews header
  const ChatBubbleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      {...props}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      className={"h-7 w-7 text-yellow-400 " + (props.className || "")}
    >
      <path
        d="M21 12c0 3.866-3.582 7-8 7-1.07 0-2.09-.154-3-.438V21l-4.197-2.799C3.32 16.97 3 16.495 3 16V7c0-.552.448-1 1-1h16c.552 0 1 .448 1 1v5z"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <div className="mt-8 rounded-3xl bg-white p-6 shadow-2xl">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChatBubbleIcon />
          <h3 className="text-lg font-semibold text-gray-800">
            Reviews{" "}
            <span className="ml-1 text-base font-semibold text-gray-500">
              ({totalReviews})
            </span>
          </h3>
        </div>
        <Link
          to={`/client/service/reviews/${serviceId}`}
          className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-700 shadow-sm transition-colors hover:bg-yellow-200 hover:text-yellow-800"
        >
          View All
        </Link>
      </div>
      {totalReviews > 0 ? (
        <div>
          <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-8">
            <div className="mb-6 flex flex-col items-center text-center lg:mb-0">
              <span className="inline-block rounded-2xl border-2 border-yellow-300 bg-yellow-100 px-6 py-2 text-4xl font-extrabold text-yellow-700 shadow-md">
                {averageRating.toFixed(1)}
              </span>
              <div className="mt-2 flex justify-center">
                <StarRatingDisplay rating={averageRating} />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                based on {totalReviews} review{totalReviews > 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex-1">
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = ratingDistribution[star] || 0;
                  const percentage =
                    totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center text-sm">
                      <span className="w-12 font-medium text-gray-600">
                        {star} star{star > 1 ? "s" : ""}
                      </span>
                      <div className="mx-3 h-3 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-3 rounded-full bg-yellow-400 transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="w-8 text-right font-semibold text-gray-700">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {visibleReviews.slice(0, 3).map((review) => (
              <div
                key={review.id}
                className="rounded-2xl border border-blue-100 bg-white/80 p-5 shadow-md transition-all hover:shadow-lg"
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-yellow-300 bg-yellow-50 shadow">
                    <UserCircleIcon className="h-10 w-10 text-yellow-400" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">A Client</p>
                    <div className="flex items-center">
                      <StarRatingDisplay rating={review.rating} />
                    </div>
                  </div>
                </div>
                <div className="w-full">
                  <p className="w-full text-base break-words text-gray-700">
                    {review.comment}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <ChatBubbleIcon className="mb-4 h-12 w-12 text-gray-300" />
          <p className="text-lg font-semibold text-gray-400">
            No reviews yet for this service.
          </p>
        </div>
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
      document.title = `${service.name} | SRV`;
    }
  }, [service]);
  console.log(service);

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

  // Check if current user is the service provider (to prevent self-booking)
  const isOwnService = Boolean(
    identity &&
      service &&
      identity.getPrincipal().toString() === service.providerId,
  );

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
    timeSlotsByDay?: Record<string, string[]>; // Added to support grouped time slots by day
  };

  interface AvailabilitySectionProps {
    availability?: Availability;
  }

  // Visualize each day with all its corresponding time slots
  const AvailabilitySection: React.FC<AvailabilitySectionProps> = ({
    availability,
  }) => {
    const slotsByDay = availability?.timeSlotsByDay || {};
    const days = Object.keys(slotsByDay);
    const hasDays = days.length > 0;
    // Find the max number of slots for any day (for grid rows)
    const maxSlots = days.reduce((max, day) => {
      const slots = Array.isArray(slotsByDay[day]) ? slotsByDay[day] : [];
      return Math.max(max, slots.length);
    }, 0);

    // Icon for section header
    const CalendarIcon = (props: React.SVGProps<SVGSVGElement>) => (
      <svg
        {...props}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        className={"h-7 w-7 text-blue-400 " + (props.className || "")}
      >
        <rect
          x="3"
          y="7"
          width="18"
          height="13"
          rx="3"
          strokeWidth="2"
          stroke="currentColor"
        />
        <path d="M16 3v4M8 3v4" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );

    return (
      <div className="mt-8 rounded-3xl bg-white p-6 shadow-2xl backdrop-blur-md">
        <div className="mb-4 flex items-center gap-2">
          <CalendarIcon />
          <h3 className="text-lg font-semibold text-gray-800">Availability</h3>
          {availability?.isAvailableNow && (
            <span className="ml-2 flex animate-pulse items-center gap-1 rounded-full border border-green-200 bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-green-500"></span>
              Available Now
            </span>
          )}
        </div>
        {hasDays ? (
          <div>
            {/* Mobile: stacked list, Desktop: grid */}
            <div className="block lg:hidden">
              {/* Mobile dropdown/accordion for days */}
              {(() => {
                const [openDay, setOpenDay] = React.useState<string | null>(
                  null,
                );
                return (
                  <ul className="divide-y divide-blue-100">
                    {days.map((day) => {
                      let slots = slotsByDay[day];
                      if (typeof slots === "string") slots = [slots];
                      if (!Array.isArray(slots)) slots = [];
                      const isOpen = openDay === day;
                      return (
                        <li key={day} className="py-1">
                          <button
                            type="button"
                            className={`flex w-full items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-left text-base font-semibold text-blue-700 shadow-sm transition hover:bg-yellow-50 focus:ring-2 focus:ring-blue-400 focus:outline-none`}
                            onClick={() => setOpenDay(isOpen ? null : day)}
                            aria-expanded={isOpen}
                            aria-controls={`availability-panel-${day}`}
                          >
                            <span className="flex items-center gap-2">
                              <span className="inline-block h-2 w-2 rounded-full bg-blue-400"></span>
                              {day}
                            </span>
                            <svg
                              className={`ml-2 h-5 w-5 transition-transform ${isOpen ? "rotate-180" : ""}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </button>
                          {isOpen && (
                            <div
                              id={`availability-panel-${day}`}
                              className="mt-2 mb-4 flex flex-wrap items-center gap-2 px-3"
                            >
                              {slots.length > 0 ? (
                                slots.map((slot, idx) => (
                                  <span
                                    key={slot + idx}
                                    className="inline-block min-w-[120px] rounded-full border border-yellow-300 bg-yellow-100 px-3 py-1 text-center text-sm font-semibold text-yellow-800 shadow-md transition hover:bg-yellow-200"
                                  >
                                    {slot}
                                  </span>
                                ))
                              ) : (
                                <span className="text-gray-400">
                                  Not specified
                                </span>
                              )}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                );
              })()}
            </div>
            {/* Desktop: landscape grid */}
            <div className="hidden lg:block">
              <div className="overflow-x-auto">
                {(() => {
                  const [hoveredDay, setHoveredDay] = React.useState<
                    string | null
                  >(null);
                  return (
                    <table className="min-w-full border-separate border-spacing-y-2">
                      <thead>
                        <tr>
                          {days.map((day) => (
                            <th
                              key={day}
                              className={`rounded-t-xl border border-blue-200 bg-blue-50 px-4 py-3 text-center text-base font-bold text-blue-700 shadow-sm transition-transform duration-150 ${hoveredDay === day ? "scale-95 bg-yellow-50" : "hover:bg-yellow-50"}`}
                              onMouseEnter={() => setHoveredDay(day)}
                              onMouseLeave={() => setHoveredDay(null)}
                            >
                              <span className="flex items-center justify-center gap-2">
                                <span className="inline-block h-2 w-2 rounded-full bg-blue-400"></span>
                                {day}
                              </span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[...Array(maxSlots > 0 ? maxSlots : 1)].map(
                          (_, rowIdx) => (
                            <tr key={rowIdx}>
                              {days.map((day) => {
                                let slots = slotsByDay[day];
                                if (typeof slots === "string") slots = [slots];
                                if (!Array.isArray(slots)) slots = [];
                                const slot = slots[rowIdx];
                                return (
                                  <td
                                    key={day + rowIdx}
                                    className="px-4 py-3 text-center align-top"
                                  >
                                    {slot ? (
                                      <span
                                        className={`inline-block min-w-[120px] rounded-full border border-yellow-300 bg-yellow-100 px-3 py-1 text-base font-semibold text-yellow-800 shadow-md transition-transform duration-150 ${hoveredDay === day ? "scale-95 bg-yellow-200" : "hover:bg-yellow-200"}`}
                                      >
                                        {slot}
                                      </span>
                                    ) : (
                                      <span className="text-gray-400">
                                        {rowIdx === 0 ? "Not specified" : ""}
                                      </span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  );
                })()}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-gray-400">No availability specified</div>
        )}
      </div>
    );
  };

  // Map backend availability to frontend expected fields, supporting multiple time slots per day
  let mappedAvailability:
    | (Availability & { timeSlotsByDay?: Record<string, string[]> })
    | undefined = undefined;
  // Define a type for time slot objects
  type TimeSlotObject = {
    day?: string;
    start?: string;
    end?: string;
  };

  if (service.availability) {
    const { schedule, timeSlots, isAvailableNow } = service.availability;
    // Accept both string and object with day property
    let availableDays: string[] = [];
    if (Array.isArray(schedule) && schedule.length > 0) {
      availableDays = schedule
        .map((s: any) => {
          if (typeof s === "string") return s;
          if (typeof s === "object" && s.day) return s.day;
          return undefined;
        })
        .filter((d): d is string => typeof d === "string");
    }
    // Always initialize all days in timeSlotsByDay, even if no slots
    let timeSlotsByDay: Record<string, string[]> = {};
    availableDays.forEach((day) => {
      timeSlotsByDay[day] = [];
    });
    if (Array.isArray(timeSlots) && timeSlots.length > 0) {
      // Case 1: timeSlots is 1:1 with availableDays (e.g. 7 days, 7 slots)
      if (
        Array.isArray(availableDays) &&
        availableDays.length === timeSlots.length
      ) {
        availableDays.forEach((day, idx) => {
          const slot = timeSlots[idx] as string | TimeSlotObject;
          if (typeof slot === "string") {
            const match = slot.match(/^(\d{2}:\d{2})-(\d{2}:\d{2})$/);
            if (match) {
              const [, start, end] = match;
              timeSlotsByDay[day] = [
                `${formatTime12Hour(start)} - ${formatTime12Hour(end)}`,
              ];
            } else {
              timeSlotsByDay[day] = [formatTime12Hour(slot)];
            }
          } else if (
            slot &&
            typeof slot === "object" &&
            "start" in slot &&
            "end" in slot &&
            slot.start &&
            slot.end
          ) {
            timeSlotsByDay[day] = [
              `${formatTime12Hour(slot.start)} - ${formatTime12Hour(slot.end)}`,
            ];
          }
        });
      } else if (availableDays.length === 1) {
        // All slots go to the only day
        timeSlotsByDay[availableDays[0]] = timeSlots
          .map((slot: string | TimeSlotObject) => {
            if (typeof slot === "string") {
              const match = slot.match(/^(\d{2}:\d{2})-(\d{2}:\d{2})$/);
              if (match) {
                const [, start, end] = match;
                return `${formatTime12Hour(start)} - ${formatTime12Hour(end)}`;
              }
              return formatTime12Hour(slot);
            } else if (
              slot &&
              typeof slot === "object" &&
              "start" in slot &&
              "end" in slot &&
              slot.start &&
              slot.end
            ) {
              return `${formatTime12Hour(slot.start)} - ${formatTime12Hour(slot.end)}`;
            }
            return undefined;
          })
          .filter((r): r is string => typeof r === "string");
      } else {
        // If timeSlots is an array of objects with day property, group by day
        let hasObjectSlots = false;
        timeSlots.forEach((slot: string | TimeSlotObject) => {
          if (
            slot &&
            typeof slot === "object" &&
            "day" in slot &&
            "start" in slot &&
            "end" in slot &&
            slot.day &&
            slot.start &&
            slot.end
          ) {
            hasObjectSlots = true;
            const day = slot.day;
            const range = `${formatTime12Hour(slot.start)} - ${formatTime12Hour(slot.end)}`;
            if (!timeSlotsByDay[day]) timeSlotsByDay[day] = [];
            timeSlotsByDay[day].push(range);
          }
        });
        // If no object slots, treat all as string slots and assign to all days
        if (!hasObjectSlots) {
          availableDays.forEach((day) => {
            timeSlotsByDay[day] = timeSlots
              .map((slot: string | TimeSlotObject) => {
                if (typeof slot === "string") {
                  const match = slot.match(/^(\d{2}:\d{2})-(\d{2}:\d{2})$/);
                  if (match) {
                    const [, start, end] = match;
                    return `${formatTime12Hour(start)} - ${formatTime12Hour(end)}`;
                  }
                  return formatTime12Hour(slot);
                }
                return undefined;
              })
              .filter((r): r is string => typeof r === "string");
          });
        }
      }
    }
    mappedAvailability = {
      isAvailableNow,
      availableDays,
      timeSlotsByDay,
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
          {/* Left Column: Provider Info (Match Service Info Rectangle) */}
          <div className="mt-6 w-full lg:mt-0 lg:w-[400px]">
            <div className="flex h-auto min-h-[220px] flex-col justify-center rounded-3xl border border-blue-100 bg-white/70 p-8 shadow-2xl backdrop-blur-md">
              <div className="flex flex-col items-center gap-2">
                <div className="flex flex-col items-center">
                  <div
                    className="overflow-hidden rounded-full border-4 border-white bg-gradient-to-br from-blue-200 via-white to-blue-100 shadow-xl"
                    style={{
                      width: "96px",
                      height: "96px",
                      minWidth: "96px",
                      minHeight: "96px",
                      maxWidth: "104px",
                      maxHeight: "104px",
                    }}
                  >
                    <img
                      src={providerAvatar || "/../default-provider.svg"}
                      alt={providerName}
                      className="h-full w-full rounded-full object-cover"
                      style={{ borderRadius: "50%" }}
                    />
                  </div>
                  <div className="mt-2 flex items-center">
                    <h2 className="m-0 p-0 text-2xl leading-tight font-extrabold text-gray-900 drop-shadow-sm">
                      {providerName}
                    </h2>
                    {service &&
                      service.availability &&
                      typeof service.availability.isAvailableNow ===
                        "boolean" &&
                      service.availability.isAvailableNow && (
                        <span className="ml-2 inline-block h-4 w-4 rounded-full border-2 border-white bg-green-500 shadow"></span>
                      )}
                  </div>
                </div>
                <div className="mt-1 flex w-full flex-col items-center gap-0">
                  <ReputationScore providerId={service.providerId} />
                  {isVerified === true && (
                    <span className="mt-1 flex items-center rounded-lg bg-blue-50 px-3 py-1 text-sm text-blue-600">
                      <CheckBadgeIcon className="mr-2 h-5 w-5" />
                      <span>This service provider is verified.</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="mt-6 w-full lg:mt-0 lg:w-[400px]">
            <div className="flex h-auto min-h-[220px] flex-col justify-center rounded-3xl border-white bg-white p-8 shadow-2xl">
              <h1 className="mb-2 text-3xl font-extrabold text-gray-900 drop-shadow-sm">
                {name}
              </h1>
              <p className="mb-2 flex items-center gap-2 text-lg font-semibold text-yellow-700">
                <TagIcon className="h-6 w-6 text-yellow-400" />
                {category?.name ?? "General"}
              </p>
              <div className="mb-4 flex items-center text-base text-gray-600">
                <MapPinIcon className="mr-2 h-6 w-6 text-blue-400" />
                <span>{location?.address || "Baguio City"}</span>
              </div>
              <div className="mb-2 flex flex-wrap items-center gap-2 text-base text-gray-600">
                <span className="flex items-center">
                  <StarIcon className="mr-1 h-6 w-6 text-yellow-400" />
                  <span className="text-lg font-bold">
                    {averageRating.toFixed(1)}
                  </span>
                  <span className="ml-1">({reviewCount} reviews)</span>
                </span>
              </div>
            </div>
          </div>
        </div>
        {/* Packages Section */}
        <div className="mt-8 rounded-xl bg-white p-6 shadow-lg">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800">
            <Squares2X2Icon className="h-6 w-6 text-yellow-400" /> Packages
            Offered
          </h3>
          {loadingPackages ? (
            <div className="p-4 text-center text-gray-500">
              Loading packages...
            </div>
          ) : packages.length > 0 ? (
            <div className="flex flex-col gap-4">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="group relative flex flex-col items-stretch overflow-hidden rounded-2xl border border-yellow-300 bg-gradient-to-br from-yellow-50 via-white to-blue-50 p-5 shadow-md transition-all duration-200 hover:scale-[0.98] hover:shadow-xl md:flex-row"
                  style={{ willChange: "transform" }}
                >
                  <div className="flex flex-1 items-center gap-4">
                    {/* Removed package icon here */}
                    <div className="flex min-w-0 flex-1 flex-col">
                      <h4 className="truncate text-lg font-bold text-gray-900">
                        {pkg.title}
                      </h4>
                      <p className="mt-1 text-sm break-words text-gray-600 md:line-clamp-2">
                        {pkg.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 ml-0 flex min-w-[120px] flex-col items-end justify-between md:mt-0 md:ml-6">
                    <span className="rounded-lg border border-blue-200 bg-blue-100 px-4 py-2 text-xl font-extrabold text-blue-700 shadow-sm">
                      ₱
                      {Number(pkg.price).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <span className="absolute top-0 right-0 h-2 w-2 rounded-bl-2xl bg-yellow-300"></span>
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
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          {/* Chat button (Left, less wide) */}
          <button
            onClick={handleChatProviderClick}
            disabled={isOwnService}
            className="flex flex-shrink items-center justify-center rounded-lg bg-gray-100 px-4 py-3 font-bold text-gray-700 shadow-sm transition-colors hover:bg-blue-100 hover:text-blue-700 disabled:cursor-not-allowed disabled:bg-gray-200"
            style={{ minWidth: 0, flexBasis: "32%" }}
          >
            {chatLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-blue-400"></div>
                Creating
              </>
            ) : null}
            <span className="text-base font-semibold">Chat</span>
          </button>

          {/* Book Now button (Right, wider and more prominent) */}
          <div
            className="group relative flex flex-grow justify-end"
            style={{ flexBasis: "68%" }}
          >
            <button
              onClick={handleBookNow}
              disabled={packages.length === 0 || isOwnService}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 px-6 py-3 font-extrabold text-white shadow-lg ring-2 ring-blue-200 transition-all duration-200 hover:from-yellow-400 hover:to-yellow-300 hover:text-blue-900 hover:ring-yellow-200 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-400"
              style={{ fontSize: "1.15rem", letterSpacing: "0.01em" }}
            >
              Book Now
            </button>
            {isOwnService && (
              <div className="absolute right-0 bottom-full mb-2 hidden rounded bg-gray-800 px-3 py-2 text-sm whitespace-nowrap text-white opacity-0 transition-opacity group-hover:block group-hover:opacity-100">
                You can't book your own service
                <div className="absolute top-full right-4 h-0 w-0 border-t-4 border-r-4 border-l-4 border-transparent border-t-gray-800"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default ServiceDetailPage;
