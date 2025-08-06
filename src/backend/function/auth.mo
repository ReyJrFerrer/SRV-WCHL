import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Time "mo:base/Time";
import HashMap "mo:base/HashMap";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Char "mo:base/Char";
import Option "mo:base/Option";
import Types "../types/shared";
import StaticData "../utils/staticData";


persistent actor AuthCanister {
    // Type definitions
    type Profile = Types.Profile;
    type UserRole = Types.UserRole;
    type Result<T> = Types.Result<T>;
    type MediaItem = Types.MediaItem;
    type MediaType = Types.MediaType;

    // State variables
    private var profileEntries : [(Principal, Profile)] = [];
    private transient var profiles = HashMap.HashMap<Principal, Profile>(10, Principal.equal, Principal.hash);
    private transient var phoneToPrincipal = HashMap.HashMap<Text, Principal>(10, Text.equal, Text.hash);

    // Canister references
    private transient var reputationCanisterId : ?Principal = null;
    private transient var mediaCanisterId : ?Principal = null;

    // Initial data loading 

    // Constants
    private transient let MIN_NAME_LENGTH : Nat = 2;
    private transient let MAX_NAME_LENGTH : Nat = 50;
    private transient let MIN_PHONE_LENGTH : Nat = 10;
    private transient let MAX_PHONE_LENGTH : Nat = 15;

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
            phoneToPrincipal.put(profile.phone, principal);
        };
    };

    // Initialize static data if profiles are less than 5
    if (profiles.size() < 5) {
        initializeStaticProfiles();
    };
    // Initialization
    system func preupgrade() {
        profileEntries := Iter.toArray(profiles.entries());
    };

    system func postupgrade() {
        profiles := HashMap.fromIter<Principal, Profile>(profileEntries.vals(), 10, Principal.equal, Principal.hash);
        profileEntries := [];
        
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
        reputation : ?Principal,
        media : ?Principal
    ) : async Result<Text> {
        // In real implementation, need to check if caller has admin rights
        reputationCanisterId := reputation;
        mediaCanisterId := media;
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
        
        if (not validatePhone(phone)) {
            return #err("Invalid phone format");
        };


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
                    activeRole = role; // activeRole tracks user's preferred mode/UI
                    role = #ServiceProvider; // Everyone is a ServiceProvider by default
                    createdAt = Time.now();
                    updatedAt = Time.now();
                    profilePicture = null;
                    biography = null;
                };
                
                profiles.put(caller, newProfile);
                phoneToPrincipal.put(phone, caller);
                
                // Initialize reputation for new user
                switch (reputationCanisterId) {
                    case (?repId) {
                        let reputationCanister = actor(Principal.toText(repId)) : actor {
                            initializeReputation : (Principal, Time.Time) -> async Types.Result<Types.ReputationScore>;
                        };
                        ignore await reputationCanister.initializeReputation(caller, Time.now());
                    };
                    case (null) {
                        // Reputation canister not set, continue without initializing reputation
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
                    activeRole = existingProfile.activeRole; // Preserve activeRole during profile updates
                    createdAt = existingProfile.createdAt;
                    updatedAt = Time.now();
                    profilePicture = existingProfile.profilePicture;
                    biography = existingProfile.biography;
                };
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
    
    // Switch active user role between Client and ServiceProvider while preserving original role
    public shared(msg) func switchUserRole() : async Result<Profile> {
        let caller = msg.caller;
        
        if (Principal.isAnonymous(caller)) {
            return #err("Anonymous principal not allowed");
        };
        
        switch (profiles.get(caller)) {
            case (?existingProfile) {
                // Toggle between Client and ServiceProvider active roles
                let newActiveRole : UserRole = switch (existingProfile.activeRole) {
                    case (#Client) #ServiceProvider;
                    case (#ServiceProvider) #Client;
                };
                
                let updatedProfile : Profile = {
                    id = existingProfile.id;
                    name = existingProfile.name;
                    phone = existingProfile.phone;
                    role = existingProfile.role; // Preserve original role
                    activeRole = newActiveRole; // Only change the active role
                    createdAt = existingProfile.createdAt;
                    updatedAt = Time.now();
                    profilePicture = existingProfile.profilePicture;
                    biography = existingProfile.biography;
                };
                
                profiles.put(caller, updatedProfile);
                return #ok(updatedProfile);
            };
            case (null) {
                return #err("Profile not found");
            };
        };
    };
    
    // Get all service providers (for discovery) - everyone is a service provider
    public query func getAllServiceProviders() : async [Profile] {
        let providersBuffer = Array.filter<Profile>(
            Iter.toArray(profiles.vals()),
            func (profile : Profile) : Bool {
                return profile.role == #ServiceProvider; // Everyone is a ServiceProvider
            }
        );
        
        return providersBuffer;
    };

    // Upload profile picture
    public shared(msg) func uploadProfilePicture(
        fileName : Text,
        contentType : Text,
        fileData : Blob
    ) : async Result<Profile> {
        let caller = msg.caller;
        
        if (Principal.isAnonymous(caller)) {
            return #err("Anonymous principal not allowed");
        };

        // Check if user has a profile
        switch (profiles.get(caller)) {
            case (?existingProfile) {
                // Check if media canister is set
                switch (mediaCanisterId) {
                    case (?mediaId) {
                        // Create media canister actor
                        let mediaCanister = actor(Principal.toText(mediaId)) : actor {
                            uploadMedia : (Text, Text, MediaType, Blob) -> async Result<MediaItem>;
                        };
                        
                        // Upload to media canister
                        let uploadResult = await mediaCanister.uploadMedia(
                            fileName,
                            contentType,
                            #UserProfile,
                            fileData
                        );
                        
                        switch (uploadResult) {
                            case (#ok(mediaItem)) {
                        // Update profile with new image URL
                        let updatedProfile : Profile = {
                            id = existingProfile.id;
                            name = existingProfile.name;
                            phone = existingProfile.phone;
                            role = existingProfile.role;
                            activeRole = existingProfile.activeRole;
                            createdAt = existingProfile.createdAt;
                            updatedAt = Time.now();
                            profilePicture = ?{
                                imageUrl = mediaItem.url;
                                thumbnailUrl = mediaItem.url; // For now, use same URL
                            };
                            biography = existingProfile.biography;
                        };                                profiles.put(caller, updatedProfile);
                                return #ok(updatedProfile);
                            };
                            case (#err(error)) {
                                return #err("Failed to upload profile picture: " # error);
                            };
                        };
                    };
                    case (null) {
                        return #err("Media canister not configured");
                    };
                };
            };
            case (null) {
                return #err("Profile not found. Please create a profile first");
            };
        };
    };

    // Remove profile picture
    public shared(msg) func removeProfilePicture() : async Result<Profile> {
        let caller = msg.caller;
        
        if (Principal.isAnonymous(caller)) {
            return #err("Anonymous principal not allowed");
        };

        switch (profiles.get(caller)) {
            case (?existingProfile) {
            let updatedProfile : Profile = {
                id = existingProfile.id;
                name = existingProfile.name;
                phone = existingProfile.phone;
                role = existingProfile.role;
                activeRole = existingProfile.activeRole;
                createdAt = existingProfile.createdAt;
                updatedAt = Time.now();
                profilePicture = null;
                biography = existingProfile.biography;
            };                profiles.put(caller, updatedProfile);
                return #ok(updatedProfile);
            };
            case (null) {
                return #err("Profile not found");
            };
        };
    };
}