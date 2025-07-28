import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import BottomNavigation from "../../components/provider/BottomNavigation";
import ProviderBookingItemCard from "../../components/provider/ProviderBookingItemCard";
import {
  useProviderBookingManagement,
  ProviderEnhancedBooking,
} from "../../hooks/useProviderBookingManagement";

type BookingStatusTab =
  | "ALL"
  | "PENDING"
  | "CONFIRMED"
  | "IN PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

// Filter for "Same Day" or "Scheduled" booking types
type BookingTimingFilter = "All" | "Same Day" | "Scheduled";

const TAB_ITEMS: BookingStatusTab[] = [
  "ALL",
  "PENDING",
  "CONFIRMED",
  "IN PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

// Options for the timing filter
const TIMING_FILTERS: BookingTimingFilter[] = ["All", "Same Day", "Scheduled"];

const ProviderBookingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryTab = searchParams.get("tab");

  const [activeTab, setActiveTab] = useState<BookingStatusTab>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [timingFilter, setTimingFilter] = useState<BookingTimingFilter>("All");
  const [isTimingDropdownOpen, setIsTimingDropdownOpen] =
    useState<boolean>(false);

  const timingDropdownRef = useRef<HTMLDivElement>(null);

  const {
    bookings,
    loading,
    error,
    getPendingBookings,
    getUpcomingBookings,
    getCompletedBookings,
    getBookingsByStatus,
    clearError,
    refreshBookings,
    isProviderAuthenticated,
  } = useProviderBookingManagement();

  useEffect(() => {
    if (
      typeof queryTab === "string" &&
      TAB_ITEMS.includes(queryTab as BookingStatusTab)
    ) {
      setActiveTab(queryTab as BookingStatusTab);
    } else if (!queryTab) {
      setActiveTab("ALL");
    }
  }, [queryTab]);

  useEffect(() => {
    document.title = "My Bookings | SRV Provider";
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        timingDropdownRef.current &&
        !timingDropdownRef.current.contains(event.target as Node)
      ) {
        setIsTimingDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const categorizedBookings = useMemo(() => {
    const cancelledBookings = getBookingsByStatus("Cancelled");
    const declinedBookings = getBookingsByStatus("Declined");
    const combinedCancelledBookings = [
      ...cancelledBookings,
      ...declinedBookings,
    ];

    const allBookings = bookings;

    return {
      ALL: allBookings,
      PENDING: getPendingBookings(),
      CONFIRMED: getUpcomingBookings(),
      COMPLETED: getCompletedBookings(),
      CANCELLED: combinedCancelledBookings,
      "IN PROGRESS": bookings.filter(
        (booking) => booking.status === "InProgress",
      ),
    };
  }, [
    getPendingBookings,
    getUpcomingBookings,
    getCompletedBookings,
    getBookingsByStatus,
    bookings,
  ]);

  const tabCounts = useMemo(() => {
    return {
      ALL: categorizedBookings.ALL.length,
      PENDING: categorizedBookings.PENDING.length,
      CONFIRMED: categorizedBookings.CONFIRMED.length,
      "IN PROGRESS": categorizedBookings["IN PROGRESS"].length,
      COMPLETED: categorizedBookings.COMPLETED.length,
      CANCELLED: categorizedBookings.CANCELLED.length,
    };
  }, [categorizedBookings]);

  const currentBookings: ProviderEnhancedBooking[] = useMemo(() => {
    let filteredBookings = categorizedBookings[activeTab] || [];

    // --- MODIFICATION HERE ---
    // If 'startTime' does not exist, we need to use an alternative property
    // that represents the booking's date/time for filtering.
    // Let's assume there's a 'bookingDate' or 'scheduledDate' property,
    // or if not, we might need to introduce one in your ProviderEnhancedBooking type
    // or infer it from another property.

    // For this example, I'll assume a property named `scheduledDateTime`
    // which contains a string that can be parsed by `new Date()`.
    // If you have a different property, replace `booking.scheduledDateTime`
    // with the correct property name.
    if (timingFilter !== "All") {
      filteredBookings = filteredBookings.filter((booking) => {
        // IMPORTANT: Replace 'booking.scheduledDateTime' with the actual property
        // that holds the date/time information for your bookings.
        // If no such property exists, this timing filter cannot work as intended.
        const dateString = (booking as any).scheduledDateTime || (booking as any).createdAt; // Placeholder for actual date property
        // Using 'any' as a temporary workaround if the type doesn't include it.
        // The ideal fix is to update `ProviderEnhancedBooking` type definition.

        if (!dateString) {
          console.warn(
            `Booking ${booking.id} is missing a valid date property (e.g., scheduledDateTime), skipping timing filter.`,
          );
          return false;
        }

        const bookingDate = new Date(dateString);

        // Check if bookingDate is valid before proceeding
        if (isNaN(bookingDate.getTime())) {
          console.warn(
            `Booking ${booking.id} has an invalid date string: ${dateString}`,
          );
          return false;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize today's date to start of day

        const isSameDay =
          bookingDate.getDate() === today.getDate() &&
          bookingDate.getMonth() === today.getMonth() &&
          bookingDate.getFullYear() === today.getFullYear();

        return timingFilter === "Same Day" ? isSameDay : !isSameDay;
      });
    }

    // Apply search term filter
    if (searchTerm) {
      filteredBookings = filteredBookings.filter(
        (booking) =>
          (booking.serviceName &&
            booking.serviceName
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          booking.clientName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          booking.id.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    return filteredBookings;
  }, [activeTab, categorizedBookings, searchTerm, timingFilter]);

  const handleRetry = async () => {
    clearError();
    try {
      await refreshBookings();
    } catch (error) {
      console.error("❌ Failed to retry loading bookings:", error);
    }
  };

  if (!isProviderAuthenticated() && !loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Oops!</h1>
          <p className="mb-4 text-gray-600">
            You need to be logged in as service provider to continue.
          </p>
          <button
            onClick={() => navigate("/provider/login")}
            className="rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading Bookings...</p>
        </div>
      </div>
    );
  }

  if (error && bookings.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            Unable to load bookings
          </h1>
          <p className="mb-4 text-gray-600">{error}</p>
          <div className="space-x-3">
            <button
              onClick={() => navigate("/provider/dashboard")}
              className="rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
            >
              Back to Dashboard
            </button>
            <button
              onClick={handleRetry}
              className="rounded-lg bg-gray-300 px-6 py-2 text-gray-700 transition-colors hover:bg-gray-400"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-screen flex-col bg-gray-100">
        <header className="sticky top-0 z-20 bg-white py-4 shadow-sm">
          <div className="flex items-center justify-center">
            <h1 className="hidden text-lg font-semibold text-gray-800 md:block">
              My Bookings
            </h1>
            <div className="md:hidden">
              <span className="text-lg font-bold text-blue-600">SRV</span>
            </div>
          </div>
        </header>

        <div className="sticky top-[64px] z-10 bg-white px-4 pt-4 pb-2">
          <div className="mb-4 flex items-center justify-between">
            <div className="relative mr-2 flex-grow">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search bookings..."
                className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {/* Timing Filter Dropdown */}
            <div className="relative" ref={timingDropdownRef}>
              <button
                className="flex items-center rounded-lg border border-gray-300 px-4 py-2 text-gray-600 hover:bg-gray-50 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                onClick={() => setIsTimingDropdownOpen(!isTimingDropdownOpen)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="mr-1 h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h.01M12 11h.01M15 11h.01M7 16h.01M12 16h.01M15 16h.01M7 21h.01M12 21h.01M15 21h.01M3 9h18c.552 0 1-.448 1-1V5c0-.552-.448-1-1-1H3c-.552 0-1 .448-1 1v3c0 .552.448 1 1 1zM2 13h20c.552 0 1-.448 1-1V9c0-.552-.448-1-1-1H2c-.552 0-1 .448-1 1v3c0 .552.448 1 1 1z"
                  />
                </svg>
                <span className="hidden md:inline">{timingFilter}</span>
                <svg
                  className={`-mr-0.5 ml-2 h-4 w-4 transform transition-transform ${isTimingDropdownOpen ? "rotate-180" : "rotate-0"} md:ml-2`}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              {isTimingDropdownOpen && (
                <div className="ring-opacity-5 absolute right-0 z-50 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black focus:outline-none">
                  <div
                    className="py-1"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="options-menu"
                  >
                    {TIMING_FILTERS.map((filter) => (
                      <button
                        key={filter}
                        onClick={() => {
                          setTimingFilter(filter);
                          setIsTimingDropdownOpen(false);
                        }}
                        className={`${
                          timingFilter === filter
                            ? "bg-blue-100 text-blue-900"
                            : "text-gray-700"
                        } block w-full px-4 py-2 text-left text-sm hover:bg-gray-100`}
                        role="menuitem"
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-center overflow-x-auto">
            <nav className="flex space-x-2 pb-2 text-sm">
              {TAB_ITEMS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                  }}
                  className={`flex-shrink-0 rounded-full px-4 py-2 text-center font-medium transition-colors ${
                    activeTab === tab
                      ? "bg-blue-600 text-white"
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  }`}
                >
                  {tab} ({tabCounts[tab as keyof typeof tabCounts]})
                </button>
              ))}
            </nav>
          </div>
        </div>

        <main className="flex-grow overflow-y-auto pb-20">
          {currentBookings.length > 0 ? (
            <div className="space-y-4 px-4 py-4">
              {currentBookings.map((booking) => (
                <div
                  key={booking.id}
                  onClick={() => {
                    if (
                      activeTab === "IN PROGRESS" &&
                      booking.status === "InProgress"
                    ) {
                      navigate(`/provider/active-service/${booking.id}`);
                    }
                  }}
                  className={`w-full ${
                    activeTab === "IN PROGRESS"
                      ? "cursor-pointer transition-shadow hover:shadow-lg"
                      : ""
                  }`}
                >
                  <ProviderBookingItemCard booking={booking} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-[calc(100vh-250px)] flex-col items-center justify-center px-4 py-16 text-center">
              <div className="mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="mx-auto h-24 w-24 text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
              </div>
              <p className="text-lg text-gray-500">
                No bookings found with the current filters.
              </p>
            </div>
          )}
        </main>
        <BottomNavigation />
      </div>
    </>
  );
};

export default ProviderBookingsPage;