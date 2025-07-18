// SRV-ICP-ver2-jdMain/frontend/src/components/provider/ServiceManagementNextjs.tsx
// ...existing imports...
import React from 'react';
import { PlusIcon, CurrencyDollarIcon, StarIcon, ArrowRightIcon, ScissorsIcon } from '@heroicons/react/24/solid';
import { PaintBrushIcon, WrenchScrewdriverIcon, ComputerDesktopIcon, CameraIcon, SparklesIcon, AcademicCapIcon, TruckIcon, HomeIcon, EllipsisHorizontalCircleIcon, BoltIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { EnhancedService } from '../../hooks/serviceManagement';
import { getCategoryIcon } from '../../utils/serviceHelpers';

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

interface ServiceManagementProps {
  services?: EnhancedService[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => Promise<void>;
  className?: string;
  maxItemsToShow?: number;
}

const ServiceManagementNextjs: React.FC<ServiceManagementProps> = ({
  services = [],
  loading = false,
  error = null,
  onRefresh,
  className = '',
  maxItemsToShow = 3
}) => {
  const displayedServices = services.slice(0, maxItemsToShow);

  const renderIcon = (service: EnhancedService) => {
    // Use getCategoryIcon helper to get the correct icon name based on category
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

  // Show loading state
  if (loading) {
    return (
      <div className={`services-section bg-white p-6 rounded-xl shadow-lg ${className}`}>
        <div className="section-header flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Aking mga Serbisyo</h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="ml-3 text-gray-500">Loading services...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={`services-section bg-white p-6 rounded-xl shadow-lg ${className}`}>
        <div className="section-header flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Aking mga Serbisyo</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">{error}</p>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`services-section bg-white p-6 rounded-xl shadow-lg ${className}`}>
      <div className="section-header flex flex-wrap justify-between items-center mb-4 gap-2">
        <h2 className="text-xl font-bold text-gray-800">Aking mga Serbisyo</h2>
        {services.length > maxItemsToShow && (
          <Link href="/provider/services" legacyBehavior>
            <a className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center transition-colors">
              View All ({services.length})
              <ArrowRightIcon className="h-4 w-4 ml-1" />
            </a>
          </Link>
        )}
        <Link href="/provider/services/add" legacyBehavior>
          <a
            className="add-button p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors ml-auto sm:ml-0"
            aria-label="Add new service"
          >
            <PlusIcon className="h-5 w-5" />
          </a>
        </Link>
      </div>

      {displayedServices.length > 0 ? (
        <div className="mt-4 space-y-4">
          {displayedServices.map((service) => {
            const statusDisplay = getStatusDisplay(service.status);
            
            return (
              <Link key={service.id} href={`/provider/service-details/${service.id}`} legacyBehavior>
                <a className="block service-card-item bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex flex-col md:flex-row md:items-start md:space-x-4">
                    {/* Service Icon */}
                    <div className="flex-shrink-0 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3 md:mb-0">
                      {renderIcon(service)}
                    </div>

                    {/* Service Details */}
                    <div className="flex-grow">
                      <div className="flex flex-col md:flex-row justify-between md:items-start">
                        <div className="flex-grow">
                          <h4 className="font-semibold text-black text-base md:text-lg">
                            {service.title}
                          </h4>
                          <p className="text-xs md:text-sm text-gray-500">
                            {service.category?.name || 'Service'}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {service.formattedLocation || 'Location not specified'}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-2 md:mt-0 w-fit ${statusDisplay.className}`}
                        >
                          {statusDisplay.text}
                        </span>
                      </div>

                      <div className="flex items-center text-xs md:text-sm text-gray-600 mt-2 space-x-3">
                        <div className="flex items-center">
                          {/* <CurrencyDollarIcon className="h-4 w-4 text-gray-400 mr-1" /> */}
                          <span>{service.formattedPrice || `₱${service.price}`}</span>
                        </div>
                        <div className="flex items-center">
                          <StarIcon className="h-4 w-4 text-yellow-400 mr-1" />
                          <span>
                            {service.averageRating || 'N/A'} ({service.totalReviews || 0} reviews)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </a>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-10 text-gray-500">
          <WrenchScrewdriverIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="mb-1">You haven't listed any services yet.</p>
          <Link href="/provider/services/add" legacyBehavior>
            <a className="text-sm text-blue-600 hover:text-blue-700 font-semibold">
              Add your first service
            </a>
          </Link>
        </div>
      )}
    </div>
  );
};

export default ServiceManagementNextjs;