import React from "react";
import {
  PlusIcon,
  StarIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/solid";
import { Link } from "react-router-dom";
import { EnhancedService } from "../../hooks/serviceManagement";

// Helper to get category image path
const getCategoryImage = (slugOrName?: string) => {
  if (!slugOrName) return "/images/categories/others.svg";
  // Normalize slug: lowercase, replace spaces with hyphens
  const slug = slugOrName.toLowerCase().replace(/\s+/g, "-");
  return `/images/categories/${slug}.svg`;
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
  maxItemsToShow = services.length,
}) => {
  const displayedServices = services.slice(0, maxItemsToShow);

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "Available":
        return { text: "Active", className: "bg-green-100 text-green-700" }; // Show badge for active
      case "Suspended":
        return {
          text: "Suspended",
          className: "bg-yellow-100 text-yellow-700",
        };
      case "Unavailable":
        return { text: "Inactive", className: "bg-red-100 text-red-700" };
      default:
        return { text: "Unknown", className: "bg-gray-100 text-gray-600" };
    }
  };

  if (loading) {
    return (
      <>
        <h2 className="mt-5 pt-4 text-3xl font-extrabold tracking-tight text-blue-900 not-last:mb-6">
          My Services
        </h2>
        <div className={`rounded-2xl bg-white p-8 shadow-lg ${className}`}>
          <div className="flex flex-col items-center justify-center py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-500">Loading your services...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <h2 className="mt-5 mb-6 pt-5 text-3xl font-extrabold tracking-tight text-blue-900">
          My Services
        </h2>
        <div className={`rounded-2xl bg-white p-8 shadow-lg ${className}`}>
          <div className="py-12 text-center">
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
      </>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between pt-5 pb-2">
        <h2 className="mt-5 text-xl font-extrabold tracking-tight text-blue-900 sm:text-2xl md:text-3xl">
          My Services
        </h2>
        <Link
          to="/provider/services/add"
          className="flex items-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 sm:px-4"
          aria-label="Add new service"
        >
          <PlusIcon className="h-5 w-5" />
          <span className="ml-1 hidden sm:inline">Add new service</span>
        </Link>
      </div>
      <div
        className={`rounded-2xl bg-gradient-to-br from-blue-50 via-white to-yellow-50 p-6 shadow-lg ${className} mt-2`}
      >
        {displayedServices.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {displayedServices.map((service) => {
              const isActive = service.status === "Available";
              const categoryImage = getCategoryImage(
                service.category?.slug || service.category?.name,
              );

              return (
                <Link
                  key={service.id}
                  to={`/provider/service-details/${service.id}`}
                  className="group relative flex flex-col rounded-2xl border border-blue-100 bg-white p-5 shadow transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
                >
                  {/* Category image */}
                  <div className="absolute -top-8 left-1/2 z-10 -translate-x-1/2">
                    <img
                      src={categoryImage}
                      alt={service.category?.name || "Category"}
                      className="h-16 w-16 rounded-full border-4 border-white bg-white object-cover shadow-lg"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/images/categories/others.svg";
                      }}
                    />
                  </div>
                  {/* Active badge in top right if active */}
                  {isActive && (
                    <span
                      className="absolute top-3 right-3 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 shadow"
                      title="Active"
                    >
                      Active
                    </span>
                  )}
                  <div className="mt-10 flex flex-grow flex-col">
                    <div className="flex items-center justify-between">
                      <h4 className="mb-1 truncate text-lg font-bold text-blue-900">
                        {service.title}
                      </h4>
                      {/* Status badge always shown, but only "Active" for available */}
                      {!isActive && (
                        <span
                          className={`ml-2 rounded-full px-3 py-1 text-xs font-semibold ${getStatusDisplay(service.status).className}`}
                        >
                          {getStatusDisplay(service.status).text}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-blue-700">
                      {service.category?.name || "Service"}
                    </p>
                    {/* Hide price, location, description */}
                    <div className="mt-3 flex items-center gap-3">
                      <StarIcon className="h-5 w-5 text-yellow-400" />
                      <span className="font-semibold text-blue-900">
                        {service.averageRating || "N/A"}
                      </span>
                      <span className="text-gray-500">
                        ({service.totalReviews || 0} reviews)
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-gray-500">
            <WrenchScrewdriverIcon className="mx-auto mb-3 h-14 w-14 text-gray-300" />
            <p className="mb-2 text-lg">You haven't listed any services yet.</p>
            <Link
              to="/provider/services/add"
              className="mt-2 inline-flex items-center rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-blue-700"
            >
              <PlusIcon className="mr-2 h-5 w-5" />
              Add your first service
            </Link>
          </div>
        )}
      </div>
    </>
  );
};

export default ServiceManagementNextjs;
