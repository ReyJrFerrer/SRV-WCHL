// TO FIX

import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Time "mo:base/Time";
import HashMap "mo:base/HashMap";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Int "mo:base/Int";
import Float "mo:base/Float";
import Option "mo:base/Option";
import Bool "mo:base/Bool";
import Result "mo:base/Result";
import Debug "mo:base/Debug";
import Hash "mo:base/Hash";

import Types "./types";

actor ReputationCanister {
    // Type definitions
    type ReputationScore = Types.ReputationScore;
    type TrustLevel = Types.TrustLevel;
    type DetectionFlag = Types.DetectionFlag;
    type Result<T> = Types.Result<T>;
    type Evidence = Types.Evidence;
    type Review = Types.Review;
    type Booking = Types.Booking;

    // State variables
    private stable var reputationEntries : [(Principal, ReputationScore)] = [];
    private var reputations = HashMap.HashMap<Principal, ReputationScore>(10, Principal.equal, Principal.hash);
    
    // Canister references
    private var authCanisterId : ?Principal = null;
    private var bookingCanisterId : ?Principal = null;
    private var reviewCanisterId : ?Principal = null;
    private var serviceCanisterId : ?Principal = null;

    // Constants for reputation calculation
    private let BASE_SCORE : Float = 50.0;
    private let MAX_BOOKING_POINTS : Float = 20.0;
    private let MAX_RATING_POINTS : Float = 20.0;
    private let MAX_AGE_POINTS : Float = 10.0;
    private let MIN_TRUST_SCORE : Float = 0.0;
    private let MAX_TRUST_SCORE : Float = 100.0;
    private let TRUST_LEVEL_THRESHOLDS : [(TrustLevel, Float)] = [
        (#Low, 20.0),
        (#Medium, 50.0),
        (#High, 80.0),
        (#VeryHigh, 100.0)
    ];

    // New constants for enhanced scoring
    private let RECENCY_WEIGHT : Float = 0.3;
    private let CONSISTENCY_BONUS : Float = 5.0;
    private let EVIDENCE_QUALITY_WEIGHT : Float = 0.2;
    private let REVIEW_SENTIMENT_WEIGHT : Float = 0.15;
    private let ACTIVITY_FREQUENCY_WEIGHT : Float = 0.1;

    // State variables for reputation history
    private stable var reputationHistoryEntries : [(Principal, [(Time.Time, Float)])] = [];
    private var reputationHistory = HashMap.HashMap<Principal, [(Time.Time, Float)]>(10, Principal.equal, Principal.hash);

    // Initialization
    system func preupgrade() {
        reputationEntries := Iter.toArray(reputations.entries());
    };

    system func postupgrade() {
        reputations := HashMap.fromIter<Principal, ReputationScore>(reputationEntries.vals(), 10, Principal.equal, Principal.hash);
        reputationEntries := [];
    };

    // Helper functions
    private func calculateTrustScore(
        completedBookings : Nat,
        averageRating : ?Float,
        accountAge : Time.Time,
        flags : [DetectionFlag]
    ) : Float {
        var score : Float = BASE_SCORE;
        
        // 1. Booking Activity Score (max 20 points)
        let bookingPoints = Float.min(MAX_BOOKING_POINTS, Float.fromInt(completedBookings));
        score += bookingPoints;
        
        // 2. Rating Quality Score (max 20 points)
        switch (averageRating) {
            case (null) {};
            case (?rating) {
                // Higher weight for ratings above 4.0
                if (rating >= 4.0) {
                    score += (rating - 1.0) * 6.0; // Maps 1-5 to 0-24
                } else {
                    score += (rating - 1.0) * 4.0; // Maps 1-5 to 0-16
                };
            };
        };
        
        // 3. Account Age Score (max 10 points)
        let ageInDays = Float.fromInt(Time.now() - accountAge) / (24.0 * 60.0 * 60.0 * 1_000_000_000.0);
        let agePoints = Float.min(MAX_AGE_POINTS, ageInDays / 36.5); // Max points after ~1 year
        score += agePoints;
        
        // 4. Activity Consistency Bonus (up to 5 points)
        if (completedBookings >= 5) {
            switch (averageRating) {
                case (?rating) {
                    if (rating >= 4.0) {
                        score += CONSISTENCY_BONUS; // Full bonus for consistent high ratings
                    } else if (rating >= 3.5) {
                        score += CONSISTENCY_BONUS * 0.6; // Partial bonus for good ratings
                    };
                };
                case (null) {};
            };
        };
        
        // 5. Recency Weight (up to 15 points)
        let recencyScore = calculateRecencyScore(completedBookings, accountAge);
        score += recencyScore * RECENCY_WEIGHT;
        
        // 6. Activity Frequency Score (up to 10 points)
        let frequencyScore = calculateActivityFrequency(completedBookings, accountAge);
        score += frequencyScore * ACTIVITY_FREQUENCY_WEIGHT;
        
        // 7. Penalties for Suspicious Activity
        var penaltyPoints : Float = 0.0;
        for (flag in flags.vals()) {
            switch (flag) {
                case (#ReviewBomb) { 
                    penaltyPoints += 15.0;
                    if (flags.size() > 1) {
                        penaltyPoints += 5.0;
                    };
                };
                case (#CompetitiveManipulation) { 
                    penaltyPoints += 15.0;
                    if (flags.size() > 1) {
                        penaltyPoints += 5.0;
                    };
                };
                case (#FakeEvidence) { 
                    penaltyPoints += 10.0;
                    if (flags.size() > 1) {
                        penaltyPoints += 3.0;
                    };
                };
                case (#IdentityFraud) { 
                    penaltyPoints += 15.0;
                    if (flags.size() > 1) {
                        penaltyPoints += 10.0;
                    };
                };
                case (#Other) { 
                    penaltyPoints += 5.0;
                };
            };
        };
        
        // Apply penalties with a cap
        score -= Float.min(penaltyPoints, score * 0.5);
        
        // 8. Minimum Activity Threshold
        if (completedBookings < 3 and ageInDays < 30.0) {
            score *= 0.8;
        };
        
        // Ensure final score is between 0 and 100
        return Float.max(MIN_TRUST_SCORE, Float.min(MAX_TRUST_SCORE, score));
    };

    // New helper functions for enhanced scoring
    private func calculateRecencyScore(completedBookings : Nat, accountAge : Time.Time) : Float {
        if (completedBookings == 0) return 0.0;
        
        let now = Time.now();
        let ageInDays = Float.fromInt(now - accountAge) / (24.0 * 60.0 * 60.0 * 1_000_000_000.0);
        
        // Higher score for recent activity
        if (ageInDays <= 30.0) { // Last 30 days
            return 15.0;
        } else if (ageInDays <= 90.0) { // Last 90 days
            return 10.0;
        } else if (ageInDays <= 180.0) { // Last 180 days
            return 5.0;
        };
        
        return 0.0;
    };

    private func calculateActivityFrequency(completedBookings : Nat, accountAge : Time.Time) : Float {
        if (completedBookings == 0) return 0.0;
        
        let ageInDays = Float.fromInt(Time.now() - accountAge) / (24.0 * 60.0 * 60.0 * 1_000_000_000.0);
        let bookingsPerMonth = Float.fromInt(completedBookings) / (ageInDays / 30.0);
        
        // Score based on booking frequency
        if (bookingsPerMonth >= 5.0) {
            return 10.0;
        } else if (bookingsPerMonth >= 3.0) {
            return 7.0;
        } else if (bookingsPerMonth >= 1.0) {
            return 4.0;
        };
        
        return 0.0;
    };

    // Enhanced review analysis
    private func analyzeReview(review : Review) : [DetectionFlag] {
        var flags : [DetectionFlag] = [];
        
        // 1. Check for review bombing
        if (review.rating <= 2) {
            flags := Array.append<DetectionFlag>(flags, [#ReviewBomb]);
        };
        
        // 2. Check for competitive manipulation
        if (review.rating == 5 and Text.size(review.comment) < 20) {
            flags := Array.append<DetectionFlag>(flags, [#CompetitiveManipulation]);
        };
        
        // 3. Check for sentiment consistency
        let sentimentScore = calculateSentimentScore(review);
        if (sentimentScore < 0.3 and review.rating >= 4) {
            flags := Array.append<DetectionFlag>(flags, [#Other]);
        };
        
        return flags;
    };

    private func calculateSentimentScore(review : Review) : Float {
        let comment = Text.toLowercase(review.comment);
        var positiveWords = 0;
        var negativeWords = 0;
        
        // Simple sentiment analysis based on keyword matching
        let positiveKeywords = ["excellent", "great", "good", "amazing", "wonderful", "perfect", "best", "love", "happy", "satisfied"];
        let negativeKeywords = ["bad", "poor", "terrible", "awful", "horrible", "worst", "hate", "disappointed", "unsatisfied", "waste"];
        
        for (word in positiveKeywords.vals()) {
            if (Text.contains(comment, #text word)) {
                positiveWords += 1;
            };
        };
        
        for (word in negativeKeywords.vals()) {
            if (Text.contains(comment, #text word)) {
                negativeWords += 1;
            };
        };
        
        let totalWords = positiveWords + negativeWords;
        if (totalWords == 0) return 0.5; // Neutral if no keywords found
        
        return Float.fromInt(positiveWords) / Float.fromInt(totalWords);
    };

    // Enhanced evidence quality evaluation
    // private func evaluateEvidenceQuality(evidence : Evidence) : Float {
    //     var qualityScore : Float = 0.75; // Base quality score
        
    //     // 1. Description length and quality
    //     if (Text.size(evidence.description) > 100) {
    //         qualityScore += 0.1;
    //     };
        
    //     // 2. File evidence
    //     if (evidence.fileUrls.size() > 0) {
    //         qualityScore += 0.1;
    //         // Bonus for multiple files
    //         if (evidence.fileUrls.size() > 1) {
    //             qualityScore += 0.05;
    //         };
    //     };
        
    //     // 3. Keyword analysis
    //     let description = Text.toLowercase(evidence.description);
    //     if (Text.contains(description, #text "proof") or 
    //         Text.contains(description, #text "evidence") or 
    //         Text.contains(description, #text "photo")) {
    //         qualityScore += 0.05;
    //     };
        
    //     // 4. Timeliness
    //     let ageInHours = Float.fromInt(Time.now() - evidence.createdAt) / (60.0 * 60.0 * 1_000_000_000.0);
    //     if (ageInHours <= 24.0) { // Within 24 hours
    //         qualityScore += 0.1;
    //     };
        
    //     return Float.min(1.0, qualityScore);
    // };

    // Enhanced reputation history tracking
    private func updateReputationHistory(userId : Principal, newScore : Float) {
        let now = Time.now();
        switch (reputationHistory.get(userId)) {
            case (?history) {
                let newHistory = Array.append([(now, newScore)], history);
                reputationHistory.put(userId, newHistory);
            };
            case (null) {
                reputationHistory.put(userId, [(now, newScore)]);
            };
        };
    };

    // Enhanced reputation update
    public func updateUserReputation(userId : Principal) : async Result<ReputationScore> {
        switch (reputations.get(userId)) {
            case (null) {
                return #err("User reputation not found");
            };
            case (?existingScore) {
                // Get completed bookings from booking canister
                let bookingCanister = actor(Principal.toText(Option.unwrap(bookingCanisterId))) : actor {
                    getProviderCompletedBookings : (Principal) -> async [Booking];
                };
                let completedBookings = await bookingCanister.getProviderCompletedBookings(userId);
                
                // Get ratings from review canister
                let reviewCanister = actor(Principal.toText(Option.unwrap(reviewCanisterId))) : actor {
                    calculateUserAverageRating : (Principal) -> async Result<Float>;
                };
                let averageRating = switch (await reviewCanister.calculateUserAverageRating(userId)) {
                    case (#ok(rating)) ?rating;
                    case (#err(_)) null;
                };
                
                // Get account age from auth canister
                let authCanister = actor(Principal.toText(Option.unwrap(authCanisterId))) : actor {
                    getProfile : (Principal) -> async Result<{ createdAt : Time.Time }>;
                };
                let accountAge = switch (await authCanister.getProfile(userId)) {
                    case (#ok(profile)) profile.createdAt;
                    case (#err(_)) existingScore.lastUpdated;
                };
                
                let newTrustScore = calculateTrustScore(
                    completedBookings.size(),
                    averageRating,
                    accountAge,
                    existingScore.detectionFlags
                );
                
                let newTrustLevel = determineTrustLevel(newTrustScore);
                
                let updatedScore : ReputationScore = {
                    userId = existingScore.userId;
                    trustScore = newTrustScore;
                    trustLevel = newTrustLevel;
                    completedBookings = completedBookings.size();
                    averageRating = averageRating;
                    detectionFlags = existingScore.detectionFlags;
                    lastUpdated = Time.now();
                };
                
                reputations.put(userId, updatedScore);
                updateReputationHistory(userId, newTrustScore);
                
                return #ok(updatedScore);
            };
        };
    };
    
    // Helper functions
    private func determineTrustLevel(trustScore : Float) : TrustLevel {
        for ((level, threshold) in TRUST_LEVEL_THRESHOLDS.vals()) {
            if (trustScore <= threshold) {
                return level;
            };
        };
        return #VeryHigh;
    };
    
    // Public functions
    
    // Initialize reputation for a new user
    public func initializeReputation(userId : Principal, creationTime : Time.Time) : async Result<ReputationScore> {
        switch (reputations.get(userId)) {
            case (?_) {
                return #err("Reputation already exists for this user");
            };
            case (null) {
                let newScore : ReputationScore = {
                    userId = userId;
                    trustScore = BASE_SCORE;
                    trustLevel = #New;
                    completedBookings = 0;
                    averageRating = null;
                    detectionFlags = [];
                    lastUpdated = Time.now();
                };
                
                reputations.put(userId, newScore);
                return #ok(newScore);
            };
        };
    };
    
    // Get reputation score for a user
    public query func getReputationScore(userId : Principal) : async Result<ReputationScore> {
        switch (reputations.get(userId)) {
            case (?score) {
                return #ok(score);
            };
            case (null) {
                return #err("No reputation score found for this user");
            };
        };
    };
    
    // Process a new review and update reputations
    public func processReview(review : Review) : async Result<Review> {
        // 1. Analyze review for flags
        let flags = analyzeReview(review);
        
        // 2. Calculate quality score (0.0 - 1.0)
        let qualityScore : Float = Float.max(0.0, Float.min(1.0, 1.0 - (Float.fromInt(flags.size()) * 0.25)));
        
        // 3. Determine if review should be hidden
        let shouldHide = qualityScore < 0.3 or flags.size() > 2;
        
        // 4. Update provider reputation
        ignore await updateUserReputation(review.providerId);
        
        // 5. Update client reputation (reviewer)
        ignore await updateUserReputation(review.clientId);
        
        // 6. Return updated review with status and quality score
        let updatedReview : Review = {
            id = review.id;
            bookingId = review.bookingId;
            clientId = review.clientId;
            providerId = review.providerId;
            serviceId = review.serviceId;
            rating = review.rating;
            comment = review.comment;
            status = if (shouldHide) { #Hidden } else if (flags.size() > 0) { #Flagged } else { #Visible };
            qualityScore = ?qualityScore;
            createdAt = review.createdAt;
            updatedAt = Time.now();
        };
        
        return #ok(updatedReview);
    };
    
    // Process evidence submission
    // public func processEvidence(evidence : Evidence) : async Result<Evidence> {
    //     // 1. Evaluate evidence quality
    //     let qualityScore = evaluateEvidenceQuality(evidence);
        
    //     // 2. Update evidence with quality score
    //     let updatedEvidence : Evidence = {
    //         id = evidence.id;
    //         bookingId = evidence.bookingId;
    //         submitterId = evidence.submitterId;
    //         description = evidence.description;
    //         fileUrls = evidence.fileUrls;
    //         qualityScore = ?qualityScore;
    //         createdAt = evidence.createdAt;
    //     };
        
    //     // 3. Update submitter reputation
    //     ignore await updateUserReputation(evidence.submitterId);
        
    //     return #ok(updatedEvidence);
    // };
    
    // Set canister references (admin function)
    public shared(msg) func setCanisterReferences(
        auth : Principal,
        booking : Principal,
        review : Principal,
        service : Principal
    ) : async Result<Text> {
        // In real implementation, need to check if caller has admin rights
        authCanisterId := ?auth;
        bookingCanisterId := ?booking;
        reviewCanisterId := ?review;
        serviceCanisterId := ?service;
        
        return #ok("Canister references set successfully");
    };
    
    // Get reputation statistics
    public query func getReputationStatistics() : async {
        totalUsers : Nat;
        averageTrustScore : Float;
        trustLevelDistribution : [(TrustLevel, Nat)];
    } {
        var total : Nat = 0;
        var totalScore : Float = 0.0;
        var newCount : Nat = 0;
        var lowCount : Nat = 0;
        var mediumCount : Nat = 0;
        var highCount : Nat = 0;
        var veryHighCount : Nat = 0;
        
        for (score in reputations.vals()) {
            total += 1;
            totalScore += score.trustScore;
            
            switch (score.trustLevel) {
                case (#New) { newCount += 1 };
                case (#Low) { lowCount += 1 };
                case (#Medium) { mediumCount += 1 };
                case (#High) { highCount += 1 };
                case (#VeryHigh) { veryHighCount += 1 };
            };
        };
        
        let averageScore = if (total > 0) { totalScore / Float.fromInt(total) } else { 0.0 };
        
        let distribution : [(TrustLevel, Nat)] = [
            (#New, newCount),
            (#Low, lowCount),
            (#Medium, mediumCount),
            (#High, highCount),
            (#VeryHigh, veryHighCount)
        ];
        
        return {
            totalUsers = total;
            averageTrustScore = averageScore;
            trustLevelDistribution = distribution;
        };
    };
}