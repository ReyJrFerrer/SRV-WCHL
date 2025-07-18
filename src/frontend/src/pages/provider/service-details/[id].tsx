import React, { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import { 
    ArrowLeftIcon, 
    PencilIcon, 
    TrashIcon, 
    StarIcon as StarSolid, 
    CheckCircleIcon, 
    XCircleIcon, 
    CurrencyDollarIcon, 
    MapPinIcon, 
    CalendarDaysIcon, 
    ClockIcon, 
    DocumentTextIcon, 
    TagIcon, 
    BriefcaseIcon, 
    CogIcon,
    CameraIcon as CameraSolidIcon 
} from '@heroicons/react/24/solid';

import { useServiceManagement, EnhancedService } from '../../../hooks/serviceManagement';
import BottomNavigation from '@app/components/provider/BottomNavigationNextjs';
import { ServicePackage } from '../../../services/serviceCanisterService';
import ViewReviewsButton from '@app/components/common/ViewReviewsButton';

const ProviderServiceDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query; 
  
  // Use real hook instead of mock data
  const { 
    getService, 
    deleteService, 
    updateServiceStatus,
    formatServicePrice,
    getStatusColor,
    getServicePackages,
    loading: hookLoading,
    error: hookError 
  } = useServiceManagement();
  
  const [service, setService] = useState<EnhancedService | null>(null);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [initializationAttempts, setInitializationAttempts] = useState(0);
  
  // Refs to track loading state
  const hasLoadedSuccessfully = useRef(false);
  const currentServiceId = useRef<string | null>(null);
  const isLoadingRef = useRef(false);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Wait for hook initialization before attempting to load service
  const waitForInitialization = useCallback(async (maxAttempts = 10): Promise<boolean> => {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Simply check if we have the getService function available
      // This is more reliable than checking loading states

      setInitializationAttempts(attempt + 1);
      
      // Shorter wait time since we're just checking function availability
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check if component was unmounted
      if (!mountedRef.current) {
        return false;
      }
    }
    
    console.warn('Hook initialization timeout');
    return false;
  }, [getService]);

  // Robust service loading with initialization check
  const loadServiceDataRobust = useCallback(async (serviceId: string): Promise<void> => {
    // Prevent concurrent loading
    if (isLoadingRef.current) {
      return;
    }

    // Don't reload if we already have this service loaded successfully
    if (service && service.id === serviceId && hasLoadedSuccessfully.current) {
      return;
    }

    isLoadingRef.current = true;
    setLoading(true);
    setError(null);
    setInitializationAttempts(0);

    try {
      // Simplified approach - just wait a bit for the hook to be ready
      if (!getService) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Check if component was unmounted during wait
      if (!mountedRef.current) {
        return;
      }

      // Direct call without retries first, since backend is fast
      const serviceData = await getService(serviceId);
      
      if (serviceData) {

        try {
          const servicePackages = await getServicePackages(serviceId);
        
          
          // Only update state if component is still mounted
          if (mountedRef.current) {
            setService(serviceData);
            setPackages(servicePackages || []);
            setRetryCount(0);
            hasLoadedSuccessfully.current = true;
            currentServiceId.current = serviceId;
            setError(null);
          }
        } catch (packageError) {
          console.warn('Failed to load packages:', packageError);
          // Continue with service loading even if packages fail
          if (mountedRef.current) {
            setService(serviceData);
            setPackages([]);
            setRetryCount(0);
            hasLoadedSuccessfully.current = true;
            currentServiceId.current = serviceId;
            setError(null);
          }
        }
      } else {
        throw new Error('Service not found');
      }

    } catch (err) {
      console.error('Error loading service:', err);
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load service');
        hasLoadedSuccessfully.current = false;
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      isLoadingRef.current = false;
    }
  }, [service, getService, getServicePackages]);

  // Main effect to load service when ID changes
  useEffect(() => {
    if (id && typeof id === 'string') {
      // Only load if service ID changed or we haven't loaded successfully
      if (currentServiceId.current !== id || !hasLoadedSuccessfully.current) {
        currentServiceId.current = id;
        hasLoadedSuccessfully.current = false;
        loadServiceDataRobust(id);
      }
    }
  }, [id, loadServiceDataRobust]);

  const handleDeleteService = async () => {
    if (!service) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete "${service.title}"? This action cannot be undone.`
    );
    
    if (confirmed) {
      setIsDeleting(true);
      try {
        await deleteService(service.id);
        // Reset state when navigating away
        hasLoadedSuccessfully.current = false;
        currentServiceId.current = null;
        router.push('/provider/services');
      } catch (error) {
        console.error('Failed to delete service:', error);
        alert('Failed to delete service. Please try again.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleStatusToggle = async () => {
    if (!service) return;
    
    const newStatus = service.status === 'Available' ? 'Unavailable' : 'Available';
    setIsUpdatingStatus(true);
    try {
      await updateServiceStatus(service.id, newStatus);
      // Update the service state directly instead of reloading
      setService(prev => prev ? { ...prev, status: newStatus } : prev);
    } catch (error) {
      console.error('Failed to update service status:', error);
      alert('Failed to update service status. Please try again.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleRetry = () => {
    if (id && typeof id === 'string') {
      setRetryCount(prev => prev + 1);
      hasLoadedSuccessfully.current = false; // Reset success flag for retry
      loadServiceDataRobust(id);
    }
  };

  // Show loading screen during initialization or data loading
  if ((loading || hookLoading || initializationAttempts > 0) && !service) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="text-gray-700 mt-4">
          {initializationAttempts > 0 
            ? `Initializing system... (${initializationAttempts}/20)`
            : 'Loading service details...'
          }
        </p>
        {retryCount > 0 && (
          <p className="text-sm text-gray-500 mt-2">Retry attempt: {retryCount}</p>
        )}
      </div>
    );
  }

  // Show error screen only if we have an error and no service data
  if ((error || hookError) && !service) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Head>
            <title>Service Error | SRV Provider</title>
        </Head>
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold text-red-600 mb-4">
            Unable to Load Service
          </h1>
          <p className="text-gray-600 mb-6">
            {error || hookError || 'The service could not be loaded.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleRetry}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <Link href="/provider/services" legacyBehavior>
              <a className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                Back to Services
              </a>
            </Link>
          </div>
          {retryCount > 0 && (
            <p className="text-xs text-gray-500 mt-4">
              Attempted {retryCount} {retryCount === 1 ? 'retry' : 'retries'}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Final fallback if no service data
  if (!service) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Head>
            <title>Service Not Found | SRV Provider</title>
        </Head>
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold text-red-600 mb-4">Service Not Found</h1>
          <p className="text-gray-600 mb-6">
            The requested service could not be found or loaded.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleRetry}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Loading Again
            </button>
            <Link href="/provider/services" legacyBehavior>
              <a className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                Back to Services
              </a>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // const heroImageUrl = typeof service.heroImage === 'string' 
  //   ? service.heroImage 
  //   : (service.heroImage as any)?.default?.src || (service.heroImage as any)?.src;

  return (
    <>
      <Head>
        <title>Details: {service.title} | SRV Provider</title>
        <meta name="description" content={`Detailed view of service: ${service.title}`} />
      </Head>

      <div className="min-h-screen bg-gray-100 pb-20 md:pb-0">
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-700" />
            </button>
            <h1 className="text-lg font-semibold text-gray-800 truncate">
              Service Details
            </h1>
            <div className="w-8"></div>
          </div>
        </header>

        {/* Show loading overlay for operations while keeping content visible */}
        {(isUpdatingStatus || isDeleting) && (
          <div className="fixed inset-0 bg-black bg-opacity-20 z-40 flex items-center justify-center">
            <div className="bg-white rounded-lg p-4 flex items-center shadow-lg">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-700">
                {isUpdatingStatus ? 'Updating status...' : 'Deleting service...'}
              </span>
            </div>
          </div>
        )}

        <main className="container mx-auto p-4 sm:p-6 space-y-6">
          {/* Hero Image and Basic Info Card */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* {heroImageUrl && (
              <div className="relative w-full aspect-[16/6] bg-gray-200 overflow-hidden">
                <Image
                  src={heroImageUrl}
                  alt={service.title}
                  layout="fill"
                  objectFit="cover"
                />
              </div>
            )} */}
            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold text-gray-800 truncate" title={service.title}>
                    {service.title}
                  </h2>
                  <p className="text-sm text-gray-500 flex items-center mt-1">
                    <TagIcon className="h-4 w-4 mr-1.5 text-gray-400 flex-shrink-0"/>
                    {service.category.name}
                  </p>
                </div>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ml-2 flex-shrink-0 bg-${getStatusColor(service.status)}-100 text-${getStatusColor(service.status)}-700`}>
                  {service.status}
                </span>
              </div>
              {/* <p className="text-gray-600 text-sm leading-relaxed mt-1">{service.description}</p> */}
            </div>
          </div>

          {/* Action Buttons Card */}
           <div className="bg-white rounded-xl shadow-lg p-4 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <Link href={`/provider/services/edit/${service.id}`} legacyBehavior>
                    <a className="flex-1 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm">
                        <PencilIcon className="h-5 w-5 mr-2" /> Edit Service
                    </a>
                </Link>
                <button
                    onClick={handleStatusToggle}
                    disabled={isUpdatingStatus}
                    className={`flex-1 flex items-center justify-center font-medium py-2.5 px-4 rounded-lg transition-colors text-sm disabled:opacity-50 ${
                      service.status === 'Available' 
                        ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                >
                    <CogIcon className="h-5 w-5 mr-2" />
                    {isUpdatingStatus ? 'Updating...' : (service.status === 'Available' ? 'Deactivate' : 'Activate')}
                </button>
                <button
                    onClick={handleDeleteService}
                    disabled={isDeleting}
                    className="flex-1 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm disabled:opacity-50"
                >
                    <TrashIcon className="h-5 w-5 mr-2" /> 
                    {isDeleting ? 'Deleting...' : 'Delete Service'}
                </button>
            </div>

          {/* Detailed Information Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           
            <div className="bg-white rounded-xl shadow-lg p-6 space-y-3">
              <h3 className="text-lg font-semibold text-gray-700 mb-3 border-b pb-2">Ratings</h3>
                 <ViewReviewsButton
                  serviceId={service.id}
                  averageRating={service.averageRating!}
                  totalReviews={service.totalReviews!}
                  variant="card"
                  className="mt-2"
                />
              {/* <p className="flex items-center text-sm">
                <CurrencyDollarIcon className="h-5 w-5 mr-2 text-green-500"/>
                Price: <span className="font-medium ml-1">{service.formattedPrice || formatServicePrice(service.price)}</span>
              </p> */}
              {/* <p className="flex items-center text-sm">
                <StarSolid className="h-5 w-5 mr-2 text-yellow-400"/>
                Rating: <span className="font-medium ml-1">{service.averageRating?.toFixed(1) || '0.0'} ({service.totalReviews || 0} reviews)</span>
              </p> */}
              
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 space-y-3">
              <h3 className="text-lg font-semibold text-gray-700 mb-3 border-b pb-2">Location & Provider Details</h3>
              <div className="space-y-3">
                <p className="flex items-start text-sm">
                  <MapPinIcon className="h-5 w-5 mr-2 text-blue-500 flex-shrink-0 mt-0.5"/>
                  <div className="flex-1">
                    <span className="font-medium">Full Address:</span>
                    <div className="text-gray-600 mt-1">
                      {service.location.address && (
                        <div>{service.location.address}</div>
                      )}
                      <div>
                        {service.location.city}{service.location.state && `, ${service.location.state}`}
                        {service.location.postalCode && ` ${service.location.postalCode}`}
                      </div>
                      {service.location.country && (
                        <div className="text-gray-500">{service.location.country}</div>
                      )}
                    </div>
                  </div>
                </p>
                
                {/* {(service.location.latitude !== undefined && service.location.longitude !== undefined) && (
                  <p className="flex items-center text-sm">
                    <MapPinIcon className="h-5 w-5 mr-2 text-green-500"/>
                    Coordinates: <span className="font-medium ml-1 font-mono text-xs">
                      {service.location.latitude.toFixed(6)}, {service.location.longitude.toFixed(6)}
                    </span>
                  </p>
                )} */}
              </div>
              {/* {service.providerProfile && (
                <p className="flex items-center text-sm">
                  Provider: <span className="font-medium ml-1">{service.providerProfile.name}</span>
                </p>
              )} */}
              {service.weeklySchedule && service.weeklySchedule.length > 0 && (
                <>
                  <p className="flex items-center text-sm">
                    <CalendarDaysIcon className="h-5 w-5 mr-2 text-indigo-500"/>
                    Available Days: <span className="font-medium ml-1">
                      {service.weeklySchedule
                        ?.filter(({ availability }) => availability.isAvailable)
                        ?.map(({ day }) => day)
                        ?.join(', ') || 'Not specified'}
                    </span>
                  </p>
                  <p className="flex items-center text-sm">
                    <ClockIcon className="h-5 w-5 mr-2 text-purple-500"/>
                    Time Slots: <span className="font-medium ml-1">
                      {service.weeklySchedule
                        ?.filter(({ availability }) => availability.isAvailable)
                        ?.flatMap(({ availability }) => availability.slots)
                        ?.map(slot => `${slot.startTime}-${slot.endTime}`)
                        ?.join(' | ') || 'Not specified'}
                    </span>
                  </p>
                  {/* {service.instantBookingEnabled !== undefined && (
                    <p className="flex items-center text-sm">
                      <CheckCircleIcon className="h-5 w-5 mr-2 text-green-500"/>
                      Instant Booking: <span className="font-medium ml-1">
                        {service.instantBookingEnabled ? 'Available' : 'Not Available'}
                      </span>
                    </p>
                  )} */}
                  {service.bookingNoticeHours !== undefined && (
                    <p className="flex items-center text-sm">
                      <ClockIcon className="h-5 w-5 mr-2 text-orange-500"/>
                      Advance Notice: <span className="font-medium ml-1">
                        {service.bookingNoticeHours} hours required
                      </span>
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {packages && packages.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                <BriefcaseIcon className="h-5 w-5 mr-2 text-gray-500"/>Service Packages ({packages.length})
              </h3>
              <div className="space-y-4">
                {packages.map((pkg) => (
                  <div key={pkg.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold text-md text-gray-800">{pkg.title}</h4>
                      <span className="text-md font-semibold text-green-600 ml-2">
                        ₱{pkg.price.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{pkg.description}</p>
                    <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
                      <span>Created: {new Date(pkg.createdAt).toLocaleDateString()}</span>
                      <span>Updated: {new Date(pkg.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {packages && packages.length === 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                <BriefcaseIcon className="h-5 w-5 mr-2 text-gray-500"/>Service Packages
              </h3>
              <div className="text-center py-8">
                <BriefcaseIcon className="h-12 w-12 text-gray-300 mx-auto mb-4"/>
                <p className="text-gray-500 mb-4">No packages available for this service</p>
                <p className="text-sm text-gray-400">Packages help customers choose specific service options with different pricing</p>
              </div>
            </div>
          )}
{/*           
          {service.media && service.media.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                <CameraSolidIcon className="h-5 w-5 mr-2 text-gray-500"/>Gallery
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {service.media.map((item, index) => (
                  item.type === 'IMAGE' && (
                    <div key={index} className="aspect-square rounded-lg overflow-hidden border border-gray-200 relative">
                      <Image 
                        src={item.url} 
                        alt={`Service gallery image ${index + 1}`} 
                        layout="fill" 
                        objectFit="cover" 
                        className="hover:scale-105 transition-transform"
                      />
                    </div>
                  )
                ))}
              </div>
            </div>
          )} */}

        </main>
        <div className="md:hidden">
            <BottomNavigation />
        </div>
      </div>
    </>
  );
};

export default ProviderServiceDetailPage;