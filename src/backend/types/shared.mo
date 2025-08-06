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
    public type UserRole = {
        #Client;
        #ServiceProvider;
    };

    public type ProfileImage = {
        imageUrl: Text;
        thumbnailUrl: Text;
    };

    // Media storage types
    public type MediaType = {
        #UserProfile;
        #ServiceImage;
        #ServiceCertificate;
    };

    public type MediaItem = {
        id: Text;
        ownerId: Principal;
        fileName: Text;
        fileSize: Nat;
        contentType: Text;
        mediaType: MediaType;
        filePath: Text;
        url: Text;
        thumbnailUrl: ?Text;
        createdAt: Time.Time;
        updatedAt: Time.Time;
    };

    public type MediaUploadRequest = {
        fileName: Text;
        contentType: Text;
        mediaType: MediaType;
        fileData: Blob;
    };
    // Removed Profile
    public type Profile = {
        id: Principal;
        name: Text;
        phone: Text;
        role: UserRole; // Original role when user first signed up
        activeRole: UserRole; // Current active role for UI and permissions
        createdAt: Time.Time;
        updatedAt: Time.Time;
        profilePicture: ?ProfileImage;
        biography: ?Text;
    };

    // Service types
    public type ServiceCategory = {
        id: Text;
        name: Text;
        description: Text;
        parentId: ?Text;
        slug: Text;
        imageUrl: Text;
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
        imageUrls: [Text]; // Array of media URLs for service images (max 5)
        certificateUrls: [Text]; // Array of media URLs for service certificates
        isVerifiedService: Bool; // Service verification status based on certificates
        // Availability information
        weeklySchedule: ?[(DayOfWeek, DayAvailability)];
        instantBookingEnabled: ?Bool;
        bookingNoticeHours: ?Nat; // Minimum hours in advance for booking
        maxBookingsPerDay: ?Nat;
        // Package reference not needed as we'll use serviceId to look up packages
    };

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
        notes: ?Text;  // Optional notes from client during booking creation
        createdAt: Time.Time;
        updatedAt: Time.Time;
    };

    // Review types
    public type ReviewStatus = {
        #Visible;
        #Hidden;
        #Flagged;
    };

    public type Review = {
        id: Text;
        bookingId: Text;
        clientId: Principal;
        providerId: Principal;
        serviceId: Text;
        rating: Nat;
        comment: Text;
        status: ReviewStatus;
        qualityScore: ?Float;
        createdAt: Time.Time;
        updatedAt: Time.Time;
    };

    // Reputation types
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

    public type ReputationScore = {
        userId: Principal;
        trustScore: Float;
        trustLevel: TrustLevel;
        completedBookings: Nat;
        averageRating: ?Float;
        detectionFlags: [DetectionFlag];
        lastUpdated: Time.Time;
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

    public type ClientAnalytics = {
        clientId: Principal;
        totalBookings: Nat;
        servicesCompleted: Nat;
        totalSpent: Nat; // Only from completed bookings
        memberSince: Time.Time; // From user profile creation date
        packageBreakdown: [(Text, Nat)]; // (packageId, count) pairs for package bookings
        startDate: ?Time.Time;
        endDate: ?Time.Time;
    };

    // Chat types
    public type MessageStatus = {
        #Sent;
        #Delivered;
        #Read;
    };

    public type MessageType = {
        #Text;
        #File; // Future support for file attachments
    };

    public type EncryptedContent = {
        encryptedText: Text;
        encryptionKey: Text;
    };

    public type FileAttachment = {
        fileName: Text;
        fileSize: Nat;
        fileType: Text;
        fileUrl: Text;
    };

    public type Message = {
        id: Text;
        conversationId: Text;
        senderId: Principal;
        receiverId: Principal;
        messageType: MessageType;
        content: EncryptedContent;
        attachment: ?FileAttachment;
        status: MessageStatus;
        createdAt: Time.Time;
        readAt: ?Time.Time;
    };

    public type Conversation = {
        id: Text;
        clientId: Principal;
        providerId: Principal;
        createdAt: Time.Time;
        lastMessageAt: ?Time.Time;
        isActive: Bool;
        unreadCount: [(Principal, Nat)]; // (userId, unreadCount) pairs
    };

    public type ConversationSummary = {
        conversation: Conversation;
        lastMessage: ?Message;
    };

    public type MessagePage = {
        messages: [Message];
        hasMore: Bool;
        nextPageToken: ?Text;
    };

    // API Response
    public type Result<T> = {
        #ok: T;
        #err: Text;
    };

    // HTTP types for serving media files
    public type HeaderField = (Text, Text);

    public type HttpRequest = {
        method: Text;
        url: Text;
        headers: [HeaderField];
        body: Blob;
    };

    public type HttpResponse = {
        status_code: Nat16;
        headers: [HeaderField];
        body: Blob;
    };
}