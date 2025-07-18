import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';

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

  if (details && typeof details === 'string') {
    try {
      bookingDetails = JSON.parse(details);
    } catch (error) {
      console.error("Failed to parse booking details:", error);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Head>
        <title>Booking Confirmed - SRV Client</title>
        <meta name="description" content="Your booking request has been sent." />
      </Head>

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <h1 className="text-lg font-semibold text-gray-900 text-center">
          Booking Request Sent!
        </h1>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        {bookingDetails ? (
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md text-center">
            {/* Success Icon */}
            <div className="text-6xl mb-4">🎉</div>
            
            {/* Success Message */}
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Ang request mo ay naibigay na kay {bookingDetails.providerName}!
            </h2>
            <p className="text-gray-600 mb-6">
              Hintayin na ang notipikasyon mula sa katayuan ng iyong booking.
            </p>

            {/* Booking Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
                Booking Summary:
              </h3>
              
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium text-gray-700">Service:</span>{' '}
                  {bookingDetails.serviceName}
                </p>
                <p>
                  <span className="font-medium text-gray-700">Provider:</span>{' '}
                  {bookingDetails.providerName}
                </p>
                
                {bookingDetails.selectedPackages && bookingDetails.selectedPackages.length > 0 && (
                  <div>
                    <span className="font-medium text-gray-700">Packages:</span>
                    <ul className="list-disc list-inside ml-4 mt-1">
                      {bookingDetails.selectedPackages.map(pkg => (
                        <li key={pkg.id} className="text-gray-600">{pkg.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              
                <p>
                  <span className="font-medium text-gray-700">Type:</span>{' '}
                  {bookingDetails.bookingType === 'sameday' ? 'Same Day' : 'Scheduled'}
                </p>
                <p>
                  <span className="font-medium text-gray-700">Date:</span>{' '}
                  {bookingDetails.date}
                </p>
                <p>
                  <span className="font-medium text-gray-700">Time:</span>{' '}
                  {bookingDetails.time}
                </p>
                {bookingDetails.location && (
                  <p>
                    <span className="font-medium text-gray-700">Location:</span>{' '}
                    {bookingDetails.location}
                  </p>
                )}
              </div>
            </div>

            {/* Action Button */}
            <Link href="/client" legacyBehavior>
              <a className="inline-block w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                Back to Home
              </a>
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md text-center">
            <p className="text-gray-600 mb-4">
              Loading booking details or an error occurred while parsing details.
            </p>
            <Link href="/client" legacyBehavior>
              <a className="inline-block w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
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
