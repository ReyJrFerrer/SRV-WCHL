import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router'; 
import BottomNavigation from '@app/components/provider/BottomNavigationNextjs';
import ProviderBookingItemCard from '@app/components/provider/ProviderBookingItemCard';
import { useProviderBookingManagement, ProviderEnhancedBooking } from '../../hooks/useProviderBookingManagement';

type BookingStatusTab = 'Pending' | 'Upcoming' | 'Completed' | 'Cancelled' | 'InProgress';
const TAB_ITEMS: BookingStatusTab[] = ['Pending', 'Upcoming', 'InProgress', 'Completed', 'Cancelled'];

const ProviderBookingsPage: React.FC = () => {
  const router = useRouter();
  const { tab: queryTab } = router.query; 

  const [activeTab, setActiveTab] = useState<BookingStatusTab>('Pending'); 
  
  // Use the provider booking management hook
  const {
    bookings,
    loading,
    error,
    refreshing,
    getPendingBookings,
    getUpcomingBookings,
    getCompletedBookings,
    getBookingsByStatus,
    clearError,
    refreshBookings,
    isProviderAuthenticated
  } = useProviderBookingManagement();

  useEffect(() => {
    if (typeof queryTab === 'string' && TAB_ITEMS.includes(queryTab as BookingStatusTab)) {
      setActiveTab(queryTab as BookingStatusTab);
    } else if (!queryTab) {
        setActiveTab('Pending');
    }
  }, [queryTab]); 

  // Categorize bookings based on the hook's filtering functions
  const categorizedBookings = useMemo(() => {
    // Combine cancelled and declined bookings in the cancelled tab
    const cancelledBookings = getBookingsByStatus('Cancelled');
    const declinedBookings = getBookingsByStatus('Declined');
    const combinedCancelledBookings = [...cancelledBookings, ...declinedBookings];

    return {
      Pending: getPendingBookings(),
      Upcoming: getUpcomingBookings(),
      Completed: getCompletedBookings(),
      Cancelled: combinedCancelledBookings, // Include both cancelled and declined
      InProgress: bookings.filter(booking => booking.status === 'InProgress'),
    };
  }, [getPendingBookings, getUpcomingBookings, getCompletedBookings, getBookingsByStatus, bookings]);

  const currentBookings: ProviderEnhancedBooking[] = categorizedBookings[activeTab] || [];

  // Handle retry functionality
  const handleRetry = async () => {
    clearError();
    try {
      await refreshBookings();
    } catch (error) {
      console.error('❌ Failed to retry loading bookings:', error);
    }
  };

  // Show authentication error if not authenticated as provider
  if (!isProviderAuthenticated() && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Hala!</h1>
          <p className="text-gray-600 mb-4">
            Kailangan mong nakalogin bilang isang tagapagbigay serbisyo upang magpatuloy
          </p>
          <button
            onClick={() => router.push('/provider/login')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Balik sa Login
          </button>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Niloload ang iyong mga bookings...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && bookings.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Hindi maload ang mga bookings</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-3">
            <button
              onClick={() => router.push('/provider/dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Balik sa Dashboard
            </button>
            <button
              onClick={handleRetry}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg transition-colors"
            >
              Ulitin
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>My Bookings | SRV Provider</title>
        <meta name="description" content="Manage your service bookings" />
      </Head>
      <div className="min-h-screen bg-gray-100 flex flex-col">
        {/* Error Display */}
        {error && (
          <div className="mx-4 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-red-600 text-sm">{error}</span>
              </div>
              <button
                onClick={clearError}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Isara
              </button>
            </div>
          </div>
        )}

        {/* Refresh indicator */}
        {refreshing && (
          <div className="mx-4 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-blue-600 text-sm">Nirerefresh ang mga bookings...</span>
            </div>
          </div>
        )}

        <header className="bg-white shadow-sm sticky top-0 z-20 px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-800">Aking Bookings</h1>
            <button
              onClick={refreshBookings}
              disabled={refreshing}
              className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
              title="Refresh bookings"
            >
              <svg className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </header>

        <div className="bg-white border-b border-gray-200 sticky top-[73px] z-10">
          <nav className="flex space-x-1 sm:space-x-2 p-1 sm:p-2 justify-around">
            {TAB_ITEMS.map(tab => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                }}
                className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-md flex-grow text-center transition-colors
                            ${activeTab === tab 
                                ? 'bg-blue-600 text-white shadow-sm' 
                                : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'}`}
              >
                {tab} ({categorizedBookings[tab]?.length || 0})
              </button>
            ))}
          </nav>
        </div>

        <main className="flex-grow overflow-y-auto pb-20">
          {currentBookings.length > 0 ? (
            <div className="space-y-4 p-4">
              {currentBookings.map(booking => (
                <div 
                  key={booking.id}
                  onClick={() => {
                    // If it's an InProgress booking, navigate to active service page
                    if (activeTab === 'InProgress' && booking.status === 'InProgress') {
                      router.push(`/provider/active-service/${booking.id}`);
                    }
                  }}
                  className={`w-full ${activeTab === 'InProgress' ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
                >
                  <ProviderBookingItemCard 
                      booking={booking}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="mb-4">
                {activeTab === 'Pending' && (
                  <div className="text-6xl mb-4">⏳</div>
                )}
                {activeTab === 'Upcoming' && (
                  <div className="text-6xl mb-4">📅</div>
                )}
                {activeTab === 'Completed' && (
                  <div className="text-6xl mb-4">✅</div>
                )}
                {activeTab === 'Cancelled' && (
                  <div className="text-6xl mb-4">❌</div>
                )}
                {activeTab === 'InProgress' && (
                  <div className="text-6xl mb-4">🔄</div>
                )}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Walang {activeTab.toLowerCase()} bookings
              </h3>
              <p className="text-gray-500 mb-6">
                {activeTab === 'Pending' && "Wala kang naghihintay na booking request."}
                {activeTab === 'Upcoming' && "Wala kang mga nalalapit na kumpirmadong booking."}
                {activeTab === 'Completed' && "Wala ka pang natapos na booking."}
                {activeTab === 'Cancelled' && "Wala kang mga nakanselang o tinanggihang booking."}
                {activeTab === 'InProgress' && "Wala kang mga booking na kasalukuyang isinasagawa."}
              </p>
              {activeTab === 'Pending' && (
                <p className="text-sm text-gray-400">
                  Ang mga bagong booking requests ay magpapakita dito kapag nagbook na sila.
                </p>
              )}
              {activeTab === 'Cancelled' && (
                <p className="text-sm text-gray-400">
                  Ang booking na ito ay kinansela ng kliyente o tinanggihan mo ay magpapakita dito.
                </p>
              )}
            </div>
          )}
        </main>
        <BottomNavigation />
      </div>
    </>
  );
};

export default ProviderBookingsPage;