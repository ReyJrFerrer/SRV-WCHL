import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeftIcon, StarIcon } from '@heroicons/react/24/outline';
import { useBookingRating } from '../../../hooks/reviewManagement';
import { useBookingManagement } from '../../../hooks/bookingManagement';

export default function BookingRating() {
  const router = useRouter();
  const { id: bookingId} = router.query; // Get bookingId from URL params

  // State for the rating form
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for booking and review data
  const [booking, setBooking] = useState<any>(null);
  const [existingReview, setExistingReview] = useState<any>(null);
  const [providerNameState, setProviderName] = useState('Service Provider');

  // Get booking data from booking management hook
  const { 
    bookings, 
    loading: bookingLoading,
    error: bookingError,
    formatBookingDate,
    formatLocationString 
  } = useBookingManagement();

  // Get review functionality from review management hook
  const {
    submitReview,
    updateReview,
    canReview,
    getBookingReviews,
    loading: reviewLoading,
    error: reviewError,
    clearError
  } = useBookingRating(bookingId as string); // Pass bookingId to the hook


  const handleRating = useCallback((value: number) => {
    setRating(value);
  }, []);

  // Load booking and review data when bookingId changes
  useEffect(() => {
    const loadData = async () => {
      if (!bookingId || typeof bookingId !== 'string') return;

      try {
        // Find the booking from the bookings array
        const foundBooking = bookings.find(b => b.id === bookingId);
        setBooking(foundBooking);

        if (foundBooking) {
          // Set provider name from enriched booking data
          setProviderName(
            foundBooking.providerProfile?.name || 
            foundBooking.providerName || 
            'Service Provider'
          );
        }

        // Check for existing reviews
        const bookingReviews = await getBookingReviews(bookingId);
        if (bookingReviews && bookingReviews.length > 0) {
          const userReview = bookingReviews[0]; // Assuming one review per booking per user
          setExistingReview(userReview);
          
          // Pre-fill form if editing existing review
          setRating(userReview.rating);
          setFeedback(userReview.comment);
        }
      } catch (error) {
        console.error('Error loading booking/review data:', error);
      }
    };

    loadData();
  }, [bookingId, bookings, getBookingReviews]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    if (!bookingId || typeof bookingId !== 'string') {
      alert('Invalid booking ID');
      return;
    }

    setIsSubmitting(true);
    clearError();

    try {
      const formData = { rating, comment: feedback };
      
      let result;
      if (existingReview) {
        // Update existing review
        result = await updateReview(existingReview.id, formData);
      } else {
        // Submit new review
        result = await submitReview(bookingId, formData);
      }

      if (result) {
        // Success - navigate back to bookings
        router.push('/client/booking');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      // Error is handled by the hook and displayed in UI
    } finally {
      setIsSubmitting(false);
    }
  }, [rating, feedback, bookingId, existingReview, updateReview, submitReview, clearError, router]);

  // Pre-fill form if editing existing review
  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setFeedback(existingReview.comment);
    }
  }, [existingReview]);

  // Memoized values for performance
  const isLoading = useMemo(() => 
    bookingLoading || reviewLoading, 
    [bookingLoading, reviewLoading]
  );

  const hasError = useMemo(() => 
    bookingError || reviewError, 
    [bookingError, reviewError]
  );

  const ratingLabel = useMemo(() => {
    switch (rating) {
      case 1: return "Poor";
      case 2: return "Fair";
      case 3: return "Good";
      case 4: return "Very Good";
      case 5: return "Excellent";
      default: return "";
    }
  }, [rating]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  // Error state
  if (hasError) {
    return (
      <div className="max-w-2xl mx-auto mt-6 p-6 bg-red-50 rounded-lg border border-red-200">
        <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
        <p className="text-red-600 mb-4">{bookingError || reviewError}</p>
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:underline"
        >
          Go Back
        </button>
      </div>
    );
  }

  // No booking found
  if (!booking) {
    return (
      <div className="max-w-2xl mx-auto mt-6 p-6 bg-yellow-50 rounded-lg border border-yellow-200">
        <h2 className="text-lg font-semibold text-yellow-800 mb-2">Booking Not Found</h2>
        <p className="text-yellow-600 mb-4">
          The requested booking could not be found or you don't have permission to review it.
        </p>
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:underline"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Cannot review
  if (canReview === false) {
    return (
      <div className="max-w-2xl mx-auto mt-6 p-6 bg-yellow-50 rounded-lg border border-yellow-200">
        <h2 className="text-lg font-semibold text-yellow-800 mb-2">Review Not Available</h2>
        <p className="text-yellow-600 mb-4">
          You cannot review this booking. This may be because:
        </p>
        <ul className="list-disc list-inside text-yellow-600 mb-4 space-y-1">
          <li>The booking is not completed yet</li>
          <li>The 30-day review window has expired</li>
          <li>You are not the client for this booking</li>
        </ul>
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:underline"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-6 p-6 bg-white rounded-lg shadow">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="mb-4 flex items-center text-sm text-blue-600 hover:underline"
      >
        <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back
      </button>

      {/* Booking Information Card */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
        <h3 className="font-medium text-gray-900 mb-2">Booking Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
          <div>
            <span className="font-medium">Service:</span> {booking.serviceName || 'Service'}
          </div>
          <div>
            <span className="font-medium">Date:</span> {formatBookingDate(booking.scheduledDate)}
          </div>
          <div>
            <span className="font-medium">Location:</span> {formatLocationString(booking.location)}
          </div>
          <div>
            <span className="font-medium">Price:</span> ${booking.price || 'TBD'}
          </div>
        </div>
      </div>

      {/* Rating Form */}
      <h2 className="text-xl font-semibold mb-2">
        {existingReview ? 'Update Review for' : 'Rate'} {providerNameState}
      </h2>
      <p className="text-gray-500 mb-4">
        {existingReview 
          ? 'Update your previous rating and feedback'
          : 'How satisfied were you with the service?'
        }
      </p>

      {/* Star Rating */}
      <div className="flex space-x-2 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon
            key={star}
            className={`h-7 w-7 cursor-pointer transition-colors ${
              (hovered ?? rating) >= star ? 'text-yellow-400' : 'text-gray-300'
            } ${isSubmitting ? 'pointer-events-none' : ''}`}
            onClick={() => !isSubmitting && handleRating(star)}
            onMouseEnter={() => !isSubmitting && setHovered(star)}
            onMouseLeave={() => !isSubmitting && setHovered(null)}
            fill={(hovered ?? rating) >= star ? 'currentColor' : 'none'}
          />
        ))}
      </div>

      {/* Rating Labels */}
      <div className="mb-4 text-sm text-gray-600">
        {rating > 0 && (
          <span>{ratingLabel}</span>
        )}
      </div>

      {/* Feedback Textarea */}
      <textarea
        placeholder="Write your feedback... (optional)"
        className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        rows={4}
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        disabled={isSubmitting}
        maxLength={500}
      />
      <div className="text-right text-xs text-gray-500 mt-1">
        {feedback.length}/500 characters
      </div>

      {/* Submit Button */}
      <div className="mt-6 flex justify-end space-x-3">
        <button
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={rating === 0 || isSubmitting}
          className="bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
        >
          {isSubmitting && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          )}
          {isSubmitting 
            ? 'Submitting...' 
            : existingReview 
              ? 'Update Review' 
              : 'Submit Rating'
          }
        </button>
      </div>

      {/* Existing Review Info */}
      {existingReview && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> You previously rated this service {existingReview.rating}/5 stars.
            You can update your review at any time.
          </p>
        </div>
      )}
    </div>
  );
}
