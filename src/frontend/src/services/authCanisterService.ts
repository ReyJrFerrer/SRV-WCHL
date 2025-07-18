// Auth Canister Service
import { Actor } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { idlFactory } from '../../../declarations/auth/auth.did.js';
import { getHttpAgent, getAdminHttpAgent } from '../utils/icpClient';
import type { _SERVICE as AuthService, Profile, UserRole } from '../../../declarations/auth/auth.did';
import { adaptBackendProfile } from '../utils/assetResolver';

// Canister configuration
const AUTH_CANISTER_ID = process.env.NEXT_PUBLIC_AUTH_CANISTER_ID || 'be2us-64aaa-aaaaa-qaabq-cai';

// Create actor
let authActor: AuthService | null = null;

const getAuthActor = async (): Promise<AuthService> => {
  if (!authActor) {
    const agent = await getHttpAgent();
    authActor = Actor.createActor(idlFactory, {
      agent: agent,
      canisterId: AUTH_CANISTER_ID,
    }) as AuthService;
  }
  return authActor;
};

// Frontend-compatible Profile interface
export interface FrontendProfile {
  id: string;
  name: string;
  // email: string;
  phone: string;
  role: 'Client' | 'ServiceProvider';
  isVerified: boolean;
  profilePicture?: {
    imageUrl: any; // Frontend require() result
    thumbnailUrl: any; // Frontend require() result
  };
  biography?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Auth Canister Service Functions
export const authCanisterService = {
  /**
   * Get all service providers from the auth canister
   */
  async getAllServiceProviders(): Promise<FrontendProfile[]> {
    try {
      const actor = await getAuthActor();
      const profiles = await actor.getAllServiceProviders();
      
      // Convert backend profiles to frontend-compatible format
      return profiles.map(profile => adaptBackendProfile(profile));
    } catch (error) {
      console.error('Error fetching service providers:', error);
      throw new Error(`Failed to fetch service providers: ${error}`);
    }
  },

  /**
   * Get a specific profile by Principal ID
   */
  async getProfile(userId: string): Promise<FrontendProfile | null> {
    try {
      const actor = await getAuthActor();
      
      // Convert string to Principal
      const userPrincipal = Principal.fromText(userId);
      
      const result = await actor.getProfile(userPrincipal);
      
      if ('ok' in result) {
        return adaptBackendProfile(result.ok);
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      console.error('UserId that caused error:', userId);
      throw new Error(`Failed to fetch profile: ${error}`);
    }
  },

  /**
   * Get the current user's profile
   */
  async getMyProfile(): Promise<FrontendProfile | null> {
    try {
      const actor = await getAuthActor();
      const result = await actor.getMyProfile();
      
      if ('ok' in result) {
        return adaptBackendProfile(result.ok);
      } else {
        console.error('Error fetching my profile:', result.err);
        return null;
      }
    } catch (error) {
      console.error('Error fetching my profile:', error);
      throw new Error(`Failed to fetch my profile: ${error}`);
    }
  },

  /**
   * Create a new profile
   */
  async createProfile(
    name: string,
    // email: string,
    phone: string,
    role: 'Client' | 'ServiceProvider'
  ): Promise<FrontendProfile | null> {
    try {
      const actor = await getAuthActor();
      const userRole: UserRole = { [role]: null } as UserRole;
      const result = await actor.createProfile(name, phone, userRole);
      
      if ('ok' in result) {
        return adaptBackendProfile(result.ok);
      } else {
        console.error('Error creating profile:', result.err);
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Error creating profile:', error);
      throw new Error(`Failed to create profile: ${error}`);
    }
  },

  /**
   * Update an existing profile
   */
  async updateProfile(
    name?: string,
    // email?: string,
    phone?: string
  ): Promise<FrontendProfile | null> {
    try {
      const actor = await getAuthActor();
      const result = await actor.updateProfile(
        name ? [name] : [],
        // email ? [email] : [],
        phone ? [phone] : []
      );
      
      if ('ok' in result) {
        return adaptBackendProfile(result.ok);
      } else {
        console.error('Error updating profile:', result.err);
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw new Error(`Failed to update profile: ${error}`);
    }
  },

  /**
   * Verify a user
   */
  async verifyUser(userId: string): Promise<boolean> {
    try {
      const actor = await getAuthActor();
      
      // Convert string to Principal
      const userPrincipal = Principal.fromText(userId);
      const result = await actor.verifyUser(userPrincipal);
      
      if ('ok' in result) {
        return result.ok;
      } else {
        console.error('Error verifying user:', result.err);
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Error verifying user:', error);
      throw new Error(`Failed to verify user: ${error}`);
    }
  },

  /**
   * Set canister references for auth canister (ADMIN FUNCTION)
   */
  async setCanisterReferences(reputationCanisterId?: string): Promise<string | null> {
    try {
      // Use admin agent for setup operations
      const agent = await getAdminHttpAgent();
      const actor = Actor.createActor(idlFactory, {
        agent: agent,
        canisterId: AUTH_CANISTER_ID,
      }) as AuthService;

      const result = await actor.setCanisterReferences(
        reputationCanisterId ? [Principal.fromText(reputationCanisterId)] : []
      );
      
      if ('ok' in result) {
        return result.ok;
      } else {
        console.error('Error setting canister references:', result.err);
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Error setting canister references:', error);
      throw new Error(`Failed to set canister references: ${error}`);
    }
  }
};

// Reset functions for authentication state changes
export const resetAuthActor = () => {
  authActor = null;
};

export const refreshAuthActor = async () => {
  authActor = null;
  return await getAuthActor();
};

export default authCanisterService;
