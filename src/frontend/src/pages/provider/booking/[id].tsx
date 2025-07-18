import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeftIcon, CalendarDaysIcon, MapPinIcon, CurrencyDollarIcon, UserCircleIcon, ChatBubbleLeftEllipsisIcon, XCircleIcon, ArrowPathIcon, ClockIcon, InformationCircleIcon, StarIcon, CheckCircleIcon, PhoneIcon } from '@heroicons/react/24/solid';
import { ProviderEnhancedBooking, useProviderBookingManagement } from '../../../hooks/useProviderBookingManagement';
import BottomNavigationNextjs from '../../../components/provider/BottomNavigationNextjs';

const ProviderBookingDetailsPage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [specificBooking, setSpecificBooking] = useState<ProviderEnhancedBooking | null>(null);
  const [localLoading, setLocalLoading] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);

  const {
    bookings,
    acceptBookingById,
    declineBookingById,
    startBookingById,
    completeBookingById,
    isBookingActionInProgress,
    loading: hookLoading,
    error: hookError,
    refreshBookings,
    clearError,
    formatBookingDate,
    formatBookingTime
  } = useProviderBookingManagement();

  // Find specific booking from the hook's bookings array
  useEffect(() => {
    if (id && typeof id === 'string') {
      setLocalLoading(true);
      setLocalError(null);

      // Wait for bookings to load from the hook
      if (!hookLoading && bookings.length >= 0) {
        const foundBooking = bookings.find(booking => booking.id === id);
        
        if (foundBooking) {
          setSpecificBooking(foundBooking);
        } else {
          setLocalError('Booking not found');
        }
        
        setLocalLoading(false);
      }
    }
  }, [id, bookings, hookLoading]);

  // Handle retry functionality
  const handleRetry = async () => {
    setLocalError(null);
    clearError();
    try {
      await refreshBookings();
    } catch (error) {
      console.error('❌ Failed to retry loading bookings:', error);
    }
  };

  // Action handlers
  const handleAcceptBooking = async () => {
    if (!specificBooking) return;
    
    const clientName = specificBooking.clientName || 'this client';
    if (window.confirm(`Are you sure you want to accept the booking from "${clientName}"?`)) {
      const success = await acceptBookingById(specificBooking.id);
      if (success) {
        alert(`Booking from "${clientName}" has been accepted successfully.`);
        await refreshBookings();
        // Update local state
        const updatedBooking = bookings.find(booking => booking.id === specificBooking.id);
        if (updatedBooking) {
          setSpecificBooking(updatedBooking);
        }
      }
    }
  };

  const handleDeclineBooking = async () => {
    if (!specificBooking) return;
    
    const clientName = specificBooking.clientName || 'this client';
    if (window.confirm(`Are you sure you want to decline the booking from "${clientName}"?`)) {
      const success = await declineBookingById(specificBooking.id, 'Declined by provider');
      if (success) {
        alert(`Booking from "${clientName}" has been declined.`);
        await refreshBookings();
        // Update local state
        const updatedBooking = bookings.find(booking => booking.id === specificBooking.id);
        if (updatedBooking) {
          setSpecificBooking(updatedBooking);
        }
      }
    }
  };

  const handleStartService = async () => {
    if (!specificBooking) return;
    
    const success = await startBookingById(specificBooking.id);
    if (success) {
      const actualStartTime = new Date().toISOString();
      router.push(`/provider/active-service/${specificBooking.id}?startTime=${actualStartTime}`);
    }
  };

  const handleCompleteService = async () => {
    if (!specificBooking) return;
    
    if (window.confirm('Mark this booking as completed?')) {
      const success = await completeBookingById(specificBooking.id);
      if (success) {
        alert('Service has been marked as completed successfully.');
        await refreshBookings();
        // Update local state
        const updatedBooking = bookings.find(booking => booking.id === specificBooking.id);
        if (updatedBooking) {
          setSpecificBooking(updatedBooking);
        }
      }
    }
  };

  const handleContactClient = () => {
    if (!specificBooking) return;
    const clientContact = specificBooking.clientPhone || specificBooking.clientProfile?.phone;
    
    if (clientContact && clientContact !== 'Contact not available') {
      window.location.href = `tel:${clientContact}`;
    } else {
      alert('Client contact information not available.');
    }
  };

  // Utility functions
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleString([], { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return 'Date not available';
    }
  };

  const getStatusPillStyle = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'REQUESTED':
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700';
      case 'ACCEPTED':
      case 'CONFIRMED':
        return 'bg-green-100 text-green-700';
      case 'INPROGRESS':
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-700';
      case 'COMPLETED':
        return 'bg-indigo-100 text-indigo-700';
      case 'CANCELLED':
        return 'bg-red-100 text-red-700';
      case 'DECLINED':
        return 'bg-gray-100 text-gray-700';
      case 'DISPUTED':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Determine loading state
  const isLoading = hookLoading || localLoading;

  // Determine error state
  const displayError = localError || hookError;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  // Error state - show if there's an error and no booking found
  if (displayError && !specificBooking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Head><title>Booking Not Found</title></Head>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {localError === 'Booking not found' ? 'Booking Not Found' : 'Error Loading Booking'}
          </h1>
          <p className="text-gray-600 mb-4">{displayError}</p>
          <div className="space-x-3">
            <Link href="/provider/booking" legacyBehavior>
              <a className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors">
                Back to My Bookings
              </a>
            </Link>
            <button
              onClick={handleRetry}
              disabled={isBookingActionInProgress('refresh', 'refresh')}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {isBookingActionInProgress('refresh', 'refresh') ? 'Retrying...' : 'Retry'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No booking found (after loading completed)
  if (!specificBooking && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Head><title>Booking Not Found</title></Head>
        <h1 className="text-xl font-semibold text-red-600 mb-4">Booking Not Found</h1>
        <Link href="/provider/booking" legacyBehavior>
          <a className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Back to My Bookings
          </a>
        </Link>
      </div>
    );
  }

  // Extract booking data
  const serviceName = specificBooking?.serviceDetails?.description || specificBooking?.packageName || 'Service';
  const packageName = specificBooking?.packageName;
  const clientName = specificBooking?.clientName || 'Unknown Client';
  const clientContact = specificBooking?.clientPhone || specificBooking?.clientProfile?.phone || 'Contact not available';
  const bookingLocation = specificBooking?.formattedLocation || 'Location not specified';
  const price = specificBooking?.price;
  const duration = specificBooking?.serviceDuration || 'N/A';

  // Check booking states
  const canAcceptOrDecline = specificBooking?.canAccept && specificBooking?.canDecline;
  const canStart = specificBooking?.canStart;
  const canComplete = specificBooking?.canComplete;
  const isCompleted = specificBooking?.status === 'Completed';
  const isCancelled = specificBooking?.status === 'Cancelled';
  const isDeclined = specificBooking?.status === 'Declined';
  const isFinished = isCompleted || isCancelled || isDeclined;

  // Show booking details
  return (
    <>
      <Head>
        <title>Booking: {serviceName} | SRV Provider</title>
        <meta 
          name="description" 
          content={`Provider booking details for ${serviceName}`} 
        />
        <meta name="robots" content="noindex" />
      </Head>
      
      <div className="min-h-screen bg-gray-100 pb-20 md:pb-0">
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="container mx-auto px-4 py-3 flex items-center">
            <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-100 mr-2">
              <ArrowLeftIcon className="h-5 w-5 text-gray-700" />
            </button>
            <h1 className="text-lg font-semibold text-slate-800 truncate">Booking Details</h1>
          </div>
        </header>

        <main className="container mx-auto p-4 sm:p-6 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-slate-800">{clientName}</h2>
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusPillStyle(specificBooking?.status || '')}`}>
                {specificBooking?.status === 'InProgress' ? 'In Progress' : specificBooking?.status?.replace('_', ' ') || 'Unknown'}
              </span>
            </div>
            
            {packageName && (
              <h3 className="text-xl font-semibold text-slate-700 mb-2">{clientContact}</h3>
            )}
            
            <p className="text-sm text-gray-500 mb-1 flex items-center">
              Service: <span className="font-medium text-gray-700 ml-1">{serviceName}</span>
            </p>
            
            {clientContact && clientContact !== 'Contact not available' && (
              <p className="text-sm text-gray-500 mb-4">Package: {packageName}</p>
            )}

            <div className="border-t border-gray-200 pt-4 space-y-3 text-sm">
              <div className="flex items-start">
                <CalendarDaysIcon className="h-5 w-5 mr-2 text-blue-500 mt-0.5 flex-shrink-0"/>
                <span><strong className="font-medium text-gray-700">Requested:</strong> {formatDate(specificBooking?.requestedDate || specificBooking?.createdAt)}</span>
              </div>
              
              <div className="flex items-start">
                <MapPinIcon className="h-5 w-5 mr-2 text-blue-500 mt-0.5 flex-shrink-0"/>
                <span><strong className="font-medium text-gray-700">Location:</strong> {bookingLocation}</span>
              </div>
              
              {price !== undefined && (
                <div className="flex items-start">
                  <CurrencyDollarIcon className="h-5 w-5 mr-2 text-green-500 mt-0.5 flex-shrink-0"/>
                  <span><strong className="font-medium text-gray-700">Payment:</strong> ₱{price.toFixed(2)}</span>
                </div>
              )}

              {duration !== 'N/A' && (
                <div className="flex items-start">
                  <ClockIcon className="h-5 w-5 mr-2 text-purple-500 mt-0.5 flex-shrink-0"/>
                  <span><strong className="font-medium text-gray-700">Duration:</strong> {duration}</span>
                </div>
              )}

              {specificBooking?.packageDetails?.description && (
                <div className="flex items-start">
                  <InformationCircleIcon className="h-5 w-5 mr-2 text-indigo-500 mt-0.5 flex-shrink-0"/>
                  <span><strong className="font-medium text-gray-700">Package Details:</strong> {specificBooking.packageDetails.description}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="bg-white p-4 rounded-xl shadow-lg space-y-3 sm:space-y-0 sm:flex sm:space-x-3">
            {/* Contact Client - Always available for non-declined bookings */}
            {!isDeclined && (
              <button
                onClick={handleContactClient}
                className="w-full sm:flex-1 flex items-center justify-center bg-slate-600 hover:bg-slate-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
              >
                <PhoneIcon className="h-5 w-5 mr-2" /> Contact Client
              </button>
            )}

            {/* Accept/Decline buttons for pending bookings */}
            {canAcceptOrDecline && (
              <>
                <button
                  onClick={handleDeclineBooking}
                  disabled={isBookingActionInProgress(specificBooking?.id || '', 'decline')}
                  className="w-full sm:flex-1 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm disabled:opacity-50"
                >
                  <XCircleIcon className="h-5 w-5 mr-2" /> 
                  {isBookingActionInProgress(specificBooking?.id || '', 'decline') ? 'Declining...' : 'Decline'}
                </button>
                <button
                  onClick={handleAcceptBooking}
                  disabled={isBookingActionInProgress(specificBooking?.id || '', 'accept')}
                  className="w-full sm:flex-1 flex items-center justify-center bg-green-500 hover:bg-green-600 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm disabled:opacity-50"
                >
                  <CheckCircleIcon className="h-5 w-5 mr-2" /> 
                  {isBookingActionInProgress(specificBooking?.id || '', 'accept') ? 'Accepting...' : 'Accept'}
                </button>
              </>
            )}

            {/* Start Service button for accepted bookings */}
            {canStart && (
              <button
                onClick={handleStartService}
                disabled={isBookingActionInProgress(specificBooking?.id || '', 'start')}
                className="w-full sm:flex-1 flex items-center justify-center bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm disabled:opacity-50"
              >
                <ArrowPathIcon className="h-5 w-5 mr-2" />
                {isBookingActionInProgress(specificBooking?.id || '', 'start') ? 'Starting...' : 'Start Service'}
              </button>
            )}

            {/* Complete Service button for in-progress bookings */}
            {canComplete && (
              <button
                onClick={handleCompleteService}
                disabled={isBookingActionInProgress(specificBooking?.id || '', 'complete')}
                className="w-full sm:flex-1 flex items-center justify-center bg-teal-500 hover:bg-teal-600 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm disabled:opacity-50"
              >
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                {isBookingActionInProgress(specificBooking?.id || '', 'complete') ? 'Completing...' : 'Mark Completed'}
              </button>
            )}

            {/* View Reviews for completed bookings */}
            {isCompleted && (
              <Link href={`/provider/review/${specificBooking?.id}`} legacyBehavior>
                <a className="w-full sm:flex-1 flex items-center justify-center bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm text-center">
                  <StarIcon className="h-5 w-5 mr-2" /> View Review
                </a>
              </Link>
            )}
          </div>
        </main>
        
        <div className="md:hidden">
          <BottomNavigationNextjs />
        </div>
      </div>
    </>
  );
};

export default ProviderBookingDetailsPage;
