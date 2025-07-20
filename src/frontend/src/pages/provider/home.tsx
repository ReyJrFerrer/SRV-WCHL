import React, { useState, useEffect, useMemo } from "react";
import SPHeaderNextjs from "../../components/provider/SPHeader";
import ProviderStatsNextjs from "../../components/provider/ProviderStats";
import BookingRequestsNextjs from "../../components/provider/BookingRequestsNextjs";
import ServiceManagementNextjs from "../../components/provider/ServiceManagement";
import CredentialsDisplayNextjs from "../../components/provider/CredentialsDisplay";
import BottomNavigationNextjs from "../../components/provider/BottomNavigation";
import { useServiceManagement } from "../../hooks/serviceManagement";
import { useProviderBookingManagement } from "../../hooks/useProviderBookingManagement";

interface ProviderHomePageProps {
  // Props if needed
}

const ProviderHomePage: React.FC<ProviderHomePageProps> = () => {
  const [pageLoading, setPageLoading] = useState(true);
  const [initializationAttempts, setInitializationAttempts] = useState(0);

  // Use the service management hook
  const {
    userServices,
    userProfile,
    getProviderStats,
    loading: servicesLoading,
    error: servicesError,
    refreshServices,
    isUserAuthenticated,
  } = useServiceManagement();

  // Use the provider booking management hook
  const {
    bookings,
    loading: bookingsLoading,
    error: bookingsError,
    getPendingBookings,
    getUpcomingBookings,
    refreshBookings,
    isProviderAuthenticated,
  } = useProviderBookingManagement();

  // Provider stats state
  const [providerStats, setProviderStats] = useState({
    totalServices: 0,
    activeServices: 0,
    totalBookings: 0,
    averageRating: 0,
  });

  // Only create a legacy provider object for components that still need the old interface
  const legacyProvider = useMemo(() => {
    if (!userProfile) return null;

    const nameParts = userProfile.name.split(" ");

    return {
      id: userProfile.id,
      name: userProfile.name,
      firstName: nameParts[0] || "",
      lastName: nameParts.slice(1).join(" ") || "",
      phone: userProfile.phone || "",
      profilePicture: userProfile.profilePicture || "",
      isVerified: userProfile.isVerified || false,
      rating: 0,
      totalReviews: 0,
      joinDate: userProfile.createdAt || new Date().toISOString(),
      servicesOffered: [],
      credentials: [],
      isActive: true,
    };
  }, [userProfile]);

  useEffect(() => {
    const loadProviderData = async () => {
      try {
        // Check authentication first
        if (!isUserAuthenticated()) {
          // Retry authentication check up to 3 times with delays
          if (initializationAttempts < 3) {
            setTimeout(() => {
              setInitializationAttempts((prev) => prev + 1);
            }, 1000);
            return;
          } else {
            setPageLoading(false);
            return;
          }
        }

        // Reset initialization attempts once authenticated
        setInitializationAttempts(0);

        // Load provider stats
        const stats = await getProviderStats();
        setProviderStats(stats);
      } catch (error) {
        console.error("Error loading provider data:", error);
      } finally {
        setPageLoading(false);
      }
    };

    loadProviderData();
  }, [isUserAuthenticated, getProviderStats, initializationAttempts]);

  // Calculate counts for pending and upcoming jobs using real booking data
  const bookingCounts = useMemo(() => {
    const pendingBookings = getPendingBookings();
    const upcomingBookings = getUpcomingBookings();

    const pendingCount = pendingBookings.length;
    const upcomingCount = upcomingBookings.length;

    return { pendingCount, upcomingCount };
  }, [bookings, getPendingBookings, getUpcomingBookings]);

  // Combined loading state
  const isDataLoading = servicesLoading || bookingsLoading;
  const hasError = servicesError || bookingsError;

  // Show loading state while authentication is being established
  if (pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-3 text-gray-700">
          {initializationAttempts > 0
            ? `Establishing connection... (${initializationAttempts}/3)`
            : "Loading Provider Dashboard..."}
        </p>
      </div>
    );
  }

  // Show error state if authentication failed after retries
  if (!isUserAuthenticated()) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-gray-800">
            Authentication Required
          </h1>
          <p className="mb-6 text-gray-600">
            Please log in to access your provider dashboard.
          </p>
          {hasError && (
            <p className="mb-4 text-sm text-red-600">
              Error: {servicesError || bookingsError}
            </p>
          )}
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
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Use userProfile directly for SPHeaderNextjs */}
        <SPHeaderNextjs
          provider={userProfile}
          notificationCount={bookingCounts.pendingCount}
        />

        <div className="mx-auto max-w-7xl p-4">
          {/* Use legacyProvider for components that still need the old interface */}
          {legacyProvider && <ProviderStatsNextjs loading={isDataLoading} />}

          <BookingRequestsNextjs
            pendingRequests={bookingCounts.pendingCount}
            upcomingJobs={bookingCounts.upcomingCount}
          />

          <ServiceManagementNextjs
            services={userServices}
            loading={servicesLoading}
            error={servicesError}
            onRefresh={refreshServices}
          />

          {userProfile && <CredentialsDisplayNextjs provider={userProfile} />}
        </div>

        <BottomNavigationNextjs />
      </div>
    </>
  );
};

export default ProviderHomePage;
