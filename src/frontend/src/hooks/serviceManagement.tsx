import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Service,
  ServiceStatus,
  ServiceCategory,
  ServicePackage,
  Location,
  ProviderAvailability,
  AvailableSlot,
  DayOfWeek,
  TimeSlot,
  DayAvailability,
  serviceCanisterService,
} from "../services/serviceCanisterService";
import {
  FrontendProfile,
  authCanisterService,
} from "../services/authCanisterService";

// Export availability-related types for use in components
export type {
  DayOfWeek,
  DayAvailability,
  TimeSlot,
  ProviderAvailability,
  AvailableSlot,
};

// Enhanced Service interface with additional frontend data
export interface EnhancedService extends Service {
  providerProfile?: FrontendProfile;
  formattedLocation?: string;
  distanceFromUser?: number;
  isProviderDataLoaded?: boolean;
  packages?: ServicePackage[];
  availability?: ProviderAvailability;
  formattedPrice?: string;
  averageRating?: number;
  totalReviews?: number;
}

// Service creation/update request types
export interface ServiceCreateRequest {
  title: string;
  description: string;
  categoryId: string;
  price: number;
  location: Location;
  weeklySchedule?: Array<{ day: DayOfWeek; availability: DayAvailability }>;
  instantBookingEnabled?: boolean;
  bookingNoticeHours?: number;
  maxBookingsPerDay?: number;
}

export interface ServiceUpdateRequest extends Partial<ServiceCreateRequest> {
  id: string;
  status?: ServiceStatus;
}

// Package management types
export interface PackageCreateRequest {
  serviceId: string;
  title: string;
  description: string;
  price: number;
}

export interface PackageUpdateRequest extends Partial<PackageCreateRequest> {
  id: string;
}

// Search and filtering types
export interface ServiceSearchFilters {
  categoryId?: string;
  location?: Location;
  radius?: number;
  minPrice?: number;
  maxPrice?: number;
  status?: ServiceStatus;
  rating?: number;
  instantBookingOnly?: boolean;
  availableToday?: boolean;
}

export interface ServiceSearchRequest extends ServiceSearchFilters {
  query?: string;
  sortBy?: "price" | "rating" | "distance" | "created" | "popularity";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// Hook state management types
interface LoadingStates {
  services: boolean;
  profile: boolean;
  providers: boolean;
  categories: boolean;
  packages: boolean;
  availability: boolean;
  operations: Map<string, boolean>;
}

interface ServiceManagementHook {
  // Core data states
  services: EnhancedService[];
  userProfile: FrontendProfile | null;
  providerProfiles: Map<string, FrontendProfile>;
  categories: ServiceCategory[];
  userServices: EnhancedService[];

  // Loading states
  loading: boolean;
  loadingProfiles: boolean;
  loadingCategories: boolean;
  refreshing: boolean;

  // Error state
  error: string | null;

  // Service CRUD operations
  createService: (request: ServiceCreateRequest) => Promise<EnhancedService>;
  updateService: (
    serviceId: string,
    categoryId: string,
    title: string,
    description: string,
    price: number,
  ) => Promise<EnhancedService>;
  deleteService: (serviceId: string) => Promise<void>;
  getService: (serviceId: string) => Promise<EnhancedService | null>;

  // Service status management
  updateServiceStatus: (
    serviceId: string,
    status: ServiceStatus,
  ) => Promise<void>;
  activateService: (serviceId: string) => Promise<void>;
  suspendService: (serviceId: string) => Promise<void>;
  deactivateService: (serviceId: string) => Promise<void>;

  // Package management
  createPackage: (request: PackageCreateRequest) => Promise<ServicePackage>;
  updatePackage: (request: PackageUpdateRequest) => Promise<ServicePackage>;
  deletePackage: (packageId: string) => Promise<void>;
  getServicePackages: (serviceId: string) => Promise<ServicePackage[]>;

  // Availability management
  updateAvailability: (
    serviceId: string,
    availability: ProviderAvailability,
  ) => Promise<void>;
  getServiceAvailability: (
    serviceId: string,
  ) => Promise<ProviderAvailability | null>;
  getAvailableSlots: (
    serviceId: string,
    date: Date,
  ) => Promise<AvailableSlot[]>;
  toggleInstantBooking: (serviceId: string, enabled: boolean) => Promise<void>;

  // Search and filtering
  searchServices: (request: ServiceSearchRequest) => Promise<EnhancedService[]>;
  getServicesByCategory: (categoryId: string) => Promise<EnhancedService[]>;
  getServicesByLocation: (
    location: Location,
    radius: number,
  ) => Promise<EnhancedService[]>;
  getNearbyServices: (userLocation?: Location) => Promise<EnhancedService[]>;

  // Utility functions
  servicesByStatus: (status: ServiceStatus) => EnhancedService[];
  refreshServices: () => Promise<void>;
  clearError: () => void;
  getServiceCount: (status?: ServiceStatus) => number;
  formatServicePrice: (price: number) => string;
  getStatusColor: (status: ServiceStatus) => string;
  enrichServiceWithProviderData: (service: Service) => Promise<EnhancedService>;
  formatLocationString: (location: Location) => string;
  calculateDistance: (from: Location, to: Location) => number;
  getCurrentUserId: () => string | null;
  isUserAuthenticated: () => boolean;
  retryOperation: (operation: string) => Promise<void>;
  isOperationInProgress: (operation: string) => boolean;
  organizeWeeklySchedule: (
    weeklySchedule?: Array<{ day: DayOfWeek; availability: DayAvailability }>,
  ) => OrganizedWeeklySchedule;

  // Category management
  getCategories: () => Promise<ServiceCategory[]>;
  refreshCategories: () => Promise<void>;

  // Provider functions
  getProviderServices: (providerId?: string) => Promise<EnhancedService[]>;
  getProviderStats: (providerId?: string) => Promise<{
    totalServices: number;
    activeServices: number;
    totalBookings: number;
    averageRating: number;
  }>;
}

// Add this interface near the other type definitions
export interface OrganizedWeeklySchedule {
  monday?: DayAvailability;
  tuesday?: DayAvailability;
  wednesday?: DayAvailability;
  thursday?: DayAvailability;
  friday?: DayAvailability;
  saturday?: DayAvailability;
  sunday?: DayAvailability;
}

export const useServiceManagement = (): ServiceManagementHook => {
  // Authentication - Using identity from custom AuthContext
  const { isAuthenticated, identity } = useAuth();

  // Core state management
  const [services, setServices] = useState<EnhancedService[]>([]);
  const [userProfile, setUserProfile] = useState<FrontendProfile | null>(null);
  const [providerProfiles, setProviderProfiles] = useState<
    Map<string, FrontendProfile>
  >(new Map());
  const [categories, setCategories] = useState<ServiceCategory[]>([]);

  // Loading states
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    services: false,
    profile: false,
    providers: false,
    categories: false,
    packages: false,
    availability: false,
    operations: new Map(),
  });

  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Computed states
  const loading = useMemo(
    () => loadingStates.services || loadingStates.profile,
    [loadingStates.services, loadingStates.profile],
  );

  const loadingProfiles = useMemo(
    () => loadingStates.providers,
    [loadingStates.providers],
  );

  const loadingCategories = useMemo(
    () => loadingStates.categories,
    [loadingStates.categories],
  );

  // User services filtered from all services
  const userServices = useMemo(() => {
    if (!identity) return [];
    const currentUserIdString = identity.getPrincipal().toString();
    return services.filter(
      (service) => service.providerId.toString() === currentUserIdString,
    );
  }, [services, identity]);

  // Helper function to update loading state
  const setLoadingState = useCallback(
    (key: keyof Omit<LoadingStates, "operations">, value: boolean) => {
      setLoadingStates((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  // Helper function to update operation loading state
  const setOperationLoading = useCallback(
    (operation: string, value: boolean) => {
      setLoadingStates((prev) => {
        const newOperations = new Map(prev.operations);
        if (value) {
          newOperations.set(operation, true);
        } else {
          newOperations.delete(operation);
        }
        return { ...prev, operations: newOperations };
      });
    },
    [],
  );

  // Error handling
  const handleError = useCallback((error: any, operation: string) => {
    console.error(`Error in ${operation}:`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    setError(`${operation}: ${errorMessage}`);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch user profile
  const fetchUserProfile = useCallback(async () => {
    // Wait for authentication context to be properly initialized
    if (!isAuthenticated || !identity) return;

    try {
      setLoadingState("profile", true);
      // Add a small delay to ensure HTTP agent is ready
      await new Promise((resolve) => setTimeout(resolve, 100));

      const profileData = await authCanisterService.getProfile(
        identity.getPrincipal().toString(),
      );
      setUserProfile(profileData);
    } catch (error) {
      handleError(error, "fetch user profile");
    } finally {
      setLoadingState("profile", false);
    }
  }, [isAuthenticated, identity, setLoadingState, handleError]);

  // Fetch provider profile
  const fetchProviderProfile = useCallback(
    async (providerId: string): Promise<FrontendProfile | null> => {
      try {
        if (providerProfiles.has(providerId)) {
          return providerProfiles.get(providerId)!;
        }

        // Add delay to ensure agents are ready
        await new Promise((resolve) => setTimeout(resolve, 100));

        const profile = await authCanisterService.getProfile(providerId);
        if (profile) {
          setProviderProfiles((prev) => new Map(prev).set(providerId, profile));
          return profile;
        }
        return null;
      } catch (error) {
        console.error("Error fetching provider profile:", error);
        return null;
      }
    },
    [providerProfiles],
  );

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      setLoadingState("categories", true);
      setCategories([]); // Clear categories to prevent flickering
      // Add delay to ensure agents are ready
      await new Promise((resolve) => setTimeout(resolve, 100));

      const categoriesData = await serviceCanisterService.getAllCategories();
      setCategories(categoriesData);
    } catch (error) {
      handleError(error, "fetch categories");
    } finally {
      setLoadingState("categories", false);
    }
  }, [setLoadingState, handleError]);

  // Enrich service with provider data
  const enrichServiceWithProviderData = useCallback(
    async (service: Service): Promise<EnhancedService> => {
      const providerProfile = await fetchProviderProfile(
        service.providerId.toString(),
      );

      const enrichedService: EnhancedService = {
        ...service,
        providerProfile: providerProfile ?? undefined,
        formattedLocation: formatLocationString(service.location),
        isProviderDataLoaded: true,
        formattedPrice: formatServicePrice(service.price),
        averageRating: service.rating || 0,
        totalReviews: Number(service.reviewCount) || 0,
      };

      return enrichedService;
    },
    [fetchProviderProfile],
  );

  // Fetch services
  const fetchServices = useCallback(async () => {
    try {
      setLoadingState("services", true);
      // Add delay to ensure agents are ready
      await new Promise((resolve) => setTimeout(resolve, 100));

      const servicesData = await serviceCanisterService.getAllServices();

      // Enrich services with provider data
      const enrichedServices = await Promise.all(
        servicesData.map((service) => enrichServiceWithProviderData(service)),
      );

      setServices(enrichedServices);
    } catch (error) {
      handleError(error, "fetch services");
    } finally {
      setLoadingState("services", false);
    }
  }, [setLoadingState, handleError, enrichServiceWithProviderData]);

  // Service CRUD Operations

  // Fixed: createService now uses individual parameters instead of request object
  const createService = useCallback(
    async (request: ServiceCreateRequest): Promise<EnhancedService> => {
      try {
        setOperationLoading("createService", true);
        const newService = await serviceCanisterService.createService(
          request.title,
          request.description,
          request.categoryId,
          request.price,
          request.location,
          request.weeklySchedule,
          request.instantBookingEnabled,
          request.bookingNoticeHours,
          request.maxBookingsPerDay,
        );

        if (!newService) {
          throw new Error("Failed to create service");
        }

        const enrichedService = await enrichServiceWithProviderData(newService);
        setServices((prev) => [...prev, enrichedService]);
        return enrichedService;
      } catch (error) {
        handleError(error, "create service");
        throw error;
      } finally {
        setOperationLoading("createService", false);
      }
    },
    [setOperationLoading, handleError, enrichServiceWithProviderData],
  );

  // Fixed: updateService now uses only 4 parameters (serviceId, title, description, price)
  const updateService = useCallback(
    async (
      serviceId: string,
      categoryId: string,
      title: string,
      description: string,
      price: number,
    ): Promise<EnhancedService> => {
      try {
        setOperationLoading("updateService", true);
        const updatedService = await serviceCanisterService.updateService(
          serviceId,
          categoryId,
          title,
          description,
          price,
        );

        if (!updatedService) {
          throw new Error("Failed to update service");
        }

        const enrichedService =
          await enrichServiceWithProviderData(updatedService);
        setServices((prev) =>
          prev.map((service) =>
            service.id === serviceId ? enrichedService : service,
          ),
        );
        return enrichedService;
      } catch (error) {
        handleError(error, "update service");
        throw error;
      } finally {
        setOperationLoading("updateService", false);
      }
    },
    [setOperationLoading, handleError, enrichServiceWithProviderData],
  );

  const deleteService = useCallback(
    async (serviceId: string): Promise<void> => {
      try {
        setOperationLoading("deleteService", true);
        await serviceCanisterService.deleteService(serviceId);
        setServices((prev) =>
          prev.filter((service) => service.id !== serviceId),
        );
      } catch (error) {
        handleError(error, "delete service");
        throw error;
      } finally {
        setOperationLoading("deleteService", false);
      }
    },
    [setOperationLoading, handleError],
  );

  const getService = useCallback(
    async (serviceId: string): Promise<EnhancedService | null> => {
      try {
        // Add delay to ensure agents are ready
        await new Promise((resolve) => setTimeout(resolve, 100));
        const service = await serviceCanisterService.getService(serviceId);
        if (!service) return null;

        return await enrichServiceWithProviderData(service);
      } catch (error) {
        handleError(error, "get service");
        return null;
      }
    },
    [handleError, enrichServiceWithProviderData],
  );

  // Service status management
  const updateServiceStatus = useCallback(
    async (serviceId: string, status: ServiceStatus): Promise<void> => {
      try {
        setOperationLoading("updateServiceStatus", true);
        const updatedService = await serviceCanisterService.updateServiceStatus(
          serviceId,
          status,
        );
        if (!updatedService) {
          throw new Error("Failed to update service status");
        }

        const enrichedService =
          await enrichServiceWithProviderData(updatedService);
        setServices((prev) =>
          prev.map((service) =>
            service.id === serviceId ? enrichedService : service,
          ),
        );
      } catch (error) {
        handleError(error, "update service status");
        throw error;
      } finally {
        setOperationLoading("updateServiceStatus", false);
      }
    },
    [setOperationLoading, handleError, enrichServiceWithProviderData],
  );

  const activateService = useCallback(
    async (serviceId: string): Promise<void> => {
      await updateServiceStatus(serviceId, "Available");
    },
    [updateServiceStatus],
  );

  const suspendService = useCallback(
    async (serviceId: string): Promise<void> => {
      await updateServiceStatus(serviceId, "Suspended");
    },
    [updateServiceStatus],
  );

  const deactivateService = useCallback(
    async (serviceId: string): Promise<void> => {
      await updateServiceStatus(serviceId, "Unavailable");
    },
    [updateServiceStatus],
  );

  // Package management
  const createPackage = useCallback(
    async (request: PackageCreateRequest): Promise<ServicePackage> => {
      try {
        setOperationLoading("createPackage", true);
        const newPackage = await serviceCanisterService.createServicePackage(
          request.serviceId,
          request.title,
          request.description,
          request.price,
        );

        if (!newPackage) {
          throw new Error("Failed to create package");
        }

        return newPackage;
      } catch (error) {
        handleError(error, "create package");
        throw error;
      } finally {
        setOperationLoading("createPackage", false);
      }
    },
    [setOperationLoading, handleError],
  );

  const updatePackage = useCallback(
    async (request: PackageUpdateRequest): Promise<ServicePackage> => {
      try {
        setOperationLoading("updatePackage", true);
        const updatedPackage =
          await serviceCanisterService.updateServicePackage(
            request.id,
            request.title!,
            request.description!,
            request.price!,
          );

        if (!updatedPackage) {
          throw new Error("Failed to update package");
        }

        return updatedPackage;
      } catch (error) {
        handleError(error, "update package");
        throw error;
      } finally {
        setOperationLoading("updatePackage", false);
      }
    },
    [setOperationLoading, handleError],
  );

  const deletePackage = useCallback(
    async (packageId: string): Promise<void> => {
      try {
        setOperationLoading("deletePackage", true);
        await serviceCanisterService.deleteServicePackage(packageId);
      } catch (error) {
        handleError(error, "delete package");
        throw error;
      } finally {
        setOperationLoading("deletePackage", false);
      }
    },
    [setOperationLoading, handleError],
  );

  const getServicePackages = useCallback(
    async (serviceId: string): Promise<ServicePackage[]> => {
      try {
        // Add delay to ensure agents are ready
        await new Promise((resolve) => setTimeout(resolve, 100));

        return await serviceCanisterService.getServicePackages(serviceId);
      } catch (error) {
        handleError(error, "get service packages");
        return [];
      }
    },
    [handleError],
  );

  // Availability management
  const updateAvailability = useCallback(
    async (
      serviceId: string,
      availability: ProviderAvailability,
    ): Promise<void> => {
      try {
        setOperationLoading("updateAvailability", true);
        // Fixed: using setServiceAvailability instead of updateProviderAvailability
        const updatedAvailability =
          await serviceCanisterService.setServiceAvailability(
            serviceId,
            availability.weeklySchedule,
            availability.instantBookingEnabled,
            availability.bookingNoticeHours,
            availability.maxBookingsPerDay,
          );

        if (!updatedAvailability) {
          throw new Error("Failed to update availability");
        }

        // Update the service in local state
        setServices((prev) =>
          prev.map((service) =>
            service.id === serviceId
              ? { ...service, availability: updatedAvailability }
              : service,
          ),
        );
      } catch (error) {
        handleError(error, "update availability");
        throw error;
      } finally {
        setOperationLoading("updateAvailability", false);
      }
    },
    [setOperationLoading, handleError],
  );

  // Fixed: getAvailableSlots now uses Date parameter and correct method name
  const getAvailableSlots = useCallback(
    async (serviceId: string, date: Date): Promise<AvailableSlot[]> => {
      try {
        // Add delay to ensure agents are ready
        await new Promise((resolve) => setTimeout(resolve, 100));

        return await serviceCanisterService.getAvailableTimeSlots(
          serviceId,
          date,
        );
      } catch (error) {
        handleError(error, "get available slots");
        return [];
      }
    },
    [handleError],
  );

  const toggleInstantBooking = useCallback(
    async (serviceId: string, enabled: boolean): Promise<void> => {
      try {
        setOperationLoading("toggleInstantBooking", true);

        // Get current availability
        const currentAvailability =
          await serviceCanisterService.getServiceAvailability(serviceId);
        if (!currentAvailability) {
          throw new Error("Service availability not found");
        }

        // Update with new instant booking setting
        await serviceCanisterService.setServiceAvailability(
          serviceId,
          currentAvailability.weeklySchedule,
          enabled,
          currentAvailability.bookingNoticeHours,
          currentAvailability.maxBookingsPerDay,
        );

        // Update local state
        setServices((prev) =>
          prev.map((service) =>
            service.id === serviceId
              ? {
                  ...service,
                  availability: service.availability
                    ? {
                        ...service.availability,
                        instantBookingEnabled: enabled,
                      }
                    : undefined,
                }
              : service,
          ),
        );
      } catch (error) {
        handleError(error, "toggle instant booking");
        throw error;
      } finally {
        setOperationLoading("toggleInstantBooking", false);
      }
    },
    [setOperationLoading, handleError],
  );

  // Search and filtering
  const searchServices = useCallback(
    async (request: ServiceSearchRequest): Promise<EnhancedService[]> => {
      try {
        // For now, implement basic filtering on loaded services
        // This can be enhanced with backend search in the future
        let filteredServices = [...services];

        if (request.categoryId) {
          filteredServices = filteredServices.filter(
            (service) => service.category.id === request.categoryId,
          );
        }

        if (request.status) {
          filteredServices = filteredServices.filter(
            (service) => service.status === request.status,
          );
        }

        if (request.minPrice !== undefined) {
          filteredServices = filteredServices.filter(
            (service) => service.price >= request.minPrice!,
          );
        }

        if (request.maxPrice !== undefined) {
          filteredServices = filteredServices.filter(
            (service) => service.price <= request.maxPrice!,
          );
        }

        if (request.query) {
          const searchTerm = request.query.toLowerCase();
          filteredServices = filteredServices.filter(
            (service) =>
              service.title.toLowerCase().includes(searchTerm) ||
              service.description.toLowerCase().includes(searchTerm),
          );
        }

        return filteredServices;
      } catch (error) {
        handleError(error, "search services");
        return [];
      }
    },
    [services, handleError],
  );

  const getServicesByCategory = useCallback(
    async (categoryId: string): Promise<EnhancedService[]> => {
      try {
        // Add delay to ensure agents are ready
        await new Promise((resolve) => setTimeout(resolve, 100));

        const categoryServices =
          await serviceCanisterService.getServicesByCategory(categoryId);
        return await Promise.all(
          categoryServices.map((service) =>
            enrichServiceWithProviderData(service),
          ),
        );
      } catch (error) {
        handleError(error, "get services by category");
        return [];
      }
    },
    [handleError, enrichServiceWithProviderData],
  );

  const getServicesByLocation = useCallback(
    async (location: Location, radius: number): Promise<EnhancedService[]> => {
      try {
        // Add delay to ensure agents are ready
        await new Promise((resolve) => setTimeout(resolve, 100));

        const locationServices =
          await serviceCanisterService.searchServicesByLocation(
            location,
            radius,
          );
        return await Promise.all(
          locationServices.map((service) =>
            enrichServiceWithProviderData(service),
          ),
        );
      } catch (error) {
        handleError(error, "get services by location");
        return [];
      }
    },
    [handleError, enrichServiceWithProviderData],
  );

  const getNearbyServices = useCallback(
    async (userLocation?: Location): Promise<EnhancedService[]> => {
      if (!userLocation) return services;

      try {
        return await getServicesByLocation(userLocation, 50); // 50km default radius
      } catch (error) {
        handleError(error, "get nearby services");
        return services;
      }
    },
    [services, getServicesByLocation, handleError],
  );

  // Utility functions
  const servicesByStatus = useCallback(
    (status: ServiceStatus): EnhancedService[] => {
      return services.filter((service) => service.status === status);
    },
    [services],
  );

  const refreshServices = useCallback(async (): Promise<void> => {
    setRefreshing(true);
    try {
      await fetchServices();
    } finally {
      setRefreshing(false);
    }
  }, [fetchServices]);

  const getServiceCount = useCallback(
    (status?: ServiceStatus): number => {
      if (!status) return services.length;
      return servicesByStatus(status).length;
    },
    [services.length, servicesByStatus],
  );

  const formatServicePrice = useCallback((price: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "PHP",
    }).format(price);
  }, []);

  const getStatusColor = useCallback((status: ServiceStatus): string => {
    switch (status) {
      case "Available":
        return "green";
      case "Suspended":
        return "yellow";
      case "Unavailable":
        return "red";
      default:
        return "gray";
    }
  }, []);

  const formatLocationString = useCallback((location: Location): string => {
    return `${location.city}, ${location.state}`;
  }, []);

  const calculateDistance = useCallback(
    (from: Location, to: Location): number => {
      // Haversine formula for calculating distance between two coordinates
      const R = 6371; // Earth's radius in kilometers
      const dLat = ((to.latitude - from.latitude) * Math.PI) / 180;
      const dLon = ((to.longitude - from.longitude) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((from.latitude * Math.PI) / 180) *
          Math.cos((to.latitude * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },
    [],
  );

  const getCurrentUserId = useCallback((): string | null => {
    return identity ? identity.getPrincipal().toString() : null;
  }, [identity]);

  const isUserAuthenticated = useCallback((): boolean => {
    return isAuthenticated && identity !== null;
  }, [isAuthenticated, identity]);

  const retryOperation = useCallback(
    async (operation: string): Promise<void> => {
      // Simple retry mechanism - can be enhanced based on operation type
      switch (operation) {
        case "fetchServices":
          await fetchServices();
          break;
        case "fetchCategories":
          await fetchCategories();
          break;
        case "fetchUserProfile":
          await fetchUserProfile();
          break;
        default:
          console.warn(`Retry not implemented for operation: ${operation}`);
      }
    },
    [fetchServices, fetchCategories, fetchUserProfile],
  );

  const isOperationInProgress = useCallback(
    (operation: string): boolean => {
      return loadingStates.operations.has(operation);
    },
    [loadingStates.operations],
  );

  // Category management
  const getCategories = useCallback(async (): Promise<ServiceCategory[]> => {
    try {
      // Add delay to ensure agents are ready
      await new Promise((resolve) => setTimeout(resolve, 100));

      return await serviceCanisterService.getAllCategories();
    } catch (error) {
      handleError(error, "get categories");
      return [];
    }
  }, [handleError]);

  const refreshCategories = useCallback(async (): Promise<void> => {
    await fetchCategories();
  }, [fetchCategories]);

  // Provider functions
  const getProviderServices = useCallback(
    async (providerId?: string): Promise<EnhancedService[]> => {
      try {
        const targetProviderId = providerId || getCurrentUserId();
        if (!targetProviderId) return [];

        // Add delay to ensure agents are ready
        await new Promise((resolve) => setTimeout(resolve, 100));

        const providerServices =
          await serviceCanisterService.getServicesByProvider(targetProviderId);
        return await Promise.all(
          providerServices.map((service) =>
            enrichServiceWithProviderData(service),
          ),
        );
      } catch (error) {
        handleError(error, "get provider services");
        return [];
      }
    },
    [getCurrentUserId, handleError, enrichServiceWithProviderData],
  );

  const getProviderStats = useCallback(
    async (
      providerId?: string,
    ): Promise<{
      totalServices: number;
      activeServices: number;
      totalBookings: number;
      averageRating: number;
    }> => {
      try {
        const providerServices = await getProviderServices(providerId);

        const totalServices = providerServices.length;
        const activeServices = providerServices.filter(
          (s) => s.status === "Available",
        ).length;
        const totalBookings = 0; // This would need to be fetched from booking service
        const averageRating =
          providerServices.length > 0
            ? providerServices.reduce((sum, s) => sum + (s.rating || 0), 0) /
              providerServices.length
            : 0;

        return {
          totalServices,
          activeServices,
          totalBookings,
          averageRating,
        };
      } catch (error) {
        handleError(error, "get provider stats");
        return {
          totalServices: 0,
          activeServices: 0,
          totalBookings: 0,
          averageRating: 0,
        };
      }
    },
    [getProviderServices, handleError],
  );

  // Effects
  useEffect(() => {
    if (isAuthenticated && identity) {
      fetchUserProfile();
    }
  }, [isAuthenticated, identity, fetchUserProfile]);

  useEffect(() => {
    fetchServices();
    fetchCategories();
  }, [fetchServices, fetchCategories]);

  // Availability management functions
  const getServiceAvailability = useCallback(
    async (serviceId: string): Promise<ProviderAvailability | null> => {
      try {
        // Add delay to ensure agents are ready
        await new Promise((resolve) => setTimeout(resolve, 100));

        return await serviceCanisterService.getServiceAvailability(serviceId);
      } catch (error) {
        handleError(error, "get service availability");
        return null;
      }
    },
    [handleError],
  );

  // Add this function in the useServiceManagement hook, after the other utility functions
  const organizeWeeklySchedule = useCallback(
    (
      weeklySchedule?: Array<{ day: DayOfWeek; availability: DayAvailability }>,
    ): OrganizedWeeklySchedule => {
      const organized: OrganizedWeeklySchedule = {};

      if (!weeklySchedule || weeklySchedule.length === 0) {
        return organized;
      }

      // Map each day to its corresponding property
      weeklySchedule.forEach(({ day, availability }) => {
        switch (day) {
          case "Monday":
            organized.monday = availability;
            break;
          case "Tuesday":
            organized.tuesday = availability;
            break;
          case "Wednesday":
            organized.wednesday = availability;
            break;
          case "Thursday":
            organized.thursday = availability;
            break;
          case "Friday":
            organized.friday = availability;
            break;
          case "Saturday":
            organized.saturday = availability;
            break;
          case "Sunday":
            organized.sunday = availability;
            break;
        }
      });

      return organized;
    },
    [],
  );
  // Return the hook interface
  return {
    // Core data states
    services,
    userProfile,
    providerProfiles,
    categories,
    userServices,

    // Loading states
    loading,
    loadingProfiles,
    loadingCategories,
    refreshing,

    // Error state
    error,

    // Service CRUD operations
    createService,
    updateService,
    deleteService,
    getService,

    // Service status management
    updateServiceStatus,
    activateService,
    suspendService,
    deactivateService,

    // Package management
    createPackage,
    updatePackage,
    deletePackage,
    getServicePackages,

    // Availability management
    updateAvailability,
    getServiceAvailability,
    getAvailableSlots,
    toggleInstantBooking,

    // Search and filtering
    searchServices,
    getServicesByCategory,
    getServicesByLocation,
    getNearbyServices,

    // Utility functions
    servicesByStatus,
    refreshServices,
    clearError,
    getServiceCount,
    formatServicePrice,
    getStatusColor,
    enrichServiceWithProviderData,
    formatLocationString,
    calculateDistance,
    getCurrentUserId,
    isUserAuthenticated,
    retryOperation,
    isOperationInProgress,
    organizeWeeklySchedule,
    // Category management
    getCategories,
    refreshCategories,

    // Provider functions
    getProviderServices,
    getProviderStats,
  };
};
