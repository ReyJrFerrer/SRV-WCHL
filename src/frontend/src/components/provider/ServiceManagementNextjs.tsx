// SRV-ICP-ver2-jdMain/frontend/src/components/provider/ServiceManagementNextjs.tsx
// ...existing imports...
import React from "react";
import {
  PlusIcon,
  CurrencyDollarIcon,
  StarIcon,
  ArrowRightIcon,
  ScissorsIcon,
} from "@heroicons/react/24/solid";
import {
  PaintBrushIcon,
  WrenchScrewdriverIcon,
  ComputerDesktopIcon,
  CameraIcon,
  SparklesIcon,
  AcademicCapIcon,
  TruckIcon,
  HomeIcon,
  EllipsisHorizontalCircleIcon,
  BoltIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { EnhancedService } from "../../hooks/serviceManagement";
import { getCategoryIcon } from "../../utils/serviceHelpers";

const iconMap: { [key: string]: React.ElementType } = {
  home: HomeIcon,
  broom: PaintBrushIcon,
  car: TruckIcon,
  computer: ComputerDesktopIcon,
  cut: ScissorsIcon,
  truck: TruckIcon,
  sparkles: SparklesIcon,
  "chalkboard-teacher": AcademicCapIcon,
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
  className = "",
  maxItemsToShow = 3,
}) => {
  const displayedServices = services.slice(0, maxItemsToShow);

  const renderIcon = (service: EnhancedService) => {
    // Use getCategoryIcon helper to get the correct icon name based on category
    const iconKey = getCategoryIcon(
      service.category?.name || service.title || "",
    );
    const IconComponent = iconMap[iconKey] || iconMap.default;
    return <IconComponent className="h-8 w-8 text-blue-600" />;
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "Available":
        return {
          text: "Active",
          className: "bg-green-100 text-green-800",
        };
      case "Suspended":
        return {
          text: "Suspended",
          className: "bg-yellow-100 text-yellow-800",
        };
      case "Unavailable":
        return {
          text: "Inactive",
          className: "bg-red-100 text-red-800",
        };
      default:
        return {
          text: "Unknown",
          className: "bg-gray-100 text-gray-800",
        };
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div
        className={`services-section rounded-xl bg-white p-6 shadow-lg ${className}`}
      >
        <div className="section-header mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">
            Aking mga Serbisyo
          </h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 border-blue-500"></div>
          <p className="ml-3 text-gray-500">Loading services...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div
        className={`services-section rounded-xl bg-white p-6 shadow-lg ${className}`}
      >
        <div className="section-header mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">
            Aking mga Serbisyo
          </h2>
        </div>
        <div className="py-8 text-center">
          <p className="mb-4 text-red-500">{error}</p>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`services-section rounded-xl bg-white p-6 shadow-lg ${className}`}
    >
      <div className="section-header mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-gray-800">Aking mga Serbisyo</h2>
        {services.length > maxItemsToShow && (
          <Link href="/provider/services" legacyBehavior>
            <a className="flex items-center text-sm font-medium text-blue-600 transition-colors hover:text-blue-700">
              View All ({services.length})
              <ArrowRightIcon className="ml-1 h-4 w-4" />
            </a>
          </Link>
        )}
        <Link href="/provider/services/add" legacyBehavior>
          <a
            className="add-button ml-auto rounded-full bg-blue-600 p-2 text-white transition-colors hover:bg-blue-700 sm:ml-0"
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
              <Link
                key={service.id}
                href={`/provider/service-details/${service.id}`}
                legacyBehavior
              >
                <a className="service-card-item block cursor-pointer rounded-lg bg-gray-50 p-4 shadow-sm transition-shadow hover:shadow-md">
                  <div className="flex flex-col md:flex-row md:items-start md:space-x-4">
                    {/* Service Icon */}
                    <div className="mb-3 flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 md:mb-0">
                      {renderIcon(service)}
                    </div>

                    {/* Service Details */}
                    <div className="flex-grow">
                      <div className="flex flex-col justify-between md:flex-row md:items-start">
                        <div className="flex-grow">
                          <h4 className="text-base font-semibold text-black md:text-lg">
                            {service.title}
                          </h4>
                          <p className="text-xs text-gray-500 md:text-sm">
                            {service.category?.name || "Service"}
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            {service.formattedLocation ||
                              "Location not specified"}
                          </p>
                        </div>
                        <span
                          className={`mt-2 w-fit rounded-full px-2 py-0.5 text-xs font-semibold md:mt-0 ${statusDisplay.className}`}
                        >
                          {statusDisplay.text}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center space-x-3 text-xs text-gray-600 md:text-sm">
                        <div className="flex items-center">
                          {/* <CurrencyDollarIcon className="h-4 w-4 text-gray-400 mr-1" /> */}
                          <span>
                            {service.formattedPrice || `₱${service.price}`}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <StarIcon className="mr-1 h-4 w-4 text-yellow-400" />
                          <span>
                            {service.averageRating || "N/A"} (
                            {service.totalReviews || 0} reviews)
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
        <div className="py-10 text-center text-gray-500">
          <WrenchScrewdriverIcon className="mx-auto mb-3 h-12 w-12 text-gray-300" />
          <p className="mb-1">You haven't listed any services yet.</p>
          <Link href="/provider/services/add" legacyBehavior>
            <a className="text-sm font-semibold text-blue-600 hover:text-blue-700">
              Add your first service
            </a>
          </Link>
        </div>
      )}
    </div>
  );
};

export default ServiceManagementNextjs;
