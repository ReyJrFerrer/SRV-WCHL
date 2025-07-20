// Canister Initialization Service
import { authCanisterService } from "./authCanisterService";
import { bookingCanisterService } from "./bookingCanisterService";
import { serviceCanisterService } from "./serviceCanisterService";
import { reviewCanisterService } from "./reviewCanisterService";
import reputationCanisterService from "./reputationCanisterService";

interface CanisterInitResult {
  name: string;
  success: boolean;
  error?: string;
}

/**
 * Initialize canister references for all canisters after successful authentication
 * This ensures all canisters can communicate with each other properly
 * Optimized for instant execution with parallel task processing
 */
export const initializeCanisterReferences = async (): Promise<{
  success: boolean;
  results: CanisterInitResult[];
}> => {
  console.log("🔧 Initializing canister references instantly...");

  // Initialize canister references for each service in parallel for speed
  const initializationTasks = [
    {
      name: "Auth",
      task: authCanisterService.setCanisterReferences(),
    },
    {
      name: "Booking",
      task: bookingCanisterService.setCanisterReferences(),
    },
    {
      name: "Service",
      task: serviceCanisterService.setCanisterReferences(),
    },
    {
      name: "Review",
      task: reviewCanisterService.setCanisterReferences(),
    },
    {
      name: "Reputation",
      task: reputationCanisterService.setCanisterReferences(),
    },
  ];

  // Execute all initialization tasks in parallel for maximum speed
  const settledResults = await Promise.allSettled(
    initializationTasks.map(async ({ name, task }) => {
      try {
        await task;
        console.log(`✅ ${name} canister references initialized successfully`);
        return { name, success: true };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        console.warn(
          `⚠️ Failed to initialize ${name} canister references:`,
          errorMessage,
        );
        return { name, success: false, error: errorMessage };
      }
    }),
  );

  // Process results
  const results = settledResults.map((result) =>
    result.status === "fulfilled"
      ? result.value
      : { name: "Unknown", success: false, error: "Promise rejected" },
  );
  const overallSuccess = results.every((result) => result.success);

  if (overallSuccess) {
    console.log("🎉 All canister references initialized instantly!");
  } else {
    console.warn(
      "⚠️ Some canister references failed to initialize - check warnings above",
    );
  }

  return { success: overallSuccess, results };
};

/**
 * Check if canister initialization should be performed
 * Only perform for authenticated users
 */
export const shouldInitializeCanisters = (
  isAuthenticated: boolean,
  identity: any,
): boolean => {
  return isAuthenticated && identity && !identity.getPrincipal().isAnonymous();
};
