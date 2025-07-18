import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { ArrowLeftIcon, StarIcon, UserCircleIcon, CalendarDaysIcon, MapPinIcon, CurrencyDollarIcon, ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { useProviderBookingManagement } from '../../../hooks/useProviderBookingManagement';
import { useBookingRating } from '../../../hooks/reviewManagement';
import BottomNavigationNextjs from '../../../components/provider/BottomNavigationNextjs';

export default function ProviderReviewView() {
  const router = useRouter();
  const { id: bookingId } = router.query;

  // State for booking and review data
  const [booking, setBooking] = useState<any>(null);
  const [clientReview, setClientReview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get booking data from provider booking management hook
  const { 
    bookings, 
    loading: bookingLoading,
    error: bookingError,
    formatBookingDate,
    formatBookingTime
  } = useProviderBookingManagement();

  // Get review functionality from review management hook
  const {
    getBookingReviews,
    loading: reviewLoading,
    error: reviewError,
    formatReviewDate,
    getRelativeTime
  } = useBookingRating(null); // Don't auto-load user reviews

  // Load booking and review data when bookingId changes
  useEffect(() => {
    const loadData = async () => {
      if (!bookingId || typeof bookingId !== 'string') return;

      try {
        setLoading(true);
        setError(null);

        // Find the booking from the bookings array
        const foundBooking = bookings.find(b => b.id === bookingId);
        
        if (!foundBooking) {
          setError('Booking not found or you do not have access to this booking.');
          return;
        }

        // Verify this is a completed booking
        if (foundBooking.status !== 'Completed') {
          setError('Reviews are only available for completed bookings.');
          return;
        }

        setBooking(foundBooking);

        // Get reviews for this booking
        const bookingReviews = await getBookingReviews(bookingId);
        
        if (bookingReviews && bookingReviews.length > 0) {
          // Find the client's review (the review written by the client about this provider)
          const review = bookingReviews.find(r => r.clientId.toString() === foundBooking.clientId.toString());
          setClientReview(review || null);
        } else {
          setClientReview(null);
        }

      } catch (error) {
        console.error('Error loading booking/review data:', error);
        setError('Failed to load booking and review data.');
      } finally {
        setLoading(false);
      }
    };

    if (!bookingLoading && bookings.length >= 0) {
      loadData();
    }
  }, [bookingId, bookings, bookingLoading, getBookingReviews]);

  // Render star rating display
  const renderStarRating = useCallback((rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIconSolid
            key={star}
            className={`h-5 w-5 ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-sm font-medium text-gray-700">
          {rating}/5
        </span>
      </div>
    );
  }, []);

  // Get rating label
  const getRatingLabel = useCallback((rating: number) => {
    switch (rating) {
      case 1: return "Poor";
      case 2: return "Fair";
      case 3: return "Good";
      case 4: return "Very Good";
      case 5: return "Excellent";
      default: return "";
    }
  }, []);

  // Determine overall loading state
  const isLoading = useMemo(() => 
    bookingLoading || reviewLoading || loading, 
    [bookingLoading, reviewLoading, loading]
  );

  // Determine error state
  const displayError = useMemo(() => 
    bookingError || reviewError || error, 
    [bookingError, reviewError, error]
  );

  // Loading state
  if (isLoading) {
    return (
      <>
        <Head>
          <title>Loading Review | SRV Provider</title>
        </Head>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading review details...</p>
          </div>
        </div>
      </>
    );
  }

  // Error state
  if (displayError) {
    return (
      <>
        <Head>
          <title>Review Error | SRV Provider</title>
        </Head>
        <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
          <header className="bg-white shadow-sm sticky top-0 z-30">
            <div className="container mx-auto px-4 py-3 flex items-center">
              <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-100 mr-2">
                <ArrowLeftIcon className="h-5 w-5 text-gray-700" />
              </button>
              <h1 className="text-lg font-semibold text-slate-800">Review Details</h1>
            </div>
          </header>

          <div className="container mx-auto p-4 sm:p-6">
            <div className="max-w-2xl mx-auto bg-red-50 rounded-lg border border-red-200 p-6">
              <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
              <p className="text-red-600 mb-4">{displayError}</p>
              <button
                onClick={() => router.push('/provider/booking')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Back to Bookings
              </button>
            </div>
          </div>

          <div className="md:hidden">
            <BottomNavigationNextjs />
          </div>
        </div>
      </>
    );
  }

  // Extract booking data
  const clientName = booking?.clientName || 'Unknown Client';
  const serviceName = booking?.serviceDetails?.description || booking?.packageName || 'Service';
  const packageName = booking?.packageName;
  const bookingLocation = booking?.formattedLocation || 'Location not specified';
  const price = booking?.price;

  return (
    <>
      <Head>
        <title>Client Review: {serviceName} | SRV Provider</title>
        <meta name="description" content={`View client review for ${serviceName}`} />
        <meta name="robots" content="noindex" />
      </Head>
      
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="container mx-auto px-4 py-3 flex items-center">
            <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-100 mr-2">
              <ArrowLeftIcon className="h-5 w-5 text-gray-700" />
            </button>
            <h1 className="text-lg font-semibold text-slate-800">Client Review</h1>
          </div>
        </header>

        <main className="container mx-auto p-4 sm:p-6 space-y-6">
          {/* Booking Information Card */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center">
                <UserCircleIcon className="h-5 w-5 mr-2 text-blue-500" />
                <span><strong>Client:</strong> {clientName}</span>
              </div>
              <div className="flex items-center">
                <CalendarDaysIcon className="h-5 w-5 mr-2 text-blue-500" />
                <span><strong>Date:</strong> {formatBookingDate(booking?.requestedDate || booking?.createdAt)}</span>
              </div>
              <div className="flex items-center">
                <MapPinIcon className="h-5 w-5 mr-2 text-blue-500" />
                <span><strong>Location:</strong> {bookingLocation}</span>
              </div>
              {price !== undefined && (
                <div className="flex items-center">
                  <CurrencyDollarIcon className="h-5 w-5 mr-2 text-green-500" />
                  <span><strong>Price:</strong> ₱{price.toFixed(2)}</span>
                </div>
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                <strong>Service:</strong> {serviceName}
              </p>
              {packageName && (
                <p className="text-sm text-gray-600">
                  <strong>Package:</strong> {packageName}
                </p>
              )}
            </div>
          </div>

          {/* Review Card */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Review</h3>
            
            {clientReview ? (
              <div className="space-y-4">
                {/* Rating */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Rating</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {getRatingLabel(clientReview.rating)}
                    </span>
                  </div>
                  {renderStarRating(clientReview.rating)}
                </div>

                {/* Review Date */}
                <div className="text-sm text-gray-500">
                  <strong>Reviewed:</strong> {formatReviewDate(clientReview.createdAt)} 
                  <span className="ml-2">({getRelativeTime(clientReview.createdAt)})</span>
                </div>

                {/* Comment */}
                {clientReview.comment && clientReview.comment.trim() && (
                  <div>
                    <div className="flex items-center mb-2">
                      <ChatBubbleBottomCenterTextIcon className="h-5 w-5 mr-2 text-blue-500" />
                      <span className="text-sm font-medium text-gray-700">Client Feedback</span>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
                      <p className="text-gray-800 italic">"{clientReview.comment}"</p>
                    </div>
                  </div>
                )}

                {/* Review Status */}
                <div className="pt-4 border-t border-gray-200">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    clientReview.status === 'Visible' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {clientReview.status}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
                  <StarIcon className="h-6 w-6 text-gray-400" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Review Yet</h4>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">
                  The client has not left a review for this booking yet. Reviews can be submitted for up to 30 days after service completion.
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {/* <div className="flex justify-center space-x-3">
            <button
              onClick={() => router.push('/provider/bookings')}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Back to Bookings
            </button>
            <button
              onClick={() => router.push('/provider/reviews')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View All Reviews
            </button>
          </div> */}
        </main>
        
        <div className="md:hidden">
          <BottomNavigationNextjs />
        </div>
      </div>
    </>
  );
}
