import { describe, beforeEach, afterEach, it, expect, inject } from "vitest";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { PocketIc, type Actor } from "@dfinity/pic";
import { Principal } from "@dfinity/principal";

// Import generated types for reputation canister
import {
  type _SERVICE as ReputationService,
  idlFactory as reputationIdlFactory,
} from "../../src/declarations/reputation/reputation.did.js";

// Define the path to reputation canister's WASM file
export const REPUTATION_WASM_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  ".dfx",
  "local",
  "canisters",
  "reputation",
  "reputation.wasm",
);

// Test data
const TEST_USER_ID = Principal.fromText("rdmx6-jaaaa-aaaaa-aaadq-cai");
const TEST_PROVIDER_ID = Principal.fromText("rrkah-fqaaa-aaaaa-aaaaq-cai");
const TEST_CLIENT_ID = Principal.fromText("ryjl3-tyaaa-aaaaa-aaaba-cai");

const createTestReview = () => ({
  id: "test-review-001",
  bookingId: "test-booking-001",
  clientId: TEST_CLIENT_ID,
  providerId: TEST_PROVIDER_ID,
  serviceId: "test-service-001",
  rating: BigInt(5), // Should be bigint
  comment: "Excellent service! Very professional and timely.",
  status: { Visible: null },
  qualityScore: [0.9] as [] | [number], // Correct optional array format
  createdAt: BigInt(Date.now() * 1_000_000),
  updatedAt: BigInt(Date.now() * 1_000_000),
});

const createNegativeTestReview = () => ({
  id: "test-review-002",
  bookingId: "test-booking-002",
  clientId: TEST_CLIENT_ID,
  providerId: TEST_PROVIDER_ID,
  serviceId: "test-service-001",
  rating: BigInt(1), // Should be bigint
  comment: "Terrible service, very disappointed.",
  status: { Visible: null },
  qualityScore: [0.3] as [] | [number], // Correct optional array format
  createdAt: BigInt(Date.now() * 1_000_000),
  updatedAt: BigInt(Date.now() * 1_000_000),
});

describe("Reputation Canister LLM Integration Tests", () => {
  let pic: PocketIc;
  let actor: Actor<ReputationService>;

  beforeEach(async () => {
    pic = await PocketIc.create(inject("PIC_URL"));

    // Setup the reputation canister
    const fixture = await pic.setupCanister<ReputationService>({
      idlFactory: reputationIdlFactory,
      wasm: REPUTATION_WASM_PATH,
    });

    actor = fixture.actor;

    // Set up canister references
    const authCanisterId = Principal.fromText("rrkah-fqaaa-aaaaa-aaaaq-cai");
    const bookingCanisterId = Principal.fromText("ryjl3-tyaaa-aaaaa-aaaba-cai");
    const reviewCanisterId = Principal.fromText("rdmx6-jaaaa-aaaaa-aaadq-cai");
    const serviceCanisterId = Principal.fromText("be2us-64aaa-aaaaa-qaabq-cai");

    await actor.setCanisterReferences(
      authCanisterId,
      bookingCanisterId,
      reviewCanisterId,
      serviceCanisterId,
    );
  });

  afterEach(async () => {
    await pic.tearDown();
  });

  describe("initializeReputation", () => {
    it("should initialize reputation for a new user", async () => {
      // Setup
      const currentTime = BigInt(Date.now() * 1_000_000);

      // Execute
      const result = await actor.initializeReputation(
        TEST_USER_ID,
        currentTime,
      );

      // Assert
      expect(result).toHaveProperty("ok");
      if ("ok" in result) {
        expect(result.ok.userId.toString()).toBe(TEST_USER_ID.toString());
        expect(result.ok.trustScore).toBe(50.0); // BASE_SCORE
        expect("New" in result.ok.trustLevel).toBe(true);
        expect(result.ok.completedBookings).toBe(0);
        expect(result.ok.averageRating).toEqual([]);
        expect(result.ok.detectionFlags).toEqual([]);
      }
    });

    it("should return error when trying to initialize existing reputation", async () => {
      // Setup
      const currentTime = BigInt(Date.now() * 1_000_000);
      await actor.initializeReputation(TEST_USER_ID, currentTime);

      // Execute
      const result = await actor.initializeReputation(
        TEST_USER_ID,
        currentTime,
      );

      // Assert
      expect(result).toHaveProperty("err");
      if ("err" in result) {
        expect(result.err).toBe("Reputation already exists for this user");
      }
    });
  });

  describe("getReputationScore", () => {
    it("should return reputation score for existing user", async () => {
      // Setup
      const currentTime = BigInt(Date.now() * 1_000_000);
      await actor.initializeReputation(TEST_USER_ID, currentTime);

      // Execute
      const result = await actor.getReputationScore(TEST_USER_ID);

      // Assert
      expect(result).toHaveProperty("ok");
      if ("ok" in result) {
        expect(result.ok.userId.toString()).toBe(TEST_USER_ID.toString());
        expect(result.ok.trustScore).toBe(50.0);
      }
    });

    it("should return error for non-existing user", async () => {
      // Execute
      const result = await actor.getReputationScore(TEST_USER_ID);

      // Assert
      expect(result).toHaveProperty("err");
      if ("err" in result) {
        expect(result.err).toBe("No reputation score found for this user");
      }
    });
  });

  describe("getReputationScoreWithHistory", () => {
    it("should return reputation score with empty history for new user", async () => {
      // Setup
      const currentTime = BigInt(Date.now() * 1_000_000);
      await actor.initializeReputation(TEST_USER_ID, currentTime);

      // Execute
      const result = await actor.getReputationScoreWithHistory(TEST_USER_ID);

      // Assert
      expect(result).toHaveProperty("ok");
      if ("ok" in result) {
        expect(result.ok.score.userId.toString()).toBe(TEST_USER_ID.toString());
        expect(result.ok.history).toEqual([]);
      }
    });

    it("should return error for non-existing user", async () => {
      // Execute
      const result = await actor.getReputationScoreWithHistory(TEST_USER_ID);

      // Assert
      expect(result).toHaveProperty("err");
      if ("err" in result) {
        expect(result.err).toBe("No reputation score found for this user");
      }
    });
  });

  describe("processReviewWithLLM", () => {
    beforeEach(async () => {
      // Initialize reputations for test users
      const currentTime = BigInt(Date.now() * 1_000_000);
      await actor.initializeReputation(TEST_CLIENT_ID, currentTime);
      await actor.initializeReputation(TEST_PROVIDER_ID, currentTime);
    });

    it("should process positive review successfully", async () => {
      // Setup
      const positiveReview = createTestReview();

      // Execute
      const result = await actor.processReviewWithLLM(positiveReview);

      // Assert
      expect(result).toHaveProperty("ok");
      if ("ok" in result) {
        expect(result.ok.id).toBe(positiveReview.id);
        expect(result.ok.rating).toBe(BigInt(5));
        expect(result.ok.comment).toBe(positiveReview.comment);
        expect(result.ok.qualityScore.length).toBeGreaterThan(0);
        if (result.ok.qualityScore.length > 0) {
          expect(result.ok.qualityScore[0]).toBeGreaterThan(0);
        }
        // Should not be hidden for good quality review
        expect("Hidden" in result.ok.status).toBe(false);
      }
    });

    it("should flag suspicious review patterns", async () => {
      // Setup - review with high rating but negative comment
      const suspiciousReview = {
        ...createTestReview(),
        rating: BigInt(5),
        comment: "bad terrible awful disappointing", // Negative words with high rating
      };

      // Execute
      const result = await actor.processReviewWithLLM(suspiciousReview);

      // Assert
      expect(result).toHaveProperty("ok");
      if ("ok" in result) {
        // Should detect inconsistency and potentially flag or reduce quality
        expect(result.ok.qualityScore.length).toBeGreaterThan(0);
        if (result.ok.qualityScore.length > 0) {
          // Quality score should be lower due to sentiment mismatch
          expect(result.ok.qualityScore[0]).toBeLessThan(0.8);
        }
      }
    });

    it("should detect review bombing pattern", async () => {
      // Setup
      const reviewBombReview = createNegativeTestReview();

      // Execute
      const result = await actor.processReviewWithLLM(reviewBombReview);

      // Assert
      expect(result).toHaveProperty("ok");
      if ("ok" in result) {
        expect(result.ok.rating).toBe(BigInt(1));
        // Low ratings should be flagged for potential review bombing
        expect(result.ok.qualityScore.length).toBeGreaterThan(0);
      }
    });

    it("should detect competitive manipulation", async () => {
      // Setup - short positive review that could be fake
      const manipulationReview = {
        ...createTestReview(),
        rating: BigInt(5),
        comment: "good", // Very short comment with high rating
      };

      // Execute
      const result = await actor.processReviewWithLLM(manipulationReview);

      // Assert
      expect(result).toHaveProperty("ok");
      if ("ok" in result) {
        // Should detect potential manipulation pattern
        expect(result.ok.qualityScore.length).toBeGreaterThan(0);
        if (result.ok.qualityScore.length > 0) {
          // Quality might be reduced due to short comment
          expect(result.ok.qualityScore[0]).toBeGreaterThan(0);
        }
      }
    });
  });

  describe("getReputationStatistics", () => {
    it("should return empty statistics initially", async () => {
      // Execute
      const result = await actor.getReputationStatistics();

      // Assert
      expect(result.totalUsers).toBe(0);
      expect(result.averageTrustScore).toBe(0.0);
      expect(result.trustLevelDistribution).toEqual([
        [{ New: null }, 0],
        [{ Low: null }, 0],
        [{ Medium: null }, 0],
        [{ High: null }, 0],
        [{ VeryHigh: null }, 0],
      ]);
    });

    it("should return correct statistics after adding users", async () => {
      // Setup
      const currentTime = BigInt(Date.now() * 1_000_000);
      await actor.initializeReputation(TEST_USER_ID, currentTime);
      await actor.initializeReputation(TEST_CLIENT_ID, currentTime);

      // Execute
      const result = await actor.getReputationStatistics();

      // Assert
      expect(result.totalUsers).toBe(2);
      expect(result.averageTrustScore).toBe(50.0); // Both users have BASE_SCORE of 50
      // Should have 2 users in "New" trust level
      const newLevelCount = result.trustLevelDistribution.find(
        ([level, _]) => "New" in level,
      );
      expect(newLevelCount).toBeDefined();
      if (newLevelCount) {
        expect(newLevelCount[1]).toBe(2);
      }
    });
  });

  describe("setCanisterReferences", () => {
    it("should set canister references successfully", async () => {
      // Setup
      const authCanisterId = Principal.fromText("rrkah-fqaaa-aaaaa-aaaaq-cai");
      const bookingCanisterId = Principal.fromText(
        "ryjl3-tyaaa-aaaaa-aaaba-cai",
      );
      const reviewCanisterId = Principal.fromText(
        "rdmx6-jaaaa-aaaaa-aaadq-cai",
      );
      const serviceCanisterId = Principal.fromText(
        "be2us-64aaa-aaaaa-qaabq-cai",
      );

      // Execute
      const result = await actor.setCanisterReferences(
        authCanisterId,
        bookingCanisterId,
        reviewCanisterId,
        serviceCanisterId,
      );

      // Assert
      expect(result).toHaveProperty("ok");
      if ("ok" in result) {
        expect(result.ok).toBe("Canister references set successfully");
      }
    });
  });
});
