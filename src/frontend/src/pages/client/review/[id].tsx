import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { StarIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { useBookingRating } from "../../../hooks/reviewManagement"; // Adjust path as needed
import {
  useBookingManagement,
  EnhancedBooking,
} from "../../../hooks/bookingManagement"; // Adjust path as needed

const feedbackOptions = [
  "Very Professional",
  "Arrived On Time",
  "Friendly Staff",
  "Highly Recommended",
  "Great Experience",
];

export const BookingReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { id: bookingId } = useParams<{ id: string }>();

  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [booking, setBooking] = useState<EnhancedBooking | null>(null);
  const [existingReview, setExistingReview] = useState<any>(null);
  const [providerNameState, setProviderName] = useState("Service Provider");

  const {
    bookings,
    loading: bookingLoading,
    error: bookingError,
    formatBookingDate,
    formatLocationString,
  } = useBookingManagement();

  const {
    submitReview,
    updateReview,
    getBookingReviews,
    loading: reviewLoading,
    error: reviewError,
    clearError,
  } = useBookingRating(bookingId as string);

  // Set document title
  useEffect(() => {
    document.title = `Review Booking - SRV`;
  }, []);

  // Load booking and existing review data
  useEffect(() => {
    const loadData = async () => {
      if (!bookingId || typeof bookingId !== "string") return;
      try {
        const foundBooking = bookings.find((b) => b.id === bookingId);
        setBooking(foundBooking || null);

        if (foundBooking) {
          setProviderName(
            foundBooking.providerProfile?.name ||
              foundBooking.providerName ||
              "Service Provider",
          );
        }

        const bookingReviews = await getBookingReviews(bookingId as string);
        if (bookingReviews && bookingReviews.length > 0) {
          const userReview = bookingReviews[0];
          setExistingReview(userReview);
          setRating(userReview.rating);
          setFeedback(userReview.comment);
        }
      } catch (error) {
        console.error("Error loading booking/review data:", error);
        setFormError("Could not load booking data.");
      }
    };

    if (!bookingLoading) {
      loadData();
    }
  }, [bookingId, bookings, getBookingReviews, bookingLoading]);

  const handleRating = useCallback((value: number) => {
    setRating(value);
  }, []);

  const handleFeedbackButtonClick = (option: string) => {
    setFeedback((prev) => (prev ? `${prev}, ${option}` : option));
  };

  const handleSubmit = useCallback(async () => {
    setFormError(null);
    clearError();

    if (rating === 0) {
      setFormError("Please select a rating from 1 to 5 stars.");
      return;
    }

    const trimmedFeedback = feedback.trim();
    if (trimmedFeedback.length < 5 || trimmedFeedback.length > 500) {
      setFormError("A comment between 5 and 500 characters is required.");
      return;
    }

    if (!bookingId || typeof bookingId !== "string") {
      setFormError("Could not find a valid booking ID.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = { rating, comment: trimmedFeedback };
      const result = existingReview
        ? await updateReview(existingReview.id, formData)
        : await submitReview(bookingId as string, formData);

      if (result) {
        // Navigate to receipt page with review info in state
        navigate(`/client/booking/receipt/${bookingId}`, {
          state: {
            price: booking?.price || 0,
            paid: booking?.price || 0,
            change: 0,
            method: "Cash",
            userRating: rating,
            userComment: trimmedFeedback,
          },
        });
      }
    } catch (error) {
      console.error("Error submitting review:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    rating,
    feedback,
    bookingId,
    existingReview,
    updateReview,
    submitReview,
    clearError,
    navigate,
    booking,
  ]);

  const isLoading = useMemo(
    () => bookingLoading || reviewLoading,
    [bookingLoading, reviewLoading],
  );

  const isFormValid = useMemo(() => {
    const trimmedFeedback = feedback.trim();
    return (
      rating > 0 && trimmedFeedback.length >= 5 && trimmedFeedback.length <= 500
    );
  }, [rating, feedback]);

  const ratingLabel = useMemo(() => {
    switch (rating) {
      case 1:
        return "Poor";
      case 2:
        return "Fair";
      case 3:
        return "Good";
      case 4:
        return "Very Good";
      case 5:
        return "Excellent";
      default:
        return "Select a rating";
    }
  }, [rating]);

  if (isLoading && !booking) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="mx-auto mt-6 max-w-2xl rounded-lg border border-yellow-200 bg-yellow-50 p-6 text-center">
        <h2 className="mb-2 text-lg font-semibold text-yellow-800">
          Booking Not Found
        </h2>
        <p className="mb-4 text-yellow-600">
          {bookingError || "The requested booking could not be found."}
        </p>
        <button
          onClick={() => navigate(-1)}
          className="text-blue-600 hover:underline"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-6 max-w-2xl rounded-lg bg-white p-6 shadow">
      <div className="mb-6 rounded-lg border bg-gray-50 p-4">
        <h3 className="mb-3 font-bold text-gray-900">Booking Details</h3>
        <div className="grid grid-cols-1 gap-3 text-sm text-gray-600 md:grid-cols-2">
          <div>
            <span className="font-bold">Provider:</span> {providerNameState}
          </div>
          <div>
            <span className="font-bold">Service:</span>{" "}
            {booking.serviceName || "Service"}
          </div>
          <div>
            <span className="font-bold">Date:</span>{" "}
            {formatBookingDate(booking.scheduledDate ?? "")}
          </div>
          <div>
            <span className="font-bold">Location:</span>{" "}
            {formatLocationString(booking.location)}
          </div>
          <div>
            <span className="font-bold">Price:</span> ${booking.price || "TBD"}
          </div>
        </div>
      </div>

      <h2 className="mb-4 text-center text-xl font-bold">
        How satisfied were you with the service?
      </h2>
      <div className="mb-2 flex justify-center space-x-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon
            key={star}
            className={`h-10 w-10 cursor-pointer transition-colors ${(hovered ?? rating) >= star ? "text-yellow-400" : "text-gray-300"}`}
            onClick={() => !isSubmitting && handleRating(star)}
            onMouseEnter={() => !isSubmitting && setHovered(star)}
            onMouseLeave={() => !isSubmitting && setHovered(null)}
            fill={(hovered ?? rating) >= star ? "currentColor" : "none"}
          />
        ))}
      </div>
      <div className="mb-6 text-center text-lg font-semibold text-gray-600">
        <span>{ratingLabel}</span>
      </div>

      <div className="mb-4">
        <p className="mb-2 text-center text-sm font-medium text-gray-700">
          Add a quick comment:
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {feedbackOptions.map((option) => (
            <button
              key={option}
              onClick={() => handleFeedbackButtonClick(option)}
              disabled={isSubmitting}
              className="rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-800 transition-colors hover:border-blue-300 hover:bg-blue-100 disabled:opacity-50"
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <textarea
        placeholder="Write your feedback... (5-500 characters)"
        className="w-full resize-none rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100"
        rows={4}
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        disabled={isSubmitting}
        maxLength={500}
      />
      <div className="mt-1 text-right text-xs text-gray-500">
        {feedback.length}/500 characters
      </div>

      {(formError || reviewError) && (
        <div className="mt-4 flex items-center justify-center rounded-lg border border-red-200 bg-red-50 p-3 text-red-800">
          <ExclamationCircleIcon className="mr-2 h-5 w-5" />
          <span className="text-sm">{formError || reviewError}</span>
        </div>
      )}

      <div className="mt-6 flex justify-end space-x-3">
        <button
          onClick={() => navigate(-1)}
          disabled={isSubmitting}
          className="rounded-lg bg-gray-100 px-4 py-2 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!isFormValid || isSubmitting}
          className="flex items-center rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {isSubmitting && (
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
          )}
          {isSubmitting
            ? "Submitting..."
            : existingReview
              ? "Update Review"
              : "Submit Rating"}
        </button>
      </div>
    </div>
  );
};

export default BookingReviewPage;
