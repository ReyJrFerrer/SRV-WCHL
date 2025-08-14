import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeftIcon,
  ClockIcon,
  UserIcon,
  MapPinIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  CameraIcon,
  CheckCircleIcon,
  PaperAirplaneIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/solid";
import { useProviderBookingManagement } from "../../../hooks/useProviderBookingManagement";
import useChat from "../../../hooks/useChat";
import { useAuth } from "../../../context/AuthContext";

const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const ActiveServicePage: React.FC = () => {
  const navigate = useNavigate();
  const { bookingId } = useParams<{ bookingId: string }>();
  const [searchParams] = useSearchParams();
  const startTimeParam = searchParams.get("startTime");
  const [actualStartTime, setActualStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [uploadedImageName, setUploadedImageName] = useState<string | null>(
    null,
  );
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { getBookingById, loading, error, isProviderAuthenticated } =
    useProviderBookingManagement();

  const { identity } = useAuth();
  const { conversations, createConversation } = useChat();

  const booking = useMemo(() => {
    if (bookingId && typeof bookingId === "string") {
      return getBookingById(bookingId);
    }
    return null;
  }, [bookingId, getBookingById]);

  useEffect(() => {
    if (booking) {
      document.title = `Active Service: ${booking.serviceName || "Service"} | SRV Provider`;
    } else {
      document.title = "Active Service | SRV Provider";
    }
  }, [booking]);

  useEffect(() => {
    if (booking) {
      if (typeof startTimeParam === "string") {
        setActualStartTime(new Date(startTimeParam));
      } else if (booking.scheduledDate) {
        setActualStartTime(new Date(booking.scheduledDate));
      } else {
        setActualStartTime(new Date());
      }
    }
  }, [booking, startTimeParam]);

  useEffect(() => {
    let timerInterval: NodeJS.Timeout;
    if (actualStartTime) {
      timerInterval = setInterval(() => {
        const now = new Date();
        const diffSeconds = Math.floor(
          (now.getTime() - actualStartTime.getTime()) / 1000,
        );
        setElapsedTime(diffSeconds > 0 ? diffSeconds : 0);
      }, 1000);
    }
    return () => clearInterval(timerInterval);
  }, [actualStartTime]);

  const handleMarkCompleted = async () => {
    if (!booking) return;
    navigate(`/provider/complete-service/${booking.id}`);
  };

  const handleUploadEvidence = () => {
    // Trigger the hidden file input
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedImageName(file.name);
      // Reset the input so the same file can be uploaded again if needed
      e.target.value = "";
    }
  };

  const handleContactClient = () => {
    if (booking?.clientPhone) {
      window.open(`tel:${booking.clientPhone}`, "_self");
    } else {
      alert(`Contact client: ${booking?.clientName || "Unknown Client"}`);
    }
  };

  // Chat button handler (patterned after booking detail page)
  const handleChatClient = async () => {
    if (!booking || !identity) return;
    const clientId =
      booking.clientProfile?.id?.toString() || booking.clientId?.toString();
    if (!clientId) {
      alert("Client chat unavailable.");
      return;
    }
    try {
      const currentUserId = identity.getPrincipal().toString();
      // Check for existing conversation
      const existingConversation = conversations.find(
        (conv) =>
          (conv.conversation.providerId === currentUserId &&
            conv.conversation.clientId === clientId) ||
          (conv.conversation.clientId === currentUserId &&
            conv.conversation.providerId === clientId),
      );
      if (existingConversation) {
        navigate(`/provider/chat/${clientId}`, {
          state: {
            conversationId: existingConversation.conversation.id,
            otherUserName: booking.clientName || "Client",
            otherUserImage: booking.clientProfile?.profilePicture?.imageUrl,
          },
        });
      } else {
        // Create new conversation
        const newConversation = await createConversation(
          currentUserId,
          clientId,
        );
        if (newConversation) {
          navigate(`/provider/chat/${clientId}`, {
            state: {
              conversationId: newConversation.id,
              otherUserName: booking.clientName || "Client",
              otherUserImage: booking.clientProfile?.profilePicture?.imageUrl,
            },
          });
        }
      }
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Could not start conversation. Please try again.",
      );
    }
  };

  if (!isProviderAuthenticated()) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 text-center text-red-500">
        Please log in as a service provider to access this page.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 text-center text-red-500">
        Error: {error}
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 text-center text-red-500">
        Booking not found or an error occurred.
      </div>
    );
  }

  if (booking.status !== "InProgress") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 text-center text-orange-500">
        This booking is not currently in progress. Current status:{" "}
        {booking.status}
      </div>
    );
  }

  // --- UI Section ---
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 to-yellow-50">
      <header className="sticky top-0 z-20 bg-white/90 px-4 py-3 shadow-sm backdrop-blur">
        <div className="container mx-auto flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="mr-2 rounded-full p-2 transition-colors hover:bg-gray-100"
            aria-label="Go back"
          >
            <ArrowLeftIcon className="h-5 w-5 text-blue-600" />
          </button>
          <h1 className="truncate text-xl font-extrabold text-black sm:text-2xl">
            Service In Progress
          </h1>
        </div>
      </header>

      <main className="container mx-auto flex-grow space-y-8 p-4 pb-24 sm:p-8">
        {/* Timer Section */}
        <section className="mt-6 flex flex-col items-center justify-center rounded-2xl bg-white p-8 shadow-lg">
          <ClockIcon className="mb-3 h-16 w-16 text-blue-500 sm:h-20 sm:w-20" />
          <p className="text-base font-medium text-gray-500">Elapsed Time</p>
          <p className="text-4xl font-extrabold text-blue-900 tabular-nums sm:text-5xl">
            {formatDuration(elapsedTime)}
          </p>
          {actualStartTime && (
            <p className="mt-2 text-xs text-gray-400">
              Started:{" "}
              {actualStartTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </section>

        {/* Details and Actions Section */}
        <div className="md:flex md:gap-8 lg:gap-12">
          {/* Left Column: Booking Details */}
          <section className="w-full rounded-2xl bg-white p-6 shadow-lg sm:p-8 md:flex-1">
            <h2 className="mb-4 border-b border-blue-100 pb-3 text-xl font-bold text-blue-800 sm:text-2xl">
              Service Details
            </h2>
            <div className="space-y-4 text-base text-gray-700">
              <div className="flex items-center">
                <UserIcon className="mr-3 h-6 w-6 flex-shrink-0 text-blue-400" />
                <span className="font-semibold text-gray-800">
                  {booking.clientName || "Unknown Client"}
                </span>
              </div>
              {booking.clientPhone && (
                <div className="flex items-center">
                  <PhoneIcon className="mr-3 h-6 w-6 flex-shrink-0 text-blue-400" />
                  <a
                    href={`tel:${booking.clientPhone}`}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {booking.clientPhone}
                  </a>
                </div>
              )}
              <div className="flex items-center">
                <CalendarIcon className="mr-3 h-6 w-6 flex-shrink-0 text-blue-400" />
                <span>
                  {booking.scheduledDate
                    ? new Date(booking.scheduledDate).toLocaleString([], {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : new Date(booking.requestedDate).toLocaleString([], {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                </span>
              </div>
              <div className="flex items-start">
                <MapPinIcon className="mt-1 mr-3 h-6 w-6 flex-shrink-0 text-blue-400" />
                <span className="font-medium break-words text-gray-800">
                  {booking.formattedLocation || "Location not specified"}
                </span>
              </div>
              <div className="flex items-center">
                <CurrencyDollarIcon className="mr-3 h-6 w-6 flex-shrink-0 text-blue-400" />
                <span className="font-semibold text-green-700">
                  ₱{Number(booking.price).toFixed(2)}
                </span>
              </div>
            </div>
          </section>

          {/* Right Column: Actions */}
          <section className="mt-8 rounded-2xl bg-white p-6 shadow-lg sm:p-8 md:mt-0 md:w-auto md:max-w-xs lg:w-1/3 xl:w-1/4">
            <h3 className="mb-5 text-lg font-bold text-blue-800 sm:text-xl">
              Actions
            </h3>
            <div className="space-y-4">
              {/* Upload Work Progress Button */}
              <button
                type="button"
                onClick={handleUploadEvidence}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-base font-semibold text-blue-700 transition-colors hover:bg-blue-100"
              >
                <CameraIcon className="h-5 w-5" /> Upload Work Progress
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              {uploadedImageName && (
                <div className="mt-2 flex items-center gap-2 rounded bg-green-50 px-3 py-2 text-sm text-green-700">
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  Image "{uploadedImageName}" uploaded!
                </div>
              )}
              <button
                onClick={handleContactClient}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-base font-semibold text-blue-700 transition-colors hover:bg-blue-100"
              >
                <PaperAirplaneIcon className="h-5 w-5" /> Contact{" "}
                {booking.clientName?.split(" ")[0] || "Client"}
              </button>
              <button
                onClick={handleChatClient}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-base font-semibold text-blue-700 transition-colors hover:bg-blue-100"
              >
                <ChatBubbleLeftRightIcon className="h-5 w-5" /> Chat{" "}
                {booking.clientName?.split(" ")[0] || "Client"}
              </button>
              <button
                onClick={handleMarkCompleted}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-base font-bold text-white transition-colors hover:bg-green-700"
              >
                <CheckCircleIcon className="h-5 w-5" /> Mark as Completed
              </button>
            </div>
          </section>
        </div>
      </main>
      <div className="lg:hidden"></div>
    </div>
  );
};

export default ActiveServicePage;
