import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Time "mo:base/Time";
import HashMap "mo:base/HashMap";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Int "mo:base/Int";
import Blob "mo:base/Blob";
import Buffer "mo:base/Buffer";
import Option "mo:base/Option";
import Types "../types/shared";

actor MediaCanister {
    // Type definitions
    type MediaItem = Types.MediaItem;
    type MediaType = Types.MediaType;
    type MediaUploadRequest = Types.MediaUploadRequest;
    type Result<T> = Types.Result<T>;
    type HttpRequest = Types.HttpRequest;
    type HttpResponse = Types.HttpResponse;
    type HeaderField = Types.HeaderField;

    // State variables
    private stable var mediaEntries : [(Text, MediaItem)] = [];
    private stable var fileDataEntries : [(Text, Blob)] = [];
    private stable var mediaItems = HashMap.HashMap<Text, MediaItem>(10, Text.equal, Text.hash);
    private transient var fileDataStore = HashMap.HashMap<Text, Blob>(10, Text.equal, Text.hash);
    private transient var userMediaIndex = HashMap.HashMap<Principal, [Text]>(10, Principal.equal, Principal.hash);

    // Constants
    private transient let MAX_FILE_SIZE : Nat = 450_000; // 450KB in bytes
    private transient let SUPPORTED_CONTENT_TYPES : [Text] = [
        "image/jpeg",
        "image/jpg", 
        "image/png",
        "image/gif",
        "image/webp",
        "image/bmp",
        "image/svg+xml"
    ];

    // Helper functions
    private func generateId() : Text {
        let now = Int.abs(Time.now());
        let random = Int.abs(Time.now()) % 10000;
        return Int.toText(now) # "-" # Int.toText(random);
    };

    private func validateContentType(contentType : Text) : Bool {
        Array.find<Text>(SUPPORTED_CONTENT_TYPES, func(supportedType : Text) : Bool {
            supportedType == contentType
        }) != null
    };

    private func validateFileSize(fileSize : Nat) : Bool {
        fileSize > 0 and fileSize <= MAX_FILE_SIZE
    };

    private func generateFilePath(ownerId : Principal, mediaType : MediaType, fileName : Text) : Text {
        let ownerText = Principal.toText(ownerId);
        let mediaTypeText = switch (mediaType) {
            case (#UserProfile) "users";
            case (#ServiceImage) "services";
        };
        mediaTypeText # "/" # ownerText # "/" # fileName
    };

    private func generateUrl(mediaId : Text) : Text {
        // Generate HTTP URL that can be served by the canister
        "/media/" # mediaId
    };

    private func addToUserIndex(userId : Principal, mediaId : Text) {
        switch (userMediaIndex.get(userId)) {
            case (?existingIds) {
                let buffer = Buffer.Buffer<Text>(existingIds.size() + 1);
                for (id in existingIds.vals()) {
                    buffer.add(id);
                };
                buffer.add(mediaId);
                userMediaIndex.put(userId, Buffer.toArray(buffer));
            };
            case (null) {
                userMediaIndex.put(userId, [mediaId]);
            };
        };
    };

    private func removeFromUserIndex(userId : Principal, mediaId : Text) {
        switch (userMediaIndex.get(userId)) {
            case (?existingIds) {
                let filteredIds = Array.filter<Text>(existingIds, func(id : Text) : Bool {
                    id != mediaId
                });
                userMediaIndex.put(userId, filteredIds);
            };
            case (null) {};
        };
    };

    // Initialization
    system func preupgrade() {
        mediaEntries := Iter.toArray(mediaItems.entries());
        fileDataEntries := Iter.toArray(fileDataStore.entries());
    };

    system func postupgrade() {
        mediaItems := HashMap.fromIter<Text, MediaItem>(mediaEntries.vals(), 10, Text.equal, Text.hash);
        fileDataStore := HashMap.fromIter<Text, Blob>(fileDataEntries.vals(), 10, Text.equal, Text.hash);
        mediaEntries := [];
        fileDataEntries := [];
        
        // Rebuild user index
        for ((mediaId, mediaItem) in mediaItems.entries()) {
            addToUserIndex(mediaItem.ownerId, mediaId);
        };
    };

    // Public functions

    // Upload a media file
    public shared(msg) func uploadMedia(
        fileName : Text,
        contentType : Text,
        mediaType : MediaType,
        fileData : Blob
    ) : async Result<MediaItem> {
        let caller = msg.caller;
        
        if (Principal.isAnonymous(caller)) {
            return #err("Anonymous principal not allowed");
        };

        // Validate file size
        let fileSize = fileData.size();
        if (not validateFileSize(fileSize)) {
            return #err("File size must be between 1 byte and " # Nat.toText(MAX_FILE_SIZE) # " bytes (450KB)");
        };

        // Validate content type
        if (not validateContentType(contentType)) {
            return #err("Unsupported file type. Supported types: " # Text.join(", ", SUPPORTED_CONTENT_TYPES.vals()));
        };

        // Validate file name
        if (fileName.size() == 0 or fileName.size() > 255) {
            return #err("File name must be between 1 and 255 characters");
        };

        let mediaId = generateId();
        let filePath = generateFilePath(caller, mediaType, fileName);
        let url = "/media/" # mediaId; // Use media ID for HTTP URL
        
        let newMediaItem : MediaItem = {
            id = mediaId;
            ownerId = caller;
            fileName = fileName;
            fileSize = fileSize;
            contentType = contentType;
            mediaType = mediaType;
            filePath = filePath;
            url = url;
            thumbnailUrl = null; // We'll implement thumbnail generation later
            createdAt = Time.now();
            updatedAt = Time.now();
        };

        mediaItems.put(mediaId, newMediaItem);
        fileDataStore.put(mediaId, fileData); // Store the actual file data
        addToUserIndex(caller, mediaId);

        return #ok(newMediaItem);
    };

    // Get media item by ID
    public query func getMediaItem(mediaId : Text) : async Result<MediaItem> {
        switch (mediaItems.get(mediaId)) {
            case (?item) {
                return #ok(item);
            };
            case (null) {
                return #err("Media item not found");
            };
        };
    };

    // Get file data by media ID
    public query func getFileData(mediaId : Text) : async Result<Blob> {
        switch (fileDataStore.get(mediaId)) {
            case (?fileData) {
                return #ok(fileData);
            };
            case (null) {
                return #err("File data not found");
            };
        };
    };

    // Get media items by owner
    public query func getMediaByOwner(ownerId : Principal) : async [MediaItem] {
        switch (userMediaIndex.get(ownerId)) {
            case (?mediaIds) {
                let items = Buffer.Buffer<MediaItem>(mediaIds.size());
                for (mediaId in mediaIds.vals()) {
                    switch (mediaItems.get(mediaId)) {
                        case (?item) {
                            items.add(item);
                        };
                        case (null) {
                            // Media item was deleted but index wasn't updated
                        };
                    };
                };
                Buffer.toArray(items)
            };
            case (null) {
                []
            };
        };
    };

    // Get media items by type and owner
    public query func getMediaByTypeAndOwner(ownerId : Principal, mediaType : MediaType) : async [MediaItem] {
        switch (userMediaIndex.get(ownerId)) {
            case (?mediaIds) {
                let items = Buffer.Buffer<MediaItem>(mediaIds.size());
                for (mediaId in mediaIds.vals()) {
                    switch (mediaItems.get(mediaId)) {
                        case (?item) {
                            if (item.mediaType == mediaType) {
                                items.add(item);
                            };
                        };
                        case (null) {
                            // Media item was deleted but index wasn't updated
                        };
                    };
                };
                Buffer.toArray(items)
            };
            case (null) {
                []
            };
        }
    };

    // Delete media item
    public shared(msg) func deleteMedia(mediaId : Text) : async Result<Text> {
        let caller = msg.caller;
        
        if (Principal.isAnonymous(caller)) {
            return #err("Anonymous principal not allowed");
        };

        switch (mediaItems.get(mediaId)) {
            case (?item) {
                if (item.ownerId != caller) {
                    return #err("Not authorized to delete this media item");
                };
                
                mediaItems.delete(mediaId);
                fileDataStore.delete(mediaId); // Also delete the file data
                removeFromUserIndex(caller, mediaId);
                
                return #ok("Media item deleted successfully");
            };
            case (null) {
                return #err("Media item not found");
            };
        };
    };

    // Update media metadata (filename only for now)
    public shared(msg) func updateMediaMetadata(
        mediaId : Text,
        fileName : ?Text
    ) : async Result<MediaItem> {
        let caller = msg.caller;
        
        if (Principal.isAnonymous(caller)) {
            return #err("Anonymous principal not allowed");
        };

        switch (mediaItems.get(mediaId)) {
            case (?existingItem) {
                if (existingItem.ownerId != caller) {
                    return #err("Not authorized to update this media item");
                };

                let updatedFileName = switch (fileName) {
                    case (?name) {
                        if (name.size() == 0 or name.size() > 255) {
                            return #err("File name must be between 1 and 255 characters");
                        };
                        name
                    };
                    case (null) existingItem.fileName;
                };

                let updatedItem : MediaItem = {
                    id = existingItem.id;
                    ownerId = existingItem.ownerId;
                    fileName = updatedFileName;
                    fileSize = existingItem.fileSize;
                    contentType = existingItem.contentType;
                    mediaType = existingItem.mediaType;
                    filePath = existingItem.filePath;
                    url = existingItem.url;
                    thumbnailUrl = existingItem.thumbnailUrl;
                    createdAt = existingItem.createdAt;
                    updatedAt = Time.now();
                };

                mediaItems.put(mediaId, updatedItem);
                return #ok(updatedItem);
            };
            case (null) {
                return #err("Media item not found");
            };
        };
    };

    // Get storage statistics
    public query func getStorageStats() : async {
        totalItems: Nat;
        totalSize: Nat;
        userCount: Nat;
        typeBreakdown: [(MediaType, Nat)];
    } {
        let allItems = Iter.toArray(mediaItems.vals());
        let totalSize = Array.foldLeft<MediaItem, Nat>(allItems, 0, func(acc : Nat, item : MediaItem) : Nat {
            acc + item.fileSize
        });
        
        var userProfileCount : Nat = 0;
        var serviceImageCount : Nat = 0;
        
        for (item in allItems.vals()) {
            switch (item.mediaType) {
                case (#UserProfile) userProfileCount += 1;
                case (#ServiceImage) serviceImageCount += 1;
            };
        };

        {
            totalItems = allItems.size();
            totalSize = totalSize;
            userCount = userMediaIndex.size();
            typeBreakdown = [
                (#UserProfile, userProfileCount),
                (#ServiceImage, serviceImageCount)
            ];
        }
    };

    // HTTP interface for serving images
    public query func http_request(request : HttpRequest) : async HttpResponse {
        let { method; url; headers; body } = request;

        // Add CORS headers for all responses
        let corsHeaders : [HeaderField] = [
            ("Access-Control-Allow-Origin", "*"),
            ("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS"),
            ("Access-Control-Allow-Headers", "Content-Type"),
        ];

        // Handle OPTIONS request for CORS preflight
        if (method == "OPTIONS") {
            return {
                status_code = 200;
                headers = corsHeaders;
                body = Text.encodeUtf8("");
            };
        };

        // Only allow GET and HEAD methods
        if (method != "GET" and method != "HEAD") {
            return {
                status_code = 405;
                headers = Array.append(corsHeaders, [("Content-Type", "text/plain")]);
                body = Text.encodeUtf8("Method not allowed");
            };
        };

        // Parse URL to extract media ID
        // Expected format: /media/{mediaId}
        let urlParts = Text.split(url, #char '/');
        let partsArray = Iter.toArray(urlParts);
        
        if (partsArray.size() != 3 or partsArray[0] != "" or partsArray[1] != "media") {
            return {
                status_code = 400;
                headers = Array.append(corsHeaders, [("Content-Type", "text/plain")]);
                body = Text.encodeUtf8("Invalid URL format. Expected: /media/{mediaId}");
            };
        };

        let mediaId = partsArray[2];

        // Get media item and file data
        switch (mediaItems.get(mediaId), fileDataStore.get(mediaId)) {
            case (?mediaItem, ?fileData) {
                let cacheHeaders = [
                    ("Content-Type", mediaItem.contentType),
                    ("Cache-Control", "public, max-age=31536000"), // 1 year cache
                    ("Content-Length", Nat.toText(mediaItem.fileSize)),
                ];
                
                let responseHeaders = Array.append(corsHeaders, cacheHeaders);

                if (method == "HEAD") {
                    // For HEAD requests, return headers only
                    return {
                        status_code = 200;
                        headers = responseHeaders;
                        body = Text.encodeUtf8("");
                    };
                } else {
                    // For GET requests, return the file data
                    return {
                        status_code = 200;
                        headers = responseHeaders;
                        body = fileData;
                    };
                };
            };
            case (_, _) {
                return {
                    status_code = 404;
                    headers = Array.append(corsHeaders, [("Content-Type", "text/plain")]);
                    body = Text.encodeUtf8("Media not found");
                };
            };
        };
    };
}
