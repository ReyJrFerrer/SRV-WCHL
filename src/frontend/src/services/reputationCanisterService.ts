import { Principal } from "@dfinity/principal";
import { canisterId, createActor } from "../../../declarations/reputation";
import { getAdminHttpAgent } from "../utils/icpClient";
import type { _SERVICE as ReputationService } from "../../../declarations/reputation/reputation.did";

class ReputationCanisterService {

  // Set canister references - this is the main function needed
  async setCanisterReferences(
    authCanisterId: string,
    bookingCanisterId: string,
    reviewCanisterId: string,
    serviceCanisterId: string,
  ): Promise<void> {
    try {
      // Use admin agent for setup operations
      const agent = await getAdminHttpAgent();

      // Use the imported createActor with admin agent
      const adminActor = createActor(canisterId, {
        agent,
      }) as ReputationService;

      const result = await adminActor.setCanisterReferences(
        Principal.fromText(authCanisterId),
        Principal.fromText(bookingCanisterId),
        Principal.fromText(reviewCanisterId),
        Principal.fromText(serviceCanisterId),
      );

      if ("ok" in result) {
      } else {
        console.error(
          "❌ Failed to set reputation canister references:",
          result.err,
        );
        throw new Error(`Failed to set canister references: ${result.err}`);
      }
    } catch (error) {
      console.error("❌ Error setting reputation canister references:", error);
      throw error;
    }
  }
}

// Export singleton instance
const reputationCanisterService = new ReputationCanisterService();
export default reputationCanisterService;
