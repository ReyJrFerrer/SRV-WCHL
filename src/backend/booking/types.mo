
import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Text "mo:base/Text";
import Nat "mo:base/Nat";

module {
    // Booking types
    public type BookingStatus = {
        #Requested;
        #Accepted;
        #Declined;
        #Cancelled;
        #InProgress;
        #Completed;
        #Disputed;
    };

    public type Evidence = {
        id: Text;
        bookingId: Text;
        submitterId: Principal;
        description: Text;
        fileUrls: [Text];
        qualityScore: ?Float;
        createdAt: Time.Time;
    };

    public type Location = {
        latitude: Float;
        longitude: Float;
        address: Text;
        city: Text;
        state: Text;
        country: Text;
        postalCode: Text;
    };

    public type Booking = {
        id: Text;
        clientId: Principal;
        providerId: Principal;
        serviceId: Text;
        servicePackageId: ?Text;  // ID of the package if booking a package
        status: BookingStatus;
        requestedDate: Time.Time;
        scheduledDate: ?Time.Time;
        completedDate: ?Time.Time;
        price: Nat;
        location: Location;
        evidence: ?Evidence;
        createdAt: Time.Time;
        updatedAt: Time.Time;
    };

    // API Response
    public type Result<T> = {
        #ok: T;
        #err: Text;
    };

    public type ReputationScore = {
        userId: Principal;
        trustScore: Float;
        trustLevel: TrustLevel;
        completedBookings: Nat;
        averageRating: ?Float;
        detectionFlags: [DetectionFlag];
        lastUpdated: Time.Time;
    };

    public type TrustLevel = {
        #New;
        #Low;
        #Medium;
        #High;
        #VeryHigh;
    };

    public type DetectionFlag = {
        #ReviewBomb;
        #CompetitiveManipulation;
        #FakeEvidence;
        #IdentityFraud;
        #Other;
    };

    public type Profile = {
        id: Principal;
        name: Text;
        phone: Text;
        role: UserRole;
        createdAt: Time.Time;
        updatedAt: Time.Time;
        isVerified: Bool;
        profilePicture: ?ProfileImage;
        biography: ?Text;
    };

    public type UserRole = {
        #Client;
        #ServiceProvider;
    };

    public type ProfileImage = {
        imageUrl: Text;
        thumbnailUrl: Text;
    };

    public type Service = {
        id: Text;
        providerId: Principal;
        title: Text;
        description: Text;
        category: ServiceCategory;
        price: Nat;
        location: Location;
        status: ServiceStatus;
        createdAt: Time.Time;
        updatedAt: Time.Time;
        rating: ?Float;
        reviewCount: Nat;
        // Availability information
        weeklySchedule: ?[(DayOfWeek, DayAvailability)];
        instantBookingEnabled: ?Bool;
        bookingNoticeHours: ?Nat; // Minimum hours in advance for booking
        maxBookingsPerDay: ?Nat;
        // Package reference not needed as we'll use serviceId to look up packages
    };

    public type ServiceCategory = {
        id: Text;
        name: Text;
        description: Text;
        parentId: ?Text;
        slug: Text;
        imageUrl: Text;
    };

    public type ServiceStatus = {
        #Available;
        #Unavailable;
        #Suspended;
    };

    public type DayOfWeek = {
        #Monday;
        #Tuesday;
        #Wednesday;
        #Thursday;
        #Friday;
        #Saturday;
        #Sunday;
    };

    public type DayAvailability = {
        isAvailable: Bool;
        slots: [TimeSlot];
    };

    public type TimeSlot = {
        startTime: Text; // Format: "HH:MM" (24-hour format)
        endTime: Text;   // Format: "HH:MM" (24-hour format)
    };

    public type ServicePackage = {
        id: Text;
        serviceId: Text;
        title: Text;
        description: Text;
        price: Nat;
        createdAt: Time.Time;
        updatedAt: Time.Time;
    };

    public type AvailableSlot = {
        date: Time.Time;
        timeSlot: TimeSlot;
        isAvailable: Bool;
        conflictingBookings: [Text]; // Booking IDs that conflict
    };

    public type ProviderAvailability = {
        providerId: Principal;
        weeklySchedule: [(DayOfWeek, DayAvailability)];
        instantBookingEnabled: Bool;
        bookingNoticeHours: Nat; // Minimum hours in advance for booking
        maxBookingsPerDay: Nat;
        isActive: Bool;
        createdAt: Time.Time;
        updatedAt: Time.Time;
    };

    public type ProviderAnalytics = {
        providerId: Principal;
        completedJobs: Nat;
        cancelledJobs: Nat;
        totalJobs: Nat;
        completionRate: Float;
        totalEarnings: Nat;
        startDate: ?Time.Time;
        endDate: ?Time.Time;
        packageBreakdown: [(Text, Nat)]; // (packageId, count) pairs for package bookings
    };
}
