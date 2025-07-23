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

type BookingFilterType =
  | "All Types"
  | "Delivery Service"
  | "Beauty and Wellness"
  | "Tutoring"
  | "Photography Services"
  | "Home Services"
  | "Cleaning Services"
  | "Automotive Repair"
  | "Gadget Repair";

const TAB_ITEMS: BookingStatusTab[] = [
  "ALL",
  "PENDING",
  "CONFIRMED",
  "IN PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

const FILTER_TYPES: BookingFilterType[] = [
  "All Types",
  "Delivery Service",
  "Beauty and Wellness",
  "Tutoring",
  "Photography Services",
  "Home Services",
  "Cleaning Services",
  "Automotive Repair",
  "Gadget Repair",
];

const ProviderBookingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryTab = searchParams.get("tab");

  const [activeTab, setActiveTab] = useState<BookingStatusTab>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterType, setFilterType] = useState<BookingFilterType>("All Types");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false); // New state for dropdown visibility

  const dropdownRef = useRef<HTMLDivElement>(null); // Ref for the dropdown to handle clicks outside

  // Use the provider booking management hook
  const {
    bookings,
    loading,
    error,
    refreshing,
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

  // Effect to close the dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Categorize bookings based on the hook's filtering functions
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

  // Calculate counts for each tab
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

  // Main filtered bookings display
  const currentBookings: ProviderEnhancedBooking[] = useMemo(() => {
    let filteredBookings = categorizedBookings[activeTab] || [];

    // Apply service type filter if not "All Types"
    if (filterType !== "All Types") {
      filteredBookings = filteredBookings.filter(
        (booking) =>
          booking.serviceName &&
          booking.serviceName.toLowerCase() === filterType.toLowerCase(),
      );
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
  }, [activeTab, categorizedBookings, searchTerm, filterType]);

  // Handle retry functionality
  const handleRetry = async () => {
    clearError();
    try {
      await refreshBookings();
    } catch (error) {
      console.error("❌ Failed to retry loading bookings:", error);
    }
  };

  // Show authentication error if not authenticated as provider
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

  // Show loading state
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

  // Show error state
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
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white py-4 shadow-sm">
          <div className="flex items-center justify-center">
            {/* The h1 will be hidden on small screens and block on medium and larger screens */}
            <h1 className="hidden text-lg font-semibold text-gray-800 md:block">
              My Bookings
            </h1>
            {/* Placeholder for your logo. You'd typically replace this with an <img> tag. */}
            <div className="md:hidden">
              {/* This is where your logo would go for small screens */}
              <span className="text-lg font-bold text-blue-600">SRV</span>
            </div>
          </div>
        </header>

        {/* Tab Navigation and Filters */}
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
            {/* Filter Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                className="flex items-center rounded-lg border border-gray-300 px-4 py-2 text-gray-600 hover:bg-gray-50 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="mr-1 h-5 w-5" // Removed mr-1 for small screens to center icon
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01.293.707L19 13v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6l-2.293-2.293A1 1 0 0110 6.586V4a1 1 0 011-1h16a1 1 0 011 1z"
                  />
                </svg>
                {/* Text for the filter button - hidden on small, block on medium+ */}
                <span className="hidden md:inline">{filterType}</span>
                <svg
                  className={`-mr-0.5 ml-2 h-4 w-4 transform transition-transform ${isDropdownOpen ? "rotate-180" : "rotate-0"} md:ml-2`}
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
              {isDropdownOpen && (
                <div className="ring-opacity-5 absolute right-0 z-50 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black focus:outline-none">
                  <div
                    className="py-1"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="options-menu"
                  >
                    {FILTER_TYPES.map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          setFilterType(type);
                          setIsDropdownOpen(false);
                        }}
                        className={`${
                          filterType === type
                            ? "bg-blue-100 text-blue-900"
                            : "text-gray-700"
                        } block w-full px-4 py-2 text-left text-sm hover:bg-gray-100`}
                        role="menuitem"
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Centering the tabs */}
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
                  className={`w-full ${activeTab === "IN PROGRESS" ? "cursor-pointer transition-shadow hover:shadow-lg" : ""}`}
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
