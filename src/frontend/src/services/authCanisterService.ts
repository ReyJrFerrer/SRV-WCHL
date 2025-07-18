// Auth Canister Service
import { Principal } from "@dfinity/principal";
import { canisterId, createActor } from "../../../declarations/auth";
import { getAdminHttpAgent } from "../utils/icpClient";
import type {
  _SERVICE as AuthService,
  UserRole,
} from "../../../declarations/auth/auth.did";
import { adaptBackendProfile } from "../utils/assetResolver";
import { Identity } from "@dfinity/agent";

// Frontend-compatible Profile interface
export interface FrontendProfile {
  id: string;
  name: string;
  // email: string;
  phone: string;
  role: "Client" | "ServiceProvider";
  isVerified: boolean;
  profilePicture?: {
    imageUrl: any; // Frontend require() result
    thumbnailUrl: any; // Frontend require() result
  };
  biography?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Creates an auth actor with the provided identity
 * @param identity The user's identity from AuthContext
 * @returns An authenticated AuthService actor
 */
const createAuthActor = (identity?: Identity | null): AuthService => {
  return createActor(canisterId, {
    agentOptions: {
      identity: identity || undefined,
      host: process.env.DFX_NETWORK !== "ic" ? "http://localhost:4943" : "https://ic0.app",
    }
  }) as AuthService;
};

// Auth Canister Service Functions
export const authCanisterService = {
  /**
   * Get all service providers from the auth canister
   * @param identity The user's identity from AuthContext
   */
  async getAllServiceProviders(identity?: Identity | null): Promise<FrontendProfile[]> {
    try {
      const actor = createAuthActor(identity);
      const profiles = await actor.getAllServiceProviders();

      // Convert backend profiles to frontend-compatible format
      return profiles.map((profile) => adaptBackendProfile(profile));
    } catch (error) {
      console.error("Error fetching service providers:", error);
      throw new Error(`Failed to fetch service providers: ${error}`);
    }
  },

  /**
   * Get a specific profile by Principal ID
   * @param userId The principal ID of the user to fetch
   * @param identity The user's identity from AuthContext
   */
  async getProfile(userId: string, identity?: Identity | null): Promise<FrontendProfile | null> {
    try {
      const actor = createAuthActor(identity);

      // Convert string to Principal
      const userPrincipal = Principal.fromText(userId);

      const result = await actor.getProfile(userPrincipal);

      if ("ok" in result) {
        return adaptBackendProfile(result.ok);
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      console.error("UserId that caused error:", userId);
      throw new Error(`Failed to fetch profile: ${error}`);
    }
  },

  /**
   * Get the current user's profile
   * @param identity The user's identity from AuthContext (required for this call)
   */
  async getMyProfile(identity: Identity): Promise<FrontendProfile | null> {
    if (!identity) {
      console.error("Identity required to fetch user's own profile");
      throw new Error("Authentication required");
    }

    try {
      const actor = createAuthActor(identity);
      const result = await actor.getMyProfile();

      if ("ok" in result) {
        return adaptBackendProfile(result.ok);
      } else {
        console.error("Error fetching my profile:", result.err);
        return null;
      }
    } catch (error) {
      console.error("Error fetching my profile:", error);
      throw new Error(`Failed to fetch my profile: ${error}`);
    }
  },

  /**
   * Create a new profile
   * @param name User's name
   * @param phone User's phone number
   * @param role User's role (Client or ServiceProvider)
   * @param identity The user's identity from AuthContext (required for this call)
   */
  async createProfile(
    name: string,
    // email: string,
    phone: string,
    role: "Client" | "ServiceProvider",
    identity: Identity,
  ): Promise<FrontendProfile | null> {
    if (!identity) {
      console.error("Identity required to create profile");
      throw new Error("Authentication required");
    }

    try {
      const actor = createAuthActor(identity);
      const userRole: UserRole = { [role]: null } as UserRole;
      const result = await actor.createProfile(name, phone, userRole);

      if ("ok" in result) {
        return adaptBackendProfile(result.ok);
      } else {
        console.error("Error creating profile:", result.err);
        throw new Error(result.err);
      }
    } catch (error) {
      console.error("Error creating profile:", error);
      throw new Error(`Failed to create profile: ${error}`);
    }
  },

  /**
   * Update an existing profile
   * @param name Optional new name
   * @param phone Optional new phone number
   * @param identity The user's identity from AuthContext (required for this call)
   */
  async updateProfile(
    name?: string,
    // email?: string,
    phone?: string,
    identity?: Identity,
  ): Promise<FrontendProfile | null> {
    if (!identity) {
      console.error("Identity required to update profile");
      throw new Error("Authentication required");
    }

    try {
      const actor = createAuthActor(identity);
      const result = await actor.updateProfile(
        name ? [name] : [],
        // email ? [email] : [],
        phone ? [phone] : [],
      );

      if ("ok" in result) {
        return adaptBackendProfile(result.ok);
      } else {
        console.error("Error updating profile:", result.err);
        throw new Error(result.err);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      throw new Error(`Failed to update profile: ${error}`);
    }
  },

  /**
   * Verify a user
   * @param userId The principal ID of the user to verify
   * @param identity The user's identity from AuthContext (required for this call)
   */
  async verifyUser(userId: string, identity?: Identity): Promise<boolean> {
    if (!identity) {
      console.error("Identity required to verify user");
      throw new Error("Authentication required");
    }

    try {
      const actor = createAuthActor(identity);

      // Convert string to Principal
      const userPrincipal = Principal.fromText(userId);
      const result = await actor.verifyUser(userPrincipal);

      if ("ok" in result) {
        return result.ok;
      } else {
        console.error("Error verifying user:", result.err);
        throw new Error(result.err);
      }
    } catch (error) {
      console.error("Error verifying user:", error);
      throw new Error(`Failed to verify user: ${error}`);
    }
  },

  /**
   * Set canister references for auth canister (ADMIN FUNCTION)
   * @param reputationCanisterId Optional reputation canister ID to set
   */
  async setCanisterReferences(
    reputationCanisterId?: string,
  ): Promise<string | null> {
    try {
      // Use admin agent for setup operations
      const agent = await getAdminHttpAgent();
      
      // Use the imported createActor with admin agent
      const adminActor = createActor(canisterId, {
        agent,
      }) as AuthService;

      const result = await adminActor.setCanisterReferences(
        reputationCanisterId ? [Principal.fromText(reputationCanisterId)] : [],
      );

      if ("ok" in result) {
        return result.ok;
      } else {
        console.error("Error setting canister references:", result.err);
        throw new Error(result.err);
      }
    } catch (error) {
      console.error("Error setting canister references:", error);
      throw new Error(`Failed to set canister references: ${error}`);
    }
  },
};

export default authCanisterService;
