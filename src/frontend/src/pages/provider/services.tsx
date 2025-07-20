import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  PlusIcon,
  WrenchScrewdriverIcon,
  StarIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/solid";
import {
  PaintBrushIcon,
  ComputerDesktopIcon,
  CameraIcon,
  SparklesIcon,
  AcademicCapIcon,
  TruckIcon,
  HomeIcon,
  EllipsisHorizontalCircleIcon,
  BoltIcon,
  ScissorsIcon,
} from "@heroicons/react/24/outline";
import BottomNavigation from "../../components/provider/BottomNavigation";
import {
  useServiceManagement,
  EnhancedService,
} from "../../hooks/serviceManagement";
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

const MyServicesPage: React.FC = () => {
  const router = useRouter();

  // Use the service management hook
  const {
    userServices,
    userProfile,
    loading,
    error,
    refreshServices,
    isUserAuthenticated,
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

  const handleToggleActive = async (
    serviceId: string,
    currentStatus: boolean,
  ) => {
    // TODO: Implement actual backend call
    alert(
      `Service ${serviceId} status would be toggled. Backend integration needed.`,
    );
  };

  const handleDeleteService = async (serviceId: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this service? This action cannot be undone.",
      )
    ) {
      // TODO: Implement actual backend call
      alert(
        `Service ${serviceId} would be deleted. Backend integration needed.`,
      );
    }
  };

  // Show loading state while page initializes
  if (pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-3 text-gray-700">Loading Services...</p>
      </div>
    );
  }

  // Show error state if not authenticated
  if (!isUserAuthenticated()) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-gray-800">
            Authentication Required
          </h1>
          <p className="mb-6 text-gray-600">
            Please log in to access your services.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
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

      <div className="flex min-h-screen flex-col bg-gray-100 pb-16 md:pb-0">
        <header className="sticky top-0 z-20 bg-white px-4 py-3 shadow-sm">
          <div className="container mx-auto flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-800 sm:text-2xl">
              My Services
            </h1>
            <Link href="/provider/services/add" legacyBehavior>
              <a className="flex items-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 sm:px-4">
                <PlusIcon className="mr-1.5 h-5 w-5" />
                Add New Service
              </a>
            </Link>
          </div>
        </header>

        <main className="container mx-auto flex-grow p-4 sm:p-6">
          {loading && (
            <div className="py-16 text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-blue-500"></div>
              <p className="text-gray-600">Loading your services...</p>
            </div>
          )}

          {error && (
            <div className="mt-6 rounded-xl bg-white py-16 text-center shadow-md">
              <p className="mb-4 text-red-500">{error}</p>
              <button
                onClick={refreshServices}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && userServices.length === 0 && (
            <div className="mt-6 rounded-xl bg-white py-16 text-center shadow-md">
              <WrenchScrewdriverIcon className="mx-auto mb-4 h-16 w-16 text-gray-300" />
              <p className="mb-2 text-lg text-gray-700">No services found</p>
              <p className="mb-6 text-sm text-gray-600">
                Get started by adding your first service offering.
              </p>
              <Link href="/provider/services/add" legacyBehavior>
                <a className="inline-flex items-center rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-blue-700">
                  <PlusIcon className="mr-2 h-5 w-5" />
                  Add Your First Service
                </a>
              </Link>
            </div>
          )}

          {!loading && !error && userServices.length > 0 && (
            <div className="space-y-6">
              {userServices.map((service) => {
                const statusDisplay = getStatusDisplay(service.status);

                return (
                  <div
                    key={service.id}
                    className="rounded-xl bg-white p-6 shadow-lg"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:space-x-4">
                      {/* Service Icon */}
                      <div className="mb-3 flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 md:mb-0">
                        {renderIcon(service)}
                      </div>

                      {/* Service Details */}
                      <div className="flex-grow">
                        <div className="flex flex-col justify-between md:flex-row md:items-start">
                          <div className="flex-grow">
                            <h4 className="text-lg font-semibold text-black md:text-xl">
                              {service.title}
                            </h4>
                            <p className="text-sm text-gray-500 md:text-base">
                              {service.category?.name || "Service"}
                            </p>
                            <p className="mt-1 text-sm text-gray-400">
                              {service.formattedLocation ||
                                "Location not specified"}
                            </p>
                            {service.description && (
                              <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                                {service.description}
                              </p>
                            )}
                          </div>
                          <span
                            className={`mt-2 w-fit rounded-full px-3 py-1 text-sm font-semibold md:mt-0 ${statusDisplay.className}`}
                          >
                            {statusDisplay.text}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center space-x-4 text-sm text-gray-600 md:text-base">
                          <div className="flex items-center">
                            <span className="font-semibold text-green-600">
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

                        {/* Action Buttons */}
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Link
                            href={`/provider/service-details/${service.id}`}
                            legacyBehavior
                          >
                            <a className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700">
                              <ArrowRightIcon className="mr-1 h-4 w-4" />
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
