import { Principal } from '@dfinity/principal';
import { Actor } from '@dfinity/agent';

// Import the generated interface and factory
import { _SERVICE as ReputationService } from '../../../declarations/reputation/reputation.did';
import { idlFactory } from '../../../declarations/reputation/reputation.did.js';
import { getHttpAgent } from '../utils/icpClient';

// Use environment variable directly with fallback
const REPUTATION_CANISTER_ID = process.env.NEXT_PUBLIC_REPUTATION_CANISTER_ID || 'rdmx6-jaaaa-aaaaa-aaadq-cai';

class ReputationCanisterService {
  private actor: ReputationService | null = null;

  constructor() {
    this.initializeActor();
  }

  private async initializeActor() {
    try {
      
      if (!REPUTATION_CANISTER_ID) {
        throw new Error('Reputation canister ID is not configured');
      }

      const agent = await getHttpAgent();
      
      this.actor = Actor.createActor(idlFactory, {
        agent,
        canisterId: REPUTATION_CANISTER_ID,
      }) as ReputationService;
      
    } catch (error) {
      console.error('❌ Failed to initialize reputation canister actor:', error);
    }
  }

  private async getActor(): Promise<ReputationService> {
    if (!this.actor) {
      await this.initializeActor();
    }
    
    if (!this.actor) {
      throw new Error('Failed to initialize reputation canister actor');
    }
    
    return this.actor;
  }

  // Set canister references - this is the main function needed
  async setCanisterReferences(
    authCanisterId: string,
    bookingCanisterId: string,
    reviewCanisterId: string,
    serviceCanisterId: string
  ): Promise<void> {
    try {
      
      const actor = await this.getActor();
      
      const result = await actor.setCanisterReferences(
        Principal.fromText(authCanisterId),
        Principal.fromText(bookingCanisterId),
        Principal.fromText(reviewCanisterId),
        Principal.fromText(serviceCanisterId)
      );

      if ('ok' in result) {
      } else {
        console.error('❌ Failed to set reputation canister references:', result.err);
        throw new Error(`Failed to set canister references: ${result.err}`);
      }
    } catch (error) {
      console.error('❌ Error setting reputation canister references:', error);
      throw error;
    }
  }
}

// Export singleton instance
const reputationCanisterService = new ReputationCanisterService();
export default reputationCanisterService;