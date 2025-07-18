import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthClient } from "@dfinity/auth-client";
import { Identity } from "@dfinity/agent";
import { canisterId, createActor } from "../../declarations/auth";
import type { Result_1 as ProfileResult } from "../../declarations/auth/auth.did";
import Hero from "./components/shared/Hero";
import Features from "./components/shared/Features";
import WhyChooseSRV from "./components/shared/WhyChooseSRV";
import AboutUs from "./components/shared/AboutUs";
import SDGSection from "./components/shared/SDGSection";
import Footer from "./components/shared/Footer";

// Types for component state
interface AuthState {
  authClient: AuthClient | null;
  isAuthenticated: boolean;
  identity: Identity | null;
  isLoading: boolean;
  isCheckingProfile: boolean;
  error: string;
}

// Hook for authentication logic
const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    authClient: null,
    isAuthenticated: false,
    identity: null,
    isLoading: false,
    isCheckingProfile: true,
    error: "",
  });

  const initializeAuth = async (): Promise<void> => {
    try {
      const client = await AuthClient.create();
      const isAuth = await client.isAuthenticated();
      const userIdentity = isAuth ? client.getIdentity() : null;

      setAuthState(prev => ({
        ...prev,
        authClient: client,
        isAuthenticated: isAuth,
        identity: userIdentity,
        isCheckingProfile: false,
      }));
    } catch (error) {
      console.error("Failed to initialize auth client:", error);
      setAuthState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Auth initialization failed",
        isCheckingProfile: false,
      }));
    }
  };

  const login = async (): Promise<void> => {
    if (!authState.authClient) return;

    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: "" }));

      await authState.authClient.login({
        identityProvider: process.env.DFX_NETWORK === "ic" 
          ? "https://identity.ic0.app"
          : "http://rdmx6-jaaaa-aaaaa-aaadq-cai.localhost:4943",
        onSuccess: () => {
          const identity = authState.authClient!.getIdentity();
          setAuthState(prev => ({
            ...prev,
            isAuthenticated: true,
            identity,
            isLoading: false,
          }));
        },
        onError: (error?: string) => {
          setAuthState(prev => ({
            ...prev,
            error: error || "Login failed",
            isLoading: false,
          }));
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      setAuthState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to connect to Internet Identity",
        isLoading: false,
      }));
    }
  };

  return {
    ...authState,
    initializeAuth,
    login,
    setError: (error: string) => setAuthState(prev => ({ ...prev, error })),
    setIsCheckingProfile: (isChecking: boolean) => setAuthState(prev => ({ ...prev, isCheckingProfile: isChecking })),
  };
};

// Service function for profile operations
const useProfileService = (identity: Identity | null) => {
  const getMyProfile = async (): Promise<ProfileResult> => {
    if (!identity) {
      throw new Error("User not authenticated");
    }

    try {
      const authActor = createActor(canisterId, {
        agentOptions: {
          identity,
          host: process.env.DFX_NETWORK === "ic" ? "https://ic0.app" : "http://localhost:4943",
        },
      });

      return await authActor.getMyProfile();
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      throw error;
    }
  };

  return { getMyProfile };
};

export default function App() {
  const navigate = useNavigate();
  const auth = useAuth();
  const profileService = useProfileService(auth.identity);

  // Initialize authentication on component mount
  useEffect(() => {
    document.title = "SRV - Your Service Hub";
    auth.initializeAuth();
  }, []);

  // Check profile and redirect when authenticated
  useEffect(() => {
    const checkProfileAndRedirect = async () => {
      if (auth.isAuthenticated && auth.identity) {
        auth.setIsCheckingProfile(true);
        auth.setError("");
        
        try {
          const profileResult = await profileService.getMyProfile();

          if ("ok" in profileResult) {
            const profile = profileResult.ok;
            if ("Client" in profile.role) {
              navigate("/client/home");
            } else if ("ServiceProvider" in profile.role) {
              navigate("/provider/home");
            } else {
              navigate("/create-profile");
            }
          } else {
            if (profileResult.err === "Profile not found") {
              navigate("/create-profile");
            } else {
              throw new Error(profileResult.err || "Failed to retrieve profile.");
            }
          }
        } catch (error) {
          console.error("Profile check error:", error);
          auth.setError(
            error instanceof Error ? error.message : "Error checking profile."
          );
        } finally {
          auth.setIsCheckingProfile(false);
        }
      }
    };

    checkProfileAndRedirect();
  }, [auth.isAuthenticated, auth.identity, navigate]);

  // Loading state while checking profile
  if (auth.isCheckingProfile && auth.isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
        <div className="h-16 w-16 animate-spin rounded-full border-t-4 border-b-4 border-blue-600"></div>
        <p className="mt-4 text-lg text-gray-700">Checking your profile...</p>
      </div>
    );
  }

  return (
    <main className="bg-gray-50">
      <Hero onLoginClick={auth.login} isLoginLoading={auth.isLoading} />
      <Features />
      <WhyChooseSRV />
      <SDGSection />
      <AboutUs />

      {!auth.isAuthenticated && auth.error && (
        <section className="bg-yellow-100 py-16 lg:py-24">
          <div className="container mx-auto px-6 text-center">
            <h2 className="mb-6 text-3xl font-bold text-slate-800 lg:text-4xl">
              Login to Continue
            </h2>
            <div className="mx-auto mb-6 max-w-md rounded-lg bg-red-100 p-4 text-sm text-red-700">
              Error: {auth.error}
            </div>
            <button
              onClick={auth.login}
              disabled={auth.isLoading}
              className={`transform rounded-lg bg-blue-600 px-8 py-3 text-lg font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-blue-700 hover:shadow-xl ${
                auth.isLoading ? "cursor-not-allowed opacity-70" : ""
              }`}
            >
              {auth.isLoading ? "Connecting..." : "Retry Login"}
            </button>
          </div>
        </section>
      )}
      
      <Footer />
    </main>
  );
}
