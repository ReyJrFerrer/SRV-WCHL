import { useState, useEffect, useCallback, useMemo } from 'react';
import { Principal } from '@dfinity/principal';
import { 
  Booking, 
  BookingStatus, 
  bookingCanisterService 
} from '../services/bookingCanisterService';
import { 
  FrontendProfile, 
  authCanisterService 
} from '../services/authCanisterService';
import {
  Service,
  ServicePackage,
  serviceCanisterService
} from '../services/serviceCanisterService';

// Enhanced Provider Booking interface with client data enrichment and package support
export interface ProviderEnhancedBooking extends Booking {
  // Client data enrichment
  clientProfile?: FrontendProfile;
  clientName?: string;
  clientPhone?: string;
  formattedLocation?: string;
  
  // Service and package data enrichment
  serviceDetails?: Service;
  packageDetails?: ServicePackage;
  packageName?: string;
  description?: string;
  
  // Provider-specific computed fields
  isPending?: boolean;
  isUpcoming?: boolean;
  isActive?: boolean;
  isCompleted?: boolean;
  canAccept?: boolean;
  canDecline?: boolean;
  canStart?: boolean;
  canComplete?: boolean;
  canDispute?: boolean;
  
  // Time calculations
  timeUntilService?: string;
  serviceDuration?: string;
  isOverdue?: boolean;
  
  // Revenue tracking
  estimatedRevenue?: number;
  actualRevenue?: number;
  
  // Data loading status
  isClientDataLoaded?: boolean;
  isServiceDataLoaded?: boolean;
  isPackageDataLoaded?: boolean;
}

// Provider booking analytics interface
export interface ProviderBookingAnalytics {
  totalBookings: number;
  pendingRequests: number;
  acceptedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  disputedBookings: number;
  
  // Revenue analytics
  totalRevenue: number;
  expectedRevenue: number;
  averageBookingValue: number;
  
  // Performance metrics
  acceptanceRate: number;
  completionRate: number;
  averageResponseTime: number;
  customerSatisfactionScore?: number;
  
  // Time-based analytics
  bookingsThisWeek: number;
  bookingsThisMonth: number;
  revenueThisWeek: number;
  revenueThisMonth: number;
}

// Loading states for provider operations
interface ProviderLoadingStates {
  bookings: boolean;
  profile: boolean;
  clients: boolean;
  services: boolean;
  packages: boolean;
  analytics: boolean;
  operations: Map<string, boolean>;
}

// Hook interface
interface ProviderBookingManagementHook {
  // Data states
  bookings: ProviderEnhancedBooking[];
  providerProfile: FrontendProfile | null;
  clientProfiles: Map<string, FrontendProfile>;
  serviceDetails: Map<string, Service>;
  packageDetails: Map<string, ServicePackage>;
  analytics: ProviderBookingAnalytics | null;
  
  // Loading states
  loading: boolean;
  loadingClients: boolean;
  loadingServices: boolean;
  loadingAnalytics: boolean;
  refreshing: boolean;
  
  // Error state
  error: string | null;
  
  // Core booking management functions
  loadProviderBookings: () => Promise<void>;
  refreshBookings: () => Promise<void>;
  acceptBooking: (bookingId: string, scheduledDate?: Date) => Promise<void>;
  declineBooking: (bookingId: string, reason?: string) => Promise<void>;
  startBooking: (bookingId: string) => Promise<void>;
  completeBooking: (bookingId: string, finalPrice?: number) => Promise<void>;
  disputeBooking: (bookingId: string, reason: string) => Promise<void>;
  
  // Individual booking lookup and action functions
  getBookingById: (bookingId: string) => ProviderEnhancedBooking | null;
  getBookingWithClientData: (bookingId: string) => Promise<ProviderEnhancedBooking | null>;
  acceptBookingById: (bookingId: string, scheduledDate?: Date) => Promise<boolean>;
  declineBookingById: (bookingId: string, reason?: string) => Promise<boolean>;
  startBookingById: (bookingId: string) => Promise<boolean>;
  completeBookingById: (bookingId: string, finalPrice?: number) => Promise<boolean>;
  disputeBookingById: (bookingId: string, reason: string) => Promise<boolean>;
  isBookingActionInProgress: (bookingId: string, action: string) => boolean;
  
  // Data filtering and categorization
  getBookingsByStatus: (status: BookingStatus) => ProviderEnhancedBooking[];
  getPendingBookings: () => ProviderEnhancedBooking[];
  getUpcomingBookings: () => ProviderEnhancedBooking[];
  getActiveBookings: () => ProviderEnhancedBooking[];
  getCompletedBookings: () => ProviderEnhancedBooking[];
  getTodaysBookings: () => ProviderEnhancedBooking[];
  getOverdueBookings: () => ProviderEnhancedBooking[];
  
  // Analytics functions
  calculateAnalytics: () => ProviderBookingAnalytics;
  getRevenueByPeriod: (period: 'week' | 'month' | 'year') => number;
  getBookingCountByPeriod: (period: 'week' | 'month' | 'year') => number;
  
  // Utility functions
  formatBookingDate: (dateString: string) => string;
  formatBookingTime: (dateString: string) => string;
  getStatusColor: (status: BookingStatus) => string;
  getStatusLabel: (status: BookingStatus) => string;
  calculateTimeUntilService: (scheduledDate: string) => string;
  enrichBookingWithClientData: (booking: Booking) => Promise<ProviderEnhancedBooking>;
  formatLocationString: (location: any) => string;
  
  // State management
  getCurrentProviderId: () => string | null;
  isProviderAuthenticated: () => boolean;
  clearError: () => void;
  isOperationInProgress: (operation: string) => boolean;
  retryOperation: (operation: () => Promise<void>) => Promise<void>;
  // Package helper functions
  getPackageDisplayName: (booking: ProviderEnhancedBooking) => string;
  hasPackage: (booking: ProviderEnhancedBooking) => boolean;
  // Service helper functions
  getServiceDisplayName: (booking: ProviderEnhancedBooking) => string;
  hasServiceDetails: (booking: ProviderEnhancedBooking) => boolean;
}

export const useProviderBookingManagement = (): ProviderBookingManagementHook => {
  // Core state management
  const [providerBookings, setProviderBookings] = useState<ProviderEnhancedBooking[]>([]);
  const [providerProfile, setProviderProfile] = useState<FrontendProfile | null>(null);
  const [clientProfiles, setClientProfiles] = useState<Map<string, FrontendProfile>>(new Map());
  const [serviceDetails, setServiceDetails] = useState<Map<string, Service>>(new Map());
  const [packageDetails, setPackageDetails] = useState<Map<string, ServicePackage>>(new Map());
  const [analytics, setAnalytics] = useState<ProviderBookingAnalytics | null>(null);
  
  // Loading states
  const [loadingStates, setLoadingStates] = useState<ProviderLoadingStates>({
    bookings: false,
    profile: false,
    clients: false,
    services: false,
    packages: false,
    analytics: false,
    operations: new Map()
  });
  
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Computed loading states
  const loading = useMemo(() => 
    loadingStates.bookings || loadingStates.profile,
    [loadingStates.bookings, loadingStates.profile]
  );

  const loadingClients = useMemo(() => 
    loadingStates.clients,
    [loadingStates.clients]
  );

  const loadingServices = useMemo(() => 
    loadingStates.services || loadingStates.packages,
    [loadingStates.services, loadingStates.packages]
  );

  const loadingAnalytics = useMemo(() => 
    loadingStates.analytics,
    [loadingStates.analytics]
  );

  // Utility functions for state management
  const setLoadingState = useCallback((key: keyof ProviderLoadingStates | string, value: boolean) => {
    setLoadingStates(prev => {
      if (key === 'operations') return prev;
      if (typeof key === 'string' && key.includes('-')) {
        const newOperations = new Map(prev.operations);
        if (value) {
          newOperations.set(key, value);
        } else {
          newOperations.delete(key);
        }
        return { ...prev, operations: newOperations };
      }
      return { ...prev, [key]: value };
    });
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const isOperationInProgress = useCallback((operation: string): boolean => {
    return loadingStates.operations.has(operation);
  }, [loadingStates.operations]);

  // Authentication functions
  const getCurrentProviderId = useCallback((): string | null => {
    try {
      return providerProfile?.id || null;
    } catch {
      return null;
    }
  }, [providerProfile]);

  const isProviderAuthenticated = useCallback((): boolean => {
    return providerProfile !== null && providerProfile.role === 'ServiceProvider';
  }, [providerProfile]);

  // Error handling functions
  const handleBookingError = useCallback((error: any, operation: string) => {
    console.error(`Error in ${operation}:`, error);
    const errorMessage = error?.message || `Failed to ${operation}`;
    setError(errorMessage);
  }, []);

  const handleAuthError = useCallback(() => {
    setError('Authentication required. Please log in as a service provider.');
  }, []);

  // Client profile caching functions
  const getCachedClientProfile = useCallback((clientId: string): FrontendProfile | null => {
    return clientProfiles.get(clientId) || null;
  }, [clientProfiles]);

  const cacheClientProfile = useCallback((clientId: string, profile: FrontendProfile) => {
    setClientProfiles(prev => new Map(prev).set(clientId, profile));
  }, []);

  // Service and package caching functions
  const cacheServiceDetails = useCallback((serviceId: string, service: Service) => {
    setServiceDetails(prev => new Map(prev.set(serviceId, service)));
  }, []);

  const getCachedServiceDetails = useCallback((serviceId: string): Service | null => {
    return serviceDetails.get(serviceId) || null;
  }, [serviceDetails]);

  const cachePackageDetails = useCallback((packageId: string, pkg: ServicePackage) => {
    setPackageDetails(prev => new Map(prev.set(packageId, pkg)));
  }, []);

  const getCachedPackageDetails = useCallback((packageId: string): ServicePackage | null => {
    return packageDetails.get(packageId) || null;
  }, [packageDetails]);

  // Utility functions for loading states
  const isAnyLoading = useCallback((): boolean => {
    return loadingStates.bookings || loadingStates.profile || loadingStates.clients || loadingStates.services || loadingStates.packages || loadingStates.analytics;
  }, [loadingStates]);

  // Enhanced client profile loading
  const loadClientProfile = useCallback(async (clientId: string): Promise<FrontendProfile | null> => {
    try {
      // Check cache first
      const cached = getCachedClientProfile(clientId);
      if (cached) {
        return cached;
      }

      setLoadingState('clients', true);
      
      const profile = await authCanisterService.getProfile(clientId);
      
      if (profile) {

        cacheClientProfile(clientId, profile);
        return profile;
      } else {

        return null;
      }
    } catch (error) {
      console.error(`❌ Error loading client profile for ${clientId}:`, error);
      return null;
    } finally {
      setLoadingState('clients', false);
    }
  }, [getCachedClientProfile, setLoadingState, cacheClientProfile]);

  // Service data loading functions
  const loadServiceDetails = useCallback(async (serviceId: string): Promise<Service | null> => {
    try {
      // Check cache first
      const cached = getCachedServiceDetails(serviceId);
      if (cached) {
        return cached;
      }

      setLoadingState('services', true);
      
      const service = await serviceCanisterService.getService(serviceId);
      
      if (service) {
        cacheServiceDetails(serviceId, service);
        return service;
      } else {
        return null;
      }
    } catch (error) {
      console.error(`❌ Error loading service details for ${serviceId}:`, error);
      return null;
    } finally {
      setLoadingState('services', false);
    }
  }, [getCachedServiceDetails, setLoadingState, cacheServiceDetails]);

  const loadPackageDetails = useCallback(async (packageId: string): Promise<ServicePackage | null> => {
    try {
      // Check cache first
      const cached = getCachedPackageDetails(packageId);
      if (cached) {
        return cached;
      }


      setLoadingState('packages', true);
      
      const pkg = await serviceCanisterService.getPackage(packageId);
      
      if (pkg) {
        cachePackageDetails(packageId, pkg);
        return pkg;
      } else {
        return null;
      }
    } catch (error) {
      console.error(`❌ Error loading package details for ${packageId}:`, error);
      return null;
    } finally {
      setLoadingState('packages', false);
    }
  }, [getCachedPackageDetails, setLoadingState, cachePackageDetails]);

  // Time calculation utilities
  const calculateTimeUntilService = useCallback((scheduledDate: string): string => {
    if (!scheduledDate) return 'Not scheduled';
    
    const now = new Date();
    const serviceDate = new Date(scheduledDate);
    const diffMs = serviceDate.getTime() - now.getTime();
    
    if (diffMs < 0) return 'Overdue';
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
  }, []);
  
  // Location formatting utility
  const formatLocationString = useCallback((location: any): string => {
    if (!location) return 'No location provided';
    
    // Handle string locations
    if (typeof location === 'string') return location;
    
    // Handle object locations with address fields
    if (typeof location === 'object') {
      const parts = [];
      
      if (location.address) parts.push(location.address);
      else {
        if (location.street) parts.push(location.street);
        if (location.city) parts.push(location.city);
        if (location.state) parts.push(location.state);
        if (location.zipCode || location.postalCode) parts.push(location.zipCode || location.postalCode);
        if (location.country) parts.push(location.country);
      }
      
      if (parts.length > 0) return parts.join(', ');
      
      // If no standard address fields, try to JSON stringify but handle circular refs
      try {
        return JSON.stringify(location);
      } catch {
        return 'Complex location object';
      }
    }
    
    return 'Unknown location format';
  }, []);

  // Enhanced booking enrichment with client, service, and package data
  const enrichBookingWithClientData = useCallback(async (booking: Booking): Promise<ProviderEnhancedBooking> => {
    try {
      
      // Load all data in parallel - use servicePackageId
      const [clientProfile, serviceDetails, packageDetails] = await Promise.all([
        loadClientProfile(booking.clientId.toString()),
        booking.serviceId ? loadServiceDetails(booking.serviceId) : Promise.resolve(null),
        booking.servicePackageId ? loadPackageDetails(booking.servicePackageId) : Promise.resolve(null)
      ]);
      
      const formattedLocation = formatLocationString(booking.location);
      const timeUntilService = booking.scheduledDate ? calculateTimeUntilService(booking.scheduledDate) : undefined;
      
      // Calculate booking properties
      const now = new Date();
      const scheduledDate = booking.scheduledDate ? new Date(booking.scheduledDate) : null;
      const isOverdue = scheduledDate ? scheduledDate < now && booking.status === 'Accepted' : false;
      
      const enhancedBooking: ProviderEnhancedBooking = {
        ...booking,
        // Client data
        clientProfile: clientProfile || undefined,
        clientName: clientProfile?.name ||'Unknown Client',
        clientPhone: clientProfile?.phone || 'Unknown Phone Number',
        formattedLocation,
        timeUntilService,
        isOverdue,
        
        // Service and package data - using servicePackageId
        serviceDetails: serviceDetails || undefined,
        packageDetails: packageDetails || undefined,
        packageName: packageDetails?.title,
        description: packageDetails?.description ,
        
        // Status flags
        isPending: booking.status === 'Requested',
        isUpcoming: booking.status === 'Accepted',
        isActive: booking.status === 'InProgress',
        isCompleted: booking.status === 'Completed',
        
        // Action availability
        canAccept: booking.status === 'Requested',
        canDecline: booking.status === 'Requested',
        canStart: booking.status === 'Accepted' && scheduledDate ? scheduledDate <= now : false,
        canComplete: booking.status === 'InProgress',
        canDispute: booking.status === 'Completed',
        
        // Revenue tracking
        estimatedRevenue: booking.price,
        actualRevenue: booking.status === 'Completed' ? booking.price : 0,
        
        // Data loading status
        isClientDataLoaded: !!clientProfile,
        isServiceDataLoaded: !!serviceDetails || !booking.serviceId,
        isPackageDataLoaded: !!packageDetails || !booking.servicePackageId // Consider loaded if no servicePackageId
      };

      
      return enhancedBooking;
    } catch (error) {
      console.error(`❌ Error enriching booking ${booking.id}:`, error);
      
      // Return booking with minimal enhancement but proper packageName handling
      return {
        ...booking,
        clientName:'Unknown Client',
        formattedLocation: formatLocationString(booking.location),
        packageName: undefined,
        description: undefined,
        isClientDataLoaded: false,
        isServiceDataLoaded: false,
        isPackageDataLoaded: false,
        isPending: booking.status === 'Requested',
        isUpcoming: booking.status === 'Accepted',
        isActive: booking.status === 'InProgress',
        isCompleted: booking.status === 'Completed',
        canAccept: booking.status === 'Requested',
        canDecline: booking.status === 'Requested',
        canStart: booking.status === 'Accepted',
        canComplete: booking.status === 'InProgress',
        canDispute: booking.status === 'Completed',
        estimatedRevenue: booking.price,
        actualRevenue: booking.status === 'Completed' ? booking.price : 0
      };
    }
  }, [loadClientProfile, formatLocationString, calculateTimeUntilService, loadServiceDetails, loadPackageDetails]);

  // Enhanced helper functions for better package handling using servicePackageId
  const getPackageDisplayName = useCallback((booking: ProviderEnhancedBooking): string => {
    if (!booking.servicePackageId) {
      return 'No Package Selected';
    }
    
    if (booking.packageDetails?.title) {
      return booking.packageDetails.title;
    }
    
    if (booking.packageName) {
      return booking.packageName;
    }
    
    if (booking.isPackageDataLoaded === false) {
      return 'Loading Package...';
    }
    
    return `Package ID: ${booking.servicePackageId}`;
  }, []);

  const hasPackage = useCallback((booking: ProviderEnhancedBooking): boolean => {
    return !!booking.servicePackageId;
  }, []);

  // Service helper functions
  const getServiceDisplayName = useCallback((booking: ProviderEnhancedBooking): string => {
    if (booking.serviceDetails?.title) {
      return booking.serviceDetails.title;
    }
    
    if (booking.serviceName) {
      return booking.serviceName;
    }
    
    if (booking.isServiceDataLoaded === false) {
      return 'Loading Service...';
    }
    
    return booking.serviceId ? `Service ID: ${booking.serviceId}` : 'Unknown Service';
  }, []);

  const hasServiceDetails = useCallback((booking: ProviderEnhancedBooking): boolean => {
    return !!booking.serviceDetails || !!booking.serviceName;
  }, []);

  // Load provider profile
  const loadProviderProfile = useCallback(async () => {
    try {
      setLoadingState('profile', true);
      clearError();
      
      const profile = await authCanisterService.getMyProfile();
      if (profile && profile.role === 'ServiceProvider') {
        setProviderProfile(profile);
      } else {
        handleAuthError();
      }
    } catch (error) {
      handleBookingError(error, 'load provider profile');
      handleAuthError();
    } finally {
      setLoadingState('profile', false);
    }
  }, [setLoadingState, clearError, handleBookingError, handleAuthError]);

  // Load provider bookings
  const loadProviderBookings = useCallback(async () => {
    if (!isProviderAuthenticated()) {
      handleAuthError();
      return;
    }

    try {
      setLoadingState('bookings', true);
      clearError();
      
      const currentProviderId = getCurrentProviderId();
      if (!currentProviderId) {
        throw new Error('No authenticated provider found');
      }

      const providerPrincipal = Principal.fromText(currentProviderId);
      const rawBookings = await bookingCanisterService.getProviderBookings(providerPrincipal);
      
      
      // Enrich bookings with client data in parallel
      const enrichedBookings = await Promise.all(
        rawBookings.map(booking => enrichBookingWithClientData(booking))
      );
      
      setProviderBookings(enrichedBookings);
      
    } catch (error) {
      handleBookingError(error, 'load provider bookings');
    } finally {
      setLoadingState('bookings', false);
    }
  }, [
    isProviderAuthenticated, 
    handleAuthError, 
    setLoadingState, 
    clearError, 
    getCurrentProviderId, 
    handleBookingError,
    enrichBookingWithClientData
  ]);

  // Refresh bookings
  const refreshBookings = useCallback(async () => {
    setRefreshing(true);
    try {
      // Clear all caches to ensure fresh data
      setClientProfiles(new Map());
      setServiceDetails(new Map());
      setPackageDetails(new Map());
      await loadProviderBookings();
    } finally {
      setRefreshing(false);
    }
  }, [loadProviderBookings]);

  // Booking action functions
  const acceptBooking = useCallback(async (bookingId: string, scheduledDate?: Date) => {
    try {
      setLoadingState(`accept-${bookingId}`, true);
      clearError();
      
      const updatedBooking = await bookingCanisterService.acceptBooking(bookingId, scheduledDate || new Date());
      
      if (updatedBooking) {
        const enrichedBooking = await enrichBookingWithClientData(updatedBooking);
        setProviderBookings(prev => 
          prev.map(booking => 
            booking.id === bookingId ? enrichedBooking : booking
          )
        );
      }
    } catch (error) {
      handleBookingError(error, `accept booking ${bookingId}`);
      throw error;
    } finally {
      setLoadingState(`accept-${bookingId}`, false);
    }
  }, [setLoadingState, clearError, handleBookingError, enrichBookingWithClientData]);

  const declineBooking = useCallback(async (bookingId: string, reason?: string) => {
    try {
      setLoadingState(`decline-${bookingId}`, true);
      clearError();
      
      const updatedBooking = await bookingCanisterService.declineBooking(bookingId);
      
      if (updatedBooking) {
        const enrichedBooking = await enrichBookingWithClientData(updatedBooking);
        setProviderBookings(prev => 
          prev.map(booking => 
            booking.id === bookingId ? enrichedBooking : booking
          )
        );
      }
    } catch (error) {
      handleBookingError(error, `decline booking ${bookingId}`);
      throw error;
    } finally {
      setLoadingState(`decline-${bookingId}`, false);
    }
  }, [setLoadingState, clearError, handleBookingError, enrichBookingWithClientData]);

  const startBooking = useCallback(async (bookingId: string) => {
    try {
      setLoadingState(`start-${bookingId}`, true);
      clearError();
      
      const updatedBooking = await bookingCanisterService.startBooking(bookingId);
      
      if (updatedBooking) {
        const enrichedBooking = await enrichBookingWithClientData(updatedBooking);
        setProviderBookings(prev => 
          prev.map(booking => 
            booking.id === bookingId ? enrichedBooking : booking
          )
        );
      }
    } catch (error) {
      handleBookingError(error, `start booking ${bookingId}`);
      throw error;
    } finally {
      setLoadingState(`start-${bookingId}`, false);
    }
  }, [setLoadingState, clearError, handleBookingError, enrichBookingWithClientData]);

  const completeBooking = useCallback(async (bookingId: string, finalPrice?: number) => {
    try {
      setLoadingState(`complete-${bookingId}`, true);
      clearError();
      
      const updatedBooking = await bookingCanisterService.completeBooking(bookingId);
      
      if (updatedBooking) {
        const enrichedBooking = await enrichBookingWithClientData(updatedBooking);
        setProviderBookings(prev => 
          prev.map(booking => 
            booking.id === bookingId ? enrichedBooking : booking
          )
        );
      }
    } catch (error) {
      handleBookingError(error, `complete booking ${bookingId}`);
      throw error;
    } finally {
      setLoadingState(`complete-${bookingId}`, false);
    }
  }, [setLoadingState, clearError, handleBookingError, enrichBookingWithClientData]);

  const disputeBooking = useCallback(async (bookingId: string, reason: string) => {
    try {
      setLoadingState(`dispute-${bookingId}`, true);
      clearError();
      
      const updatedBooking = await bookingCanisterService.disputeBooking(bookingId);
      
      if (updatedBooking) {
        const enrichedBooking = await enrichBookingWithClientData(updatedBooking);
        setProviderBookings(prev => 
          prev.map(booking => 
            booking.id === bookingId ? enrichedBooking : booking
          )
        );

      }
    } catch (error) {
      handleBookingError(error, `dispute booking ${bookingId}`);
      throw error;
    } finally {
      setLoadingState(`dispute-${bookingId}`, false);
    }
  }, [setLoadingState, clearError, handleBookingError, enrichBookingWithClientData]);

  // Individual booking lookup and action functions
  const getBookingById = useCallback((bookingId: string): ProviderEnhancedBooking | null => {
    return providerBookings.find(booking => booking.id === bookingId) || null;
  }, [providerBookings]);

  const getBookingWithClientData = useCallback(async (bookingId: string): Promise<ProviderEnhancedBooking | null> => {
    try {
      const booking = getBookingById(bookingId);
      if (!booking) {
        console.warn(`Booking ${bookingId} not found in current bookings`);
        return null;
      }

      // If client data is already loaded, return the booking
      if (booking.isClientDataLoaded) {
        return booking;
      }

      // Re-enrich with fresh client data
      const rawBooking = await bookingCanisterService.getBooking(bookingId);
      if (rawBooking) {
        return await enrichBookingWithClientData(rawBooking);
      }

      return booking;
    } catch (error) {
      console.error(`Error getting booking ${bookingId} with client data:`, error);
      return getBookingById(bookingId);
    }
  }, [getBookingById, enrichBookingWithClientData]);

  const acceptBookingById = useCallback(async (bookingId: string, scheduledDate?: Date): Promise<boolean> => {
    try {
      await acceptBooking(bookingId, scheduledDate);
      return true;
    } catch (error) {
      console.error(`Failed to accept booking ${bookingId}:`, error);
      return false;
    }
  }, [acceptBooking]);

  const declineBookingById = useCallback(async (bookingId: string, reason?: string): Promise<boolean> => {
    try {
      await declineBooking(bookingId, reason);
      return true;
    } catch (error) {
      console.error(`Failed to decline booking ${bookingId}:`, error);
      return false;
    }
  }, [declineBooking]);

  const startBookingById = useCallback(async (bookingId: string): Promise<boolean> => {
    try {
      await startBooking(bookingId);
      return true;
    } catch (error) {
      console.error(`Failed to start booking ${bookingId}:`, error);
      return false;
    }
  }, [startBooking]);

  const completeBookingById = useCallback(async (bookingId: string, finalPrice?: number): Promise<boolean> => {
    try {
      await completeBooking(bookingId, finalPrice);
      return true;
    } catch (error) {
      console.error(`Failed to complete booking ${bookingId}:`, error);
      return false;
    }
  }, [completeBooking]);

  const disputeBookingById = useCallback(async (bookingId: string, reason: string): Promise<boolean> => {
    try {
      await disputeBooking(bookingId, reason);
      return true;
    } catch (error) {
      console.error(`Failed to dispute booking ${bookingId}:`, error);
      return false;
    }
  }, [disputeBooking]);

  const isBookingActionInProgress = useCallback((bookingId: string, action: string): boolean => {
    const operationKey = `${action}-${bookingId}`;
    return isOperationInProgress(operationKey);
  }, [isOperationInProgress]);

  // Data filtering and categorization functions
  const getBookingsByStatus = useCallback((status: BookingStatus): ProviderEnhancedBooking[] => {
    return providerBookings.filter(booking => booking.status === status);
  }, [providerBookings]);

  const getPendingBookings = useCallback((): ProviderEnhancedBooking[] => {
    return providerBookings.filter(booking => booking.isPending);
  }, [providerBookings]);

  const getUpcomingBookings = useCallback((): ProviderEnhancedBooking[] => {
    return providerBookings.filter(booking => booking.isUpcoming);
  }, [providerBookings]);

  const getActiveBookings = useCallback((): ProviderEnhancedBooking[] => {
    return providerBookings.filter(booking => booking.isActive);
  }, [providerBookings]);

  const getCompletedBookings = useCallback((): ProviderEnhancedBooking[] => {
    return providerBookings.filter(booking => booking.isCompleted);
  }, [providerBookings]);

  const getTodaysBookings = useCallback((): ProviderEnhancedBooking[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return providerBookings.filter(booking => {
      if (!booking.scheduledDate) return false;
      const scheduledDate = new Date(booking.scheduledDate);
      return scheduledDate >= today && scheduledDate < tomorrow;
    });
  }, [providerBookings]);

  const getOverdueBookings = useCallback((): ProviderEnhancedBooking[] => {
    return providerBookings.filter(booking => booking.isOverdue);
  }, [providerBookings]);

  // Analytics calculation
  const calculateAnalytics = useCallback((): ProviderBookingAnalytics => {
    const totalBookings = providerBookings.length;
    const pendingRequests = getPendingBookings().length;
    const acceptedBookings = getBookingsByStatus('Accepted').length;
    const completedBookings = getCompletedBookings().length;
    const cancelledBookings = getBookingsByStatus('Cancelled').length;
    const disputedBookings = getBookingsByStatus('Disputed').length;
    
    // Revenue calculations
    const totalRevenue = completedBookings > 0 
      ? providerBookings
          .filter(booking => booking.isCompleted)
          .reduce((sum, booking) => sum + (booking.actualRevenue || 0), 0)
      : 0;
    
    const expectedRevenue = providerBookings
      .filter(booking => booking.status === 'Accepted' || booking.status === 'InProgress')
      .reduce((sum, booking) => sum + (booking.estimatedRevenue || 0), 0);
    
    const averageBookingValue = totalBookings > 0 
      ? providerBookings.reduce((sum, booking) => sum + booking.price, 0) / totalBookings 
      : 0;
    
    // Performance metrics
    const totalRequests = pendingRequests + acceptedBookings + getBookingsByStatus('Declined').length;
    const acceptanceRate = totalRequests > 0 ? (acceptedBookings / totalRequests) * 100 : 0;
    const completionRate = acceptedBookings > 0 ? (completedBookings / acceptedBookings) * 100 : 0;
    
    // Time-based analytics
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const bookingsThisWeek = providerBookings.filter(booking => {
      const createdDate = new Date(booking.createdAt);
      return createdDate >= weekStart;
    }).length;
    
    const bookingsThisMonth = providerBookings.filter(booking => {
      const createdDate = new Date(booking.createdAt);
      return createdDate >= monthStart;
    }).length;
    
    const revenueThisWeek = providerBookings
      .filter(booking => {
        const completedDate = booking.completedDate ? new Date(booking.completedDate) : null;
        return completedDate && completedDate >= weekStart && booking.isCompleted;
      })
      .reduce((sum, booking) => sum + (booking.actualRevenue || 0), 0);
    
    const revenueThisMonth = providerBookings
      .filter(booking => {
        const completedDate = booking.completedDate ? new Date(booking.completedDate) : null;
        return completedDate && completedDate >= monthStart && booking.isCompleted;
      })
      .reduce((sum, booking) => sum + (booking.actualRevenue || 0), 0);
    
    return {
      totalBookings,
      pendingRequests,
      acceptedBookings,
      completedBookings,
      cancelledBookings,
      disputedBookings,
      totalRevenue,
      expectedRevenue,
      averageBookingValue,
      acceptanceRate,
      completionRate,
      averageResponseTime: 0, // Would need additional data tracking
      bookingsThisWeek,
      bookingsThisMonth,
      revenueThisWeek,
      revenueThisMonth
    };
  }, [providerBookings, getPendingBookings, getBookingsByStatus, getCompletedBookings]);

  // Period-based analytics
  const getRevenueByPeriod = useCallback((period: 'week' | 'month' | 'year'): number => {
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }
    
    return providerBookings
      .filter(booking => {
        const completedDate = booking.completedDate ? new Date(booking.completedDate) : null;
        return completedDate && completedDate >= startDate && booking.isCompleted;
      })
      .reduce((sum, booking) => sum + (booking.actualRevenue || 0), 0);
  }, [providerBookings]);

  const getBookingCountByPeriod = useCallback((period: 'week' | 'month' | 'year'): number => {
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }
    
    return providerBookings.filter(booking => {
      const createdDate = new Date(booking.createdAt);
      return createdDate >= startDate;
    }).length;
  }, [providerBookings]);

  // Utility functions
  const formatBookingDate = useCallback((dateString: string): string => {
    if (!dateString) return 'TBD';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
    if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }, []);

  const formatBookingTime = useCallback((dateString: string): string => {
    if (!dateString) return 'TBD';
    
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }, []);

  const getStatusColor = useCallback((status: BookingStatus): string => {
    switch (status) {
      case 'Requested':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'Accepted':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'InProgress':
        return 'bg-purple-100 text-purple-800 border border-purple-200';
      case 'Completed':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'Cancelled':
        return 'bg-gray-100 text-gray-800 border border-gray-200';
      case 'Declined':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'Disputed':
        return 'bg-orange-100 text-orange-800 border border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  }, []);

  const getStatusLabel = useCallback((status: BookingStatus): string => {
    switch (status) {
      case 'Requested':
        return 'Pending Review';
      case 'Accepted':
        return 'Confirmed';
      case 'InProgress':
        return 'In Progress';
      case 'Completed':
        return 'Completed';
      case 'Cancelled':
        return 'Cancelled';
      case 'Declined':
        return 'Declined';
      case 'Disputed':
        return 'Disputed';
      default:
        return status;
    }
  }, []);

  // Retry operation with error handling
  const retryOperation = useCallback(async (operation: () => Promise<void>) => {
    try {
      clearError();
      await operation();
    } catch (error) {
      console.error('Retry operation failed:', error);
      // Error is handled by the individual operation
    }
  }, [clearError]);

  // Initialize data on mount
  useEffect(() => {
    const initializeData = async () => {
      await loadProviderProfile();
    };
    
    initializeData();
  }, [loadProviderProfile]);

  // Load bookings when provider profile is available
  useEffect(() => {
    if (providerProfile && isProviderAuthenticated()) {
      loadProviderBookings();
    }
  }, [providerProfile, isProviderAuthenticated, loadProviderBookings]);

  // Calculate analytics when bookings change
  useEffect(() => {
    if (providerBookings.length > 0) {
      setLoadingState('analytics', true);
      try {
        const newAnalytics = calculateAnalytics();
        setAnalytics(newAnalytics);
      } catch (error) {
        console.error('Error calculating analytics:', error);
      } finally {
        setLoadingState('analytics', false);
      }
    }
  }, [providerBookings, calculateAnalytics, setLoadingState]);

  // Return hook interface with enhanced data
  return {
    // Data states
    bookings: providerBookings,
    providerProfile,
    clientProfiles,
    serviceDetails,
    packageDetails,
    analytics,
    
    // Loading states
    loading,
    loadingClients,
    loadingServices,
    loadingAnalytics,
    refreshing,
    
    // Error state
    error,
    
    // Core booking management functions
    loadProviderBookings,
    refreshBookings,
    acceptBooking,
    declineBooking,
    startBooking,
    completeBooking,
    disputeBooking,
    
    // Individual booking lookup and action functions
    getBookingById: (bookingId: string) => providerBookings.find(booking => booking.id === bookingId) || null,
    getBookingWithClientData: async (bookingId: string) => {
      const booking = providerBookings.find(booking => booking.id === bookingId);
      if (!booking) return null;
      return await enrichBookingWithClientData(booking);
    },
    acceptBookingById: async (bookingId: string, scheduledDate?: Date) => {
      try {
        await acceptBooking(bookingId, scheduledDate);
        return true;
      } catch {
        return false;
      }
    },
    declineBookingById: async (bookingId: string, reason?: string) => {
      try {
        await declineBooking(bookingId, reason);
        return true;
      } catch {
        return false;
      }
    },
    startBookingById: async (bookingId: string) => {
      try {
        await startBooking(bookingId);
        return true;
      } catch {
        return false;
      }
    },
    completeBookingById: async (bookingId: string, finalPrice?: number) => {
      try {
        await completeBooking(bookingId, finalPrice);
        return true;
      } catch {
        return false;
      }
    },
    disputeBookingById: async (bookingId: string, reason: string) => {
      try {
        await disputeBooking(bookingId, reason);
        return true;
      } catch {
        return false;
      }
    },
    isBookingActionInProgress: (bookingId: string, action: string) => {
      return isOperationInProgress(`${action}-${bookingId}`);
    },
    
    // Data filtering and categorization
    getBookingsByStatus,
    getPendingBookings,
    getUpcomingBookings,
    getActiveBookings,
    getCompletedBookings,
    getTodaysBookings,
    getOverdueBookings,
    
    // Analytics functions
    calculateAnalytics,
    getRevenueByPeriod,
    getBookingCountByPeriod,
    
    // Utility functions
    formatBookingDate,
    formatBookingTime,
    getStatusColor,
    getStatusLabel,
    calculateTimeUntilService,
    enrichBookingWithClientData,
    formatLocationString,
    
    // State management
    getCurrentProviderId,
    isProviderAuthenticated,
    clearError,
    isOperationInProgress,
    retryOperation,
    
    // Enhanced helper functions
    getPackageDisplayName,
    hasPackage,
    getServiceDisplayName,
    hasServiceDetails,
  };
};

export default useProviderBookingManagement;
