import React from "react";
import {
  CalendarDaysIcon,
  CalendarIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/solid";
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
    <div className="booking-cards my-6 grid grid-cols-1 gap-4 md:grid-cols-2">
      {/* Pending Requests Card */}
      <div className="booking-card flex flex-col rounded-lg border-l-4 border-blue-600 bg-white p-5 shadow-md">
        <div className="booking-card-header mb-3 flex items-center justify-between">
          <h3 className="text-base font-bold text-black sm:text-lg">
            Naghihintay na mga Request
          </h3>
          <CalendarDaysIcon className="h-6 w-6 text-blue-600" />
        </div>
        <p className="mb-4 flex-grow text-sm text-blue-600">
          Mayroon kang{" "}
          <span className="text-2xl font-bold">{pendingRequests}</span>{" "}
          {pendingRequests === 1 ? "request" : "requests"} na kailangan ng iyong
          sagot.
        </p>
        <Link
          to="/provider/bookings?tab=Pending"
          className="mt-auto flex items-center justify-between text-sm font-semibold text-blue-600 hover:text-yellow-400"
        >
          <span>Tignan ang mga Requests</span>
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
      {/* Upcoming Jobs Card */}
      <div className="booking-card flex flex-col rounded-lg border-l-4 border-blue-600 bg-white p-5 shadow-md">
        <div className="booking-card-header mb-3 flex items-center justify-between">
          <h3 className="text-base font-bold text-black sm:text-lg">
            Serbisyong Nakaiskedyul
          </h3>
          <CalendarIcon className="h-6 w-6 text-blue-600" />
        </div>
        <p className="mb-4 flex-grow text-sm text-blue-600">
          Mayroon kang{" "}
          <span className="text-2xl font-bold">{upcomingJobs}</span>{" "}
          {upcomingJobs === 1 ? "service" : "services"} na nakaiskedyul.
        </p>
        <Link
          to="/provider/bookings?tab=Upcoming"
          className="mt-auto flex items-center justify-between text-sm font-semibold text-blue-600 hover:text-yellow-400"
        >
          <span>Tignan ang mga Requests</span>
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};

export default BookingRequests;
