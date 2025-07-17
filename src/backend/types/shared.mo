import Principal "mo:base/Principal";
import Int "mo:base/Int";
import Time "mo:base/Time";
import List "mo:base/List";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import HashMap "mo:base/HashMap";
import Buffer "mo:base/Buffer";

module {
    // User types
    // Removed Profile

    // Service types
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

    // Availability types
    public type TimeSlot = {
        startTime: Text; // Format: "HH:MM" (24-hour format)
        endTime: Text;   // Format: "HH:MM" (24-hour format)
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

    public type AvailableSlot = {
        date: Time.Time;
        timeSlot: TimeSlot;
        isAvailable: Bool;
        conflictingBookings: [Text]; // Booking IDs that conflict
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

    

    

    

    // Analytics types
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

    // API Response
    public type Result<T> = {
        #ok: T;
        #err: Text;
    };
}