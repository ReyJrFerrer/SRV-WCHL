import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  MapPinIcon,
  CalendarDaysIcon,
  TagIcon,
  BriefcaseIcon,
  LockClosedIcon,
  LockOpenIcon,
} from "@heroicons/react/24/solid";

import {
  useServiceManagement,
  EnhancedService,
} from "../../../hooks/serviceManagement";
import BottomNavigation from "../../../components/provider/BottomNavigation";
import { ServicePackage } from "../../../services/serviceCanisterService";
import ViewReviewsButton from "../../../components/common/ViewReviewsButton";
import useProviderBookingManagement from "../../../hooks/useProviderBookingManagement";

// Simple Tooltip component for validation messages
interface TooltipProps {
  children: React.ReactNode;
  content: string;
  disabled?: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  disabled = false,
}) => {
  if (!disabled) return <>{children}</>;

  return (
    <div className="group relative">
      {children}
      <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 transform rounded-lg bg-gray-800 px-3 py-2 text-sm whitespace-nowrap text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        {content}
        <div className="absolute top-full left-1/2 -translate-x-1/2 transform border-4 border-transparent border-t-gray-800"></div>
      </div>
    </div>
  );
};

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

  // Use provider booking management hook for validation
  const { bookings: providerBookings } = useProviderBookingManagement();

  const [service, setService] = useState<EnhancedService | null>(null);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set document title
  useEffect(() => {
    if (service) {
      document.title = `${service.title} | SRV Provider`;
    } else {
      document.title = "Service Details | SRV Provider";
    }
  }, [service]);
  const [retryCount, setRetryCount] = useState(0);

  // Helper function to check if service has active bookings
  const hasActiveBookings = useMemo(() => {
    if (!service || !providerBookings.length) return false;

    // Active booking statuses that should prevent editing/deletion
    const activeStatuses = ["Requested", "Accepted", "InProgress"];

    return providerBookings.some(
      (booking) =>
        booking.serviceId === service.id &&
        activeStatuses.includes(booking.status),
    );
  }, [service, providerBookings]);

  // Get count of active bookings for tooltip message
  const activeBookingsCount = useMemo(() => {
    if (!service || !providerBookings.length) return 0;

    const activeStatuses = ["Requested", "Accepted", "InProgress"];

    return providerBookings.filter(
      (booking) =>
        booking.serviceId === service.id &&
        activeStatuses.includes(booking.status),
    ).length;
  }, [service, providerBookings]);

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

  return (
    <div className="min-h-screen bg-gray-100 pb-20 md:pb-0">
      <header className="sticky top-0 z-30 bg-white shadow-sm">
        <div className="container mx-auto flex items-center justify-between px-6 py-6">
          <button
            onClick={() => navigate("/provider/home")}
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

      <main className="container mx-auto space-y-6 p-4 sm:p-6">
        {/* Active Bookings Warning */}
        {hasActiveBookings && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-amber-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800">
                  Service has active bookings
                </h3>
                <div className="mt-2 text-sm text-amber-700">
                  <p>
                    This service has {activeBookingsCount} active booking
                    {activeBookingsCount !== 1 ? "s" : ""} and cannot be edited
                    or deleted until all bookings are completed or cancelled.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hero Image and Basic Info Card */}
        <div className="mt-8 overflow-hidden rounded-xl bg-white shadow-lg">
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
          </div>

          {/* Location & provider details */}
          <div className="space-y-5 rounded-xl bg-white p-6 shadow-lg">
            <h3 className="mb-4 flex items-center gap-2 border-b pb-2 text-lg font-semibold text-gray-700">
              <MapPinIcon className="h-6 w-6 text-blue-500" />
              Location & Provider Details
            </h3>
            <div className="col-span-1 sm:col-span-2">
              <dt className="mb-1 text-xs font-semibold text-gray-500">
                Full Address
              </dt>
              <dd className="flex flex-col gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800">
                <span className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 10.5c0 2.485-2.015 4.5-4.5 4.5s-4.5-2.015-4.5-4.5S9.015 6 11.5 6s4.5 2.015 4.5 4.5z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 14.5v4"
                    />
                  </svg>
                  <span>
                    {service.location.address && (
                      <span>{service.location.address}, </span>
                    )}
                    {service.location.city}
                    {service.location.state && `, ${service.location.state}`}
                    {service.location.postalCode &&
                      ` ${service.location.postalCode}`}
                    {service.location.country && (
                      <span className="text-gray-500">
                        , {service.location.country}
                      </span>
                    )}
                  </span>
                </span>
              </dd>
            </div>

            {service.weeklySchedule && service.weeklySchedule.length > 0 && (
              <div className="mt-4 flex flex-col gap-4">
                {/* Availability Section */}
                <div className="col-span-1 sm:col-span-2">
                  <dt className="mb-1 flex items-center gap-2 text-xs font-semibold text-gray-500">
                    <CalendarDaysIcon className="h-4 w-4 text-blue-400" />
                    Availability
                  </dt>
                  <dd className="flex flex-wrap gap-4 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800">
                    {service.weeklySchedule
                      .filter((entry) => entry.availability.isAvailable)
                      .map((entry) => (
                        <div
                          key={entry.day}
                          className="flex min-w-[120px] flex-col items-start"
                        >
                          <span className="mb-1 rounded-full bg-blue-100 px-3 py-0.5 text-xs font-bold text-blue-700 shadow-sm">
                            {entry.day}
                          </span>
                          <span className="text-sm font-medium text-blue-900">
                            {entry.availability.slots &&
                            entry.availability.slots.length > 0 ? (
                              <ul className="ml-4 list-disc space-y-0.5">
                                {entry.availability.slots.map((slot, idx) => {
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
                                  return (
                                    <li
                                      key={idx}
                                      className="text-xs text-blue-800"
                                    >
                                      {formatTime(slot.startTime)} -{" "}
                                      {formatTime(slot.endTime)}
                                    </li>
                                  );
                                })}
                              </ul>
                            ) : (
                              <span className="text-xs text-gray-400">
                                No slots
                              </span>
                            )}
                          </span>
                        </div>
                      ))}
                    {service.weeklySchedule.filter(
                      (entry) => entry.availability.isAvailable,
                    ).length === 0 && (
                      <span className="text-gray-400">Not specified</span>
                    )}
                  </dd>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Service Images Placeholder */}
        <div className="mb-6 rounded-xl bg-white p-6 shadow-lg">
          <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-700">
            <span className="mr-2 inline-block h-5 w-5 align-middle">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-5 w-5 text-gray-500"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5V7.125C3 6.504 3.504 6 4.125 6h15.75c.621 0 1.125.504 1.125 1.125V16.5M3 16.5A2.25 2.25 0 005.25 18.75h13.5A2.25 2.25 0 0021 16.5M3 16.5l4.72-4.72a1.5 1.5 0 012.12 0l2.44 2.44a1.5 1.5 0 002.12 0l3.44-3.44a1.5 1.5 0 012.12 0L21 13.5"
                />
              </svg>
            </span>
            Service Images
          </h3>
          <div className="py-8 text-center text-gray-400">
            <p>Service images will appear here.</p>
          </div>
        </div>

        {/* Certifications Placeholder */}
        <div className="rounded-xl bg-white p-6 shadow-lg">
          <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-700">
            <span className="mr-2 inline-block h-5 w-5 align-middle">
              {/* Award/Certificate icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-5 w-5 text-gray-500"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 10.5V6.75A3.75 3.75 0 008.25 6.75v3.75m6.75 0a3.75 3.75 0 01-7.5 0m7.5 0H6.75m10.5 0v6.75a2.25 2.25 0 01-2.25 2.25H9a2.25 2.25 0 01-2.25-2.25V10.5"
                />
                <circle cx="12" cy="10.5" r="3" />
              </svg>
            </span>
            Certifications
          </h3>
          <div className="py-8 text-center text-gray-400">
            <p>Certifications will appear here.</p>
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

        {/* Action Buttons Card */}
        <div className="mb-8 flex flex-col gap-2 rounded-xl bg-white p-4 shadow-lg sm:flex-row sm:gap-3">
          {/* Deactivate/Activate Button */}
          <button
            onClick={handleStatusToggle}
            disabled={isUpdatingStatus}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold shadow-sm transition-colors duration-150 focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:outline-none disabled:opacity-60 ${
              service.status === "Available"
                ? "text-yellow-600 hover:bg-yellow-500 hover:text-white"
                : "text-green-600 hover:bg-green-500 hover:text-white"
            }`}
          >
            {service.status === "Available" ? (
              <LockClosedIcon className="h-5 w-5" />
            ) : (
              <LockOpenIcon className="h-5 w-5" />
            )}
            {isUpdatingStatus
              ? "Updating..."
              : service.status === "Available"
                ? "Deactivate"
                : "Activate"}
          </button>

          {/* Delete Service Button */}
          <Tooltip
            content={`Cannot delete service with ${activeBookingsCount} active booking${activeBookingsCount !== 1 ? "s" : ""}`}
            disabled={hasActiveBookings}
          >
            <button
              onClick={hasActiveBookings ? undefined : handleDeleteService}
              disabled={isDeleting || hasActiveBookings}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-500 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 shadow-sm transition-colors duration-150 focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:outline-none disabled:opacity-60 ${
                hasActiveBookings
                  ? "cursor-not-allowed opacity-60"
                  : "hover:bg-red-500 hover:text-white"
              }`}
              tabIndex={hasActiveBookings ? -1 : 0}
            >
              <TrashIcon className="h-5 w-5" />
              {isDeleting ? "Deleting..." : "Delete Service"}
            </button>
          </Tooltip>
        </div>
      </main>
      <div className="md:hidden">
        <BottomNavigation />
      </div>
    </div>
  );
};

export default ProviderServiceDetailPage;
