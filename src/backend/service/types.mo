import Principal "mo:base/Principal";
import Time "mo:base/Time";

import SharedTypes "../types/shared";

module ServiceTypes {
    // Re-export shared types for convenience
    public type Service = SharedTypes.Service;
    public type ServiceCategory = SharedTypes.ServiceCategory;
    public type ServiceStatus = SharedTypes.ServiceStatus;
    public type Location = SharedTypes.Location;
    public type Result<T> = SharedTypes.Result<T>;
    public type ProviderAvailability = SharedTypes.ProviderAvailability;
    public type DayOfWeek = SharedTypes.DayOfWeek;
    public type DayAvailability = SharedTypes.DayAvailability;
    public type TimeSlot = SharedTypes.TimeSlot;
    public type AvailableSlot = SharedTypes.AvailableSlot;
    public type ServicePackage = SharedTypes.ServicePackage;

    // Service-specific types and data structures
    public type ServiceValidationError = {
        #InvalidTitle : Text;
        #InvalidDescription : Text;
        #InvalidPrice : Text;
        #InvalidLocation : Text;
        #InvalidProvider : Text;
        #ServiceNotFound : Text;
        #UnauthorizedAccess : Text;
        #ValidationFailed : Text;
    };

    public type ServiceSearchFilters = {
        categoryId : ?Text;
        minPrice : ?Nat;
        maxPrice : ?Nat;
        location : ?Location;
        radiusKm : ?Float;
        minRating : ?Float;
        availableDate : ?Time.Time;
        providerId : ?Principal;
    };

    public type ServiceStatistics = {
        totalServices : Nat;
        activeServices : Nat;
        draftServices : Nat;
        suspendedServices : Nat;
        deletedServices : Nat;
        categoryCounts : [(Text, Nat)];
    };

    public type AvailabilityCheck = {
        serviceId : Text;
        requestedDateTime : Time.Time;
        duration : ?Nat; // Duration in minutes
    };

    public type ProviderProfile = {
        providerId : Principal;
        totalServices : Nat;
        activeServices : Nat;
        averageRating : ?Float;
        totalReviews : Nat;
        isVerified : Bool;
        joinedDate : Time.Time;
    };

    public type ServiceUpdateRequest = {
        serviceId : Text;
        title : ?Text;
        description : ?Text;
        price : ?Nat;
        location : ?Location;
        categoryId : ?Text;
        imageUrls : ?[Text];
        status : ?ServiceStatus;
        maxBookingsPerDay : ?Nat;
    };

    public type CategoryWithStats = {
        category : ServiceCategory;
        serviceCount : Nat;
        averagePrice : ?Float;
        averageRating : ?Float;
    };

    // Booking-related types for service integration
    public type BookingStatus = SharedTypes.BookingStatus;
    public type BookingInfo = {
        bookingId : Text;
        serviceId : Text;
        clientId : Principal;
        providerId : Principal;
        scheduledDate : Time.Time;
        status : BookingStatus;
        duration : ?Nat;
    };

    // Package-related extended types
    public type PackageBooking = {
        packageId : Text;
        serviceIds : [Text];
        totalPrice : Nat;
        discountApplied : Nat;
        validUntil : Time.Time;
    };

    // Validation constants
    public let VALIDATION_CONSTANTS = {
        MIN_TITLE_LENGTH = 5;
        MAX_TITLE_LENGTH = 100;
        MIN_DESCRIPTION_LENGTH = 5;
        MAX_DESCRIPTION_LENGTH = 1000;
        MIN_PRICE = 5;
        MAX_PRICE = 1_000_000;
        MAX_SEARCH_RADIUS_KM = 100.0;
        MIN_RATING = 1.0;
        MAX_RATING = 5.0;
        MAX_IMAGES_PER_SERVICE = 10;
        MAX_SERVICES_PER_PROVIDER = 50;
        DEFAULT_HASHMAP_SIZE = 100;
    };

    // Helper type for internal operations
    public type ServiceOperation = {
        #Create;
        #Update;
        #Delete;
        #StatusChange;
        #AvailabilityUpdate;
    };

    public type OperationResult<T> = {
        #Success : T;
        #Error : ServiceValidationError;
    };
}
