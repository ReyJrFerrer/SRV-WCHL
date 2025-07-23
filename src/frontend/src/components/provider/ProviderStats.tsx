import React from "react";
import {
  MapPinIcon,
  ClockIcon,
  StarIcon,
  CheckCircleIcon,
  ChartBarIcon,
  ChartPieIcon,
  BanknotesIcon,
} from "@heroicons/react/24/solid";
import { useProviderBookingManagement } from "../../hooks/useProviderBookingManagement";
import { useProviderReviews } from "../../hooks/reviewManagement";

interface ProviderStatsProps {
  className?: string;
  loading?: boolean;
}

const ProviderStats: React.FC<ProviderStatsProps> = ({
  className = "",
  loading: externalLoading = false,
}) => {
  const { loading: bookingLoading, error } = useProviderBookingManagement();
  const { loading: reviewsLoading, error: reviewsError } = useProviderReviews();

  const isLoading = externalLoading || bookingLoading || reviewsLoading;
  const hasError = error || reviewsError;

  const stats = React.useMemo(() => {
    return [
      {
        title: "Earnings this month",
        value: "₱ 1200.00",
        icon: <BanknotesIcon className="h-6 w-6 text-white" />,
        bgColor: "bg-[#4068F4]",
      },
      {
        title: "Pending payout",
        value: "₱ 300.00",
        icon: <ClockIcon className="h-6 w-6 text-white" />,
        bgColor: "bg-[#4068F4]",
      },
      {
        title: "Finished Jobs",
        value: "5",
        icon: <CheckCircleIcon className="h-6 w-6 text-white" />,
        bgColor: "bg-[#4068F4]",
      },
      {
        title: "Customer Rating",
        value: "4.3",
        icon: <StarIcon className="h-6 w-6 text-white" />,
        bgColor: "bg-[#4068F4]",
      },
      {
        title: "Completion rate",
        value: "75%",
        icon: <ChartBarIcon className="h-6 w-6 text-white" />,
        bgColor: "bg-[#4068F4]",
      },
      {
        title: "Total Income",
        value: "₱ 2,300",
        icon: <ChartPieIcon className="h-6 w-6 text-white" />,
        bgColor: "bg-[#4068F4]",
      },
    ];
  }, []);

  const statPairs: Array<typeof stats> = [];
  for (let i = 0; i < stats.length; i += 2) {
    statPairs.push(stats.slice(i, i + 2));
  }

  if (hasError) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">
            Error loading stats. {error || reviewsError}
          </p>
        </div>
      </div>
    );
  }

  const renderCards = (isMobileView: boolean) => {
    // Shared card rendering logic
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
          {statPairs.map((pair, index) => (
            <div key={index} className="flex w-64 flex-shrink-0 flex-col gap-4">
              {pair.map((stat, statIndex) => content(stat, statIndex))}
            </div>
          ))}
        </div>
      );
    } else {
      return (
        <div className="grid grid-cols-2 gap-4 pb-4">
          {stats.map((stat, index) => content(stat, index))}
        </div>
      );
    }
  };

  return (
    <div>
      <h1 className="mb-6 pt-6 text-4xl font-extrabold text-black">
        Dashboard
      </h1>
      <div className={className}>
        {/* Mobile View */}
        <div className="md:hidden">
          {isLoading ? (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {Array.from({ length: 3 }).map((_, index) => (
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
              ))}
            </div>
          ) : (
            renderCards(true)
          )}
        </div>

        {/* PC View */}
        <div className="hidden md:block">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 pb-4">
              {Array.from({ length: 6 }).map((_, index) => (
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
              ))}
            </div>
          ) : (
            renderCards(false)
          )}
        </div>
      </div>
    </div>
  );
};

export default ProviderStats;
