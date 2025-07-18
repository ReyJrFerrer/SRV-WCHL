import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { 
    ArrowLeftIcon, 
    ClockIcon, 
    UserIcon, 
    MapPinIcon, 
    CalendarIcon, 
    CurrencyDollarIcon, 
    CameraIcon, 
    CheckCircleIcon, 
    PaperAirplaneIcon, 
    PhoneIcon 
} from '@heroicons/react/24/solid'; 

import BottomNavigation from '@app/components/provider/BottomNavigationNextjs';
import { useProviderBookingManagement, ProviderEnhancedBooking } from '../../../hooks/useProviderBookingManagement';

const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const ActiveServicePage: React.FC = () => {
  const router = useRouter();
  const { bookingId, startTime: startTimeParam } = router.query;
  const [actualStartTime, setActualStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  // Use the enhanced hook instead of mock data
  const {
    getBookingById,
    completeBookingById,
    loading,
    error,
    isProviderAuthenticated
  } = useProviderBookingManagement();

  // Get booking data from hook
  const booking = useMemo(() => {
    if (bookingId && typeof bookingId === 'string') {
      return getBookingById(bookingId);
    }
    return null;
  }, [bookingId, getBookingById]);

  useEffect(() => {
    if (booking) {
      if (typeof startTimeParam === 'string') {
        setActualStartTime(new Date(startTimeParam));
      } else if (booking.scheduledDate) {
        setActualStartTime(new Date(booking.scheduledDate));
      } else {
        setActualStartTime(new Date()); 
      }
    }
  }, [booking, startTimeParam]);

  useEffect(() => {
    let timerInterval: NodeJS.Timeout;
    if (actualStartTime) {
      timerInterval = setInterval(() => {
        const now = new Date();
        const diffSeconds = Math.floor((now.getTime() - actualStartTime.getTime()) / 1000);
        setElapsedTime(diffSeconds > 0 ? diffSeconds : 0);
      }, 1000);
    }
    return () => clearInterval(timerInterval);
  }, [actualStartTime]);

  
  const handleMarkCompleted = async () => {
    if (!booking) return;
    
    
    // Just redirect to the complete service page without calling completeBookingById
    // The actual completion will be handled in the complete-service page
    router.push(`/provider/complete-service/${booking.id}`);
  };

  const handleUploadEvidence = () => { 
    alert('Upload evidence functionality to be implemented.'); 
  };
  
  const handleContactClient = () => { 
    if (booking?.clientPhone) {
      window.open(`tel:${booking.clientPhone}`, '_self');
    } else {
      alert(`Contact client: ${booking?.clientName || 'Unknown Client'}`); 
    }
  };

  // Check authentication
  if (!isProviderAuthenticated()) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500 p-4 text-center">
        Please log in as a service provider to access this page.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500 p-4 text-center">
        Error: {error}
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500 p-4 text-center">
        Booking not found or an error occurred.
      </div>
    );
  }

  // Ensure booking is in the correct status for active service
  if (booking.status !== 'InProgress') {
    return (
      <div className="min-h-screen flex items-center justify-center text-orange-500 p-4 text-center">
        This booking is not currently in progress. Current status: {booking.status}
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Active Service: {booking.serviceName|| 'Service'} | SRV Provider</title>
      </Head>
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <header className="bg-white shadow-sm sticky top-0 z-20 px-4 py-3">
          <div className="container mx-auto flex items-center">
            <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-100 mr-2 transition-colors" aria-label="Go back">
              <ArrowLeftIcon className="h-5 w-5 text-gray-700" />
            </button>
            <h1 className="text-xl font-semibold text-gray-800 truncate">Service In Progress</h1>
          </div>
        </header>

        <main className="flex-grow container mx-auto p-4 sm:p-6 space-y-6 pb-20">
          {/* Timer Section - Prominent at the top */}
          <section className="bg-white p-6 rounded-xl shadow-lg text-center">
            <ClockIcon className="h-12 w-12 sm:h-16 sm:h-16 text-blue-500 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Elapsed Time</p>
            <p className="text-3xl sm:text-4xl font-bold text-gray-800 tabular-nums">{formatDuration(elapsedTime)}</p>
            {actualStartTime && <p className="text-xs text-gray-400 mt-1">Started: {actualStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>}
          </section>

          {/* Details and Actions Section - Becomes two-column on wider screens */}
          <div className="md:flex md:gap-6 lg:gap-8">
            {/* Left Column: Booking Details */}
            <section className="bg-white p-4 sm:p-6 rounded-xl shadow-lg md:flex-1 w-full">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">
                {booking.serviceName || 'Service'}
              </h2>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-center">
                  <UserIcon className="h-5 w-5 mr-2.5 text-gray-400 flex-shrink-0" />
                  Client: <span className="font-medium text-gray-800 ml-1">{booking.clientName || 'Unknown Client'}</span>
                </div>
                {booking.clientPhone && (
                  <div className="flex items-center">
                    <PhoneIcon className="h-5 w-5 mr-2.5 text-gray-400 flex-shrink-0" />
                    Contact: <a href={`tel:${booking.clientPhone}`} className="font-medium text-blue-600 hover:underline ml-1">{booking.clientPhone}</a>
                  </div>
                )}
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2.5 text-gray-400 flex-shrink-0" />
                  Scheduled: <span className="font-medium text-gray-800 ml-1">
                    {booking.scheduledDate 
                      ? new Date(booking.scheduledDate).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : new Date(booking.requestedDate).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                    }
                  </span>
                </div>
                <div className="flex items-start">
                  <MapPinIcon className="h-5 w-5 mr-2.5 text-gray-400 flex-shrink-0 mt-0.5" />
                  Location: <span className="font-medium text-gray-800 ml-1 break-words">{booking.formattedLocation || 'Location not specified'}</span>
                </div>
                <div className="flex items-center">
                  <CurrencyDollarIcon className="h-5 w-5 mr-2.5 text-gray-400 flex-shrink-0" />
                  Price: <span className="font-medium text-green-600 ml-1">₱{Number(booking.price).toFixed(2)}</span>
                </div>
              </div>
            </section>

            {/* Right Column: Actions */}
            <section className="bg-white p-4 sm:p-6 rounded-xl shadow-lg mt-6 md:mt-0 md:w-auto lg:w-1/3 xl:w-1/4 md:max-w-xs">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={handleUploadEvidence}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <CameraIcon className="h-5 w-5"/> Upload Evidence
                </button>
                <button
                  onClick={handleContactClient}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <PaperAirplaneIcon className="h-5 w-5"/> Contact Client
                </button>
                <button
                  onClick={handleMarkCompleted}
                  className="w-full px-4 py-3 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 mt-2"
                >
                  <CheckCircleIcon className="h-5 w-5"/> Mark as Completed
                </button>
              </div>
            </section>
          </div>
        </main>
        <div className="lg:hidden"> <BottomNavigation /> </div>
      </div>
    </>
  );
};

export default ActiveServicePage;