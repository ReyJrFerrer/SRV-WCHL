
import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Text "mo:base/Text";

module {
    // User types
    public type UserRole = {
        #Client;
        #ServiceProvider;
        #Admin; // New admin role for enhanced security
    };

    public type ProfileImage = {
        imageUrl: Text;
        thumbnailUrl: Text;
    };

    // Enhanced profile type with role switching support
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
        // New fields for enhanced security
        lastLogin: ?Time.Time;
        loginCount: Nat;
        isActive: Bool;
        suspendedUntil: ?Time.Time;
    };

    // Role switching history tracking
    public type RoleChangeRecord = {
        id: Text;
        userId: Principal;
        previousRole: UserRole;
        newRole: UserRole;
        changedAt: Time.Time;
        reason: ?Text;
        approvedBy: ?Principal; // For admin-approved role changes
    };

    // Enhanced security types
    public type SecurityEvent = {
        id: Text;
        userId: Principal;
        eventType: SecurityEventType;
        timestamp: Time.Time;
        ipAddress: ?Text;
        userAgent: ?Text;
        details: ?Text;
    };

    public type SecurityEventType = {
        #Login;
        #FailedLogin;
        #RoleSwitch;
        #ProfileUpdate;
        #VerificationChange;
        #Suspension;
        #Reactivation;
    };

    // Profile statistics for analytics
    public type ProfileStatistics = {
        totalProfiles: Nat;
        activeProfiles: Nat;
        verifiedProfiles: Nat;
        suspendedProfiles: Nat;
        clientCount: Nat;
        serviceProviderCount: Nat;
        adminCount: Nat;
        recentRegistrations: Nat; // Last 30 days
    };

    // Validation constants
    public let VALIDATION_CONSTANTS = {
        MIN_NAME_LENGTH = 2;
        MAX_NAME_LENGTH = 50;
        MIN_PHONE_LENGTH = 10;
        MAX_PHONE_LENGTH = 15;
        DEFAULT_HASHMAP_SIZE = 100;
        MAX_ROLE_SWITCHES_PER_DAY = 3;
        SUSPENSION_DURATION_HOURS = 24;
        MAX_FAILED_LOGINS = 5;
    };

    // API Response
    public type Result<T> = {
        #ok: T;
        #err: Text;
    };
}
