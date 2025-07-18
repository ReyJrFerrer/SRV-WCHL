// utils/canisterStartup.ts
import authCanisterService from "../services/authCanisterService";
import serviceCanisterService from "../services/serviceCanisterService";
import reviewCanisterService from "../services/reviewCanisterService";
import bookingCanisterService from "../services/bookingCanisterService";
import reputationCanisterService from "../services/reputationCanisterService";

let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

/**
 * Initialize canister network by setting up inter-canister references
 * This should be called once at application startup
 */
export const initializeCanisterNetwork = async (): Promise<void> => {
  if (isInitialized) {
    console.log("🔄 Canisters already initialized");
    return;
  }

  if (initializationPromise) {
    console.log("🔄 Initialization already in progress, waiting...");
    return initializationPromise;
  }

  initializationPromise = performInitialization();
  return initializationPromise;
};

async function performInitialization(): Promise<void> {
  console.log("🚀 Initializing canister network...");

  try {
    const config = {
      authCanisterId: process.env.NEXT_PUBLIC_AUTH_CANISTER_ID!,
      bookingCanisterId: process.env.NEXT_PUBLIC_BOOKING_CANISTER_ID!,
      serviceCanisterId: process.env.NEXT_PUBLIC_SERVICE_CANISTER_ID!,
      reviewCanisterId: process.env.NEXT_PUBLIC_REVIEW_CANISTER_ID!,
      reputationCanisterId: process.env.NEXT_PUBLIC_REPUTATION_CANISTER_ID!,
    };

    // Validate required environment variables
    if (
      !config.authCanisterId ||
      !config.bookingCanisterId ||
      !config.serviceCanisterId ||
      !config.reviewCanisterId ||
      !config.reputationCanisterId
    ) {
      throw new Error("Missing required canister IDs in environment variables");
    }

    // Set canister references in parallel
    await Promise.all([
      reviewCanisterService.setCanisterReferences(
        config.bookingCanisterId,
        config.serviceCanisterId,
        config.reputationCanisterId,
        config.authCanisterId,
      ),
      serviceCanisterService.setCanisterReferences(
        config.authCanisterId,
        config.bookingCanisterId,
        config.reviewCanisterId,
        config.reputationCanisterId,
      ),
      authCanisterService.setCanisterReferences(config.reputationCanisterId),
      bookingCanisterService.setCanisterReferences(
        config.authCanisterId,
        config.serviceCanisterId,
        config.reviewCanisterId,
        config.reputationCanisterId,
      ),
      reputationCanisterService.setCanisterReferences(
        config.authCanisterId,
        config.bookingCanisterId,
        config.reviewCanisterId,
        config.serviceCanisterId,
      ),
    ]);

    // Test if initialization worked by making a simple call
    await Promise.all([
      authCanisterService.getAllServiceProviders(),
      serviceCanisterService.getAllCategories(),
    ]);

    isInitialized = true;
    console.log("✅ Canister network initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize canister network:", error);

    // Reset for retry
    isInitialized = false;
    initializationPromise = null;

    // Only throw in development, in production we'll try to continue
    if (process.env.NODE_ENV === "development") {
      throw error;
    } else {
      console.warn(
        "⚠️ Continuing without full canister initialization in production",
      );
    }
  }
}

/**
 * Check if canisters are initialized
 */
export const getInitializationStatus = (): boolean => {
  return isInitialized;
};

/**
 * Force re-initialization (useful for development/testing)
 */
export const resetInitialization = (): void => {
  isInitialized = false;
  initializationPromise = null;
};
