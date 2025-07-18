import React, { useState, useMemo, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import BottomNavigationNextjs from '../../../components/client/BottomNavigationNextjs';
import ClientBookingItemCard from '../../../components/client/ClientBookingItemCard';
import { useBookingManagement, EnhancedBooking } from '../../../hooks/bookingManagement';
import { ArrowLeftIcon, ClipboardDocumentListIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

type BookingStatusTab = 'ALL' | 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
const TAB_ITEMS: BookingStatusTab[] = ['ALL', 'PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

const MyBookingsPage: NextPage = () => {
  const router = useRouter();
  const { tab: queryTab } = router.query;
  const bookingManagement = useBookingManagement();

  const [activeTab, setActiveTab] = useState<BookingStatusTab>('ALL');

  useEffect(() => {
    let targetTab: BookingStatusTab = 'ALL';
    let shouldRedirect = false;
    let redirectTabQuery = 'all';

    if (queryTab) {
      let singleQueryTab: string | undefined = undefined;
      if (typeof queryTab === 'string') {
        singleQueryTab = queryTab;
      } else if (Array.isArray(queryTab) && queryTab.length > 0) {
        singleQueryTab = queryTab[0];
      }

      if (singleQueryTab) {
        const upperCaseQueryTab = singleQueryTab.toUpperCase() as BookingStatusTab;
        if (TAB_ITEMS.includes(upperCaseQueryTab)) {
          targetTab = upperCaseQueryTab;
        } else {
          shouldRedirect = true;
        }
      } else {
        if (queryTab !== undefined) shouldRedirect = true;
      }
    }

    if (activeTab !== targetTab) {
      setActiveTab(targetTab);
    }

    if (shouldRedirect && (typeof queryTab !== 'string' || queryTab.toLowerCase() !== redirectTabQuery)) {
      router.push({ pathname: '/client/booking', query: { tab: redirectTabQuery } }, undefined, { shallow: true });
    }
  }, [queryTab, router, activeTab]);

  // Filter bookings based on active tab
  const filteredBookings = useMemo(() => {
    if (!Array.isArray(bookingManagement.bookings)) {
      console.error("bookingManagement.bookings is not an array!", bookingManagement.bookings);
      return [];
    }

    const validBookings = bookingManagement.bookings.filter(booking => {
      if (!booking) {
        console.warn("Undefined/null booking object found in bookings and removed before tab filtering.");
        return false;
      }
      if (typeof booking.status !== 'string') {
        console.warn("Booking object missing or has invalid status, removed before tab filtering:", booking);
        return false;
      }
      return true;
    });

    if (activeTab === 'ALL') {
     
      return validBookings;
    }

    // Map tab names to booking status values to match your booking management hook
    const statusMapping: Record<BookingStatusTab, string[]> = {
      'ALL': [],
      'PENDING': ['Requested', 'Pending'],
      'CONFIRMED': ['Accepted', 'Confirmed'],
      'IN_PROGRESS': ['InProgress', 'In_Progress'],
      'COMPLETED': ['Completed'],
      'CANCELLED': ['Cancelled', 'Declined']
    };

    const statusesToMatch = statusMapping[activeTab] || [];
    return validBookings.filter(booking => 
      statusesToMatch.some(status => 
        booking.status.toLowerCase() === status.toLowerCase()
      )
    );
  }, [activeTab, bookingManagement.bookings]);

  // Get bookings count for each tab
  const getBookingCountForTab = (tab: BookingStatusTab) => {
    if (!bookingManagement.bookings) return 0;
    if (tab === 'ALL') return bookingManagement.bookings.length;
    
    const statusMapping: Record<BookingStatusTab, string[]> = {
      'ALL': [],
      'PENDING': ['Requested', 'Pending'],
      'CONFIRMED': ['Accepted', 'Confirmed'],
      'IN_PROGRESS': ['InProgress', 'In_Progress'],
      'COMPLETED': ['Completed'],
      'CANCELLED': ['Cancelled', 'Declined']
    };

    const statusesToMatch = statusMapping[tab] || [];
    return bookingManagement.bookings.filter(booking => 
      booking.status && statusesToMatch.some(status => 
        booking.status.toLowerCase() === status.toLowerCase()
      )
    ).length;
  };


  // Handle cancel booking
  const handleCancelBookingOnListPage = async (bookingId: string) => {
    if (window.confirm("Are you sure you want to cancel this booking?")) {
      try {
        await bookingManagement.updateBookingStatus(bookingId, 'Cancelled');
        alert(`Booking ${bookingId} has been cancelled successfully.`);
      } catch (error) {
        console.error('Error cancelling booking:', error);
        alert('Failed to cancel booking. Please try again.');
      }
    }
  };

  return (
    <>
      <Head>
        <title>My Bookings - SRV</title>
        <meta name="description" content="View and manage your bookings" />
      </Head>
      
      <div className="min-h-screen bg-gray-100 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-20 px-4 py-3">
          <div className="container mx-auto flex items-center">
            <button 
              onClick={() => router.push('/client/home')}
              className="p-2 rounded-full hover:bg-gray-100 mr-2 transition-colors md:hidden"
              aria-label="Back to Home"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-700" />
            </button>
            <h1 className="text-xl font-semibold text-slate-800 text-center flex-grow md:text-left">Aking Bookings</h1>
          </div>
        </header>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200 sticky top-[57px] z-10 overflow-x-auto whitespace-nowrap hide-scrollbar">
          <nav className="flex space-x-1 p-1.5 sm:p-2 justify-start sm:justify-around">
            {TAB_ITEMS.map(tab => (
              <button
                key={tab}
                onClick={() => {
                  router.push({ pathname: '/client/booking', query: { tab: tab.toLowerCase() } }, undefined, { shallow: true });
                }}
                className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-md flex-shrink-0 transition-colors duration-150
                            ${activeTab === tab 
                                ? 'bg-blue-600 text-white shadow-sm' 
                                : 'text-gray-500 hover:bg-gray-200 hover:text-slate-700'}`}
              >
                {tab.replace('_', ' ')} ({getBookingCountForTab(tab)})
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <main className="flex-grow container mx-auto p-3 sm:p-4 pb-20">
          {bookingManagement.loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Niloload ang iyong mga bookings...</p>
            </div>
          ) : bookingManagement.error ? (
            <div className="text-center py-16 bg-white rounded-lg shadow mt-4">
              <ExclamationTriangleIcon className="h-16 w-16 text-red-300 mx-auto mb-4" />
              <p className="text-red-500 text-lg mb-4">{bookingManagement.error}</p>
              <button
                onClick={() => bookingManagement.retryOperation('loadBookings')}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Ulitin
              </button>
            </div>
          ) : filteredBookings.length > 0 ? (
            <div className="space-y-4 md:space-y-6">
              {filteredBookings.map(booking => (
                <ClientBookingItemCard 
                  key={booking.id}
                  booking={booking}
                  onCancelBooking={handleCancelBookingOnListPage}
                />
        
              )
              )}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-lg shadow mt-4">
              <ClipboardDocumentListIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Walang booking na nahanap sa kategoryang: "{activeTab.replace('_', ' ')}" .</p>
            </div>
          )}
        </main>

        {/* Bottom Navigation */}
        <BottomNavigationNextjs />
      </div>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>
    </>
  );
};

export default MyBookingsPage;
