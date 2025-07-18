import React, { useState } from 'react';
import { CalendarDaysIcon, CalendarIcon, ArrowRightIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

interface BookingRequestsProps {
  pendingRequests?: number;
  upcomingJobs?: number;
  className?: string;
}


const BookingRequestsNextjs: React.FC<BookingRequestsProps> = ({ 
  pendingRequests = 0, 
  upcomingJobs = 0,    
  className = '' 
}) => {
  return (
    <div className="booking-cards grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
  {/* Pending Requests Card */}
        <div className="booking-card bg-white border-l-4 border-blue-600 flex flex-col p-5 rounded-lg shadow-md">
        <div className="booking-card-header flex justify-between items-center mb-3">
          <h3 className="font-bold text-black text-base sm:text-lg">Naghihintay na mga Request</h3>
          <CalendarDaysIcon className="h-6 w-6 text-blue-600" />
        </div>
          <p className="text-blue-600 text-sm mb-4 flex-grow">
          Mayroon kang <span className="font-bold text-2xl">{pendingRequests}</span> {pendingRequests === 1 ? 'request' : 'requests'} na kailangan ng iyong sagot.
        </p>
        <Link href="/provider/bookings?tab=Pending" legacyBehavior>
           <a className="mt-auto flex justify-between items-center text-blue-600 hover:text-yellow-400 font-semibold text-sm">
            <span>Tignan ang mga Requests</span>
            <ArrowRightIcon className="h-4 w-4" />
          </a>
        </Link>
      </div>
      {/* Upcoming Jobs Card */}
      <div className="booking-card bg-white border-l-4 border-blue-600 flex flex-col p-5 rounded-lg shadow-md">
        <div className="booking-card-header flex justify-between items-center mb-3">
          <h3 className="font-bold text-black text-base sm:text-lg">Serbisyong Nakaiskedyul</h3>
          <CalendarIcon className="h-6 w-6 text-blue-600" />
        </div>
       <p className="text-blue-600 text-sm mb-4 flex-grow">
          Mayroon kang <span className="font-bold text-2xl">{upcomingJobs}</span> {upcomingJobs === 1 ? 'service' : 'services'} na nakaiskedyul.
        </p>
        <Link href="/provider/bookings?tab=Upcoming" legacyBehavior>
            <a className="mt-auto flex justify-between items-center text-blue-600 hover:text-yellow-400 font-semibold text-sm">
            <span>Tignan ang mga Requests</span>
            <ArrowRightIcon className="h-4 w-4" />
          </a>
        </Link>
      </div>
    </div>
  );
};

export default BookingRequestsNextjs;