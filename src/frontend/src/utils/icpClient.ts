// ICP Client Utility for Authentication
import { HttpAgent, Identity } from '@dfinity/agent';

// Global variables to store the current authentication state
let currentIdentity: Identity | null = null;
let httpAgent: HttpAgent | null = null;
let identityInitialized = false;

/**
 * Set the current identity from the ICP Connect context
 * This should be called from the AuthWrapper when authentication state changes
 */
export const setCurrentIdentity = (identity: Identity | null) => {
  currentIdentity = identity;
  identityInitialized = true;
  // Reset agent when identity changes
  httpAgent = null;
};

/**
 * Get the current authenticated identity
 */
export const getCurrentIdentity = (): Identity | null => {
  return currentIdentity;
};

/**
 * Initialize identity from authentication context (for page reloads)
 * This should be called before making any authenticated requests
 */
export const initializeIdentity = async (): Promise<void> => {
  if (identityInitialized) return;

  // Try to get identity from your auth context/provider
  // This will depend on your authentication setup (ICP Connect, Internet Identity, etc.)
  // You might need to access your auth context here
  
  // For now, we'll mark as initialized to prevent infinite loops
  identityInitialized = true;
  
  // If you're using ICP Connect or similar, you would do something like:
  // const authClient = await AuthClient.create();
  // const identity = authClient.getIdentity();
  // if (identity && !identity.getPrincipal().isAnonymous()) {
  //   currentIdentity = identity;
  // }
};

/**
 * Create or get the HTTP agent with the current identity
 */
export const getHttpAgent = async (): Promise<HttpAgent> => {
  // Initialize identity if not already done
  await initializeIdentity();
  
  if (!httpAgent) {
    // Check if we're in development or production
    const isDevelopment = process.env.NODE_ENV === 'development' || 
                         process.env.NEXT_PUBLIC_IC_HOST?.includes('localhost');
    
    // Create agent with current identity if available
    const agentOptions: any = {
      host: isDevelopment 
        ? 'http://localhost:4943' 
        : 'https://ic0.app',
    };

    // Add identity if authenticated
    if (currentIdentity) {
      agentOptions.identity = currentIdentity;
      console.log('Creating HTTP agent with authenticated identity:', currentIdentity.getPrincipal().toString());
    } else {
      console.log('Creating HTTP agent with anonymous identity');
    }

    httpAgent = new HttpAgent(agentOptions);

    // Fetch root key for local development
    if (isDevelopment) {
      try {
        await httpAgent.fetchRootKey();
        console.log('Root key fetched successfully for development');
      } catch (error) {
        console.warn('Failed to fetch root key:', error);
        throw new Error('Failed to initialize HTTP agent for local development');
      }
    }
  }
  
  if (!httpAgent) {
    throw new Error('HTTP agent initialization failed');
  }
  
  return httpAgent;
};

/**
 * Create HTTP agent for admin operations (without identity requirement)
 * Use this only for initial setup operations
 */
export const getAdminHttpAgent = async (): Promise<HttpAgent> => {
  const isDevelopment = process.env.NODE_ENV === 'development' || 
                       process.env.NEXT_PUBLIC_IC_HOST?.includes('localhost');
  
  const adminAgent = new HttpAgent({
    host: isDevelopment 
      ? 'http://localhost:4943' 
      : 'https://ic0.app',
  });

  // Fetch root key for local development
  if (isDevelopment) {
    try {
      await adminAgent.fetchRootKey();
    } catch (error) {
      console.warn('Failed to fetch root key for admin agent:', error);
      throw new Error('Failed to initialize admin HTTP agent for local development');
    }
  }
  
  return adminAgent;
};

/**
 * Reset the agent and identity state (useful when identity changes or user logs out)
 */
export const resetAgent = () => {
  httpAgent = null;
  identityInitialized = false;
};

/**
 * Logout function that clears identity and resets agent state
 * Returns the principal ID that was logged out (useful for disconnect operations)
 */
export const logout = (): string | null => {
  let principalId = null;
  
  // Get the principal ID before clearing identity
  if (currentIdentity && typeof currentIdentity.getPrincipal === 'function') {
    try {
      principalId = currentIdentity.getPrincipal().toString();
      console.log('Logging out user with principal:', principalId);
    } catch (error) {
      console.warn('Could not get principal ID during logout:', error);
    }
  }
  
  // Clear the current identity
  currentIdentity = null;
  
  // Reset agent and initialization state
  resetAgent();
  
  console.log('User logged out successfully');
  return principalId;
};

/**
 * Clear all authentication state (for complete logout)
 */
export const clearAuthState = () => {
  currentIdentity = null;
  httpAgent = null;
  identityInitialized = false;
  console.log('All authentication state cleared');
};

/**
 * Check if user is currently authenticated
 */
export const isAuthenticated = (): boolean => {
  return currentIdentity !== null && 
         typeof currentIdentity.getPrincipal === 'function' &&
         !currentIdentity.getPrincipal().isAnonymous();
};

/**
 * Force re-initialization of identity (useful for debugging)
 */
export const reinitializeIdentity = async (): Promise<void> => {
  identityInitialized = false;
  httpAgent = null;
  await initializeIdentity();
};
