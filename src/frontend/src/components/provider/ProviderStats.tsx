import React from "react";
import { useProviderBookingManagement } from "../../hooks/useProviderBookingManagement";
import { useProviderReviews } from "../../hooks/reviewManagement";

// Import your new chart components
import BookingStatusPieChart from './BookingStatusPieChart';
import MonthlyRevenueLineChart from './MonthlyRevenueLineChart';
import DailyBookingsBarChart from './DailyBookingsBarChart';
import CustomerRatingStars from './CustomerRatingStars';

interface ProviderStatsProps {
  className?: string;
  loading?: boolean;
}

const ProviderStats: React.FC<ProviderStatsProps> = ({
  className = "",
  loading: externalLoading = false,
}) => {
  const {
    loading: bookingLoading,
    error,
  } = useProviderBookingManagement();

  const {
    loading: reviewsLoading,
    error: reviewsError,
  } = useProviderReviews();

  const isLoading = externalLoading || bookingLoading || reviewsLoading;
  const hasError = error || reviewsError;

  if (hasError) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">
            Error loading stats: {error || reviewsError || "Unknown error"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="mb-6 pt-6 text-2xl sm:text-3xl md:text-4xl font-extrabold text-black">
        Dashboard
      </h1>
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 ${className}`}>
        {isLoading ? (
          // Skeleton loaders for charts
          <>
            <div className="h-90 w-full animate-pulse rounded-lg bg-gray-200"></div>
            <div className="h-90 w-full animate-pulse rounded-lg bg-gray-200"></div>
            <div className="h-90 w-full animate-pulse rounded-lg bg-gray-200"></div>
            <div className="h-90 w-full animate-pulse rounded-lg bg-gray-200"></div>
          </>
        ) : (
          // Render the charts with a fixed height and padding
          <>
            <div className="bg-white p-6 rounded-lg shadow-md h-90">
              <BookingStatusPieChart />
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md h-90">
              <MonthlyRevenueLineChart />
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md h-90">
              <DailyBookingsBarChart />
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md h-90 flex items-center justify-center">
              <CustomerRatingStars />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProviderStats;