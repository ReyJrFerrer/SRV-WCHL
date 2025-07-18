import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router'; 
import { ProviderEnhancedBooking, useProviderBookingManagement } from '../../hooks/useProviderBookingManagement';
import { 
    MapPinIcon, CalendarIcon, ClockIcon, UserIcon, 
    CurrencyDollarIcon, PhoneIcon, InformationCircleIcon,
    CalendarDaysIcon, CheckCircleIcon, XCircleIcon, 
    ExclamationTriangleIcon, ArrowPathIcon, StarIcon
} from '@heroicons/react/24/outline';

const calculateDuration = (start: string | Date, end: string | Date): string => {
  const startTime = new Date(start); const endTime = new Date(end);
  const durationMs = endTime.getTime() - startTime.getTime();
  if (isNaN(durationMs) || durationMs < 0) return 'N/A';
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  let durationStr = '';
  if (hours > 0) durationStr += `${hours} hr${hours > 1 ? 's' : ''} `;
  if (minutes > 0) durationStr += `${minutes} min${minutes > 1 ? 's' : ''}`;
  return durationStr.trim() || (hours === 0 && minutes === 0 ? "Short duration" : "N/A");
};

interface ProviderBookingItemCardProps {
  booking: ProviderEnhancedBooking;
}

const ProviderBookingItemCard: React.FC<ProviderBookingItemCardProps> = ({ booking }) => {
  const [showDetails, setShowDetails] = useState(false);
  const router = useRouter();
  const { 
    acceptBookingById, 
    declineBookingById, 
    startBookingById, 
    completeBookingById,
    isBookingActionInProgress,
    getStatusColor,
    formatBookingDate,
    formatBookingTime,
    refreshBookings
  } = useProviderBookingManagement();


  // Debug validation
  if (!booking) {
    console.error("CRITICAL: ProviderBookingItemCard received an undefined 'booking' prop!");
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl shadow-lg" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> Nawawala ang impormasyon sa booking na ito.</span>
      </div>
    );
  }

  if (!booking.id) {
    console.error("CRITICAL: Booking object is missing 'id'. Booking data:", JSON.stringify(booking, null, 2));
    return (
      <div className="bg-orange-100 border border-orange-400 text-orange-700 px-4 py-3 rounded-xl shadow-lg" role="alert">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 mr-2"/>
          <strong className="font-bold">Data Issue!</strong>
        </div>
        <span className="block sm:inline"> Kulang kulang ang impormasyon ng booking na ito.                      (missing ID).</span>
      </div>
    );
  }

  // Extract booking data with proper property names for ProviderEnhancedBooking
  const clientName = booking.clientName || 'Unknown Client';
  const clientContact = booking.clientPhone || booking.clientProfile?.phone || 'Contact not available';
  const serviceTitle = booking.serviceDetails?.description || booking.packageName || 'Service';
  const serviceImage = '/images/Tutoring-LanguageTutor1.jpg';
  const packageTitle = booking.packageName; 
  const scheduledDate = booking.scheduledDate ? new Date(booking.scheduledDate) : null;
  const duration = booking.serviceDuration || 'N/A';
  const price = booking.price;
  const priceLabel = "Service Price";
  const locationAddress = booking.formattedLocation || "Location not specified";
  const status = booking.status;

  // Format date function
  const formatDate = (date: Date | string | number) => {
    try {
      const dateObj = new Date(date);
      return dateObj.toLocaleDateString([], { 
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

  // Status color mapping (enhanced version)
  const getEnhancedStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'REQUESTED':
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-100';
      case 'ACCEPTED':
      case 'CONFIRMED':
        return 'text-green-600 bg-green-100';
      case 'INPROGRESS':
      case 'IN_PROGRESS':
        return 'text-blue-600 bg-blue-100';
      case 'COMPLETED':
        return 'text-indigo-600 bg-indigo-100';
      case 'CANCELLED':
        return 'text-red-600 bg-red-100';
      case 'DECLINED':
        return 'text-gray-600 bg-gray-100';
      case 'DISPUTED':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Action handlers using the hook's functions
  const handleAccept = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const success = await acceptBookingById(booking.id);
    if (success) {
      window.location.reload()
    } else {
      console.error(`❌ Failed to accept booking ${booking.id}`);
    }
  };

  const handleReject = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm('Sigurado ka bang gusto mong idecline?')) {
      const success = await declineBookingById(booking.id, 'Declined by provider');
      if (success) {
        window.location.reload()
        // await refreshBookings();
      } else {
        console.error(`❌ Failed to decline booking ${booking.id}`);
      }
    }
  };

  const handleContactClient = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (clientContact && clientContact !== 'Contact not available') {
      window.location.href = `tel:${clientContact}`;
    } else {
      alert('Contact information not available');
    }
  };

  const handleMarkAsCompleted = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm('Mark this booking as completed?')) {
      const success = await completeBookingById(booking.id);
      if (success) {
        await refreshBookings();
      } else {
        console.error(`❌ Failed to complete booking ${booking.id}`);
      }
    }
  };

  const handleStartService = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const success = await startBookingById(booking.id);
    if (success) {
      router.push(`/provider/active-service/${booking.id}`);
    } else {
      console.error(`❌ Failed to start service for booking ${booking.id}`);
    }
  };

  // Check booking states
  const canAcceptOrDecline = booking.canAccept && booking.canDecline;
  const canStart = booking.canStart;
  const canComplete = booking.canComplete;
  const isCompleted = status === 'Completed';
  const isCancelled = status === 'Cancelled';
  const isFinished = isCompleted || isCancelled;
  const isInProgress = status === 'InProgress'; // ✅ Add this check

  return (
    <>
      {/* ✅ Conditionally render Link only for non-InProgress bookings */}
      {!isInProgress ? (
        <Link href={`/provider/booking/${booking.id}`} legacyBehavior>
          <a className="block bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-shadow duration-300 cursor-pointer">
            <div className="md:flex">
              {serviceImage && (
                <div className="md:flex-shrink-0">
                  <div className="relative h-48 w-full object-cover md:w-48">
                    <Image
                      src={serviceImage}
                      alt={serviceTitle}
                      layout="fill"
                      objectFit="cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/default-service.jpg';
                      }}
                    />
                  </div>
                </div>
              )}
              
              <div className="p-4 sm:p-5 flex flex-col justify-between flex-grow">
                <div>
                  <div className="flex justify-between items-start">
                    <p className="text-xs text-indigo-500 uppercase tracking-wider font-semibold">
                      {clientContact}
                    </p>
                  </div>
                  
                  <h3 className="mt-1 text-lg md:text-xl font-bold text-slate-800 truncate" title={clientName}>
                    {clientName}
                  </h3>
                  
                  <p className="mt-1 text-xs text-gray-500">
                    Service: {serviceTitle}
                  </p>
                  
                  {packageTitle && (
                    <p className="mt-1 text-xs text-gray-500">
                      Package: {packageTitle}
                    </p>
                  )}
                  
                  <div className="mt-3 space-y-1.5 text-xs text-gray-600">
                    <p className="flex items-center">
                      <CalendarDaysIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                      {formatDate(booking.requestedDate)}
                    </p>
                    
                    <p className="flex items-center">
                      <MapPinIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                      {locationAddress}
                    </p>
                    
                    {price !== undefined && (
                      <p className="flex items-center">
                        <CurrencyDollarIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                        ₱{price.toFixed(2)}
                      </p>
                    )}

                    {duration !== 'N/A' && (
                      <p className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                        Duration: {duration}
                      </p>
                    )}
                  </div>

                  {/* Expandable details section */}
                  <div
                    className={`transition-all duration-300 overflow-hidden`}
                    style={{
                      maxHeight: showDetails ? 200 : 0,
                      opacity: showDetails ? 1 : 0,
                      marginTop: showDetails ? 8 : 0
                    }}
                  >
                    <div className="space-y-2 text-xs text-gray-700 border-t border-gray-200 pt-2">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                        <span>Scheduled Date: <span className="font-medium">
                          {formatBookingDate(booking.requestedDate)}
                        </span></span>
                      </div>
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                        <span>Scheduled Time: <span className="font-medium">
                          {formatBookingTime(booking.requestedDate)}
                        </span></span>
                      </div>
                      {booking.packageDetails?.description && (
                        <div className="flex items-start">
                          <InformationCircleIcon className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0 mt-0.5" />
                          <span>Package Description: <span className="font-medium">
                            {booking.packageDetails.description}
                          </span></span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="mt-4 pt-3 border-t border-gray-200 flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 sm:justify-end">
                  {/* Show accept/reject buttons for pending bookings */}
                  {canAcceptOrDecline && (
                    <>
                      <button 
                        onClick={handleReject} 
                        disabled={isBookingActionInProgress(booking.id, 'decline')}
                        className="flex items-center justify-center text-xs w-full sm:w-auto bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-3 rounded-md transition-colors"
                      >
                        <XCircleIcon className="h-4 w-4 mr-1.5" />
                        {isBookingActionInProgress(booking.id, 'decline') ? 'Declining...' : 'Decline'}
                      </button>
                      <button 
                        onClick={handleAccept} 
                        disabled={isBookingActionInProgress(booking.id, 'accept')}
                        className="flex items-center justify-center text-xs w-full sm:w-auto bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-3 rounded-md transition-colors"
                      >
                        <CheckCircleIcon className="h-4 w-4 mr-1.5" />
                        {isBookingActionInProgress(booking.id, 'accept') ? 'Accepting...' : 'Accept'}
                      </button>
                    </>
                  )}

                  {/* Show contact and start service buttons for accepted bookings */}
                  {canStart && (
                    <>
                      <button 
                        onClick={handleContactClient} 
                        className="flex items-center justify-center text-xs w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-3 rounded-md transition-colors"
                      >
                        <PhoneIcon className="h-4 w-4 mr-1.5" />
                        Contact Client
                      </button>
                      <button 
                        onClick={handleStartService} 
                        disabled={isBookingActionInProgress(booking.id, 'start')}
                        className="flex items-center justify-center text-xs w-full sm:w-auto bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-3 rounded-md transition-colors"
                      >
                        <ArrowPathIcon className="h-4 w-4 mr-1.5" />
                        {isBookingActionInProgress(booking.id, 'start') ? 'Starting...' : 'Start Service'}
                      </button>
                    </>
                  )}

                  {/* Show contact and complete buttons for in-progress bookings */}
                  {canComplete && (
                    <>
                      <button 
                        onClick={handleContactClient} 
                        className="flex items-center justify-center text-xs w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-3 rounded-md transition-colors"
                      >
                        <PhoneIcon className="h-4 w-4 mr-1.5" />
                        Contact Client
                      </button>
                      <button 
                        onClick={handleMarkAsCompleted} 
                        disabled={isBookingActionInProgress(booking.id, 'complete')}
                        className="flex items-center justify-center text-xs w-full sm:w-auto bg-teal-500 hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-3 rounded-md transition-colors"
                      >
                        <CheckCircleIcon className="h-4 w-4 mr-1.5" />
                        {isBookingActionInProgress(booking.id, 'complete') ? 'Completing...' : 'Mark Completed'}
                      </button>
                    </>
                  )}

                  {/* Show contact and view reviews buttons for completed bookings */}
                  {isCompleted && (
                    <>
                      <button 
                        onClick={handleContactClient} 
                        className="flex items-center justify-center text-xs w-full sm:w-auto bg-slate-600 hover:bg-slate-700 text-white font-medium py-2 px-3 rounded-md transition-colors"
                      >
                        <PhoneIcon className="h-4 w-4 mr-1.5" />
                        Contact Client
                      </button>
                      <Link href={`/provider/review/${booking?.id}`} legacyBehavior>
                        <a 
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center justify-center text-xs w-full sm:w-auto bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-3 rounded-md transition-colors text-center"
                        >
                          <StarIcon className="h-4 w-4 mr-1.5" />
                          View My Reviews
                        </a>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </a>
        </Link>
      ) : (
        // ✅ For InProgress bookings, render without Link wrapper
        <div className="block bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-shadow duration-300">
          <div className="md:flex">
            {serviceImage && (
              <div className="md:flex-shrink-0">
                <div className="relative h-48 w-full object-cover md:w-48">
                  <Image
                    src={serviceImage}
                    alt={serviceTitle}
                    layout="fill"
                    objectFit="cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/default-service.jpg';
                    }}
                  />
                </div>
              </div>
            )}
            
            <div className="p-4 sm:p-5 flex flex-col justify-between flex-grow">
              <div>
                <div className="flex justify-between items-start">
                  <p className="text-xs text-indigo-500 uppercase tracking-wider font-semibold">
                    {clientContact}
                  </p>
                  <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${getEnhancedStatusColor(status)}`}>
                    {status === 'InProgress'}
                  </span>
                </div>
                
                <h3 className="mt-1 text-lg md:text-xl font-bold text-slate-800 truncate" title={clientName}>
                  {clientName}
                </h3>
                
                <p className="mt-1 text-xs text-gray-500">
                  Service: {serviceTitle}
                </p>
                
                {packageTitle && (
                  <p className="mt-1 text-xs text-gray-500">
                    Package: {packageTitle}
                  </p>
                )}
                
                <div className="mt-3 space-y-1.5 text-xs text-gray-600">
                  <p className="flex items-center">
                    <CalendarDaysIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                    {formatDate(booking.requestedDate)}
                  </p>
                  
                  <p className="flex items-center">
                    <MapPinIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                    {locationAddress}
                  </p>
                  
                  {price !== undefined && (
                    <p className="flex items-center">
                      <CurrencyDollarIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                      ₱{price.toFixed(2)}
                    </p>
                  )}

                  {duration !== 'N/A' && (
                    <p className="flex items-center">
                      <ClockIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                      Duration: {duration}
                    </p>
                  )}
                </div>

                {/* Expandable details section */}
                <div
                  className={`transition-all duration-300 overflow-hidden`}
                  style={{
                    maxHeight: showDetails ? 200 : 0,
                    opacity: showDetails ? 1 : 0,
                    marginTop: showDetails ? 8 : 0
                  }}
                >
                  <div className="space-y-2 text-xs text-gray-700 border-t border-gray-200 pt-2">
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                      <span>Scheduled Date: <span className="font-medium">
                        {formatBookingDate(booking.requestedDate)}
                      </span></span>
                    </div>
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                      <span>Scheduled Time: <span className="font-medium">
                        {formatBookingTime(booking.requestedDate)}
                      </span></span>
                    </div>
                    {booking.packageDetails?.description && (
                      <div className="flex items-start">
                        <InformationCircleIcon className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0 mt-0.5" />
                        <span>Package Description: <span className="font-medium">
                          {booking.packageDetails.description}
                        </span></span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-4 pt-3 border-t border-gray-200 flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 sm:justify-end">
                {/* Show accept/reject buttons for pending bookings */}
                {canAcceptOrDecline && (
                  <>
                    <button 
                      onClick={handleReject} 
                      disabled={isBookingActionInProgress(booking.id, 'decline')}
                      className="flex items-center justify-center text-xs w-full sm:w-auto bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-3 rounded-md transition-colors"
                    >
                      <XCircleIcon className="h-4 w-4 mr-1.5" />
                      {isBookingActionInProgress(booking.id, 'decline') ? 'Declining...' : 'Decline'}
                    </button>
                    <button 
                      onClick={handleAccept} 
                      disabled={isBookingActionInProgress(booking.id, 'accept')}
                      className="flex items-center justify-center text-xs w-full sm:w-auto bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-3 rounded-md transition-colors"
                    >
                      <CheckCircleIcon className="h-4 w-4 mr-1.5" />
                      {isBookingActionInProgress(booking.id, 'accept') ? 'Accepting...' : 'Accept'}
                    </button>
                  </>
                )}

                {/* Show contact and start service buttons for accepted bookings */}
                {canStart && (
                  <>
                    <button 
                      onClick={handleContactClient} 
                      className="flex items-center justify-center text-xs w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-3 rounded-md transition-colors"
                    >
                      <PhoneIcon className="h-4 w-4 mr-1.5" />
                      Contact Client
                    </button>
                    <button 
                      onClick={handleStartService} 
                      disabled={isBookingActionInProgress(booking.id, 'start')}
                      className="flex items-center justify-center text-xs w-full sm:w-auto bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-3 rounded-md transition-colors"
                    >
                      <ArrowPathIcon className="h-4 w-4 mr-1.5" />
                      {isBookingActionInProgress(booking.id, 'start') ? 'Starting...' : 'Start Service'}
                    </button>
                  </>
                )}

                {/* Show contact and complete buttons for in-progress bookings */}
                {canComplete && (
                  <>
                    <button 
                      onClick={handleContactClient} 
                      className="flex items-center justify-center text-xs w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-3 rounded-md transition-colors"
                    >
                      <PhoneIcon className="h-4 w-4 mr-1.5" />
                      Contact Client
                    </button>
                    <button 
                      onClick={handleMarkAsCompleted} 
                      disabled={isBookingActionInProgress(booking.id, 'complete')}
                      className="flex items-center justify-center text-xs w-full sm:w-auto bg-teal-500 hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-3 rounded-md transition-colors"
                    >
                      <CheckCircleIcon className="h-4 w-4 mr-1.5" />
                      {isBookingActionInProgress(booking.id, 'complete') ? 'Completing...' : 'Mark Completed'}
                    </button>
                  </>
                )}

                {/* Show contact and view reviews buttons for completed bookings */}
                {isCompleted && (
                  <>
                    <button 
                      onClick={handleContactClient} 
                      className="flex items-center justify-center text-xs w-full sm:w-auto bg-slate-600 hover:bg-slate-700 text-white font-medium py-2 px-3 rounded-md transition-colors"
                    >
                      <PhoneIcon className="h-4 w-4 mr-1.5" />
                      Contact Client
                    </button>
                    <Link href={`/provider/review/${booking?.id}`} legacyBehavior>
                      <a 
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center justify-center text-xs w-full sm:w-auto bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-3 rounded-md transition-colors text-center"
                      >
                        <StarIcon className="h-4 w-4 mr-1.5" />
                        View My Reviews
                      </a>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProviderBookingItemCard;