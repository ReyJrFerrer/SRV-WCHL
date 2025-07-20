import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import BottomNavigationNextjs from "../../../components/client/BottomNavigation";
import ClientBookingItemCard from "../../../components/client/ClientBookingItemCard";
import {
  useBookingManagement,
} from "../../../hooks/bookingManagement";
import {
  ArrowLeftIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/solid";

type BookingStatusTab =
  | "ALL"
  | "PENDING"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";
const TAB_ITEMS: BookingStatusTab[] = [
  "ALL",
  "PENDING",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

const MyBookingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryTab = searchParams.get("tab");
  const bookingManagement = useBookingManagement();

  const [activeTab, setActiveTab] = useState<BookingStatusTab>("ALL");

  // Set document title
  useEffect(() => {
    document.title = "My Bookings - SRV";
  }, []);

  useEffect(() => {
    let targetTab: BookingStatusTab = "ALL";
    let shouldRedirect = false;
    let redirectTabQuery = "all";

    if (queryTab) {
      const upperCaseQueryTab = queryTab.toUpperCase() as BookingStatusTab;
      if (TAB_ITEMS.includes(upperCaseQueryTab)) {
        targetTab = upperCaseQueryTab;
      } else {
        shouldRedirect = true;
      }
    }

    if (activeTab !== targetTab) {
      setActiveTab(targetTab);
    }

    if (shouldRedirect && queryTab !== redirectTabQuery) {
      setSearchParams({ tab: redirectTabQuery });
    }
  }, [queryTab, setSearchParams, activeTab]);

  // Filter bookings based on active tab
  const filteredBookings = useMemo(() => {
    if (!Array.isArray(bookingManagement.bookings)) {
      console.error(
        "bookingManagement.bookings is not an array!",
        bookingManagement.bookings,
      );
      return [];
    }

    const validBookings = bookingManagement.bookings.filter((booking) => {
      if (!booking) {
        console.warn(
          "Undefined/null booking object found in bookings and removed before tab filtering.",
        );
        return false;
      }
      if (typeof booking.status !== "string") {
        console.warn(
          "Booking object missing or has invalid status, removed before tab filtering:",
          booking,
        );
        return false;
      }
      return true;
    });

    if (activeTab === "ALL") {
      return validBookings;
    }

    // Map tab names to booking status values to match your booking management hook
    const statusMapping: Record<BookingStatusTab, string[]> = {
      ALL: [],
      PENDING: ["Requested", "Pending"],
      CONFIRMED: ["Accepted", "Confirmed"],
      IN_PROGRESS: ["InProgress", "In_Progress"],
      COMPLETED: ["Completed"],
      CANCELLED: ["Cancelled", "Declined"],
    };

    const statusesToMatch = statusMapping[activeTab] || [];
    return validBookings.filter((booking) =>
      statusesToMatch.some(
        (status) => booking.status.toLowerCase() === status.toLowerCase(),
      ),
    );
  }, [activeTab, bookingManagement.bookings]);

  // Get bookings count for each tab
  const getBookingCountForTab = (tab: BookingStatusTab) => {
    if (!bookingManagement.bookings) return 0;
    if (tab === "ALL") return bookingManagement.bookings.length;

    const statusMapping: Record<BookingStatusTab, string[]> = {
      ALL: [],
      PENDING: ["Requested", "Pending"],
      CONFIRMED: ["Accepted", "Confirmed"],
      IN_PROGRESS: ["InProgress", "In_Progress"],
      COMPLETED: ["Completed"],
      CANCELLED: ["Cancelled", "Declined"],
    };

    const statusesToMatch = statusMapping[tab] || [];
    return bookingManagement.bookings.filter(
      (booking) =>
        booking.status &&
        statusesToMatch.some(
          (status) => booking.status.toLowerCase() === status.toLowerCase(),
        ),
    ).length;
  };

  // Handle cancel booking
  const handleCancelBookingOnListPage = async (bookingId: string) => {
    if (window.confirm("Are you sure you want to cancel this booking?")) {
      try {
        await bookingManagement.updateBookingStatus(bookingId, "Cancelled");
        alert(`Booking ${bookingId} has been cancelled successfully.`);
      } catch (error) {
        console.error("Error cancelling booking:", error);
        alert("Failed to cancel booking. Please try again.");
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-100">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white px-4 py-3 shadow-sm">
          <div className="container mx-auto flex items-center">
            <button
              onClick={() => navigate("/client/home")}
              className="mr-2 rounded-full p-2 transition-colors hover:bg-gray-100 md:hidden"
              aria-label="Back to Home"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-700" />
            </button>
            <h1 className="flex-grow text-center text-xl font-semibold text-slate-800 md:text-left">
              Aking Bookings
            </h1>
          </div>
        </header>

        {/* Tabs */}
        <div className="booking-tabs sticky top-[57px] z-10 overflow-x-auto border-b border-gray-200 bg-white whitespace-nowrap" style={{
          msOverflowStyle: 'none',
          scrollbarWidth: 'none'
        }}>
          <style>
            {`
              .booking-tabs::-webkit-scrollbar {
                display: none;
              }
            `}
          </style>
          <nav className="flex justify-start space-x-1 p-1.5 sm:justify-around sm:p-2">
            {TAB_ITEMS.map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setSearchParams({ tab: tab.toLowerCase() });
                }}
                className={`flex-shrink-0 rounded-md px-3 py-2 text-xs font-medium transition-colors duration-150 sm:text-sm ${
                  activeTab === tab
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-500 hover:bg-gray-200 hover:text-slate-700"
                }`}
              >
                {tab.replace("_", " ")} ({getBookingCountForTab(tab)})
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <main className="container mx-auto flex-grow p-3 pb-20 sm:p-4">
          {bookingManagement.loading ? (
            <div className="py-16 text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-500">
                Niloload ang iyong mga bookings...
              </p>
            </div>
          ) : bookingManagement.error ? (
            <div className="mt-4 rounded-lg bg-white py-16 text-center shadow">
              <ExclamationTriangleIcon className="mx-auto mb-4 h-16 w-16 text-red-300" />
              <p className="mb-4 text-lg text-red-500">
                {bookingManagement.error}
              </p>
              <button
                onClick={() => bookingManagement.retryOperation("loadBookings")}
                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Ulitin
              </button>
            </div>
          ) : filteredBookings.length > 0 ? (
            <div className="space-y-4 md:space-y-6">
              {filteredBookings.map((booking) => (
                <ClientBookingItemCard
                  key={booking.id}
                  booking={booking}
                  onCancelBooking={handleCancelBookingOnListPage}
                />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-lg bg-white py-16 text-center shadow">
              <ClipboardDocumentListIcon className="mx-auto mb-4 h-16 w-16 text-gray-300" />
              <p className="text-lg text-gray-500">
                Walang booking na nahanap sa kategoryang: "
                {activeTab.replace("_", " ")}" .
              </p>
            </div>
          )}
        </main>

      {/* Bottom Navigation */}
      <BottomNavigationNextjs />
    </div>
  );
};export default MyBookingsPage;
