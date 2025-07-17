import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Time "mo:base/Time";
import HashMap "mo:base/HashMap";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Char "mo:base/Char";
import Option "mo:base/Option";
import Int "mo:base/Int";
import Order "mo:base/Order";
import Debug "mo:base/Debug";

import Types "./types";
import StaticData "../utils/staticData";

/**
    Jun 17, 2025: 
    Removed email from auth
*/
actor AuthCanister {
    // Type definitions
    type Profile = Types.Profile;
    type UserRole = Types.UserRole;
    type Result<T> = Types.Result<T>;
    type RoleChangeRecord = Types.RoleChangeRecord;
    type SecurityEvent = Types.SecurityEvent;
    type SecurityEventType = Types.SecurityEventType;
    type ProfileStatistics = Types.ProfileStatistics;

    // State variables with improved HashMap sizes
    private stable var profileEntries : [(Principal, Profile)] = [];
    private var profiles = HashMap.HashMap<Principal, Profile>(Types.VALIDATION_CONSTANTS.DEFAULT_HASHMAP_SIZE, Principal.equal, Principal.hash);
    private var verifiedUsers = HashMap.HashMap<Principal, Bool>(Types.VALIDATION_CONSTANTS.DEFAULT_HASHMAP_SIZE, Principal.equal, Principal.hash);
    private var phoneToPrincipal = HashMap.HashMap<Text, Principal>(Types.VALIDATION_CONSTANTS.DEFAULT_HASHMAP_SIZE, Text.equal, Text.hash);

    // New state variables for enhanced functionality
    private stable var roleChangeEntries : [(Text, RoleChangeRecord)] = [];
    private var roleChangeHistory = HashMap.HashMap<Text, RoleChangeRecord>(Types.VALIDATION_CONSTANTS.DEFAULT_HASHMAP_SIZE, Text.equal, Text.hash);
    
    private stable var securityEventEntries : [(Text, SecurityEvent)] = [];
    private var securityEvents = HashMap.HashMap<Text, SecurityEvent>(Types.VALIDATION_CONSTANTS.DEFAULT_HASHMAP_SIZE, Text.equal, Text.hash);
    
    // Rate limiting for role switches
    private var dailyRoleSwitches = HashMap.HashMap<Principal, [(Time.Time, UserRole)]>(50, Principal.equal, Principal.hash);

    // Canister references
    private var reputationCanisterId : ?Principal = null;

    // Initial data loading 
    

    // Constants from validation constants
    private let MIN_NAME_LENGTH : Nat = Types.VALIDATION_CONSTANTS.MIN_NAME_LENGTH;
    private let MAX_NAME_LENGTH : Nat = Types.VALIDATION_CONSTANTS.MAX_NAME_LENGTH;
    private let MIN_PHONE_LENGTH : Nat = Types.VALIDATION_CONSTANTS.MIN_PHONE_LENGTH;
    private let MAX_PHONE_LENGTH : Nat = Types.VALIDATION_CONSTANTS.MAX_PHONE_LENGTH;
    private let MAX_ROLE_SWITCHES_PER_DAY : Nat = Types.VALIDATION_CONSTANTS.MAX_ROLE_SWITCHES_PER_DAY;

    // Helper functions
    private func generateId() : Text {
        let now = Int.abs(Time.now());
        let random = Int.abs(Time.now()) % 100000; // Increased entropy
        return Int.toText(now) # "-" # Int.toText(random);
    };

    private func validatePhone(phone : Text) : Bool {
        if (phone.size() < MIN_PHONE_LENGTH or phone.size() > MAX_PHONE_LENGTH) {
            return false;
        };
        
        let chars = Text.toIter(phone);
        var digitCount = 0;
        
        for (c in chars) {
            if (Char.isDigit(c)) {
                digitCount += 1;
            } else if (c != '+' and c != '-' and c != '(' and c != ')' and c != ' ') {
                return false;
            };
        };
        
        digitCount >= 10
    };

    private func validateName(name : Text) : Bool {
        name.size() >= MIN_NAME_LENGTH and name.size() <= MAX_NAME_LENGTH
    };

    // Enhanced validation for role transitions
    private func isValidRoleTransition(currentRole : UserRole, newRole : UserRole, isAdmin : Bool) : Bool {
        switch (currentRole, newRole) {
            case (#Client, #ServiceProvider) true; // Users can become providers
            case (#ServiceProvider, #Client) true; // Providers can become clients
            case (#Client, #Admin) isAdmin; // Only admins can promote to admin
            case (#ServiceProvider, #Admin) isAdmin; // Only admins can promote to admin
            case (#Admin, #Client) isAdmin; // Only admins can demote themselves
            case (#Admin, #ServiceProvider) isAdmin; // Only admins can demote themselves
            case (_, _) false; // Same role transition not allowed
        }
    };

    // Check if user is admin
    private func isAdmin(userId : Principal) : Bool {
        switch (profiles.get(userId)) {
            case (?profile) profile.role == #Admin;
            case (null) false;
        }
    };

    // Rate limiting for role switches
    private func canSwitchRole(userId : Principal) : Bool {
        switch (dailyRoleSwitches.get(userId)) {
            case (?switches) {
                let now = Time.now();
                let dayInNanoseconds = 24 * 60 * 60 * 1_000_000_000;
                
                // Filter switches from last 24 hours
                let recentSwitches = Array.filter<(Time.Time, UserRole)>(
                    switches,
                    func ((timestamp, _) : (Time.Time, UserRole)) : Bool {
                        (now - timestamp) < dayInNanoseconds
                    }
                );
                
                recentSwitches.size() < MAX_ROLE_SWITCHES_PER_DAY
            };
            case (null) true; // No switches recorded, allow
        }
    };

    // Log security events
    private func logSecurityEvent(
        userId : Principal,
        eventType : SecurityEventType,
        details : ?Text
    ) {
        let eventId = generateId();
        let event : SecurityEvent = {
            id = eventId;
            userId = userId;
            eventType = eventType;
            timestamp = Time.now();
            ipAddress = null; // Could be enhanced with real IP tracking
            userAgent = null; // Could be enhanced with user agent tracking
            details = details;
        };
        
        securityEvents.put(eventId, event);
    };

    // Helper functions for duplicate checking
    // private func isEmailTaken(email : Text, excludePrincipal : ?Principal) : Bool {
    //     switch (emailToPrincipal.get(email)) {
    //         case (?principal) {
    //             switch (excludePrincipal) {
    //                 case (?exclude) {
    //                     return Principal.notEqual(principal, exclude);
    //                 };
    //                 case (null) {
    //                     return true;
    //                 };
    //             };
    //         };
    //         case (null) {
    //             return false;
    //         };
    //     };
    // };

    private func isPhoneTaken(phone : Text, excludePrincipal : ?Principal) : Bool {
        switch (phoneToPrincipal.get(phone)) {
            case (?principal) {
                switch (excludePrincipal) {
                    case (?exclude) {
                        return Principal.notEqual(principal, exclude);
                    };
                    case (null) {
                        return true;
                    };
                };
            };
            case (null) {
                return false;
            };
        };
    };

    // Static data initialization
    private func initializeStaticProfiles() {
        // Add profiles from shared static data
        for ((principal, profile) in StaticData.getSTATIC_PROFILES().vals()) {
            profiles.put(principal, profile);
            verifiedUsers.put(principal, true);
            phoneToPrincipal.put(profile.phone, principal);
        };
    };

    // Initialize static data if profiles are less than 5
    if (profiles.size() < 5) {
        initializeStaticProfiles();
    };
    // Initialization with enhanced state management
    system func preupgrade() {
        profileEntries := Iter.toArray(profiles.entries());
        roleChangeEntries := Iter.toArray(roleChangeHistory.entries());
        securityEventEntries := Iter.toArray(securityEvents.entries());
    };

    system func postupgrade() {
        profiles := HashMap.fromIter<Principal, Profile>(profileEntries.vals(), Types.VALIDATION_CONSTANTS.DEFAULT_HASHMAP_SIZE, Principal.equal, Principal.hash);
        profileEntries := [];
        
        roleChangeHistory := HashMap.fromIter<Text, RoleChangeRecord>(roleChangeEntries.vals(), Types.VALIDATION_CONSTANTS.DEFAULT_HASHMAP_SIZE, Text.equal, Text.hash);
        roleChangeEntries := [];
        
        securityEvents := HashMap.fromIter<Text, SecurityEvent>(securityEventEntries.vals(), Types.VALIDATION_CONSTANTS.DEFAULT_HASHMAP_SIZE, Text.equal, Text.hash);
        securityEventEntries := [];
        
        // Rebuild phone mappings
        for ((principal, profile) in profiles.entries()) {
            phoneToPrincipal.put(profile.phone, principal);
        };
        
        // Initialize static data if profiles are less than 5
        if (profiles.size() < 5) {
            initializeStaticProfiles();
        };
    };

    // Set canister references
    public shared(_msg) func setCanisterReferences(
        reputation : ?Principal
    ) : async Result<Text> {
        // In real implementation, need to check if caller has admin rights
        reputationCanisterId := reputation;
        return #ok("Canister references set successfully");
    };

    // Public functions
    
    // Create a new user profile
    public shared(msg) func createProfile(
        name : Text,
        phone : Text,
        role : UserRole
    ) : async Result<Profile> {
        let caller = msg.caller;
        
        if (Principal.isAnonymous(caller)) {
            return #err("Anonymous principal not allowed");
        };
        
        // Validate input
        if (not validateName(name)) {
            return #err("Invalid name length. Must be between " # Nat.toText(MIN_NAME_LENGTH) # " and " # Nat.toText(MAX_NAME_LENGTH) # " characters");
        };
        
        // if (not validateEmail(email)) {
        //     return #err("Invalid email format");
        // };
        
        if (not validatePhone(phone)) {
            return #err("Invalid phone format");
        };

        // Check for duplicate email and phone
        // if (isEmailTaken(email, null)) {
        //     return #err("Email is already registered");
        // };

        if (isPhoneTaken(phone, null)) {
            return #err("Phone number is already registered");
        };
        
        switch (profiles.get(caller)) {
            case (?_existingProfile) {
                return #err("Profile already exists");
            };
            case (null) {
                let newProfile : Profile = {
                    id = caller;
                    name = name;
                    phone = phone;
                    role = role;
                    createdAt = Time.now();
                    updatedAt = Time.now();
                    isVerified = false;
                    profilePicture = null;
                    biography = null;
                    // New enhanced security fields
                    lastLogin = ?Time.now();
                    loginCount = 1;
                    isActive = true;
                    suspendedUntil = null;
                };
                
                profiles.put(caller, newProfile);
                verifiedUsers.put(caller, false);
                phoneToPrincipal.put(phone, caller);
                
                // Log security event for new registration
                logSecurityEvent(caller, #Login, ?("New profile created"));
                
                // Initialize reputation for new service providers
                if (role == #ServiceProvider) {
                    switch (reputationCanisterId) {
                        case (?repId) {
                            let reputationCanister = actor(Principal.toText(repId)) : actor {
                                initializeUserReputation : (Principal) -> async Result<Bool>;
                            };
                            ignore await reputationCanister.initializeUserReputation(caller);
                        };
                        case (null) {
                            // Reputation canister not set, continue without initializing reputation
                        };
                    };
                };
                
                return #ok(newProfile);
            };
        };
    };
    
    // Get profile by principal
    public query func getProfile(userId : Principal) : async Result<Profile> {
        switch (profiles.get(userId)) {
            case (?profile) {
                return #ok(profile);
            };
            case (null) {
                return #err("Profile not found");
            };
        };
    };
    
    // Get caller's profile
    public shared query(msg) func getMyProfile() : async Result<Profile> {
        let caller = msg.caller;
        
        if (Principal.isAnonymous(caller)) {
            return #err("Anonymous principal not allowed");
        };
        
        switch (profiles.get(caller)) {
            case (?profile) {
                return #ok(profile);
            };
            case (null) {
                return #err("Profile not found");
            };
        };
    };
    
    // Update user profile
    public shared(msg) func updateProfile(
        name : ?Text,
        email : ?Text,
        phone : ?Text
    ) : async Result<Profile> {
        let caller = msg.caller;
        
        if (Principal.isAnonymous(caller)) {
            return #err("Anonymous principal not allowed");
        };
        
        switch (profiles.get(caller)) {
            case (?existingProfile) {
                // Validate new values if provided
                switch(name) {
                    case(?n) {
                        if (not validateName(n)) {
                            return #err("Invalid name length. Must be between " # Nat.toText(MIN_NAME_LENGTH) # " and " # Nat.toText(MAX_NAME_LENGTH) # " characters");
                        };
                    };
                    case(null) {};
                };
                
                // switch(email) {
                //     case(?e) {
                //         if (not validateEmail(e)) {
                //             return #err("Invalid email format");
                //         };
                //         if (isEmailTaken(e, ?caller)) {
                //             return #err("Email is already registered");
                //         };
                //     };
                //     case(null) {};
                // };
                
                switch(phone) {
                    case(?p) {
                        if (not validatePhone(p)) {
                            return #err("Invalid phone format");
                        };
                        if (isPhoneTaken(p, ?caller)) {
                            return #err("Phone number is already registered");
                        };
                    };
                    case(null) {};
                };
                
                let updatedProfile : Profile = {
                    id = existingProfile.id;
                    name = Option.get(name, existingProfile.name);
                    phone = Option.get(phone, existingProfile.phone);
                    role = existingProfile.role;
                    createdAt = existingProfile.createdAt;
                    updatedAt = Time.now();
                    isVerified = existingProfile.isVerified;
                    profilePicture = existingProfile.profilePicture;
                    biography = existingProfile.biography;
                    // Preserve enhanced security fields
                    lastLogin = existingProfile.lastLogin;
                    loginCount = existingProfile.loginCount;
                    isActive = existingProfile.isActive;
                    suspendedUntil = existingProfile.suspendedUntil;
                };
                // removed email
                // Update email and phone mappings if changed
                // switch(email) {
                //     case(?e) {
                //         emailToPrincipal.delete(existingProfile.email);
                //         emailToPrincipal.put(e, caller);
                //     };
                //     case(null) {};
                // };

                switch(phone) {
                    case(?p) {
                        phoneToPrincipal.delete(existingProfile.phone);
                        phoneToPrincipal.put(p, caller);
                    };
                    case(null) {};
                };
                
                profiles.put(caller, updatedProfile);
                return #ok(updatedProfile);
            };
            case (null) {
                return #err("Profile not found");
            };
        };
    };
    
    // Verify a user's identity
    public shared(msg) func verifyUser(userId : Principal) : async Result<Bool> {
        let caller = msg.caller;
        
        if (Principal.isAnonymous(caller)) {
            return #err("Anonymous principal not allowed");
        };
        
        // Only allow self-verification or admin verification
        if (caller != userId) {
            // TODO: Add admin check here when admin functionality is implemented
            return #err("Unauthorized to verify other users");
        };
        
        switch (profiles.get(userId)) {
            case (?profile) {
                if (profile.isVerified) {
                    return #err("User is already verified");
                };
                
                // Update verification status
                let updatedProfile : Profile = {
                    id = profile.id;
                    name = profile.name;
                    phone = profile.phone;
                    role = profile.role;
                    createdAt = profile.createdAt;
                    updatedAt = Time.now();
                    isVerified = true;
                    profilePicture = profile.profilePicture;
                    biography = profile.biography;
                    // Preserve enhanced security fields
                    lastLogin = profile.lastLogin;
                    loginCount = profile.loginCount;
                    isActive = profile.isActive;
                    suspendedUntil = profile.suspendedUntil;
                };
                
                profiles.put(userId, updatedProfile);
                verifiedUsers.put(userId, true);
                return #ok(true);
            };
            case (null) {
                return #err("Profile not found");
            };
        };
    };
    
    // Get all service providers (for discovery)
    public query func getAllServiceProviders() : async [Profile] {
        let providersBuffer = Array.filter<Profile>(
            Iter.toArray(profiles.vals()),
            func (profile : Profile) : Bool {
                return profile.role == #ServiceProvider;
            }
        );
        
        return providersBuffer;
    };
    
    // NEW PROFILE SWITCHING FUNCTIONALITY
    
    // Switch user role with proper validation and logging
    public shared(msg) func switchRole(
        newRole : UserRole,
        reason : ?Text
    ) : async Result<Profile> {
        let caller = msg.caller;
        
        if (Principal.isAnonymous(caller)) {
            return #err("Anonymous principal not allowed");
        };
        
        switch (profiles.get(caller)) {
            case (?existingProfile) {
                // Check if role transition is valid
                let callerIsAdmin = isAdmin(caller);
                if (not isValidRoleTransition(existingProfile.role, newRole, callerIsAdmin)) {
                    return #err("Invalid role transition from " # debug_show(existingProfile.role) # " to " # debug_show(newRole));
                };
                
                // Check rate limiting
                if (not canSwitchRole(caller)) {
                    return #err("Too many role switches today. Maximum " # Nat.toText(MAX_ROLE_SWITCHES_PER_DAY) # " switches per day allowed");
                };
                
                // Update profile with new role
                let updatedProfile : Profile = {
                    id = existingProfile.id;
                    name = existingProfile.name;
                    phone = existingProfile.phone;
                    role = newRole;
                    createdAt = existingProfile.createdAt;
                    updatedAt = Time.now();
                    isVerified = existingProfile.isVerified;
                    profilePicture = existingProfile.profilePicture;
                    biography = existingProfile.biography;
                    lastLogin = existingProfile.lastLogin;
                    loginCount = existingProfile.loginCount;
                    isActive = existingProfile.isActive;
                    suspendedUntil = existingProfile.suspendedUntil;
                };
                
                profiles.put(caller, updatedProfile);
                
                // Log role change
                let changeId = generateId();
                let roleChange : RoleChangeRecord = {
                    id = changeId;
                    userId = caller;
                    previousRole = existingProfile.role;
                    newRole = newRole;
                    changedAt = Time.now();
                    reason = reason;
                    approvedBy = if (callerIsAdmin and caller != caller) ?caller else null;
                };
                roleChangeHistory.put(changeId, roleChange);
                
                // Update rate limiting tracker
                let now = Time.now();
                switch (dailyRoleSwitches.get(caller)) {
                    case (?switches) {
                        let newSwitches = Array.append<(Time.Time, UserRole)>(switches, [(now, newRole)]);
                        dailyRoleSwitches.put(caller, newSwitches);
                    };
                    case (null) {
                        dailyRoleSwitches.put(caller, [(now, newRole)]);
                    };
                };
                
                // Log security event
                logSecurityEvent(caller, #RoleSwitch, ?("Switched from " # debug_show(existingProfile.role) # " to " # debug_show(newRole)));
                
                // Initialize reputation in reputation canister if switching to ServiceProvider
                if (newRole == #ServiceProvider) {
                    switch (reputationCanisterId) {
                        case (?repId) {
                            let reputationCanister = actor(Principal.toText(repId)) : actor {
                                initializeUserReputation : (Principal) -> async Result<Bool>;
                            };
                            let _ = await reputationCanister.initializeUserReputation(caller);
                        };
                        case (null) {};
                    };
                };
                
                return #ok(updatedProfile);
            };
            case (null) {
                return #err("Profile not found");
            };
        };
    };
    
    // Get role change history for a user
    public query func getRoleHistory(userId : Principal) : async Result<[RoleChangeRecord]> {
        let userRoleChanges = Array.filter<RoleChangeRecord>(
            Iter.toArray(roleChangeHistory.vals()),
            func (change : RoleChangeRecord) : Bool {
                return change.userId == userId;
            }
        );
        
        // Sort by timestamp (most recent first)
        let sortedChanges = Array.sort<RoleChangeRecord>(
            userRoleChanges,
            func (a : RoleChangeRecord, b : RoleChangeRecord) : Order.Order {
                if (a.changedAt > b.changedAt) #less
                else if (a.changedAt < b.changedAt) #greater
                else #equal
            }
        );
        
        return #ok(sortedChanges);
    };
    
    // ENHANCED SECURITY FUNCTIONS
    
    // Suspend a user (admin only)
    public shared(msg) func suspendUser(
        userId : Principal,
        durationHours : Nat,
        reason : Text
    ) : async Result<Bool> {
        let caller = msg.caller;
        
        if (not isAdmin(caller)) {
            return #err("Only admins can suspend users");
        };
        
        switch (profiles.get(userId)) {
            case (?existingProfile) {
                let suspensionDuration = durationHours * 60 * 60 * 1_000_000_000; // Convert to nanoseconds
                let suspendedUntil = Time.now() + suspensionDuration;
                
                let updatedProfile : Profile = {
                    id = existingProfile.id;
                    name = existingProfile.name;
                    phone = existingProfile.phone;
                    role = existingProfile.role;
                    createdAt = existingProfile.createdAt;
                    updatedAt = Time.now();
                    isVerified = existingProfile.isVerified;
                    profilePicture = existingProfile.profilePicture;
                    biography = existingProfile.biography;
                    lastLogin = existingProfile.lastLogin;
                    loginCount = existingProfile.loginCount;
                    isActive = false;
                    suspendedUntil = ?suspendedUntil;
                };
                
                profiles.put(userId, updatedProfile);
                logSecurityEvent(userId, #Suspension, ?reason);
                
                return #ok(true);
            };
            case (null) {
                return #err("User not found");
            };
        };
    };
    
    // Reactivate a suspended user (admin only)
    public shared(msg) func reactivateUser(userId : Principal) : async Result<Bool> {
        let caller = msg.caller;
        
        if (not isAdmin(caller)) {
            return #err("Only admins can reactivate users");
        };
        
        switch (profiles.get(userId)) {
            case (?existingProfile) {
                let updatedProfile : Profile = {
                    id = existingProfile.id;
                    name = existingProfile.name;
                    phone = existingProfile.phone;
                    role = existingProfile.role;
                    createdAt = existingProfile.createdAt;
                    updatedAt = Time.now();
                    isVerified = existingProfile.isVerified;
                    profilePicture = existingProfile.profilePicture;
                    biography = existingProfile.biography;
                    lastLogin = existingProfile.lastLogin;
                    loginCount = existingProfile.loginCount;
                    isActive = true;
                    suspendedUntil = null;
                };
                
                profiles.put(userId, updatedProfile);
                logSecurityEvent(userId, #Reactivation, null);
                
                return #ok(true);
            };
            case (null) {
                return #err("User not found");
            };
        };
    };
    
    // Revoke user verification (admin only)
    public shared(msg) func revokeVerification(
        userId : Principal,
        reason : Text
    ) : async Result<Bool> {
        let caller = msg.caller;
        
        if (not isAdmin(caller)) {
            return #err("Only admins can revoke verification");
        };
        
        switch (profiles.get(userId)) {
            case (?existingProfile) {
                let updatedProfile : Profile = {
                    id = existingProfile.id;
                    name = existingProfile.name;
                    phone = existingProfile.phone;
                    role = existingProfile.role;
                    createdAt = existingProfile.createdAt;
                    updatedAt = Time.now();
                    isVerified = false;
                    profilePicture = existingProfile.profilePicture;
                    biography = existingProfile.biography;
                    lastLogin = existingProfile.lastLogin;
                    loginCount = existingProfile.loginCount;
                    isActive = existingProfile.isActive;
                    suspendedUntil = existingProfile.suspendedUntil;
                };
                
                profiles.put(userId, updatedProfile);
                verifiedUsers.put(userId, false);
                logSecurityEvent(userId, #VerificationChange, ?("Verification revoked: " # reason));
                
                return #ok(true);
            };
            case (null) {
                return #err("User not found");
            };
        };
    };
    
    // Get comprehensive profile statistics
    public query func getProfileStatistics() : async ProfileStatistics {
        var totalProfiles : Nat = 0;
        var activeProfiles : Nat = 0;
        var verifiedProfiles : Nat = 0;
        var suspendedProfiles : Nat = 0;
        var clientCount : Nat = 0;
        var serviceProviderCount : Nat = 0;
        var adminCount : Nat = 0;
        var recentRegistrations : Nat = 0;
        
        let now = Time.now();
        let thirtyDaysInNanoseconds = 30 * 24 * 60 * 60 * 1_000_000_000;
        
        for (profile in profiles.vals()) {
            totalProfiles += 1;
            
            if (profile.isActive) {
                activeProfiles += 1;
            };
            
            if (profile.isVerified) {
                verifiedProfiles += 1;
            };
            
            switch (profile.suspendedUntil) {
                case (?_) suspendedProfiles += 1;
                case (null) {};
            };
            
            switch (profile.role) {
                case (#Client) clientCount += 1;
                case (#ServiceProvider) serviceProviderCount += 1;
                case (#Admin) adminCount += 1;
            };
            
            if ((now - profile.createdAt) < thirtyDaysInNanoseconds) {
                recentRegistrations += 1;
            };
        };
        
        return {
            totalProfiles = totalProfiles;
            activeProfiles = activeProfiles;
            verifiedProfiles = verifiedProfiles;
            suspendedProfiles = suspendedProfiles;
            clientCount = clientCount;
            serviceProviderCount = serviceProviderCount;
            adminCount = adminCount;
            recentRegistrations = recentRegistrations;
        };
    };
    
    // Check if user account is in good standing
    public query func isAccountInGoodStanding(userId : Principal) : async Result<Bool> {
        switch (profiles.get(userId)) {
            case (?profile) {
                // Check if account is active
                if (not profile.isActive) {
                    return #ok(false);
                };
                
                // Check if account is suspended
                switch (profile.suspendedUntil) {
                    case (?suspensionTime) {
                        if (Time.now() < suspensionTime) {
                            return #ok(false);
                        };
                    };
                    case (null) {};
                };
                
                return #ok(true);
            };
            case (null) {
                return #err("Profile not found");
            };
        };
    };
}