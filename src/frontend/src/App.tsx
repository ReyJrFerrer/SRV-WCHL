import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth, useClient } from "@bundly/ares-react";
import Head from "next/head";
import { Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory as authIdlFactory } from "../declarations/auth/auth.did.js";
import type { Profile as UserProfile } from "../declarations/auth/auth.did.js";
import Hero from "@app/components/shared/Hero";
import Features from "@app/components/shared/Features";
import WhyChooseSRV from "@app/components/shared/WhyChooseSRV";
import AboutUs from "@app/components/shared/AboutUs";
import SDGSection from "@app/components/shared/SDGSection";
import Footer from "@app/components/shared/Footer";

type Result<T> = {
  ok?: T;
  err?: string;
};

// Dynamic environment configuration function
const getDynamicHost = () => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;

    // If accessing via localhost, use localhost for IC host
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:4943";
    } else {
      // If accessing via IP address, use the same IP for IC host
      return `http://${hostname.split(":")[0]}:4943`;
    }
  }

  // Fallback for server-side rendering
  return process.env.NEXT_PUBLIC_IC_HOST_URL || "http://localhost:4943";
};

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, currentIdentity } = useAuth();
  const client = useClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkProfileAndRedirect = async () => {
      if (isAuthenticated && currentIdentity) {
        setIsCheckingProfile(true);
        setError("");
        try {
          // Use dynamic host configuration
          const host = getDynamicHost();
          console.log("Using host:", host); // For debugging

          const agent = new HttpAgent({ identity: currentIdentity, host });
          if (process.env.NODE_ENV === "development")
            await agent.fetchRootKey();

          const authCanisterId = process.env.NEXT_PUBLIC_AUTH_CANISTER_ID;
          if (!authCanisterId)
            throw new Error("Auth canister ID not configured");

          const authActor = Actor.createActor(authIdlFactory, {
            agent,
            canisterId: authCanisterId,
          });
          const profileResult =
            (await authActor.getMyProfile()) as Result<UserProfile>;

          if (profileResult.ok) {
            if ("Client" in profileResult.ok.role) router.push("/client/home");
            else if ("ServiceProvider" in profileResult.ok.role)
              router.push("/provider/home");
            else router.push("/create-profile");
          } else if (profileResult.err === "Profile not found") {
            router.push("/create-profile");
          } else {
            throw new Error(profileResult.err || "Failed to retrieve profile.");
          }
        } catch (err) {
          console.error("Profile check error:", err);
          setError(
            err instanceof Error ? err.message : "Error checking profile.",
          );
        } finally {
          setIsCheckingProfile(false);
        }
      } else {
        setIsCheckingProfile(false);
      }
    };
    checkProfileAndRedirect();
  }, [isAuthenticated, currentIdentity, router]);

  const handleIILogin = async () => {
    try {
      setIsLoading(true);
      setError("");
      const provider = client.getProvider("internet-identity");
      if (!provider) throw new Error("Internet Identity provider not found");
      await provider.connect();
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to connect to Internet Identity",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingProfile && isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
        <div className="h-16 w-16 animate-spin rounded-full border-t-4 border-b-4 border-blue-600"></div>
        <p className="mt-4 text-lg text-gray-700">Checking your profile...</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>SRV - Your Service Hub</title>
        <meta
          name="description"
          content="Find and book local services with ease on the Internet Computer."
        />
        <link rel="icon" href="/logo.jpeg" />
      </Head>

      <main className="bg-gray-50">
        <Hero onLoginClick={handleIILogin} isLoginLoading={isLoading} />
        <Features />
        <WhyChooseSRV />
        <SDGSection />
        <AboutUs />

        {!isAuthenticated && error && (
          <section className="bg-yellow-100 py-16 lg:py-24">
            <div className="container mx-auto px-6 text-center">
              <h2 className="mb-6 text-3xl font-bold text-slate-800 lg:text-4xl">
                Login to Continue
              </h2>
              <div className="mx-auto mb-6 max-w-md rounded-lg bg-red-100 p-4 text-sm text-red-700">
                Error: {error}
              </div>
              <button
                onClick={handleIILogin}
                disabled={isLoading}
                className={`transform rounded-lg bg-blue-600 px-8 py-3 text-lg font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-blue-700 hover:shadow-xl ${isLoading ? "cursor-not-allowed opacity-70" : ""}`}
              >
                {isLoading ? "Connecting..." : "Retry Login"}
              </button>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
