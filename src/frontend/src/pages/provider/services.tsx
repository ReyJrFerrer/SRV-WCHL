import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { PlusIcon, WrenchScrewdriverIcon, StarIcon, ArrowRightIcon } from '@heroicons/react/24/solid';
import { PaintBrushIcon, ComputerDesktopIcon, CameraIcon, SparklesIcon, AcademicCapIcon, TruckIcon, HomeIcon, EllipsisHorizontalCircleIcon, BoltIcon, ScissorsIcon } from '@heroicons/react/24/outline';
import BottomNavigation from '@app/components/provider/BottomNavigationNextjs';
import { useServiceManagement, EnhancedService } from '@app/hooks/serviceManagement';
import { getCategoryIcon } from '@app/utils/serviceHelpers';

const iconMap: { [key: string]: React.ElementType } = {
  home: HomeIcon, 
  broom: PaintBrushIcon, 
  car: TruckIcon, 
  computer: ComputerDesktopIcon, 
  cut: ScissorsIcon,
  truck: TruckIcon, 
  sparkles: SparklesIcon, 
  'chalkboard-teacher': AcademicCapIcon, 
  camera: CameraIcon,
  wrench: WrenchScrewdriverIcon, 
  bolt: BoltIcon,
  default: EllipsisHorizontalCircleIcon,
};

const MyServicesPage: React.FC = () => {
  const router = useRouter();
  
  // Use the service management hook
  const {
    userServices,
    userProfile,
    loading,
    error,
    refreshServices,
    isUserAuthenticated
  } = useServiceManagement();

  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const initializePage = async () => {
      if (!isUserAuthenticated()) {
        setPageLoading(false);
        return;
      }
      
      // Data will be loaded by the hook
      setPageLoading(false);
    };

    initializePage();
  }, [isUserAuthenticated]);

  const renderIcon = (service: EnhancedService) => {
    const iconKey = getCategoryIcon(service.category?.name || service.title || '');
    const IconComponent = iconMap[iconKey] || iconMap.default;
    return <IconComponent className="h-8 w-8 text-blue-600" />;
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'Available':
        return {
          text: 'Active',
          className: 'bg-green-100 text-green-800'
        };
      case 'Suspended':
        return {
          text: 'Suspended',
          className: 'bg-yellow-100 text-yellow-800'
        };
      case 'Unavailable':
        return {
          text: 'Inactive',
          className: 'bg-red-100 text-red-800'
        };
      default:
        return {
          text: 'Unknown',
          className: 'bg-gray-100 text-gray-800'
        };
    }
  };

  const handleToggleActive = async (serviceId: string, currentStatus: boolean) => {
    // TODO: Implement actual backend call
    alert(`Service ${serviceId} status would be toggled. Backend integration needed.`);
  };

  const handleDeleteService = async (serviceId: string) => {
    if (window.confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
      // TODO: Implement actual backend call
      alert(`Service ${serviceId} would be deleted. Backend integration needed.`);
    }
  };

  // Show loading state while page initializes
  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-3 text-gray-700">Loading Services...</p>
      </div>
    );
  }

  // Show error state if not authenticated
  if (!isUserAuthenticated()) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">
            Please log in to access your services.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>My Services | SRV Provider</title>
        <meta name="description" content="Manage your offered services." />
      </Head>

      <div className="min-h-screen bg-gray-100 flex flex-col pb-16 md:pb-0">
        <header className="bg-white shadow-sm sticky top-0 z-20 px-4 py-3">
          <div className="container mx-auto flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">My Services</h1>
            <Link href="/provider/services/add" legacyBehavior>
              <a className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 sm:px-4 rounded-lg transition-colors text-sm">
                <PlusIcon className="h-5 w-5 mr-1.5" />
                Add New Service
              </a>
            </Link>
          </div>
        </header>

        <main className="flex-grow container mx-auto p-4 sm:p-6">
          {loading && (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your services...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-16 bg-white rounded-xl shadow-md mt-6">
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={refreshServices}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && userServices.length === 0 && (
            <div className="text-center py-16 bg-white rounded-xl shadow-md mt-6">
              <WrenchScrewdriverIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
               <p className="text-lg text-gray-700 mb-2">No services found</p>
                <p className="text-sm text-gray-600 mb-6">
                Get started by adding your first service offering.
              </p>
              <Link href="/provider/services/add" legacyBehavior>
                 <a className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors">
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Your First Service
                </a>
              </Link>
            </div>
          )}

          {!loading && !error && userServices.length > 0 && (
            <div className="space-y-6">
              {userServices.map(service => {
                const statusDisplay = getStatusDisplay(service.status);
                
                return (
                  <div key={service.id} className="bg-white p-6 rounded-xl shadow-lg">
                    <div className="flex flex-col md:flex-row md:items-start md:space-x-4">
                      {/* Service Icon */}
                      <div className="flex-shrink-0 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3 md:mb-0">
                        {renderIcon(service)}
                      </div>

                      {/* Service Details */}
                      <div className="flex-grow">
                        <div className="flex flex-col md:flex-row justify-between md:items-start">
                          <div className="flex-grow">
                            <h4 className="font-semibold text-black text-lg md:text-xl">
                              {service.title}
                            </h4>
                            <p className="text-sm md:text-base text-gray-500">
                              {service.category?.name || 'Service'}
                            </p>
                            <p className="text-sm text-gray-400 mt-1">
                              {service.formattedLocation || 'Location not specified'}
                            </p>
                            {service.description && (
                              <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                {service.description}
                              </p>
                            )}
                          </div>
                          <span
                            className={`text-sm font-semibold px-3 py-1 rounded-full mt-2 md:mt-0 w-fit ${statusDisplay.className}`}
                          >
                            {statusDisplay.text}
                          </span>
                        </div>

                        <div className="flex items-center text-sm md:text-base text-gray-600 mt-3 space-x-4">
                          <div className="flex items-center">
                            <span className="font-semibold text-green-600">
                              {service.formattedPrice || `₱${service.price}`}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <StarIcon className="h-4 w-4 text-yellow-400 mr-1" />
                            <span>
                              {service.averageRating || 'N/A'} ({service.totalReviews || 0} reviews)
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2 mt-4">
                          <Link href={`/provider/service-details/${service.id}`} legacyBehavior>
                            <a className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                              <ArrowRightIcon className="h-4 w-4 mr-1" />
                              View Details
                            </a>
                          </Link>
                          {/* <button
                            onClick={() => handleToggleActive(service.id, service.status === 'Available')}
                            className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                              service.status === 'Available'
                                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                : 'bg-green-100 text-green-800 hover:bg-green-200'
                            }`}
                          >
                            {service.status === 'Available' ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteService(service.id)}
                            className="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors text-sm"
                          >
                            Delete
                          </button> */}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        <BottomNavigation />
      </div>
    </>
  );
};

export default MyServicesPage;