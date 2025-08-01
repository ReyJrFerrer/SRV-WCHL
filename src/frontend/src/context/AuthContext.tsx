import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { AuthClient } from "@dfinity/auth-client";
import { Identity } from "@dfinity/agent";
import { updateAuthActor } from "../services/authCanisterService";
import { updateBookingActor } from "../services/bookingCanisterService";
import { updateServiceActor } from "../services/serviceCanisterService";
import { updateReviewActor } from "../services/reviewCanisterService";
import { updateReputationActor } from "../services/reputationCanisterService";
import { updateChatActor } from "../services/chatCanisterService";
import {
  initializeCanisterReferences,
  shouldInitializeCanisters,
} from "../services/canisterInitService";

// --- NEW: Types for Location State ---
type LocationStatus = "not_set" | "allowed" | "denied" | "unsupported";
interface Location {
  latitude: number;
  longitude: number;
}

interface AuthContextType {
  authClient: AuthClient | null;
  isAuthenticated: boolean;
  identity: Identity | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  // --- NEW: Location properties ---
  location: Location | null;
  locationStatus: LocationStatus;
  setLocation: (status: LocationStatus, location?: Location | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const updateAllActors = (identity: Identity | null) => {
  updateAuthActor(identity);
  updateBookingActor(identity);
  updateServiceActor(identity);
  updateReviewActor(identity);
  updateReputationActor(identity);
  updateChatActor(identity);
};

const initializeCanisters = async (
  isAuthenticated: boolean,
  identity: Identity | null,
) => {
  if (shouldInitializeCanisters(isAuthenticated, identity)) {
    try {
      await initializeCanisterReferences();
    } catch (error) {
      // console.warn("Failed to initialize canister references:", error);
    }
  }
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Auto-detect geolocation on mount
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setLocationStatus("unsupported");
      setLocationState(null);
      return;
    }
    navigator.geolocation.getCurrentPosition((pos) => {
      setLocationStatus("allowed");
      setLocationState({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
    });
  }, []);
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- NEW: State for Location ---
  const [location, setLocationState] = useState<Location | null>(null);
  const [locationStatus, setLocationStatus] =
    useState<LocationStatus>("not_set");

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const client = await AuthClient.create();
        setAuthClient(client);
        const isAuth = await client.isAuthenticated();
        setIsAuthenticated(isAuth);
        if (isAuth) {
          const identity = client.getIdentity();
          setIdentity(identity);
          updateAllActors(identity);
          await initializeCanisters(isAuth, identity);
        } else {
          updateAllActors(null);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "An unknown error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // --- NEW: Function to update location state ---
  const setLocation = (
    status: LocationStatus,
    newLocation?: Location | null,
  ) => {
    setLocationStatus(status);
    if (newLocation) {
      setLocationState(newLocation);
    }
    // Store the permission status to avoid asking on every visit
    localStorage.setItem("locationPermission", status);
  };

  const login = async () => {
    if (!authClient) return;

    setIsLoading(true);
    setError(null);

    try {
      await authClient.login({
        identityProvider:
          process.env.DFX_NETWORK === "ic"
            ? "https://identity.ic0.app"
            : `http://rdmx6-jaaaa-aaaaa-aaadq-cai.localhost:4943`,
        onSuccess: async () => {
          const identity = authClient.getIdentity();
          setIsAuthenticated(true);
          setIdentity(identity);
          updateAllActors(identity);
          await initializeCanisters(true, identity);
          setIsLoading(false);
        },
        onError: (err?: string) => {
          setError(err || "Login failed");
          setIsLoading(false);
        },
      });
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Failed to connect to Internet Identity",
      );
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (!authClient) return;
    await authClient.logout();
    setIsAuthenticated(false);
    setIdentity(null);
    updateAllActors(null);
  };

  const value = {
    authClient,
    isAuthenticated,
    identity,
    login,
    logout,
    isLoading,
    error,
    // --- NEW: Add location state to context value ---
    location,
    locationStatus,
    setLocation,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
