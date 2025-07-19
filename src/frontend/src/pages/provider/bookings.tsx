import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import BottomNavigation from "../../components/provider/BottomNavigationNextjs";
import ProviderBookingItemCard from "../../components/provider/ProviderBookingItemCard";
import {
  useProviderBookingManagement,
  ProviderEnhancedBooking,
} from "../../hooks/useProviderBookingManagement";

type BookingStatusTab =
  | "Pending"
  | "Upcoming"
  | "Completed"
  | "Cancelled"
  | "InProgress";
const TAB_ITEMS: BookingStatusTab[] = [
  "Pending",
  "Upcoming",
  "InProgress",
  "Completed",
  "Cancelled",
];

const ProviderBookingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { tab: queryTab } = navigate.query;

  const [activeTab, setActiveTab] = useState<BookingStatusTab>("Pending");

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
      setActiveTab("Pending");
    }
  }, [queryTab]);

  // Categorize bookings based on the hook's filtering functions
  const categorizedBookings = useMemo(() => {
    // Combine cancelled and declined bookings in the cancelled tab
    const cancelledBookings = getBookingsByStatus("Cancelled");
    const declinedBookings = getBookingsByStatus("Declined");
    const combinedCancelledBookings = [
      ...cancelledBookings,
      ...declinedBookings,
    ];

    return {
      Pending: getPendingBookings(),
      Upcoming: getUpcomingBookings(),
      Completed: getCompletedBookings(),
      Cancelled: combinedCancelledBookings, // Include both cancelled and declined
      InProgress: bookings.filter((booking) => booking.status === "InProgress"),
    };
  }, [
    getPendingBookings,
    getUpcomingBookings,
    getCompletedBookings,
    getBookingsByStatus,
    bookings,
  ]);

  const currentBookings: ProviderEnhancedBooking[] =
    categorizedBookings[activeTab] || [];

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
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Hala!</h1>
          <p className="mb-4 text-gray-600">
            Kailangan mong nakalogin bilang isang tagapagbigay serbisyo upang
            magpatuloy
          </p>
          <button
            onClick={() => navigate("/provider/login")}
            className="rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
          >
            Balik sa Login
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
          <p className="text-gray-600">Niloload ang iyong mga bookings...</p>
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
            Hindi maload ang mga bookings
          </h1>
          <p className="mb-4 text-gray-600">{error}</p>
          <div className="space-x-3">
            <button
              onClick={() => navigate("/provider/dashboard")}
              className="rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
            >
              Balik sa Dashboard
            </button>
            <button
              onClick={handleRetry}
              className="rounded-lg bg-gray-300 px-6 py-2 text-gray-700 transition-colors hover:bg-gray-400"
            >
              Ulitin
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-screen flex-col bg-gray-100">
        {/* Error Display */}
        {error && (
          <div className="mx-4 mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-sm text-red-600">{error}</span>
              </div>
              <button
                onClick={clearError}
                className="text-sm font-medium text-red-600 hover:text-red-800"
              >
                Isara
              </button>
            </div>
          </div>
        )}

        {/* Refresh indicator */}
        {refreshing && (
          <div className="mx-4 mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <div className="flex items-center">
              <div className="mr-3 h-4 w-4 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <span className="text-sm text-blue-600">
                Nirerefresh ang mga bookings...
              </span>
            </div>
          </div>
        )}

        <header className="sticky top-0 z-20 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-800">
              Aking Bookings
            </h1>
            <button
              onClick={refreshBookings}
              disabled={refreshing}
              className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
              title="Refresh bookings"
            >
              <svg
                className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
        </header>

        <div className="sticky top-[73px] z-10 border-b border-gray-200 bg-white">
          <nav className="flex justify-around space-x-1 p-1 sm:space-x-2 sm:p-2">
            {TAB_ITEMS.map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                }}
                className={`flex-grow rounded-md px-3 py-2 text-center text-xs font-medium transition-colors sm:text-sm ${
                  activeTab === tab
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                }`}
              >
                {tab} ({categorizedBookings[tab]?.length || 0})
              </button>
            ))}
          </nav>
        </div>

        <main className="flex-grow overflow-y-auto pb-20">
          {currentBookings.length > 0 ? (
            <div className="space-y-4 p-4">
              {currentBookings.map((booking) => (
                <div
                  key={booking.id}
                  onClick={() => {
                    // If it's an InProgress booking, navigate to active service page
                    if (
                      activeTab === "InProgress" &&
                      booking.status === "InProgress"
                    ) {
                      navigate(`/provider/active-service/${booking.id}`);
                    }
                  }}
                  className={`w-full ${activeTab === "InProgress" ? "cursor-pointer transition-shadow hover:shadow-lg" : ""}`}
                >
                  <ProviderBookingItemCard booking={booking} />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <div className="mb-4">
                {activeTab === "Pending" && (
                  <div className="mb-4 text-6xl">⏳</div>
                )}
                {activeTab === "Upcoming" && (
                  <div className="mb-4 text-6xl">📅</div>
                )}
                {activeTab === "Completed" && (
                  <div className="mb-4 text-6xl">✅</div>
                )}
                {activeTab === "Cancelled" && (
                  <div className="mb-4 text-6xl">❌</div>
                )}
                {activeTab === "InProgress" && (
                  <div className="mb-4 text-6xl">🔄</div>
                )}
              </div>
              <h3 className="mb-2 text-lg font-medium text-gray-900">
                Walang {activeTab.toLowerCase()} bookings
              </h3>
              <p className="mb-6 text-gray-500">
                {activeTab === "Pending" &&
                  "Wala kang naghihintay na booking request."}
                {activeTab === "Upcoming" &&
                  "Wala kang mga nalalapit na kumpirmadong booking."}
                {activeTab === "Completed" &&
                  "Wala ka pang natapos na booking."}
                {activeTab === "Cancelled" &&
                  "Wala kang mga nakanselang o tinanggihang booking."}
                {activeTab === "InProgress" &&
                  "Wala kang mga booking na kasalukuyang isinasagawa."}
              </p>
              {activeTab === "Pending" && (
                <p className="text-sm text-gray-400">
                  Ang mga bagong booking requests ay magpapakita dito kapag
                  nagbook na sila.
                </p>
              )}
              {activeTab === "Cancelled" && (
                <p className="text-sm text-gray-400">
                  Ang booking na ito ay kinansela ng kliyente o tinanggihan mo
                  ay magpapakita dito.
                </p>
              )}
            </div>
          )}
        </main>
        <BottomNavigation />
      </div>
    </>
  );
};

export default ProviderBookingsPage;
