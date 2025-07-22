import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  PrinterIcon,
  ArrowUturnLeftIcon,
  ShareIcon,
} from "@heroicons/react/24/solid";
import {
  useBookingManagement,
  EnhancedBooking,
} from "../../../../hooks/bookingManagement"; // Adjust path as needed

const ReceiptPage: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // Get booking ID from URL
  const [booking, setBooking] = useState<EnhancedBooking | null>(null);

  const { bookings, loading: bookingLoading } = useBookingManagement();

  // Set the document title
  useEffect(() => {
    document.title = "Booking Receipt | SRV-APP";
  }, []);

  // Find the specific booking from the list once bookings are loaded
  useEffect(() => {
    if (id && typeof id === "string" && !bookingLoading) {
      const foundBooking = bookings.find((b) => b.id === id);
      setBooking(foundBooking || null);
    }
  }, [id, bookings, bookingLoading]);

  // Share functionality using the Web Share API
  const handleShare = async () => {
    if (booking && navigator.share) {
      try {
        await navigator.share({
          title: "Booking Receipt",
          text: `Here is my receipt for the service: ${booking.serviceName}. Booking ID: ${booking.id}`,
          url: window.location.href,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      // Fallback for browsers that do not support the Share API
      // NOTE: alert() is blocking. Consider a custom toast notification.
      alert(
        "Share feature is not supported on your browser. You can copy the URL to share.",
      );
    }
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

  const amountPaid = booking?.price || 0;
  const changeGiven = 0;

  if (bookingLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4 text-center">
        <h1 className="mb-4 text-2xl font-bold text-red-600">
          Booking Not Found
        </h1>
        <Link
          to="/client/booking"
          className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700"
        >
          Back to My Bookings
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4 sm:p-6">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        {/* Receipt Header */}
        <div className="mb-8 text-center">
          <img
            src="/images/external logo/ConfirmationPageLogo.svg"
            alt="Confirmation"
            className="mx-auto mb-4 h-20 w-20"
          />
          <h1 className="text-3xl font-bold text-gray-800">
            Service is complete!
          </h1>
          <p className="text-gray-500">
            Thank you for using SRV, until the next SRVice!
          </p>
        </div>

        {/* Booking Details */}
        <div className="mb-6 border-b border-dashed border-gray-300 pb-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-bold text-gray-600">Booking ID:</span>
            <span className="font-mono text-gray-800">{booking.id}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-600">Date Completed:</span>
            <span className="text-gray-800">
              {formatDate(booking.updatedAt)}
            </span>
          </div>
        </div>

        {/* Service and People Details */}
        <div className="mb-6 border-b border-dashed border-gray-300 pb-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="mb-1 font-bold text-gray-600">Service</p>
            <p className="text-gray-900">
              {booking.serviceName} - {booking.packageName}
            </p>
          </div>
          <div className="mb-3 flex items-center justify-between">
            <span className="font-bold text-gray-600">Provider:</span>
            <span className="text-gray-800">
              {booking.providerProfile?.name || "N/A"}
            </span>
          </div>
        </div>

        {/* Payment Summary */}
        <div>
          <h2 className="mb-4 text-lg font-bold text-gray-800">
            Payment Summary
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="font-bold text-gray-600">Service Total:</span>
              <span className="text-gray-800">
                ₱{booking.price?.toFixed(2) || "0.00"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-gray-600">Amount Paid:</span>
              <span className="text-gray-800">₱{amountPaid.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-gray-600">Change:</span>
              <span className="text-gray-800">₱{changeGiven.toFixed(2)}</span>
            </div>
            <div className="mt-3 flex justify-between border-t border-gray-300 pt-3">
              <span className="text-xl font-bold text-gray-900">
                Total Paid
              </span>
              <span className="text-xl font-bold text-green-600">
                ₱{amountPaid.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex w-full max-w-md flex-col gap-3 sm:flex-row-reverse">
        <Link
          to="/client/booking"
          className="flex w-full flex-1 items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-center font-semibold text-white transition-colors hover:bg-blue-700"
        >
          <ArrowUturnLeftIcon className="mr-2 h-5 w-5" /> Done
        </Link>
        <button
          onClick={handleShare}
          className="flex w-full flex-1 items-center justify-center rounded-lg bg-gray-200 px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-300"
        >
          <ShareIcon className="mr-2 h-5 w-5" /> Share
        </button>
        <button
          onClick={() => window.print()}
          className="flex w-full flex-1 items-center justify-center rounded-lg bg-gray-200 px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-300"
        >
          <PrinterIcon className="mr-2 h-5 w-5" /> Print
        </button>
      </div>
    </div>
  );
};

export default ReceiptPage;
