import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  MapPinIcon,
  CalendarDaysIcon,
  ClockIcon,
  TagIcon,
  BriefcaseIcon,
  CogIcon,
} from "@heroicons/react/24/solid";

import {
  useServiceManagement,
  EnhancedService,
} from "../../../hooks/serviceManagement";
import BottomNavigation from "../../../components/provider/BottomNavigation";
import { ServicePackage } from "../../../services/serviceCanisterService";
import ViewReviewsButton from "../../../components/common/ViewReviewsButton";

const ProviderServiceDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Use real hook instead of mock data
  const {
    getService,
    deleteService,
    updateServiceStatus,
    getStatusColor,
    getServicePackages,
    loading: hookLoading,
    error: hookError,
  } = useServiceManagement();

  const [service, setService] = useState<EnhancedService | null>(null);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set document title
  useEffect(() => {
    if (service) {
      document.title = `Details: ${service.title} | SRV Provider`;
    } else {
      document.title = "Service Details | SRV Provider";
    }
  }, [service]);
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
  // Robust service loading with initialization check
  const loadServiceDataRobust = useCallback(
    async (serviceId: string): Promise<void> => {
      // Prevent concurrent loading
      if (isLoadingRef.current) {
        return;
      }

      // Don't reload if we already have this service loaded successfully
      if (
        service &&
        service.id === serviceId &&
        hasLoadedSuccessfully.current
      ) {
        return;
      }

      isLoadingRef.current = true;
      setLoading(true);
      setError(null);
      setInitializationAttempts(0);

      try {
        // Simplified approach - just wait a bit for the hook to be ready
        if (!getService) {
          await new Promise((resolve) => setTimeout(resolve, 500));
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
            console.warn("Failed to load packages:", packageError);
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
          throw new Error("Service not found");
        }
      } catch (err) {
        console.error("Error loading service:", err);
        if (mountedRef.current) {
          setError(
            err instanceof Error ? err.message : "Failed to load service",
          );
          hasLoadedSuccessfully.current = false;
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
        isLoadingRef.current = false;
      }
    },
    [service, getService, getServicePackages],
  );

  // Main effect to load service when ID changes
  useEffect(() => {
    if (id && typeof id === "string") {
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
      `Are you sure you want to delete "${service.title}"? This action cannot be undone.`,
    );

    if (confirmed) {
      setIsDeleting(true);
      try {
        await deleteService(service.id);
        // Reset state when navigating away
        hasLoadedSuccessfully.current = false;
        currentServiceId.current = null;
        navigate("/provider/services");
      } catch (error) {
        console.error("Failed to delete service:", error);
        alert("Failed to delete service. Please try again.");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleStatusToggle = async () => {
    if (!service) return;

    const newStatus =
      service.status === "Available" ? "Unavailable" : "Available";
    setIsUpdatingStatus(true);
    try {
      await updateServiceStatus(service.id, newStatus);
      // Update the service state directly instead of reloading
      setService((prev) => (prev ? { ...prev, status: newStatus } : prev));
    } catch (error) {
      console.error("Failed to update service status:", error);
      alert("Failed to update service status. Please try again.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleRetry = () => {
    if (id && typeof id === "string") {
      setRetryCount((prev) => prev + 1);
      hasLoadedSuccessfully.current = false; // Reset success flag for retry
      loadServiceDataRobust(id);
    }
  };

  // Show loading screen during initialization or data loading
  if ((loading || hookLoading || initializationAttempts > 0) && !service) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-700">
          {initializationAttempts > 0
            ? `Initializing system... (${initializationAttempts}/20)`
            : "Loading service details..."}
        </p>
        {retryCount > 0 && (
          <p className="mt-2 text-sm text-gray-500">
            Retry attempt: {retryCount}
          </p>
        )}
      </div>
    );
  }

  // Show error screen only if we have an error and no service data
  if ((error || hookError) && !service) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="max-w-md text-center">
          <h1 className="mb-4 text-xl font-semibold text-red-600">
            Unable to Load Service
          </h1>
          <p className="mb-6 text-gray-600">
            {error || hookError || "The service could not be loaded."}
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <button
              onClick={handleRetry}
              className="rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
            >
              Try Again
            </button>
            <Link
              to="/provider/services"
              className="rounded-lg bg-gray-600 px-6 py-2 text-white transition-colors hover:bg-gray-700"
            >
              Back to Services
            </Link>
          </div>
          {retryCount > 0 && (
            <p className="mt-4 text-xs text-gray-500">
              Attempted {retryCount} {retryCount === 1 ? "retry" : "retries"}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Final fallback if no service data
  if (!service) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="max-w-md text-center">
          <h1 className="mb-4 text-xl font-semibold text-red-600">
            Service Not Found
          </h1>
          <p className="mb-6 text-gray-600">
            The requested service could not be found or loaded.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <button
              onClick={handleRetry}
              className="rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
            >
              Try Loading Again
            </button>
            <Link
              to="/provider/services"
              className="rounded-lg bg-gray-600 px-6 py-2 text-white transition-colors hover:bg-gray-700"
            >
              Back to Services
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
    <div className="min-h-screen bg-gray-100 pb-20 md:pb-0">
      <header className="sticky top-0 z-30 bg-white shadow-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="rounded-full p-2 transition-colors hover:bg-gray-100"
            aria-label="Go back"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-700" />
          </button>
          <h1 className="truncate text-lg font-semibold text-gray-800">
            Service Details
          </h1>
          <div className="w-8"></div>
        </div>
      </header>

      {/* Show loading overlay for operations while keeping content visible */}
      {(isUpdatingStatus || isDeleting) && (
        <div className="bg-opacity-20 fixed inset-0 z-40 flex items-center justify-center bg-black">
          <div className="flex items-center rounded-lg bg-white p-4 shadow-lg">
            <div className="h-6 w-6 animate-spin rounded-full border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-700">
              {isUpdatingStatus ? "Updating status..." : "Deleting service..."}
            </span>
          </div>
        </div>
      )}

      <main className="container mx-auto space-y-6 p-4 sm:p-6">
        {/* Hero Image and Basic Info Card */}
        <div className="overflow-hidden rounded-xl bg-white shadow-lg">
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
            <div className="mb-2 flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <h2
                  className="truncate text-2xl font-bold text-gray-800"
                  title={service.title}
                >
                  {service.title}
                </h2>
                <p className="mt-1 flex items-center text-sm text-gray-500">
                  <TagIcon className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                  {service.category.name}
                </p>
              </div>
              <span
                className={`ml-2 flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold bg-${getStatusColor(service.status)}-100 text-${getStatusColor(service.status)}-700`}
              >
                {service.status}
              </span>
            </div>
            {/* <p className="text-gray-600 text-sm leading-relaxed mt-1">{service.description}</p> */}
          </div>
        </div>

        {/* Action Buttons Card */}
        <div className="flex flex-col space-y-2 rounded-xl bg-white p-4 shadow-lg sm:flex-row sm:space-y-0 sm:space-x-3">
          <Link
            to={`/provider/services/edit/${service.id}`}
            className="flex flex-1 items-center justify-center rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-600"
          >
            <PencilIcon className="mr-2 h-5 w-5" /> Edit Service
          </Link>
          <button
            onClick={handleStatusToggle}
            disabled={isUpdatingStatus}
            className={`flex flex-1 items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 ${
              service.status === "Available"
                ? "bg-yellow-500 text-white hover:bg-yellow-600"
                : "bg-green-500 text-white hover:bg-green-600"
            }`}
          >
            <CogIcon className="mr-2 h-5 w-5" />
            {isUpdatingStatus
              ? "Updating..."
              : service.status === "Available"
                ? "Deactivate"
                : "Activate"}
          </button>
          <button
            onClick={handleDeleteService}
            disabled={isDeleting}
            className="flex flex-1 items-center justify-center rounded-lg bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
          >
            <TrashIcon className="mr-2 h-5 w-5" />
            {isDeleting ? "Deleting..." : "Delete Service"}
          </button>
        </div>

        {/* Detailed Information Sections */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-3 rounded-xl bg-white p-6 shadow-lg">
            <h3 className="mb-3 border-b pb-2 text-lg font-semibold text-gray-700">
              Ratings
            </h3>
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

          <div className="space-y-3 rounded-xl bg-white p-6 shadow-lg">
            <h3 className="mb-3 border-b pb-2 text-lg font-semibold text-gray-700">
              Location & Provider Details
            </h3>
            <div className="space-y-3">
              <p className="flex items-start text-sm">
                <MapPinIcon className="mt-0.5 mr-2 h-5 w-5 flex-shrink-0 text-blue-500" />
                <div className="flex-1">
                  <span className="font-medium">Full Address:</span>
                  <div className="mt-1 text-gray-600">
                    {service.location.address && (
                      <div>{service.location.address}</div>
                    )}
                    <div>
                      {service.location.city}
                      {service.location.state && `, ${service.location.state}`}
                      {service.location.postalCode &&
                        ` ${service.location.postalCode}`}
                    </div>
                    {service.location.country && (
                      <div className="text-gray-500">
                        {service.location.country}
                      </div>
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
                  <CalendarDaysIcon className="mr-2 h-5 w-5 text-indigo-500" />
                  Available Days:{" "}
                  <span className="ml-1 font-medium">
                    {service.weeklySchedule
                      ?.filter(({ availability }) => availability.isAvailable)
                      ?.map(({ day }) => day)
                      ?.join(", ") || "Not specified"}
                  </span>
                </p>
                <p className="flex items-center text-sm">
                  <ClockIcon className="mr-2 h-5 w-5 text-purple-500" />
                  Time Slots:{" "}
                  <span className="ml-1 font-medium">
                    {service.weeklySchedule
                      ?.filter(({ availability }) => availability.isAvailable)
                      ?.flatMap(({ availability }) => availability.slots)
                      ?.map((slot) => `${slot.startTime}-${slot.endTime}`)
                      ?.join(" | ") || "Not specified"}
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
                    <ClockIcon className="mr-2 h-5 w-5 text-orange-500" />
                    Advance Notice:{" "}
                    <span className="ml-1 font-medium">
                      {service.bookingNoticeHours} hours required
                    </span>
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {packages && packages.length > 0 && (
          <div className="rounded-xl bg-white p-6 shadow-lg">
            <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-700">
              <BriefcaseIcon className="mr-2 h-5 w-5 text-gray-500" />
              Service Packages ({packages.length})
            </h3>
            <div className="space-y-4">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                >
                  <div className="flex items-start justify-between">
                    <h4 className="text-md font-semibold text-gray-800">
                      {pkg.title}
                    </h4>
                    <span className="text-md ml-2 font-semibold text-green-600">
                      ₱{pkg.price.toFixed(2)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    {pkg.description}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                    <span>
                      Created: {new Date(pkg.createdAt).toLocaleDateString()}
                    </span>
                    <span>
                      Updated: {new Date(pkg.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {packages && packages.length === 0 && (
          <div className="rounded-xl bg-white p-6 shadow-lg">
            <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-700">
              <BriefcaseIcon className="mr-2 h-5 w-5 text-gray-500" />
              Service Packages
            </h3>
            <div className="py-8 text-center">
              <BriefcaseIcon className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <p className="mb-4 text-gray-500">
                No packages available for this service
              </p>
              <p className="text-sm text-gray-400">
                Packages help customers choose specific service options with
                different pricing
              </p>
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
  );
};

export default ProviderServiceDetailPage;
