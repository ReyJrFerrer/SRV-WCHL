import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import {
  ArrowLeftIcon,
  PrinterIcon,
  ShareIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/solid";
import {
  useProviderBookingManagement,
  ProviderEnhancedBooking,
} from "../../../hooks/useProviderBookingManagement";

const ReceiptPage: React.FC = () => {
  const router = useRouter();
  const { bookingId, price, paid, change, method } = router.query;

  // Payment details from query params
  const serviceTotal = typeof price === "string" ? parseFloat(price) : 0;
  const amountPaid = typeof paid === "string" ? parseFloat(paid) : 0;
  const changeGiven = typeof change === "string" ? parseFloat(change) : 0;
  const paymentMethod = typeof method === "string" ? method : "N/A";

  // Use the enhanced hook instead of mock data
  const {
    getBookingById,
    loading,
    error: hookError,
    isProviderAuthenticated,
  } = useProviderBookingManagement();

  // Get booking data from hook
  const booking = useMemo(() => {
    if (bookingId && typeof bookingId === "string") {
      return getBookingById(bookingId);
    }
    return null;
  }, [bookingId, getBookingById]);

  const handleDone = () => {
    router.push("/provider/bookings?tab=Completed"); // Or provider home
  };

  const handlePrint = () => {
    // Basic browser print
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `Receipt for ${booking?.serviceName}`,
          text: `Service completed for ${booking?.clientName}. Amount Paid: ₱${amountPaid.toFixed(2)}`,
          url: window.location.href, // Share current page URL
        })
        .catch(console.error);
    } else {
      alert("Web Share API not supported. You can copy the URL.");
    }
  };

  // Check authentication
  if (!isProviderAuthenticated()) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 text-center text-red-500">
        Maglogin bilang service provider upang makita ang page na ito.
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

  if (!booking) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 text-center text-red-500">
        Booking details for receipt not found.
      </div>
    );
  }

  const completionTime = booking.completedDate
    ? new Date(booking.completedDate)
    : new Date(booking.updatedAt);

  return (
    <>
      <Head>
        <title>Receipt - {booking.serviceName} | SRV Provider</title>
      </Head>
      <div className="flex min-h-screen flex-col items-center bg-gray-100 py-6 sm:py-12 print:bg-white">
        {/* Back button (hidden on print) */}
        <div className="container mx-auto mb-4 px-4 print:hidden">
          <button
            onClick={() => router.push("/provider/bookings")} // Go to main bookings page
            className="flex items-center text-sm text-blue-600 hover:underline"
          >
            <ArrowLeftIcon className="mr-1 h-4 w-4" />
            Back to Bookings
          </button>
        </div>

        <main className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl sm:p-8 md:p-10 print:border print:border-gray-300 print:shadow-none">
          <div className="mb-8 text-center">
            <CheckBadgeIcon className="mx-auto mb-3 h-16 w-16 text-green-500" />
            <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">
              Service Completed!
            </h1>
            <p className="text-sm text-gray-500">
              Salamat sa paggamit ng SRV Platform.
            </p>
          </div>

          <div className="mb-8 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Booking ID:</span>
              <span className="font-medium text-gray-800">
                {booking.id.toUpperCase().slice(-8)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date Completed:</span>
              <span className="font-medium text-gray-800">
                {completionTime.toLocaleDateString()}{" "}
                {completionTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <hr className="my-3" />
            <div className="flex justify-between">
              <span className="text-gray-600">Service:</span>
              <span className="max-w-[60%] text-right font-medium break-words text-gray-800">
                {booking.serviceName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Client:</span>
              <span className="font-medium text-gray-800">
                {booking.clientName}
              </span>
            </div>
          </div>

          <div className="mb-8 space-y-3 border-t border-b border-gray-200 py-6 text-sm">
            <h2 className="mb-3 text-lg font-semibold text-gray-800">
              Payment Summary
            </h2>
            <div className="flex justify-between">
              <span className="text-gray-600">Service Total:</span>
              <span className="font-medium text-gray-800">
                ₱{serviceTotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">
                Amount Paid ({paymentMethod}):
              </span>
              <span className="font-medium text-green-600">
                ₱{amountPaid.toFixed(2)}
              </span>
            </div>
            {changeGiven > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Change Given:</span>
                <span className="font-medium text-gray-800">
                  ₱{changeGiven.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          <div className="mb-8 text-center text-xs text-gray-400">
            This is a simplified receipt. For official records, please refer to
            your transaction history.
          </div>

          <div className="flex flex-col gap-3 sm:flex-row print:hidden">
            <button
              onClick={handlePrint}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <PrinterIcon className="h-5 w-5" /> Print Receipt
            </button>
            <button
              onClick={handleShare}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <ShareIcon className="h-5 w-5" /> Share
            </button>
          </div>
          <button
            onClick={handleDone}
            className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none print:hidden"
          >
            Done
          </button>
        </main>
      </div>
    </>
  );
};

export default ReceiptPage;
