import React from "react";
import {
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  StarIcon,
  ChartBarIcon,
  BanknotesIcon,
} from "@heroicons/react/24/solid";
import { useProviderBookingManagement } from "../../hooks/useProviderBookingManagement";
import { useProviderReviews } from "../../hooks/reviewManagement";

interface ProviderStatsProps {
  className?: string;
  loading?: boolean;
}

const ProviderStatsNextjs: React.FC<ProviderStatsProps> = ({
  className = "",
  loading: externalLoading = false,
}) => {
  const {
    analytics,
    loading: bookingLoading,
    getRevenueByPeriod,
    providerProfile,
    error,
    isProviderAuthenticated,
  } = useProviderBookingManagement();

  // Add review management hook for getting rating and reviews
  const {
    analytics: reviewAnalytics,
    loading: reviewsLoading,
    error: reviewsError,
    getCurrentUserId,
  } = useProviderReviews(); // This will automatically load provider reviews
  // Improved loading logic - wait for both analytics and reviews
  const isLoading = externalLoading || bookingLoading || reviewsLoading;
  const hasError = error || reviewsError;

  // Calculate rating data from review analytics
  const ratingData = React.useMemo(() => {
    if (reviewAnalytics) {
      return {
        averageRating: reviewAnalytics.averageRating || 0,
        totalReviews: reviewAnalytics.totalReviews || 0,
      };
    }
    return {
      averageRating: 0,
      totalReviews: 0,
    };
  }, [reviewAnalytics]);

  // Calculate stats from real data
  const stats = React.useMemo(() => {
    // Default stats for when there's no data or loading
    const defaultStats = [
      {
        title: "Kita Ngayong Buwan",
        value: "₱0.00",
        icon: <CurrencyDollarIcon className="h-6 w-6 text-white" />,
        borderColor: "border-yellow-400",
        bgColor: "bg-yellow-400",
      },
      {
        title: "Hinihintay na payout",
        value: "₱0.00",
        icon: <ClockIcon className="h-6 w-6 text-white" />,
        borderColor: "border-yellow-400",
        bgColor: "bg-yellow-400",
      },
      {
        title: "Mga Natapos na Trabaho",
        value: "0",
        icon: <CheckCircleIcon className="h-6 w-6 text-white" />,
        borderColor: "border-yellow-400",
        bgColor: "bg-yellow-400",
      },
      {
        title: "Rating ng Kustomer",
        value: "0 (0)",
        icon: <StarIcon className="h-6 w-6 text-white" />,
        borderColor: "border-yellow-400",
        bgColor: "bg-yellow-400",
      },
      {
        title: "Persyento ng mga Natapos na Trabaho",
        value: "0%",
        icon: <ChartBarIcon className="h-6 w-6 text-white" />,
        borderColor: "border-yellow-400",
        bgColor: "bg-yellow-400",
      },
      {
        title: "Kabuuang Kita",
        value: "₱0.00",
        icon: <BanknotesIcon className="h-6 w-6 text-white" />,
        borderColor: "border-yellow-400",
        bgColor: "bg-yellow-400",
      },
    ];

    if (!analytics) {
      // Return default stats but with rating data if available
      return defaultStats.map((stat) => {
        if (stat.title === "Customer Rating") {
          return {
            ...stat,
            value: `${ratingData.averageRating.toFixed(1)} (${ratingData.totalReviews})`,
          };
        }
        return stat;
      });
    }

    try {
      const monthlyRevenue = getRevenueByPeriod("month");
      const pendingPayout = analytics.expectedRevenue || 0;

      return [
        {
          title: "Kita Ngayong Buwan",
          value: `₱${monthlyRevenue.toFixed(2)}`,
          icon: <CurrencyDollarIcon className="h-6 w-6 text-white" />,
          borderColor: "border-yellow-400",
          bgColor: "bg-yellow-400",
        },
        {
          title: "Hinihintay na payout",
          value: `₱${pendingPayout.toFixed(2)}`,
          icon: <ClockIcon className="h-6 w-6 text-white" />,
          borderColor: "border-yellow-400",
          bgColor: "bg-yellow-400",
        },
        {
          title: "Mga Natapos na Trabaho",
          value: (analytics.completedBookings || 0).toString(),
          icon: <CheckCircleIcon className="h-6 w-6 text-white" />,
          borderColor: "border-yellow-400",
          bgColor: "bg-yellow-400",
        },
        {
          title: "Rating ng Kustomer",
          value: `${ratingData.averageRating.toFixed(1)} (${ratingData.totalReviews})`,
          icon: <StarIcon className="h-6 w-6 text-white" />,
          borderColor: "border-yellow-400",
          bgColor: "bg-yellow-400",
        },
        {
          title: "Persyento ng mga Natapos na Trabaho",
          value: `${(analytics.completionRate || 0).toFixed(0)}%`,
          icon: <ChartBarIcon className="h-6 w-6 text-white" />,
          borderColor: "border-yellow-400",
          bgColor: "bg-yellow-400",
        },
        {
          title: "Kabuuang Kita",
          value: `₱${(analytics.totalRevenue || 0).toFixed(2)}`,
          icon: <BanknotesIcon className="h-6 w-6 text-white" />,
          borderColor: "border-yellow-400",
          bgColor: "bg-yellow-400",
        },
      ];
    } catch (err) {
      console.error("Error calculating stats:", err);
      return defaultStats;
    }
  }, [analytics, getRevenueByPeriod, ratingData]);

  // Show error state
  if (hasError) {
    return (
      <div className={`${className} p-4`}>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">
            Error sa paglo-load ng mga stats {error || reviewsError}
          </p>
        </div>
      </div>
    );
  }

  // Show loading state only when actually loading
  if (isLoading) {
    return (
      <div className={`stats-grid ${className}`}>
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="stat-card animate-pulse border-l-4 border-gray-300"
          >
            <div className="stat-icon bg-gray-300">
              <div className="h-6 w-6 rounded bg-gray-400"></div>
            </div>
            <div>
              <div className="mb-2 h-4 rounded bg-gray-300"></div>
              <div className="h-6 rounded bg-gray-300"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`stats-grid ${className}`}>
      {stats.map((stat, index) => (
        <div key={index} className={`stat-card ${stat.borderColor} border-l-4`}>
          <div className={`stat-icon ${stat.bgColor}`}>{stat.icon}</div>
          <div>
            <p className="text-sm text-gray-500">{stat.title}</p>
            <p className="text-xl font-bold text-gray-800">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProviderStatsNextjs;
