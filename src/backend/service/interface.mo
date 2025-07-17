import Principal "mo:base/Principal";
import Time "mo:base/Time";

import ServiceTypes "./types";

module ServiceInterface {
    // Re-export types for external consumers
    public type Service = ServiceTypes.Service;
    public type ServiceCategory = ServiceTypes.ServiceCategory;
    public type ServiceStatus = ServiceTypes.ServiceStatus;
    public type Location = ServiceTypes.Location;
    public type Result<T> = ServiceTypes.Result<T>;
    public type ProviderAvailability = ServiceTypes.ProviderAvailability;
    public type AvailableSlot = ServiceTypes.AvailableSlot;
    public type ServicePackage = ServiceTypes.ServicePackage;
    public type ServiceSearchFilters = ServiceTypes.ServiceSearchFilters;
    public type ServiceStatistics = ServiceTypes.ServiceStatistics;
    public type ServiceUpdateRequest = ServiceTypes.ServiceUpdateRequest;
    public type CategoryWithStats = ServiceTypes.CategoryWithStats;
    public type ProviderProfile = ServiceTypes.ProviderProfile;

    // Service Canister Interface - defines all public functions
    public type ServiceCanisterInterface = actor {
        // Core service management
        createService : (
            title : Text,
            description : Text,
            price : Nat,
            location : Location,
            categoryId : Text,
            imageUrls : [Text],
            maxBookingsPerDay : ?Nat
        ) -> async Result<Service>;

        getService : (serviceId : Text) -> async Result<Service>;
        getAllServices : () -> async [Service];
        getServicesByProvider : (providerId : Principal) -> async [Service];
        getServicesByCategory : (categoryId : Text) -> async [Service];
        
        updateService : (
            serviceId : Text,
            title : ?Text,
            description : ?Text,
            price : ?Nat,
            location : ?Location,
            categoryId : ?Text,
            imageUrls : ?[Text],
            maxBookingsPerDay : ?Nat
        ) -> async Result<Service>;

        updateServiceBulk : (updateRequest : ServiceUpdateRequest) -> async Result<Service>;
        updateServiceStatus : (serviceId : Text, status : ServiceStatus) -> async Result<Service>;
        deleteService : (serviceId : Text) -> async Result<Text>;

        // Category management
        addCategory : (
            name : Text,
            description : Text,
            imageUrl : Text
        ) -> async Result<ServiceCategory>;
        getAllCategories : () -> async [ServiceCategory];
        getCategoriesWithStats : () -> async [CategoryWithStats];

        // Search and filtering
        searchServicesByLocation : (
            userLocation : Location,
            radiusKm : Float,
            categoryId : ?Text
        ) -> async [Service];

        searchServicesAdvanced : (filters : ServiceSearchFilters) -> async [Service];
        searchServicesWithReputationFilter : (
            userLocation : Location,
            radiusKm : Float,
            categoryId : ?Text,
            minTrustScore : ?Float
        ) -> async [Service];

        // Availability management
        setServiceAvailability : (
            serviceId : Text,
            availability : [ServiceTypes.DayAvailability],
            maxBookingsPerDay : Nat
        ) -> async Result<ProviderAvailability>;

        getServiceAvailability : (serviceId : Text) -> async Result<ProviderAvailability>;
        
        getAvailableTimeSlots : (
            serviceId : Text,
            date : Time.Time
        ) -> async Result<[AvailableSlot]>;

        isServiceAvailable : (
            serviceId : Text,
            requestedDateTime : Time.Time
        ) -> async Result<Bool>;

        // Provider management
        getProviderProfile : (providerId : Principal) -> async Result<ProviderProfile>;
        
        // Deprecated - backward compatibility
        getProviderAvailability : (providerId : Principal) -> async Result<ProviderAvailability>;
        isProviderAvailable : (
            providerId : Principal,
            requestedDateTime : Time.Time
        ) -> async Result<Bool>;

        // Service packages
        createServicePackage : (
            name : Text,
            description : Text,
            serviceIds : [Text],
            discountPercentage : Nat,
            validityDays : Nat
        ) -> async Result<ServicePackage>;

        getServicePackage : (packageId : Text) -> async Result<ServicePackage>;
        getServicePackagesByProvider : (providerId : Principal) -> async [ServicePackage];
        updateServicePackage : (
            packageId : Text,
            name : ?Text,
            description : ?Text,
            serviceIds : ?[Text],
            discountPercentage : ?Nat,
            validityDays : ?Nat
        ) -> async Result<ServicePackage>;
        deleteServicePackage : (packageId : Text) -> async Result<Text>;

        // Statistics and analytics
        getServiceStatistics : () -> async ServiceStatistics;

        // External canister integration
        updateServiceRating : (
            serviceId : Text,
            newAverageRating : Float,
            newReviewCount : Nat
        ) -> async Result<Service>;

        // Administrative functions
        setCanisterReferences : (
            reputation : ?Principal
        ) -> async Result<Text>;
    };
}
