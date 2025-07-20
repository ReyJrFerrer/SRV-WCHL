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
} from "@heroicons/react/24/solid";

import BottomNavigation from "../../../components/provider/BottomNavigation";
import { useProviderBookingManagement } from "../../../hooks/useProviderBookingManagement";

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

  // Use the enhanced hook instead of mock data
  const { getBookingById, loading, error, isProviderAuthenticated } =
    useProviderBookingManagement();

  // Get booking data from hook
  const booking = useMemo(() => {
    if (bookingId && typeof bookingId === "string") {
      return getBookingById(bookingId);
    }
    return null;
  }, [bookingId, getBookingById]);

  // Set document title
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

    // Just redirect to the complete service page without calling completeBookingById
    // The actual completion will be handled in the complete-service page
    navigate(`/provider/complete-service/${booking.id}`);
  };

  const handleUploadEvidence = () => {
    alert("Upload evidence functionality to be implemented.");
  };

  const handleContactClient = () => {
    if (booking?.clientPhone) {
      window.open(`tel:${booking.clientPhone}`, "_self");
    } else {
      alert(`Contact client: ${booking?.clientName || "Unknown Client"}`);
    }
  };

  // Check authentication
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

  // Ensure booking is in the correct status for active service
  if (booking.status !== "InProgress") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 text-center text-orange-500">
        This booking is not currently in progress. Current status:{" "}
        {booking.status}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-100">
      <header className="sticky top-0 z-20 bg-white px-4 py-3 shadow-sm">
        <div className="container mx-auto flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="mr-2 rounded-full p-2 transition-colors hover:bg-gray-100"
            aria-label="Go back"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-700" />
          </button>
          <h1 className="truncate text-xl font-semibold text-gray-800">
            Service In Progress
          </h1>
        </div>
      </header>

      <main className="container mx-auto flex-grow space-y-6 p-4 pb-20 sm:p-6">
        {/* Timer Section - Prominent at the top */}
        <section className="rounded-xl bg-white p-6 text-center shadow-lg">
          <ClockIcon className="mx-auto mb-2 h-12 w-12 text-blue-500 sm:h-16" />
          <p className="text-sm text-gray-500">Elapsed Time</p>
          <p className="text-3xl font-bold text-gray-800 tabular-nums sm:text-4xl">
            {formatDuration(elapsedTime)}
          </p>
          {actualStartTime && (
            <p className="mt-1 text-xs text-gray-400">
              Started:{" "}
              {actualStartTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </section>

        {/* Details and Actions Section - Becomes two-column on wider screens */}
        <div className="md:flex md:gap-6 lg:gap-8">
          {/* Left Column: Booking Details */}
          <section className="w-full rounded-xl bg-white p-4 shadow-lg sm:p-6 md:flex-1">
            <h2 className="mb-3 border-b border-gray-200 pb-2 text-lg font-semibold text-gray-800 sm:text-xl">
              {booking.serviceName || "Service"}
            </h2>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-center">
                <UserIcon className="mr-2.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                Client:{" "}
                <span className="ml-1 font-medium text-gray-800">
                  {booking.clientName || "Unknown Client"}
                </span>
              </div>
              {booking.clientPhone && (
                <div className="flex items-center">
                  <PhoneIcon className="mr-2.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                  Contact:{" "}
                  <a
                    href={`tel:${booking.clientPhone}`}
                    className="ml-1 font-medium text-blue-600 hover:underline"
                  >
                    {booking.clientPhone}
                  </a>
                </div>
              )}
              <div className="flex items-center">
                <CalendarIcon className="mr-2.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                Scheduled:{" "}
                <span className="ml-1 font-medium text-gray-800">
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
                <MapPinIcon className="mt-0.5 mr-2.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                Location:{" "}
                <span className="ml-1 font-medium break-words text-gray-800">
                  {booking.formattedLocation || "Location not specified"}
                </span>
              </div>
              <div className="flex items-center">
                <CurrencyDollarIcon className="mr-2.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                Price:{" "}
                <span className="ml-1 font-medium text-green-600">
                  ₱{Number(booking.price).toFixed(2)}
                </span>
              </div>
            </div>
          </section>

          {/* Right Column: Actions */}
          <section className="mt-6 rounded-xl bg-white p-4 shadow-lg sm:p-6 md:mt-0 md:w-auto md:max-w-xs lg:w-1/3 xl:w-1/4">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 sm:text-xl">
              Actions
            </h3>
            <div className="space-y-3">
              <button
                onClick={handleUploadEvidence}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                <CameraIcon className="h-5 w-5" /> Upload Evidence
              </button>
              <button
                onClick={handleContactClient}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                <PaperAirplaneIcon className="h-5 w-5" /> Contact Client
              </button>
              <button
                onClick={handleMarkCompleted}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700"
              >
                <CheckCircleIcon className="h-5 w-5" /> Mark as Completed
              </button>
            </div>
          </section>
        </div>
      </main>
      <div className="lg:hidden">
        {" "}
        <BottomNavigation />{" "}
      </div>
    </div>
  );
};

export default ActiveServicePage;
