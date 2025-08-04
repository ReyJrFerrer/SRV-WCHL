import React from "react";
import { ArrowRightIcon } from "@heroicons/react/24/solid";
import { Link } from "react-router-dom";

interface BookingRequestsProps {
  pendingRequests?: number;
  upcomingJobs?: number;
  className?: string;
}

const BookingRequests: React.FC<BookingRequestsProps> = ({
  pendingRequests = 0,
  upcomingJobs = 0,
  className = "",
}) => {
  return (
    <div className={className}>
      <h2 className="mb-6 pt-6 text-xl font-extrabold text-black sm:text-2xl md:text-3xl">
        Bookings
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Pending Requests Card */}
        <div className="flex flex-col rounded-xl border-t-[16px] border-[#FFD32C] bg-white p-6 pt-4 shadow-md transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg">
          <div className="flex-1">
            <div className="mb-4 flex items-center space-x-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FFD32C]">
                <span className="text-3xl font-bold text-white">
                  {pendingRequests}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-black">
                  Pending Requests
                </span>
                <span className="text-sm text-gray-500">
                  Need your response
                </span>
              </div>
            </div>
          </div>
          <Link
            to="/provider/bookings?tab=pending"
            className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4 text-base font-semibold text-gray-700 hover:text-yellow-600"
          >
            <span className="text-sm sm:text-base">View Requests</span>
            <ArrowRightIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          </Link>
        </div>

        {/* Upcoming Jobs Card */}
        <div className="flex flex-col rounded-xl border-t-[16px] border-[#FFD32C] bg-white p-6 pt-4 shadow-md transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg">
          <div className="flex-1">
            <div className="mb-4 flex items-center space-x-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FFD32C]">
                <span className="text-3xl font-bold text-white">
                  {upcomingJobs}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-black">
                  Upcoming Jobs
                </span>
                <span className="text-sm text-gray-500">
                  Scheduled services
                </span>
              </div>
            </div>
          </div>
          <Link
            to="/provider/bookings?tab=upcoming"
            className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4 text-base font-semibold text-gray-700 hover:text-yellow-600"
          >
            <span className="text-sm sm:text-base">View Schedule</span>
            <ArrowRightIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookingRequests;
