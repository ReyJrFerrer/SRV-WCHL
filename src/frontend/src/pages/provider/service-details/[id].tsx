import React, { useState, useEffect } from "react";
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

  // Load service data
  useEffect(() => {
    const loadServiceData = async () => {
      if (!id || typeof id !== "string") return;

      setLoading(true);
      setError(null);

      try {
        console.log("Loading service:", id);
        const serviceData = await getService(id);
        console.log("Service Data:", serviceData);

        if (serviceData) {
          setService(serviceData);

          // Load packages separately
          try {
            const servicePackages = await getServicePackages(id);
            console.log("Service Packages:", servicePackages);
            setPackages(servicePackages || []);
          } catch (packageError) {
            console.warn("Failed to load packages:", packageError);
            setPackages([]);
          }

          setError(null);
        } else {
          throw new Error("Service not found");
        }
      } catch (err) {
        console.error("Error loading service:", err);
        setError(err instanceof Error ? err.message : "Failed to load service");
      } finally {
        setLoading(false);
      }
    };

    loadServiceData();
  }, [id, getService, getServicePackages]);

  const handleDeleteService = async () => {
    if (!service) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${service.title}"? This action cannot be undone.`,
    );

    if (confirmed) {
      setIsDeleting(true);
      try {
        await deleteService(service.id);
        // Navigate back to services list
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
      setLoading(true);
      setError(null);
      // Trigger reload by clearing service state
      setService(null);
    }
  };

  // Show loading screen during initialization or data loading
  if (loading && !service) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-700">Loading service details...</p>
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
        <div className="container mx-auto flex items-center justify-between px-6 py-6">
          <button
            onClick={() => navigate(-1)}
            className="rounded-full p-2 transition-colors hover:bg-gray-100"
            aria-label="Go back"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-700" />
          </button>
          <h1 className="truncate text-2xl font-semibold text-gray-800">
            Service Details
          </h1>
          <div className="w-8"></div>
        </div>
      </header>

      {/* Show loading overlay for operations while keeping content visible */}
      {/* {(isUpdatingStatus || isDeleting) && (
        <div className="bg-opacity-20 fixed inset-0 z-40 flex items-center justify-center bg-black">
          <div className="flex items-center rounded-lg bg-white p-4 shadow-lg">
            <div className="h-6 w-6 animate-spin rounded-full border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-700">
              {isUpdatingStatus ? "Updating status..." : "Deleting service..."}
            </span>
          </div>
        </div>
      )} */}

      <main className="container mx-auto space-y-6 p-4 sm:p-6">
        {/* Hero Image and Basic Info Card */}
        <div className="mt-8 overflow-hidden rounded-xl bg-white shadow-lg">
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

          {/* Location & provider details */}
          <div className="space-y-5 rounded-xl bg-white p-6 shadow-lg">
            <h3 className="mb-4 flex items-center gap-2 border-b pb-2 text-lg font-semibold text-gray-700">
              <MapPinIcon className="h-6 w-6 text-blue-500" />
              Location & Provider Details
            </h3>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-2 rounded-lg bg-gray-50 p-4 sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <dt className="text-black-500 text-xs font-semibold whitespace-nowrap">
                  Full Address:
                </dt>
                <dd className="text-black-1000 m-0 p-0 text-sm">
                  {service.location.address && (
                    <span>{service.location.address}, </span>
                  )}
                  <span>
                    {service.location.city}
                    {service.location.state && `, ${service.location.state}`}
                    {service.location.postalCode &&
                      ` ${service.location.postalCode}`}
                  </span>
                  {service.location.country && (
                    <span className="text-gray-500">
                      , {service.location.country}
                    </span>
                  )}
                </dd>
              </div>
              {/* {(service.location.latitude !== undefined && service.location.longitude !== undefined) && (
                <>
                  <dt className="text-xs font-semibold text-gray-500">Coordinates</dt>
                  <dd className="text-xs font-mono text-gray-700">
                    {service.location.latitude.toFixed(6)}, {service.location.longitude.toFixed(6)}
                  </dd>
                </>
              )} */}
            </dl>
            {/* {service.providerProfile && (
                <div className="flex items-center text-sm">
                  <span className="font-medium mr-1">Provider:</span> {service.providerProfile.name}
                </div>
              )} */}
            {service.weeklySchedule && service.weeklySchedule.length > 0 && (
              <div className="mt-4 space-y-4">
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <CalendarDaysIcon className="text-black-500 h-6 w-6" />
                    <span className="text-black-700 text-xs font-semibold">
                      Availability
                    </span>
                  </div>
                  <div className="space-y-2">
                    {service.weeklySchedule
                      .filter((entry) => entry.availability.isAvailable)
                      .map((entry) => (
                        <div key={entry.day} className="flex items-start gap-2">
                          <span className="text-black-700 w-24 flex-shrink-0 text-sm font-medium">
                            {entry.day}:
                          </span>
                          <span className="text-black-900 text-sm font-medium">
                            {entry.availability.slots &&
                            entry.availability.slots.length > 0 ? (
                              entry.availability.slots
                                .map((slot) => {
                                  const formatTime = (time: string) => {
                                    const [hourStr, minuteStr] =
                                      time.split(":");
                                    let hour = parseInt(hourStr, 10);
                                    const minute = minuteStr || "00";
                                    const ampm = hour >= 12 ? "PM" : "AM";
                                    hour = hour % 12;
                                    if (hour === 0) hour = 12;
                                    return `${hour}:${minute.padStart(2, "0")} ${ampm}`;
                                  };
                                  return `${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}`;
                                })
                                .join(" | ")
                            ) : (
                              <span className="text-gray-400">No slots</span>
                            )}
                          </span>
                        </div>
                      ))}
                    {service.weeklySchedule.filter(
                      (entry) => entry.availability.isAvailable,
                    ).length === 0 && (
                      <span className="text-gray-400">Not specified</span>
                    )}
                  </div>
                </div>
                {service.bookingNoticeHours !== undefined && (
                  <div className="flex items-start gap-2 rounded-lg bg-gray-50 p-4">
                    <ClockIcon className="text-black-500 mt-0.5 h-6 w-6" />
                    <div>
                      <div className="text-black-700 mb-1 text-xs font-semibold">
                        Advance Notice
                      </div>
                      <div className="text-black-900 text-sm font-medium">
                        {service.bookingNoticeHours} hours required
                      </div>
                    </div>
                  </div>
                )}
              </div>
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
        {/* Action Buttons Card */}
        <div className="flex flex-col space-y-2 rounded-xl bg-white p-4 shadow-lg sm:flex-row sm:space-y-0 sm:space-x-3">
          <Link
            to={`/provider/services/edit/${service.id}`}
            className="text-black-500 flex flex-1 items-center justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-medium transition-colors hover:bg-gray-100"
          >
            <PencilIcon className="mr-2 h-5 w-5" /> Edit Service
          </Link>
          <button
            onClick={handleStatusToggle}
            disabled={isUpdatingStatus}
            className={`text-black-500 text-transition-colors flex flex-1 items-center justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-medium disabled:opacity-50 ${
              service.status === "Available"
                ? "bg-white-500 text-yellow-500 hover:bg-gray-100"
                : "bg-white-500 text-green-500 hover:bg-gray-100"
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
            className="flex flex-1 items-center justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-gray-100 disabled:opacity-50"
          >
            <TrashIcon className="mr-2 h-5 w-5" />
            {isDeleting ? "Deleting..." : "Delete Service"}
          </button>
        </div>
      </main>
      <div className="md:hidden">
        <BottomNavigation />
      </div>
    </div>
  );
};

export default ProviderServiceDetailPage;
