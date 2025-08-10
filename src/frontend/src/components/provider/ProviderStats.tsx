import React, { useState, useEffect } from "react";
import {
  ClockIcon,
  CheckCircleIcon,
  StarIcon,
  ChartBarIcon,
  BanknotesIcon,
  ChartPieIcon,
} from "@heroicons/react/24/solid";
import { useProviderBookingManagement } from "../../hooks/useProviderBookingManagement";
import { useProviderReviews } from "../../hooks/reviewManagement";
import { useNavigate } from "react-router-dom";

// Import your new chart components
import BookingStatusPieChart from "./BookingStatusPieChart";
import MonthlyRevenueLineChart from "./MonthlyRevenueLineChart";
import DailyBookingsBarChart from "./DailyBookingsBarChart";
import CustomerRatingStars from "./CustomerRatingStars";

interface ProviderStatsProps {
  className?: string;
  loading?: boolean;
}

const ProviderStats: React.FC<ProviderStatsProps> = ({
  className = "",
  loading: externalLoading = false,
}) => {
  const navigate = useNavigate();

  const handlePayClick = () => {
    navigate("/provider/commission/pay");
  };

  const {
    analytics,
    loading: bookingLoading,
    getRevenueByPeriod,
    error,
  } = useProviderBookingManagement();

  const {
    analytics: reviewAnalytics,
    loading: reviewsLoading,
    error: reviewsError,
  } = useProviderReviews();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isLoading = externalLoading || bookingLoading || reviewsLoading;
  const hasError = error || reviewsError;

  const outstandingCommission = 125.5; // Example value

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

  const stats = React.useMemo(() => {
    const defaultStats = [
      {
        title: "Earnings This Month",
        value: "₱0.00",
        icon: <BanknotesIcon className="h-6 w-6 text-white" />,
        bgColor: "bg-[#4068F4]",
      },
      {
        title: "Pending Payout",
        value: "₱0.00",
        icon: <ClockIcon className="h-6 w-6 text-white" />,
        bgColor: "bg-[#4068F4]",
      },
      {
        title: "Completed Jobs",
        value: "0",
        icon: <CheckCircleIcon className="h-6 w-6 text-white" />,
        bgColor: "bg-[#4068F4]",
      },
      {
        title: "Customer Rating",
        value: "0 (0)",
        icon: <StarIcon className="h-6 w-6 text-white" />,
        bgColor: "bg-[#4068F4]",
      },
      {
        title: "Completion Rate",
        value: "0%",
        icon: <ChartBarIcon className="h-6 w-6 text-white" />,
        bgColor: "bg-[#4068F4]",
      },
      {
        title: "Total Earnings",
        value: "₱0.00",
        icon: <ChartPieIcon className="h-6 w-6 text-white" />,
        bgColor: "bg-[#4068F4]",
      },
    ];

    if (!analytics) {
      return defaultStats.map((stat) => {
        if (stat.title === "Customer Rating") {
          return {
            ...stat,
            value: `${ratingData.averageRating.toFixed(1)} (${
              ratingData.totalReviews
            })`,
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
          title: "Earnings This Month",
          value: `₱${monthlyRevenue.toFixed(2)}`,
          icon: <BanknotesIcon className="h-6 w-6 text-white" />,
          bgColor: "bg-[#4068F4]",
        },
        {
          title: "Pending Payout",
          value: `₱${pendingPayout.toFixed(2)}`,
          icon: <ClockIcon className="h-6 w-6 text-white" />,
          bgColor: "bg-[#4068F4]",
        },
        {
          title: "Completed Jobs",
          value: (analytics.completedBookings || 0).toString(),
          icon: <CheckCircleIcon className="h-6 w-6 text-white" />,
          bgColor: "bg-[#4068F4]",
        },
        {
          title: "Customer Rating",
          value: `${ratingData.averageRating.toFixed(1)} (${
            ratingData.totalReviews
          })`,
          icon: <StarIcon className="h-6 w-6 text-white" />,
          bgColor: "bg-[#4068F4]",
        },
        {
          title: "Completion Rate",
          value: `${(analytics.completionRate || 0).toFixed(0)}%`,
          icon: <ChartBarIcon className="h-6 w-6 text-white" />,
          bgColor: "bg-[#4068F4]",
        },
        {
          title: "Total Earnings",
          value: `₱${(analytics.totalRevenue || 0).toFixed(2)}`,
          icon: <ChartPieIcon className="h-6 w-6 text-white" />,
          bgColor: "bg-[#4068F4]",
        },
      ];
    } catch (err) {
      console.error("Error calculating stats:", err);
      return defaultStats;
    }
  }, [analytics, getRevenueByPeriod, ratingData]);

  const statPairs: Array<typeof stats> = [];
  for (let i = 0; i < stats.length; i += 2) {
    statPairs.push(stats.slice(i, i + 2));
  }

  const renderCards = () => {
    const content = (stat: (typeof stats)[0], index: number) => (
      <div
        key={index}
        className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm"
      >
        <div
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${stat.bgColor}`}
        >
          {stat.icon}
        </div>
        <div>
          <p className="text-xl font-bold text-gray-800">{stat.value}</p>
          <p className="text-sm text-gray-500">{stat.title}</p>
        </div>
      </div>
    );

    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {isLoading
          ? Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="flex w-64 flex-shrink-0 flex-col gap-4"
              >
                <div className="flex animate-pulse items-center gap-4 rounded-2xl bg-white p-4 shadow-sm">
                  <div className="h-10 w-10 rounded-full bg-gray-300"></div>
                  <div className="flex-1">
                    <div className="mb-2 h-6 w-3/4 rounded bg-gray-200"></div>
                    <div className="h-4 w-1/2 rounded bg-gray-200"></div>
                  </div>
                </div>
                <div className="flex animate-pulse items-center gap-4 rounded-2xl bg-white p-4 shadow-sm">
                  <div className="h-10 w-10 rounded-full bg-gray-300"></div>
                  <div className="flex-1">
                    <div className="mb-2 h-6 w-3/4 rounded bg-gray-200"></div>
                    <div className="h-4 w-1/2 rounded bg-gray-200"></div>
                  </div>
                </div>
              </div>
            ))
          : statPairs.map((pair, index) => (
              <div
                key={index}
                className="flex w-64 flex-shrink-0 flex-col gap-4"
              >
                {pair.map((stat, statIndex) => content(stat, statIndex))}
              </div>
            ))}
      </div>
    );
  };

  const renderCharts = () => {
    return (
      <div
        className={`grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-2 lg:gap-8 xl:grid-cols-2 ${className}`}
      >
        {isLoading ? (
          <>
            <div className="h-90 w-full animate-pulse rounded-lg bg-gray-200"></div>
            <div className="h-90 w-full animate-pulse rounded-lg bg-gray-200"></div>
            <div className="h-90 w-full animate-pulse rounded-lg bg-gray-200"></div>
            <div className="h-90 w-full animate-pulse rounded-lg bg-gray-200"></div>
          </>
        ) : (
          <>
            <div className="h-90 rounded-lg bg-white p-6 shadow-md">
              <BookingStatusPieChart />
            </div>
            <div className="h-90 rounded-lg bg-white p-6 shadow-md">
              <MonthlyRevenueLineChart />
            </div>
            <div className="h-90 rounded-lg bg-white p-6 shadow-md">
              <DailyBookingsBarChart />
            </div>
            <div className="flex h-90 items-center justify-center rounded-lg bg-white p-6 shadow-md">
              <CustomerRatingStars />
            </div>
          </>
        )}
      </div>
    );
  };

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
      <h1 className="mb-6 pt-6 text-xl font-extrabold text-black sm:text-2xl md:text-3xl">
        Dashboard
      </h1>

      <div className="mb-6 flex flex-col items-center justify-between gap-4 rounded-lg bg-white p-6 shadow-md md:flex-row">
        <div className="text-center md:text-left">
          <p className="text-sm font-semibold text-gray-500">
            Outstanding Commission
          </p>
          <p className="text-3xl font-bold text-gray-900">
            ₱{outstandingCommission.toFixed(2)}
          </p>
        </div>
        <button
          onClick={handlePayClick} // Add the onClick handler
          className="w-full rounded-full bg-blue-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 md:w-auto"
        >
          Pay Commission
        </button>
      </div>

      {isMobile ? renderCards() : renderCharts()}
    </div>
  );
};

export default ProviderStats;
