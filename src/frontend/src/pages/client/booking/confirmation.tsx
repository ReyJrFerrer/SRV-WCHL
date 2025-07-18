import React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";

interface BookingDetails {
  serviceName: string;
  providerName: string;
  selectedPackages: { id: string; name: string }[];
  concerns: string;
  bookingType: string;
  date: string;
  time: string;
  location?: string;
}

const BookingConfirmationPage: React.FC = () => {
  const router = useRouter();
  const { details } = router.query;

  let bookingDetails: BookingDetails | null = null;

  if (details && typeof details === "string") {
    try {
      bookingDetails = JSON.parse(details);
    } catch (error) {
      console.error("Failed to parse booking details:", error);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Head>
        <title>Booking Confirmed - SRV Client</title>
        <meta
          name="description"
          content="Your booking request has been sent."
        />
      </Head>

      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-4 py-3">
        <h1 className="text-center text-lg font-semibold text-gray-900">
          Booking Request Sent!
        </h1>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center p-4">
        {bookingDetails ? (
          <div className="w-full max-w-md rounded-xl bg-white p-6 text-center shadow-lg">
            {/* Success Icon */}
            <div className="mb-4 text-6xl">🎉</div>

            {/* Success Message */}
            <h2 className="mb-2 text-xl font-semibold text-gray-900">
              Ang request mo ay naibigay na kay {bookingDetails.providerName}!
            </h2>
            <p className="mb-6 text-gray-600">
              Hintayin na ang notipikasyon mula sa katayuan ng iyong booking.
            </p>

            {/* Booking Summary */}
            <div className="mb-6 rounded-lg bg-gray-50 p-4 text-left">
              <h3 className="mb-3 border-b border-gray-200 pb-2 font-semibold text-gray-900">
                Booking Summary:
              </h3>

              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium text-gray-700">Service:</span>{" "}
                  {bookingDetails.serviceName}
                </p>
                <p>
                  <span className="font-medium text-gray-700">Provider:</span>{" "}
                  {bookingDetails.providerName}
                </p>

                {bookingDetails.selectedPackages &&
                  bookingDetails.selectedPackages.length > 0 && (
                    <div>
                      <span className="font-medium text-gray-700">
                        Packages:
                      </span>
                      <ul className="mt-1 ml-4 list-inside list-disc">
                        {bookingDetails.selectedPackages.map((pkg) => (
                          <li key={pkg.id} className="text-gray-600">
                            {pkg.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                <p>
                  <span className="font-medium text-gray-700">Type:</span>{" "}
                  {bookingDetails.bookingType === "sameday"
                    ? "Same Day"
                    : "Scheduled"}
                </p>
                <p>
                  <span className="font-medium text-gray-700">Date:</span>{" "}
                  {bookingDetails.date}
                </p>
                <p>
                  <span className="font-medium text-gray-700">Time:</span>{" "}
                  {bookingDetails.time}
                </p>
                {bookingDetails.location && (
                  <p>
                    <span className="font-medium text-gray-700">Location:</span>{" "}
                    {bookingDetails.location}
                  </p>
                )}
              </div>
            </div>

            {/* Action Button */}
            <Link href="/client" legacyBehavior>
              <a className="inline-block w-full rounded-lg bg-blue-600 py-3 font-medium text-white transition-colors hover:bg-blue-700">
                Back to Home
              </a>
            </Link>
          </div>
        ) : (
          <div className="w-full max-w-md rounded-xl bg-white p-6 text-center shadow-lg">
            <p className="mb-4 text-gray-600">
              Loading booking details or an error occurred while parsing
              details.
            </p>
            <Link href="/client" legacyBehavior>
              <a className="inline-block w-full rounded-lg bg-blue-600 py-3 font-medium text-white transition-colors hover:bg-blue-700">
                Back to Home
              </a>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
};

export default BookingConfirmationPage;
