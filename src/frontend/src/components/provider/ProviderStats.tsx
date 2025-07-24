import React from 'react';
import {
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  StarIcon,
  ChartBarIcon,
  BanknotesIcon,
  ChartPieIcon, // Added for 'Total Income' based on UI
} from '@heroicons/react/24/solid';
import { useProviderBookingManagement } from '../../hooks/useProviderBookingManagement';
import { useProviderReviews } from '../../hooks/reviewManagement';

interface ProviderStatsProps {
  className?: string;
  loading?: boolean;
}

const ProviderStats: React.FC<ProviderStatsProps> = ({
  className = '',
  loading: externalLoading = false,
}) => {
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

  const isLoading = externalLoading || bookingLoading || reviewsLoading;
  const hasError = error || reviewsError;

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
        title: 'Earnings This Month',
        value: '₱0.00',
        icon: <BanknotesIcon className="h-6 w-6 text-white" />, 
        bgColor: 'bg-[#4068F4]',
      },
      {
        title: 'Pending Payout',
        value: '₱0.00',
        icon: <ClockIcon className="h-6 w-6 text-white" />,
        bgColor: 'bg-[#4068F4]',
      },
      {
        title: 'Completed Jobs',
        value: '0',
        icon: <CheckCircleIcon className="h-6 w-6 text-white" />,
        bgColor: 'bg-[#4068F4]',
      },
      {
        title: 'Customer Rating',
        value: '0 (0)',
        icon: <StarIcon className="h-6 w-6 text-white" />,
        bgColor: 'bg-[#4068F4]',
      },
      {
        title: 'Completion Rate',
        value: '0%',
        icon: <ChartBarIcon className="h-6 w-6 text-white" />,
        bgColor: 'bg-[#4068F4]',
      },
      {
        title: 'Total Earnings', // Changed title to match UI's "Total Income"
        value: '₱0.00',
        icon: <ChartPieIcon className="h-6 w-6 text-white" />, 
        bgColor: 'bg-[#4068F4]',
      },
    ];

    if (!analytics) {
      return defaultStats.map((stat) => {
        if (stat.title === 'Customer Rating') {
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
      const monthlyRevenue = getRevenueByPeriod('month');
      const pendingPayout = analytics.expectedRevenue || 0;

      return [
        {
          title: 'Earnings This Month',
          value: `₱${monthlyRevenue.toFixed(2)}`,
          icon: <BanknotesIcon className="h-6 w-6 text-white" />,
          bgColor: 'bg-[#4068F4]',
        },
        {
          title: 'Pending Payout',
          value: `₱${pendingPayout.toFixed(2)}`,
          icon: <ClockIcon className="h-6 w-6 text-white" />,
          bgColor: 'bg-[#4068F4]',
        },
        {
          title: 'Completed Jobs',
          value: (analytics.completedBookings || 0).toString(),
          icon: <CheckCircleIcon className="h-6 w-6 text-white" />,
          bgColor: 'bg-[#4068F4]',
        },
        {
          title: 'Customer Rating',
          value: `${ratingData.averageRating.toFixed(1)} (${
            ratingData.totalReviews
          })`,
          icon: <StarIcon className="h-6 w-6 text-white" />,
          bgColor: 'bg-[#4068F4]',
        },
        {
          title: 'Completion Rate',
          value: `${(analytics.completionRate || 0).toFixed(0)}%`,
          icon: <ChartBarIcon className="h-6 w-6 text-white" />,
          bgColor: 'bg-[#4068F4]',
        },
        {
          title: 'Total Earnings', // Changed title to match UI's "Total Income"
          value: `₱${(analytics.totalRevenue || 0).toFixed(2)}`,
          icon: <ChartPieIcon className="h-6 w-6 text-white" />,
          bgColor: 'bg-[#4068F4]',
        },
      ];
    } catch (err) {
      console.error('Error calculating stats:', err);
      return defaultStats;
    }
  }, [analytics, getRevenueByPeriod, ratingData]);

  const statPairs: Array<typeof stats> = [];
  for (let i = 0; i < stats.length; i += 2) {
    statPairs.push(stats.slice(i, i + 2));
  }

  if (hasError) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">
            Error loading stats: {error?.message || reviewsError?.message || 'Unknown error'}
          </p>
        </div>
      </div>
    );
  }

  const renderCards = (isMobileView: boolean) => {
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

    if (isMobileView) {
      return (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {isLoading ? (
            // Mobile Skeleton Loading
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex w-64 flex-shrink-0 flex-col gap-4">
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
          ) : (
            // Mobile Actual Content
            statPairs.map((pair, index) => (
              <div key={index} className="flex w-64 flex-shrink-0 flex-col gap-4">
                {pair.map((stat, statIndex) => content(stat, statIndex))}
              </div>
            ))
          )}
        </div>
      );
    } else {
      return (
        <div className="grid grid-cols-2 gap-4 pb-4">
          {isLoading ? (
            // PC Skeleton Loading
            Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="flex animate-pulse items-center gap-4 rounded-2xl bg-white p-4 shadow-sm"
              >
                <div className="h-10 w-10 rounded-full bg-gray-300"></div>
                <div className="flex-1">
                  <div className="mb-2 h-6 w-3/4 rounded bg-gray-200"></div>
                  <div className="h-4 w-1/2 rounded bg-gray-200"></div>
                </div>
              </div>
            ))
          ) : (
            // PC Actual Content
            stats.map((stat, index) => content(stat, index))
          )}
        </div>
      );
    }
  };

  return (
    <div>
      <h1 className="mb-6 pt-6 text-4xl font-extrabold text-black">Dashboard</h1>
      <div className={className}>
        {/* Mobile View */}
        <div className="md:hidden">{renderCards(true)}</div>

        {/* PC View */}
        <div className="hidden md:block">{renderCards(false)}</div>
      </div>
    </div>
  );
};

export default ProviderStats;