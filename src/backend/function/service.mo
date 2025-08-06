import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Time "mo:base/Time";
import HashMap "mo:base/HashMap";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Float "mo:base/Float";
import Nat "mo:base/Nat";
import Int "mo:base/Int";
import Buffer "mo:base/Buffer";

import Types "../types/shared";
import StaticData "../utils/staticData";

persistent actor ServiceCanister {
    // Type definitions
    type Service = Types.Service;
    type ServiceCategory = Types.ServiceCategory;
    type ServiceStatus = Types.ServiceStatus;
    type Location = Types.Location;
    type Result<T> = Types.Result<T>;
    type ProviderAvailability = Types.ProviderAvailability;
    type DayOfWeek = Types.DayOfWeek;
    type DayAvailability = Types.DayAvailability;
    type TimeSlot = Types.TimeSlot;
    type AvailableSlot = Types.AvailableSlot;
    type ServicePackage = Types.ServicePackage;

    // State variables
    private var serviceEntries : [(Text, Service)] = [];
    private transient var services = HashMap.HashMap<Text, Service>(10, Text.equal, Text.hash);
    
    private var categoryEntries : [(Text, ServiceCategory)] = [];
    private transient var categories = HashMap.HashMap<Text, ServiceCategory>(10, Text.equal, Text.hash);

    // Availability state variables
    private var availabilityEntries : [(Text, ProviderAvailability)] = [];
    private transient var serviceAvailabilities = HashMap.HashMap<Text, ProviderAvailability>(10, Text.equal, Text.hash);
    
    // Service package state variables
    private var packageEntries : [(Text, ServicePackage)] = [];
    private transient var servicePackages = HashMap.HashMap<Text, ServicePackage>(10, Text.equal, Text.hash);

    // Canister references
    private transient var authCanisterId : ?Principal = null;
    private transient var bookingCanisterId : ?Principal = null;
    private transient var reviewCanisterId : ?Principal = null;
    private transient var reputationCanisterId : ?Principal = null;
    private transient var mediaCanisterId : ?Principal = null;

    // Constants
    private transient let MIN_TITLE_LENGTH : Nat = 1;
    private transient let MAX_TITLE_LENGTH : Nat = 100;
    private transient let MIN_DESCRIPTION_LENGTH : Nat = 1;
    private transient let MAX_DESCRIPTION_LENGTH : Nat = 1000;
    private transient let MIN_PRICE : Nat = 1;
    private transient let MAX_PRICE : Nat = 1_000_000;
    private transient let MAX_SERVICE_IMAGES : Nat = 5;

    // Set canister references
    public shared(_msg) func setCanisterReferences(
        auth : ?Principal,
        booking : ?Principal,
        review : ?Principal,
        reputation : ?Principal,
        media : ?Principal
    ) : async Result<Text> {
        // In real implementation, need to check if caller has admin rights
        authCanisterId := auth;
        bookingCanisterId := booking;
        reviewCanisterId := review;
        reputationCanisterId := reputation;
        mediaCanisterId := media;
        return #ok("Canister references set successfully");
    };

    // Helper functions
    func generateId() : Text {
        let now = Int.abs(Time.now());
        let random = Int.abs(Time.now()) % 10000;
        return Int.toText(now) # "-" # Int.toText(random);
    };

    func calculateDistance(loc1 : Location, loc2 : Location) : Float {
        // Haversine formula for distance calculation
        let R = 6371.0; // Earth's radius in kilometers
        let dLat = (loc2.latitude - loc1.latitude) * Float.pi / 180.0;
        let dLon = (loc2.longitude - loc1.longitude) * Float.pi / 180.0;
        let a = Float.sin(dLat/2.0) * Float.sin(dLat/2.0) +
                Float.cos(loc1.latitude * Float.pi / 180.0) * Float.cos(loc2.latitude * Float.pi / 180.0) *
                Float.sin(dLon/2.0) * Float.sin(dLon/2.0);
        let c = 2.0 * Float.arctan2(Float.sqrt(a), Float.sqrt(1.0 - a));
        return R * c;
    };

    private func validateTitle(title : Text) : Bool {
        title.size() >= MIN_TITLE_LENGTH and title.size() <= MAX_TITLE_LENGTH
    };

    private func validateDescription(description : Text) : Bool {
        description.size() >= MIN_DESCRIPTION_LENGTH and description.size() <= MAX_DESCRIPTION_LENGTH
    };

    private func validatePrice(price : Nat) : Bool {
        price >= MIN_PRICE and price <= MAX_PRICE
    };

    private func validateLocation(location : Location) : Bool {
        location.latitude >= -90.0 and location.latitude <= 90.0 and
        location.longitude >= -180.0 and location.longitude <= 180.0 and
        location.address.size() > 0
    };

    private func validateProvider(providerId : Principal) : async Result<Bool> {
        switch (authCanisterId) {
            case (?authId) {
                let authCanister = actor(Principal.toText(authId)) : actor {
                    getProfile : (Principal) -> async Types.Result<Types.Profile>;
                };
                
                switch (await authCanister.getProfile(providerId)) {
                    case (#ok(profile)) {
                        if (profile.role == #ServiceProvider) {
                            return #ok(true);
                        } else {
                            return #err("User is not a service provider");
                        };
                    };
                    case (#err(msg)) {
                        return #err("Provider not found: " # msg);
                    };
                };
            };
            case (null) {
                return #err("Auth canister reference not set");
            };
        };
    };

    // Static data initialization
    private func initializeStaticData() {
        // Initialize categories from shared static data
        for ((id, category) in StaticData.STATIC_CATEGORIES.vals()) {
            categories.put(id, category);
        };

        // Initialize services from shared static data
        for ((id, service) in StaticData.getStaticServices().vals()) {
            services.put(id, service);
            
            // Also initialize availability data if it exists in the service
            switch (service.weeklySchedule, service.instantBookingEnabled, service.bookingNoticeHours, service.maxBookingsPerDay) {
                case (?schedule, ?instantBooking, ?noticeHours, ?maxBookings) {
                    let availability : ProviderAvailability = {
                        providerId = service.providerId;
                        weeklySchedule = schedule;
                        instantBookingEnabled = instantBooking;
                        bookingNoticeHours = noticeHours;
                        maxBookingsPerDay = maxBookings;
                        isActive = true;
                        createdAt = service.createdAt;
                        updatedAt = service.updatedAt;
                    };
                    serviceAvailabilities.put(id, availability);
                };
                case (_, _, _, _) {
                    // Service doesn't have complete availability data
                };
            };
        };
        
        // Initialize service packages from shared static data
        for ((id, package) in StaticData.getSTATIC_PACKAGES().vals()) {
            servicePackages.put(id, package);
        };
    };
    // Initialize static data if categories or services are empty
    if (categories.size() < 1 or services.size() < 1) {
        initializeStaticData();
    };

    // Initialization
    system func preupgrade() {
        serviceEntries := Iter.toArray(services.entries());
        categoryEntries := Iter.toArray(categories.entries());
        availabilityEntries := Iter.toArray(serviceAvailabilities.entries());
        packageEntries := Iter.toArray(servicePackages.entries());
    };

    system func postupgrade() {
        services := HashMap.fromIter<Text, Service>(serviceEntries.vals(), 10, Text.equal, Text.hash);
        serviceEntries := [];
        
        categories := HashMap.fromIter<Text, ServiceCategory>(categoryEntries.vals(), 10, Text.equal, Text.hash);
        categoryEntries := [];
        
        serviceAvailabilities := HashMap.fromIter<Text, ProviderAvailability>(availabilityEntries.vals(), 10, Text.equal, Text.hash);
        availabilityEntries := [];
        
        servicePackages := HashMap.fromIter<Text, ServicePackage>(packageEntries.vals(), 10, Text.equal, Text.hash);
        packageEntries := [];
        
        // Initialize static data if categories or services are empty
        if (categories.size() < 1 or services.size() < 1) {
            initializeStaticData();
        };
    };

    // Public functions
    
    // Create a new service listing
    public shared(msg) func createService(
        title : Text,
        description : Text,
        categoryId : Text,
        price : Nat,
        location : Location,
        weeklySchedule : ?[(DayOfWeek, DayAvailability)],
        instantBookingEnabled : ?Bool,
        bookingNoticeHours : ?Nat,
        maxBookingsPerDay : ?Nat,
        serviceImages : ?[(Text, Text, Blob)] // (fileName, contentType, fileData)
    ) : async Result<Service> {
        let caller = msg.caller;
        
        if (Principal.isAnonymous(caller)) {
            return #err("Anonymous principal not allowed");
        };

        // Validate provider
        switch (await validateProvider(caller)) {
            case (#err(msg)) {
                return #err(msg);
            };
            case (#ok(_)) {};
        };
        
        // Validate input
        if (not validateTitle(title)) {
            return #err("Title must be between " # Nat.toText(MIN_TITLE_LENGTH) # " and " # Nat.toText(MAX_TITLE_LENGTH) # " characters");
        };

        if (not validateDescription(description)) {
            return #err("Description must be between " # Nat.toText(MIN_DESCRIPTION_LENGTH) # " and " # Nat.toText(MAX_DESCRIPTION_LENGTH) # " characters");
        };

        if (not validatePrice(price)) {
            return #err("Price must be between " # Nat.toText(MIN_PRICE) # " and " # Nat.toText(MAX_PRICE));
        };

        if (not validateLocation(location)) {
            return #err("Invalid location data");
        };
        
        // Validate category exists
        let category = switch (categories.get(categoryId)) {
            case (?cat) cat;
            case (null) {
                return #err("Category not found");
            };
        };

        // Upload service images if provided
        var imageUrls : [Text] = [];
        switch (serviceImages) {
            case (?images) {
                // Validate image count
                if (images.size() > MAX_SERVICE_IMAGES) {
                    return #err("Maximum " # Nat.toText(MAX_SERVICE_IMAGES) # " images allowed per service");
                };

                // Upload images to media canister
                switch (mediaCanisterId) {
                    case (?mediaCanister) {
                        let mediaActor = actor(Principal.toText(mediaCanister)) : actor {
                            uploadMedia : (Text, Text, Types.MediaType, Blob) -> async Types.Result<Types.MediaItem>;
                        };

                        let uploadResults = Buffer.Buffer<Text>(images.size());
                        for ((fileName, contentType, fileData) in images.vals()) {
                            switch (await mediaActor.uploadMedia(fileName, contentType, #ServiceImage, fileData)) {
                                case (#ok(mediaItem)) {
                                    uploadResults.add(mediaItem.url);
                                };
                                case (#err(error)) {
                                    return #err("Failed to upload image: " # error);
                                };
                            };
                        };
                        imageUrls := Buffer.toArray(uploadResults);
                    };
                    case (null) {
                        if (images.size() > 0) {
                            return #err("Media canister not configured");
                        };
                    };
                };
            };
            case (null) {
                // No images provided, use empty array
            };
        };
        
        let serviceId = generateId();
        
        let newService : Service = {
            id = serviceId;
            providerId = caller;
            title = title;
            description = description;
            category = category;
            price = price;
            location = location;
            status = #Available;
            createdAt = Time.now();
            updatedAt = Time.now();
            rating = null;
            reviewCount = 0;
            imageUrls = imageUrls;
            // Availability information
            weeklySchedule = weeklySchedule;
            instantBookingEnabled = instantBookingEnabled;
            bookingNoticeHours = bookingNoticeHours;
            maxBookingsPerDay = maxBookingsPerDay;
        };
        
        services.put(serviceId, newService);
        
        // ALWAYS add to serviceAvailabilities if ANY availability data is provided
        switch (weeklySchedule, instantBookingEnabled, bookingNoticeHours, maxBookingsPerDay) {
            case (?schedule, ?instantBooking, ?noticeHours, ?maxBookings) {
                let availability : ProviderAvailability = {
                    providerId = caller;
                    weeklySchedule = schedule;
                    instantBookingEnabled = instantBooking;
                    bookingNoticeHours = noticeHours;
                    maxBookingsPerDay = maxBookings;
                    isActive = true;
                    createdAt = Time.now();
                    updatedAt = Time.now();
                };
                serviceAvailabilities.put(serviceId, availability);
            };
            // ADD: Handle partial availability data with defaults
            case (?schedule, ?instantBooking, _, _) {
                let availability : ProviderAvailability = {
                    providerId = caller;
                    weeklySchedule = schedule;
                    instantBookingEnabled = instantBooking;
                    bookingNoticeHours = switch (bookingNoticeHours) { case (?hours) hours; case (null) 24 }; // Default 24 hours
                    maxBookingsPerDay = switch (maxBookingsPerDay) { case (?max) max; case (null) 5 }; // Default 5 bookings
                    isActive = true;
                    createdAt = Time.now();
                    updatedAt = Time.now();
                };
                serviceAvailabilities.put(serviceId, availability);
            };
            case (_, _, _, _) {
                // No availability data provided - this is fine
            };
        };

        return #ok(newService);
    };
    
    // Get service by ID
    public query func getService(serviceId : Text) : async Result<Service> {
        switch (services.get(serviceId)) {
            case (?service) {
                return #ok(service);
            };
            case (null) {
                return #err("Service not found");
            };
        };
    };
    
    // Get services by provider
    public query func getServicesByProvider(providerId : Principal) : async [Service] {
        let providerServices = Array.filter<Service>(
            Iter.toArray(services.vals()),
            func (service : Service) : Bool {
                return service.providerId == providerId;
            }
        );
        
        return providerServices;
    };
    
    // Get services by category
    public query func getServicesByCategory(categoryId : Text) : async [Service] {
        // Validate category exists
        switch (categories.get(categoryId)) {
            case (null) {
                return [];
            };
            case (?_) {
                let categoryServices = Array.filter<Service>(
                    Iter.toArray(services.vals()),
                    func (service : Service) : Bool {
                        return service.category.id == categoryId and service.status == #Available;
                    }
                );
                
                return categoryServices;
            };
        };
    };
    
    // Update service status
    public shared(msg) func updateServiceStatus(
        serviceId : Text,
        status : ServiceStatus
    ) : async Result<Service> {
        let caller = msg.caller;
        
        switch (services.get(serviceId)) {
            case (?existingService) {
                if (existingService.providerId != caller) {
                    return #err("Not authorized to update this service");
                };
                
                let updatedService : Service = {
                    id = existingService.id;
                    providerId = existingService.providerId;
                    title = existingService.title;
                    description = existingService.description;
                    category = existingService.category;
                    price = existingService.price;
                    location = existingService.location;
                    status = status;
                    createdAt = existingService.createdAt;
                    updatedAt = Time.now();
                    rating = existingService.rating;
                    reviewCount = existingService.reviewCount;
                    imageUrls = existingService.imageUrls;
                    // Preserve availability information
                    weeklySchedule = existingService.weeklySchedule;
                    instantBookingEnabled = existingService.instantBookingEnabled;
                    bookingNoticeHours = existingService.bookingNoticeHours;
                    maxBookingsPerDay = existingService.maxBookingsPerDay;
                };
                
                services.put(serviceId, updatedService);
                return #ok(updatedService);
            };
            case (null) {
                return #err("Service not found");
            };
        };
    };
    
    // Search services by location
    public query func searchServicesByLocation(
        userLocation : Location,
        maxDistance : Float,
        categoryId : ?Text
    ) : async [Service] {
        let allServices = Iter.toArray(services.vals());
        
        let filteredServices = Array.filter<Service>(
            allServices,
            func (service : Service) : Bool {
                let categoryMatch = switch(categoryId) {
                    case (?id) service.category.id == id;
                    case (null) true;
                };
                
                let distance = calculateDistance(userLocation, service.location);
                return service.status == #Available and categoryMatch and distance <= maxDistance;
            }
        );
        
        return filteredServices;
    };
    
    // Search services by location with reputation filtering
    public func searchServicesWithReputationFilter(
        userLocation : Location,
        maxDistance : Float,
        categoryId : ?Text,
        minTrustScore : ?Float
    ) : async [Service] {
        let allServices = Iter.toArray(services.vals());
        
        let filteredServices = Array.filter<Service>(
            allServices,
            func (service : Service) : Bool {
                let categoryMatch = switch(categoryId) {
                    case (?id) service.category.id == id;
                    case (null) true;
                };
                
                let distance = calculateDistance(userLocation, service.location);
                return service.status == #Available and categoryMatch and distance <= maxDistance;
            }
        );
        
        // Filter by reputation if reputation canister is available
        switch (reputationCanisterId, minTrustScore) {
            case (?_repId, ?_minScore) {
                let _reputationCanister = actor(Principal.toText(_repId)) : actor {
                    getReputationScore : (Principal) -> async Types.Result<Types.ReputationScore>;
                };
                
                // Note: In a real implementation, you'd want to batch these calls
                // or pre-cache reputation scores for better performance
                let servicesWithReputation = Array.filter<Service>(
                    filteredServices,
                    func (service : Service) : Bool {
                        // For demo purposes, we'll assume trust score meets minimum
                        // In real implementation, you'd await the reputation score
                        true
                    }
                );
                
                return servicesWithReputation;
            };
            case (_, _) {
                return filteredServices;
            };
        };
    };
    
    // Update service rating (called by Review Canister)
    public func updateServiceRating(
        serviceId : Text,
        newRating : Float,
        newReviewCount : Nat
    ) : async Result<Service> {
        switch (services.get(serviceId)) {
            case (?existingService) {
                let updatedService : Service = {
                    id = existingService.id;
                    providerId = existingService.providerId;
                    title = existingService.title;
                    description = existingService.description;
                    category = existingService.category;
                    price = existingService.price;
                    location = existingService.location;
                    status = existingService.status;
                    createdAt = existingService.createdAt;
                    updatedAt = Time.now();
                    rating = ?newRating;
                    reviewCount = newReviewCount;
                    imageUrls = existingService.imageUrls;
                    // Preserve availability information
                    weeklySchedule = existingService.weeklySchedule;
                    instantBookingEnabled = existingService.instantBookingEnabled;
                    bookingNoticeHours = existingService.bookingNoticeHours;
                    maxBookingsPerDay = existingService.maxBookingsPerDay;
                };
                
                services.put(serviceId, updatedService);
                return #ok(updatedService);
            };
            case (null) {
                return #err("Service not found");
            };
        };
    };


    public shared(msg) func updateService(
        serviceId : Text,
        categoryId : Text,
        title : ?Text,
        description : ?Text,
        price : ?Nat,
        location : ?Location, 
        weeklySchedule : ?[(DayOfWeek, DayAvailability)],
        instantBookingEnabled : ?Bool,
        bookingNoticeHours : ?Nat,
        maxBookingsPerDay : ?Nat
    ) : async Result<Service> {
        let caller = msg.caller;
        
        if (Principal.isAnonymous(caller)) {
            return #err("Anonymous principal not allowed");
        };
        
        switch (services.get(serviceId)) {
            case (?existingService) {
                if (existingService.providerId != caller) {
                    return #err("Not authorized to update this service");
                };
                
                // Validate updated fields
                let updatedTitle = switch (title) {
                    case (?t) {
                        if (not validateTitle(t)) {
                            return #err("Title must be between " # Nat.toText(MIN_TITLE_LENGTH) # " and " # Nat.toText(MAX_TITLE_LENGTH) # " characters");
                        };
                        t;
                    };
                    case (null) existingService.title;
                };
                
                let updatedDescription = switch (description) {
                    case (?d) {
                        if (not validateDescription(d)) {
                            return #err("Description must be between " # Nat.toText(MIN_DESCRIPTION_LENGTH) # " and " # Nat.toText(MAX_DESCRIPTION_LENGTH) # " characters");
                        };
                        d;
                    };
                    case (null) existingService.description;
                };
                 // Validate category exists
                let updatedCategory = switch (categories.get(categoryId)) {
                    case (?cat) cat;
                    case (null) existingService.category;
                };
     
                
                let updatedPrice = switch (price) {
                    case (?p) {
                        if (not validatePrice(p)) {
                            return #err("Price must be between " # Nat.toText(MIN_PRICE) # " and " # Nat.toText(MAX_PRICE));
                        };
                        p;
                    };
                    case (null) existingService.price;
                };

                // Update location with validation
                let updatedLocation = switch (location) {
                    case (?loc) {
                        if (not validateLocation(loc)) {
                            return #err("Invalid location data");
                        };
                        loc;
                    };
                    case (null) existingService.location;
                };

                // Update availability with validation and defaults
                let updatedWeeklySchedule = switch (weeklySchedule) {
                    case (?schedule) ?schedule;
                    case (null) existingService.weeklySchedule;
                };

                let updatedInstantBookingEnabled = switch (instantBookingEnabled) {
                    case (?enabled) ?enabled;
                    case (null) existingService.instantBookingEnabled;
                };

                let updatedBookingNoticeHours = switch (bookingNoticeHours) {
                    case (?hours) {
                        if (hours > 720) { // Maximum 30 days
                            return #err("Booking notice hours cannot exceed 720 (30 days)");
                        };
                        ?hours;
                    };
                    case (null) existingService.bookingNoticeHours;
                };

                let updatedMaxBookingsPerDay = switch (maxBookingsPerDay) {
                    case (?maxBookings) {
                        if (maxBookings == 0 or maxBookings > 50) {
                            return #err("Max bookings per day must be between 1 and 50");
                        };
                        ?maxBookings;
                    };
                    case (null) existingService.maxBookingsPerDay;
                };
                
                let updatedService : Service = {
                    id = existingService.id;
                    providerId = existingService.providerId;
                    title = updatedTitle;
                    description = updatedDescription;
                    category = updatedCategory;
                    price = updatedPrice;
                    location = updatedLocation;
                    status = existingService.status;
                    createdAt = existingService.createdAt;
                    updatedAt = Time.now();
                    rating = existingService.rating;
                    reviewCount = existingService.reviewCount;
                    imageUrls = existingService.imageUrls; // Preserve existing images
                    // Update availability information
                    weeklySchedule = updatedWeeklySchedule;
                    instantBookingEnabled = updatedInstantBookingEnabled;
                    bookingNoticeHours = updatedBookingNoticeHours;
                    maxBookingsPerDay = updatedMaxBookingsPerDay;
                };
                
                services.put(serviceId, updatedService);

                // Update serviceAvailabilities HashMap if ANY availability data is provided
                switch (weeklySchedule, instantBookingEnabled, bookingNoticeHours, maxBookingsPerDay) {
                    case (?schedule, ?instantBooking, ?noticeHours, ?maxBookings) {
                        let availability : ProviderAvailability = {
                            providerId = caller;
                            weeklySchedule = schedule;
                            instantBookingEnabled = instantBooking;
                            bookingNoticeHours = noticeHours;
                            maxBookingsPerDay = maxBookings;
                            isActive = true;
                            createdAt = switch (serviceAvailabilities.get(serviceId)) {
                                case (?existing) existing.createdAt;
                                case (null) Time.now();
                            };
                            updatedAt = Time.now();
                        };
                        serviceAvailabilities.put(serviceId, availability);
                    };
                    // Handle partial availability data with defaults (similar to createService)
                    case (?schedule, ?instantBooking, _, _) {
                        let availability : ProviderAvailability = {
                            providerId = caller;
                            weeklySchedule = schedule;
                            instantBookingEnabled = instantBooking;
                            bookingNoticeHours = switch (updatedBookingNoticeHours) { case (?hours) hours; case (null) 24 }; // Default 24 hours
                            maxBookingsPerDay = switch (updatedMaxBookingsPerDay) { case (?max) max; case (null) 5 }; // Default 5 bookings
                            isActive = true;
                            createdAt = switch (serviceAvailabilities.get(serviceId)) {
                                case (?existing) existing.createdAt;
                                case (null) Time.now();
                            };
                            updatedAt = Time.now();
                        };
                        serviceAvailabilities.put(serviceId, availability);
                    };
                    case (_, _, _, _) {
                        // No availability updates provided - preserve existing or keep service record in sync
                        switch (updatedWeeklySchedule, updatedInstantBookingEnabled, updatedBookingNoticeHours, updatedMaxBookingsPerDay) {
                            case (?schedule, ?instantBooking, ?noticeHours, ?maxBookings) {
                                let availability : ProviderAvailability = {
                                    providerId = caller;
                                    weeklySchedule = schedule;
                                    instantBookingEnabled = instantBooking;
                                    bookingNoticeHours = noticeHours;
                                    maxBookingsPerDay = maxBookings;
                                    isActive = true;
                                    createdAt = switch (serviceAvailabilities.get(serviceId)) {
                                        case (?existing) existing.createdAt;
                                        case (null) Time.now();
                                    };
                                    updatedAt = Time.now();
                                };
                                serviceAvailabilities.put(serviceId, availability);
                            };
                            case (_, _, _, _) {
                                // No availability data to sync
                            };
                        };
                    };
                };
                return #ok(updatedService);
            };
            case (null) {
                return #err("Service not found");
            };
        };
    };
    
    // Delete a service
    public shared(msg) func deleteService(serviceId : Text) : async Result<Text> {
        let caller = msg.caller;
        
        if (Principal.isAnonymous(caller)) {
            return #err("Anonymous principal not allowed");
        };
        
        switch (services.get(serviceId)) {
            case (?existingService) {
                if (existingService.providerId != caller) {
                    return #err("Not authorized to delete this service");
                };
                
                // Remove the service from the HashMap
                services.delete(serviceId);
                
                // Also remove associated availability data if it exists
                serviceAvailabilities.delete(serviceId);
                
                // Remove associated packages
                let allPackages = Iter.toArray(servicePackages.entries());
                for ((packageId, package) in allPackages.vals()) {
                    if (package.serviceId == serviceId) {
                        servicePackages.delete(packageId);
                    };
                };
                
                return #ok("Service deleted successfully");
            };
            case (null) {
                return #err("Service not found");
            };
        };
    };

    // SERVICE IMAGE MANAGEMENT FUNCTIONS

    // Upload additional images to existing service
    public shared(msg) func uploadServiceImages(
        serviceId : Text,
        serviceImages : [(Text, Text, Blob)] // (fileName, contentType, fileData)
    ) : async Result<Service> {
        let caller = msg.caller;
        
        if (Principal.isAnonymous(caller)) {
            return #err("Anonymous principal not allowed");
        };

        switch (services.get(serviceId)) {
            case (?existingService) {
                if (existingService.providerId != caller) {
                    return #err("Not authorized to update this service");
                };

                // Check total image count after upload
                let currentImageCount = existingService.imageUrls.size();
                let newImageCount = serviceImages.size();
                
                if (currentImageCount + newImageCount > MAX_SERVICE_IMAGES) {
                    return #err("Cannot exceed maximum of " # Nat.toText(MAX_SERVICE_IMAGES) # " images per service. Current: " # Nat.toText(currentImageCount) # ", Adding: " # Nat.toText(newImageCount));
                };

                // Upload new images to media canister
                switch (mediaCanisterId) {
                    case (?mediaCanister) {
                        let mediaActor = actor(Principal.toText(mediaCanister)) : actor {
                            uploadMedia : (Text, Text, Types.MediaType, Blob) -> async Types.Result<Types.MediaItem>;
                        };

                        let uploadResults = Buffer.Buffer<Text>(newImageCount);
                        for ((fileName, contentType, fileData) in serviceImages.vals()) {
                            switch (await mediaActor.uploadMedia(fileName, contentType, #ServiceImage, fileData)) {
                                case (#ok(mediaItem)) {
                                    uploadResults.add(mediaItem.url);
                                };
                                case (#err(error)) {
                                    return #err("Failed to upload image: " # error);
                                };
                            };
                        };

                        // Combine existing and new image URLs
                        let existingUrls = Buffer.fromArray<Text>(existingService.imageUrls);
                        let newUrls = Buffer.toArray(uploadResults);
                        for (url in newUrls.vals()) {
                            existingUrls.add(url);
                        };

                        let updatedService : Service = {
                            id = existingService.id;
                            providerId = existingService.providerId;
                            title = existingService.title;
                            description = existingService.description;
                            category = existingService.category;
                            price = existingService.price;
                            location = existingService.location;
                            status = existingService.status;
                            createdAt = existingService.createdAt;
                            updatedAt = Time.now();
                            rating = existingService.rating;
                            reviewCount = existingService.reviewCount;
                            imageUrls = Buffer.toArray(existingUrls);
                            weeklySchedule = existingService.weeklySchedule;
                            instantBookingEnabled = existingService.instantBookingEnabled;
                            bookingNoticeHours = existingService.bookingNoticeHours;
                            maxBookingsPerDay = existingService.maxBookingsPerDay;
                        };

                        services.put(serviceId, updatedService);
                        return #ok(updatedService);
                    };
                    case (null) {
                        return #err("Media canister not configured");
                    };
                };
            };
            case (null) {
                return #err("Service not found");
            };
        };
    };

    // Remove specific image from service
    public shared(msg) func removeServiceImage(
        serviceId : Text,
        imageUrl : Text
    ) : async Result<Service> {
        let caller = msg.caller;
        
        if (Principal.isAnonymous(caller)) {
            return #err("Anonymous principal not allowed");
        };

        switch (services.get(serviceId)) {
            case (?existingService) {
                if (existingService.providerId != caller) {
                    return #err("Not authorized to update this service");
                };

                // Check if image exists in service
                let imageExists = Array.find<Text>(existingService.imageUrls, func(url : Text) : Bool {
                    url == imageUrl
                });

                switch (imageExists) {
                    case (?_) {
                        // Remove image URL from service
                        let filteredUrls = Array.filter<Text>(existingService.imageUrls, func(url : Text) : Bool {
                            url != imageUrl
                        });

                        let updatedService : Service = {
                            id = existingService.id;
                            providerId = existingService.providerId;
                            title = existingService.title;
                            description = existingService.description;
                            category = existingService.category;
                            price = existingService.price;
                            location = existingService.location;
                            status = existingService.status;
                            createdAt = existingService.createdAt;
                            updatedAt = Time.now();
                            rating = existingService.rating;
                            reviewCount = existingService.reviewCount;
                            imageUrls = filteredUrls;
                            weeklySchedule = existingService.weeklySchedule;
                            instantBookingEnabled = existingService.instantBookingEnabled;
                            bookingNoticeHours = existingService.bookingNoticeHours;
                            maxBookingsPerDay = existingService.maxBookingsPerDay;
                        };

                        services.put(serviceId, updatedService);

                        // Optionally delete from media canister
                        // Note: We would need to extract media ID from URL and call deleteMedia
                        // For now, just removing the reference from service

                        return #ok(updatedService);
                    };
                    case (null) {
                        return #err("Image not found in service");
                    };
                };
            };
            case (null) {
                return #err("Service not found");
            };
        };
    };

    // Reorder service images
    public shared(msg) func reorderServiceImages(
        serviceId : Text,
        orderedImageUrls : [Text]
    ) : async Result<Service> {
        let caller = msg.caller;
        
        if (Principal.isAnonymous(caller)) {
            return #err("Anonymous principal not allowed");
        };

        switch (services.get(serviceId)) {
            case (?existingService) {
                if (existingService.providerId != caller) {
                    return #err("Not authorized to update this service");
                };

                // Validate that all provided URLs exist in current service
                if (orderedImageUrls.size() != existingService.imageUrls.size()) {
                    return #err("Provided image list size doesn't match current service images");
                };

                for (url in orderedImageUrls.vals()) {
                    let urlExists = Array.find<Text>(existingService.imageUrls, func(existingUrl : Text) : Bool {
                        existingUrl == url
                    });
                    switch (urlExists) {
                        case (null) {
                            return #err("Image URL not found in service: " # url);
                        };
                        case (?_) {};
                    };
                };

                let updatedService : Service = {
                    id = existingService.id;
                    providerId = existingService.providerId;
                    title = existingService.title;
                    description = existingService.description;
                    category = existingService.category;
                    price = existingService.price;
                    location = existingService.location;
                    status = existingService.status;
                    createdAt = existingService.createdAt;
                    updatedAt = Time.now();
                    rating = existingService.rating;
                    reviewCount = existingService.reviewCount;
                    imageUrls = orderedImageUrls;
                    weeklySchedule = existingService.weeklySchedule;
                    instantBookingEnabled = existingService.instantBookingEnabled;
                    bookingNoticeHours = existingService.bookingNoticeHours;
                    maxBookingsPerDay = existingService.maxBookingsPerDay;
                };

                services.put(serviceId, updatedService);
                return #ok(updatedService);
            };
            case (null) {
                return #err("Service not found");
            };
        };
    };
    
    // Add a new category
    public shared(msg) func addCategory(
        name : Text,
        description : Text,
        parentId : ?Text,
        slug : Text,
        imageUrl : Text
    ) : async Result<ServiceCategory> {
        let caller = msg.caller;
        
        if (Principal.isAnonymous(caller)) {
            return #err("Anonymous principal not allowed");
        };
        
        // Validate parent category if provided
        switch (parentId) {
            case (?pid) {
                switch (categories.get(pid)) {
                    case (null) {
                        return #err("Parent category not found");
                    };
                    case (?_) {};
                };
            };
            case (null) {};
        };
        
        let categoryId = generateId();
        
        let newCategory : ServiceCategory = {
            id = categoryId;
            name = name;
            description = description;
            parentId = parentId;
            slug = slug;
            imageUrl = imageUrl;
        };
        
        categories.put(categoryId, newCategory);
        return #ok(newCategory);
    };
    
    // Get all categories
    public query func getAllCategories() : async [ServiceCategory] {
        return Iter.toArray(categories.vals());
    };

    // Get all services
    public query func getAllServices() : async [Service] {
        return Iter.toArray(services.vals());
    };

    // AVAILABILITY MANAGEMENT FUNCTIONS

    // Set service availability
    public shared(msg) func setServiceAvailability(
        serviceId : Text,
        weeklySchedule : [(DayOfWeek, DayAvailability)],
        instantBookingEnabled : Bool,
        bookingNoticeHours : Nat,
        maxBookingsPerDay : Nat
    ) : async Result<ProviderAvailability> {
        let caller = msg.caller;
        
        if (Principal.isAnonymous(caller)) {
            return #err("Anonymous principal not allowed");
        };

        // Validate that the service exists and caller owns it
        switch (services.get(serviceId)) {
            case (?existingService) {
                if (existingService.providerId != caller) {
                    return #err("Not authorized to set availability for this service");
                };
                
                // UPDATE: Also update the service record with new availability data
                let updatedService : Service = {
                    id = existingService.id;
                    providerId = existingService.providerId;
                    title = existingService.title;
                    description = existingService.description;
                    category = existingService.category;
                    price = existingService.price;
                    location = existingService.location;
                    status = existingService.status;
                    createdAt = existingService.createdAt;
                    updatedAt = Time.now();
                    rating = existingService.rating;
                    reviewCount = existingService.reviewCount;
                    imageUrls = existingService.imageUrls;
                    // UPDATE: Sync availability information with the service record
                    weeklySchedule = ?weeklySchedule;
                    instantBookingEnabled = ?instantBookingEnabled;
                    bookingNoticeHours = ?bookingNoticeHours;
                    maxBookingsPerDay = ?maxBookingsPerDay;
                };
                
                // Update the service record
                services.put(serviceId, updatedService);
            };
            case (null) {
                return #err("Service not found");
            };
        };

        // Validate provider
        switch (await validateProvider(caller)) {
            case (#err(msg)) {
                return #err(msg); 
            };
            case (#ok(_)) {};
        };

        // Validate booking notice hours
        if (bookingNoticeHours > 720) { // Maximum 30 days
            return #err("Booking notice hours cannot exceed 720 (30 days)");
        };

        // Validate max bookings per day
        if (maxBookingsPerDay == 0 or maxBookingsPerDay > 50) {
            return #err("Max bookings per day must be between 1 and 50");
        };

        // Get existing availability or create new one
        let currentAvailability = serviceAvailabilities.get(serviceId);

        let newAvailability : ProviderAvailability = {
            providerId = caller;
            weeklySchedule = weeklySchedule;
            instantBookingEnabled = instantBookingEnabled;
            bookingNoticeHours = bookingNoticeHours;
            maxBookingsPerDay = maxBookingsPerDay;
            isActive = true;
            createdAt = switch (currentAvailability) {
                case (?availability) availability.createdAt;
                case (null) Time.now();
            };
            updatedAt = Time.now();
        };

        serviceAvailabilities.put(serviceId, newAvailability);
        return #ok(newAvailability);
    };
    // Get service availability
    // Update getServiceAvailability to prioritize service record data
public query func getServiceAvailability(serviceId : Text) : async Result<ProviderAvailability> {
    switch (services.get(serviceId)) {
        case (?service) {
            // First try to get from service record (this will have the most up-to-date data)
            switch (service.weeklySchedule, service.instantBookingEnabled, service.bookingNoticeHours, service.maxBookingsPerDay) {
                case (?schedule, ?instantBooking, ?noticeHours, ?maxBookings) {
                    let availability : ProviderAvailability = {
                        providerId = service.providerId;
                        weeklySchedule = schedule;
                        instantBookingEnabled = instantBooking;
                        bookingNoticeHours = noticeHours;
                        maxBookingsPerDay = maxBookings;
                        isActive = true;
                        createdAt = service.createdAt;
                        updatedAt = service.updatedAt;
                    };
                    return #ok(availability);
                };
                case (_, _, _, _) {
                    // Fallback to separate availability HashMap
                    switch (serviceAvailabilities.get(serviceId)) {
                        case (?availability) {
                            return #ok(availability);
                        };
                        case (null) {
                            return #err("Service availability not properly configured");
                        };
                    };
                };
            };
        };
        case (null) {
            return #err("Service not found");
        };
    };
    };

    // Get provider availability (backward compatibility - deprecated)
    public query func getProviderAvailability(providerId : Principal) : async Result<ProviderAvailability> {
        // Find first service by this provider and return its availability
        let providerServices = Array.filter<Service>(
            Iter.toArray(services.vals()),
            func (service : Service) : Bool {
                return service.providerId == providerId;
            }
        );
        
        if (providerServices.size() == 0) {
            return #err("No services found for this provider");
        };
        
        // Return availability of first service (for backward compatibility)
        switch (serviceAvailabilities.get(providerServices[0].id)) {
            case (?availability) {
                return #ok(availability);
            };
            case (null) {
                return #err("Provider availability not found");
            };
        };
    };



    // Get available time slots for a specific date and service
    public func getAvailableTimeSlots(
        serviceId : Text,
        date : Time.Time
    ) : async Result<[AvailableSlot]> {
    
        // Get service availability (using the same logic as getServiceAvailability)
        let availability = switch (serviceAvailabilities.get(serviceId)) {
            case (?avail) avail;
            case (null) {
                // If not found in serviceAvailabilities, try to construct from service data
                switch (services.get(serviceId)) {
                    case (?service) {
                        switch (service.weeklySchedule, service.instantBookingEnabled, service.bookingNoticeHours, service.maxBookingsPerDay) {
                            case (?schedule, ?instantBooking, ?noticeHours, ?maxBookings) {
                                {
                                    providerId = service.providerId;
                                    weeklySchedule = schedule;
                                    instantBookingEnabled = instantBooking;
                                    bookingNoticeHours = noticeHours;
                                    maxBookingsPerDay = maxBookings;
                                    isActive = true;
                                    createdAt = service.createdAt;
                                    updatedAt = service.updatedAt;
                            }
                        };
                        case (_, _, _, _) {
                            return #err("Service availability not properly configured");
                        };
                    };
                };
                case (null) {
                    return #err("Service not found");
                };
            };
        }; 
        };

        if (not availability.isActive) {
            return #err("Service is not currently accepting bookings");
        };

        // Get day of week for the requested date
        let dayOfWeek = getDayOfWeekFromTime(date);
        
        // Find the day's availability in the weekly schedule
        let dayAvailability = Array.find<(DayOfWeek, DayAvailability)>(
            availability.weeklySchedule,
            func ((day, _) : (DayOfWeek, DayAvailability)) : Bool {
                day == dayOfWeek
            }
        );

        switch (dayAvailability) {
            case (?((_, dayAvail))) {
                if (not dayAvail.isAvailable) {
                    return #ok([]);
                };

                // Get conflicting bookings for this date
                let serviceObj = switch (services.get(serviceId)) {
                    case (?service) service;
                    case (null) {
                        return #err("Service not found");
                    };
                };
                let conflictingBookings = await getBookingsForDate(serviceObj.providerId, date);

                // Create available slots
                let availableSlots = Array.map<TimeSlot, AvailableSlot>(
                    dayAvail.slots,
                    func (slot : TimeSlot) : AvailableSlot {
                        let conflicts = getConflictingBookingIds(slot, conflictingBookings);
                        {
                            date = date;
                            timeSlot = slot;
                            isAvailable = conflicts.size() == 0;
                            conflictingBookings = conflicts;
                        }
                    }
                );

                return #ok(availableSlots);
            };
            case (null) {
                return #ok([]);
            };
        };
    };

    // Check if service is available at specific date and time
      public func isServiceAvailable(
        serviceId : Text,
        requestedDateTime : Time.Time
    ) : async Result<Bool> {
        
        // Basic checks only
        let availability = switch (serviceAvailabilities.get(serviceId)) {
            case (?avail) avail;
            case (null) {
                switch (services.get(serviceId)) {
                    case (?service) {
                        switch (service.weeklySchedule, service.instantBookingEnabled, service.bookingNoticeHours, service.maxBookingsPerDay) {
                            case (?schedule, ?instantBooking, ?noticeHours, ?maxBookings) {
                                {
                                    providerId = service.providerId;
                                    weeklySchedule = schedule;
                                    instantBookingEnabled = instantBooking;
                                    bookingNoticeHours = noticeHours;
                                    maxBookingsPerDay = maxBookings;
                                    isActive = true;
                                    createdAt = service.createdAt;
                                    updatedAt = service.updatedAt;
                                }
                            };
                            case (_, _, _, _) {
                                return #err("Service availability not properly configured");
                            };
                        };
                    };
                    case (null) {
                        return #err("Service not found");
                    };
                };
            };
        };

        // Just check if service is active - trust that frontend only shows valid slots
        return #ok(availability.isActive);
    };


    // Check if provider is available at specific date and time (backward compatibility - deprecated)
    public func isProviderAvailable(
        providerId : Principal,
        requestedDateTime : Time.Time
    ) : async Result<Bool> {
        // Find first service by this provider
        let providerServices = Array.filter<Service>(
            Iter.toArray(services.vals()),
            func (service : Service) : Bool {
                return service.providerId == providerId;
            }
        );
        
        if (providerServices.size() == 0) {
            return #err("No services found for this provider");
        };
        
        // Check first service's availability (for backward compatibility)
        return await isServiceAvailable(providerServices[0].id, requestedDateTime);
    };

    // HELPER FUNCTIONS FOR AVAILABILITY

    // Convert timestamp to day of week
    private func getDayOfWeekFromTime(timestamp : Time.Time) : DayOfWeek {
        // Convert nanoseconds to seconds, then to days since epoch
        let secondsSinceEpoch = timestamp / 1_000_000_000;
        let daysSinceEpoch = secondsSinceEpoch / 86400; // 86400 seconds in a day
        
        // January 1, 1970 was a Thursday
        // Days since epoch: 0=Thursday, 1=Friday, 2=Saturday, 3=Sunday, 4=Monday, 5=Tuesday, 6=Wednesday
        // We want: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
        let dayIndex = (daysSinceEpoch + 4) % 7;
        
        switch (dayIndex) {
            case (0) #Sunday;    // Corrected mapping
            case (1) #Monday;
            case (2) #Tuesday;
            case (3) #Wednesday;
            case (4) #Thursday;  // Jan 1, 1970
            case (5) #Friday;
            case (6) #Saturday;
            case (_) #Sunday; // fallback
        }
    };

    // Extract time of day from timestamp (format: "HH:MM")
    private func getTimeOfDayFromTimestamp(timestamp : Time.Time) : Text {
        let secondsSinceEpoch = timestamp / 1_000_000_000;
        let secondsInDay = secondsSinceEpoch % 86400;
        let hours = secondsInDay / 3600;
        let minutes = (secondsInDay % 3600) / 60;
        
        let hoursNat = Int.abs(hours);
        let minutesNat = Int.abs(minutes);
        
        let hoursStr = if (hoursNat < 10) "0" # Nat.toText(hoursNat) else Nat.toText(hoursNat);
        let minutesStr = if (minutesNat < 10) "0" # Nat.toText(minutesNat) else Nat.toText(minutesNat);
        
        hoursStr # ":" # minutesStr
    };

    // Check if a time is within a time slot
    private func isTimeWithinSlot(timeStr : Text, slot : TimeSlot) : Bool {
        // Compare time strings directly (assuming HH:MM format)
        timeStr >= slot.startTime and timeStr <= slot.endTime
    };

    // Get bookings for a specific date and provider
    private func getBookingsForDate(providerId : Principal, date : Time.Time) : async [Text] {
        // Call booking canister to get conflicting bookings
        switch (bookingCanisterId) {
            case (?bookingId) {
                let bookingCanister = actor(Principal.toText(bookingId)) : actor {
                    getProviderBookingConflicts : (Principal, Time.Time, Time.Time) -> async [Types.Booking];
                };
                
                let startOfDay = getStartOfDay(date);
                let endOfDay = startOfDay + (24 * 3600_000_000_000); // Add 24 hours in nanoseconds
                
                let conflicts = await bookingCanister.getProviderBookingConflicts(providerId, startOfDay, endOfDay);
                Array.map<Types.Booking, Text>(conflicts, func (booking : Types.Booking) : Text { booking.id });
            };
            case (null) {
                []
            };
        }
    };

    // Get conflicting booking IDs for a time slot
    private func getConflictingBookingIds(slot : TimeSlot, bookings : [Text]) : [Text] {
        // For now, if there are any bookings on the date, consider the slot as having conflicts
        // In a more sophisticated implementation, you would check actual time overlaps
        if (bookings.size() > 0) {
            bookings
        } else {
            []
        }
    };

    // Get daily booking count for a provider and date
    private func getDailyBookingCount(providerId : Principal, date : Time.Time) : async Nat {
        switch (bookingCanisterId) {
            case (?bookingId) {
                let bookingCanister = actor(Principal.toText(bookingId)) : actor {
                    getDailyBookingCount : (Principal, Time.Time) -> async Nat;
                };
                
                await bookingCanister.getDailyBookingCount(providerId, date);
            };
            case (null) {
                0
            };
        }
    };

    // Helper function to get start of day timestamp
    private func getStartOfDay(timestamp : Time.Time) : Time.Time {
        let secondsSinceEpoch = timestamp / 1_000_000_000;
        let daysSinceEpoch = secondsSinceEpoch / 86400;
        let startOfDaySeconds = daysSinceEpoch * 86400;
        startOfDaySeconds * 1_000_000_000
    };

    // Package-related functions
    
    // Create a new service package
    public shared(msg) func createServicePackage(
        serviceId : Text,
        title : Text,
        description : Text,
        price : Nat
    ) : async Result<ServicePackage> {
        let caller = msg.caller;
        
        if (Principal.isAnonymous(caller)) {
            return #err("Anonymous principal not allowed");
        };
        
        // Check if service exists and caller is the service provider
        switch (services.get(serviceId)) {
            case (?service) {
                if (service.providerId != caller) {
                    return #err("Not authorized to create packages for this service");
                };
                
                // Validate input
                if (not validateTitle(title)) {
                    return #err("Title must be between " # Nat.toText(MIN_TITLE_LENGTH) # " and " # Nat.toText(MAX_TITLE_LENGTH) # " characters");
                };

                if (not validateDescription(description)) {
                    return #err("Description must be between " # Nat.toText(MIN_DESCRIPTION_LENGTH) # " and " # Nat.toText(MAX_DESCRIPTION_LENGTH) # " characters");
                };

                if (not validatePrice(price)) {
                    return #err("Price must be between " # Nat.toText(MIN_PRICE) # " and " # Nat.toText(MAX_PRICE));
                };
                
                let packageId = generateId();
                
                let newPackage : ServicePackage = {
                    id = packageId;
                    serviceId = serviceId;
                    title = title;
                    description = description;
                    price = price;
                    createdAt = Time.now();
                    updatedAt = Time.now();
                };
                
                servicePackages.put(packageId, newPackage);
                return #ok(newPackage);
            };
            case (null) {
                return #err("Service not found");
            };
        };
    };
    
    // Get all packages for a service
    public query func getServicePackages(serviceId : Text) : async Result<[ServicePackage]> {
        // Check if service exists
        switch (services.get(serviceId)) {
            case (?_) {
                let allPackages = Iter.toArray(servicePackages.vals());
                let servicePackagesList = Array.filter<ServicePackage>(
                    allPackages,
                    func (pkg : ServicePackage) : Bool {
                        return pkg.serviceId == serviceId;
                    }
                );
                
                return #ok(servicePackagesList);
            };
            case (null) {
                return #err("Service not found");
            };
        };
    };
    
    // Get a specific package by ID
    public query func getPackage(packageId : Text) : async Result<ServicePackage> {
        switch (servicePackages.get(packageId)) {
            case (?package) {
                return #ok(package);
            };
            case (null) {
                return #err("Package not found");
            };
        };
    };
    
    // Update a service package
    public shared(msg) func updateServicePackage(
        packageId : Text,
        title : ?Text,
        description : ?Text,
        price : ?Nat
    ) : async Result<ServicePackage> {
        let caller = msg.caller;
        
        if (Principal.isAnonymous(caller)) {
            return #err("Anonymous principal not allowed");
        };
        
        switch (servicePackages.get(packageId)) {
            case (?existingPackage) {
                // Verify caller is the service provider
                switch (services.get(existingPackage.serviceId)) {
                    case (?service) {
                        if (service.providerId != caller) {
                            return #err("Not authorized to update this package");
                        };
                    };
                    case (null) {
                        return #err("Associated service not found");
                    };
                };
                
                // Validate updated fields
                let updatedTitle = switch (title) {
                    case (?t) {
                        if (not validateTitle(t)) {
                            return #err("Title must be between " # Nat.toText(MIN_TITLE_LENGTH) # " and " # Nat.toText(MAX_TITLE_LENGTH) # " characters");
                        };
                        t;
                    };
                    case (null) existingPackage.title;
                };
                
                let updatedDescription = switch (description) {
                    case (?d) {
                        if (not validateDescription(d)) {
                            return #err("Description must be between " # Nat.toText(MIN_DESCRIPTION_LENGTH) # " and " # Nat.toText(MAX_DESCRIPTION_LENGTH) # " characters");
                        };
                        d;
                    };
                    case (null) existingPackage.description;
                };
                
                let updatedPrice = switch (price) {
                    case (?p) {
                        if (not validatePrice(p)) {
                            return #err("Price must be between " # Nat.toText(MIN_PRICE) # " and " # Nat.toText(MAX_PRICE));
                        };
                        p;
                    };
                    case (null) existingPackage.price;
                };
                
                let updatedPackage : ServicePackage = {
                    id = existingPackage.id;
                    serviceId = existingPackage.serviceId;
                    title = updatedTitle;
                    description = updatedDescription;
                    price = updatedPrice;
                    createdAt = existingPackage.createdAt;
                    updatedAt = Time.now();
                };
                
                servicePackages.put(packageId, updatedPackage);
                return #ok(updatedPackage);
            };
            case (null) {
                return #err("Package not found");
            };
        };
    };
    
    // Delete a service package
    public shared(msg) func deleteServicePackage(packageId : Text) : async Result<Text> {
        let caller = msg.caller;
        
        if (Principal.isAnonymous(caller)) {
            return #err("Anonymous principal not allowed");
        };
        
        switch (servicePackages.get(packageId)) {
            case (?existingPackage) {
                // Verify caller is the service provider
                switch (services.get(existingPackage.serviceId)) {
                    case (?service) {
                        if (service.providerId != caller) {
                            return #err("Not authorized to delete this package");
                        };
                        
                        servicePackages.delete(packageId);
                        return #ok("Package deleted successfully");
                    };
                    case (null) {
                        return #err("Associated service not found");
                    };
                };
            };
            case (null) {
                return #err("Package not found");
            };
        };
    };
}