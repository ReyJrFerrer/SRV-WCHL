import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth, useClient } from "@bundly/ares-react";
import Head from "next/head";
import Link from "next/link";
import { Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory } from "../../declarations/auth/auth.did.js";
import type { Profile } from "../../declarations/auth/auth.did.js";
import { FingerPrintIcon, UserPlusIcon } from "@heroicons/react/24/solid";

type Result<T> = {
  ok?: T;
  err?: string;
};

export default function ClientIndexPage() {
  const router = useRouter();
  const { isAuthenticated, currentIdentity } = useAuth();
  const client = useClient();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("Initializing...");

  useEffect(() => {
    const checkProfile = async () => {
      if (isAuthenticated && currentIdentity) {
        setIsLoading(true);
        setStatusMessage("Authenticated. Verifying your profile...");
        setError("");

        try {
          const host =
            process.env.NEXT_PUBLIC_IC_HOST_URL || "http://localhost:4943";
          const agent = new HttpAgent({ identity: currentIdentity, host });
          if (process.env.NODE_ENV === "development")
            await agent.fetchRootKey();

          const authCanisterId = process.env.NEXT_PUBLIC_AUTH_CANISTER_ID;
          if (!authCanisterId)
            throw new Error("Auth canister ID not configured");

          const authActor = Actor.createActor(idlFactory, {
            agent,
            canisterId: authCanisterId,
          });
          const profileResult =
            (await authActor.getMyProfile()) as Result<Profile>;

          if ("ok" in profileResult && profileResult.ok) {
            if ("Client" in profileResult.ok.role) {
              router.push("/client/home");
            } else {
              setError(
                "Access denied. A Client profile is required to access this section.",
              );
            }
          } else if (
            "err" in profileResult &&
            profileResult.err?.includes("Profile not found")
          ) {
            router.push("/create-profile");
          } else {
            throw new Error(profileResult.err || "Failed to retrieve profile.");
          }
        } catch (e) {
          setError(e instanceof Error ? e.message : "Failed to check profile.");
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
        setStatusMessage(
          "Please log in or create an account to access the client portal.",
        );
      }
    };

    checkProfile();
  }, [isAuthenticated, currentIdentity, router]);

  const handleAuthAction = async () => {
    try {
      setIsLoading(true);
      setError("");
      setStatusMessage("Connecting to Internet Identity...");
      const provider = client.getProvider("internet-identity");
      if (!provider) throw new Error("Internet Identity provider not found");
      await provider.connect();
    } catch (err) {
      console.error("Authentication error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to connect to Internet Identity",
      );
      setIsLoading(false);
    }
  };

  const renderStatus = () => {
    if (error) {
      return <p className="text-sm font-medium text-red-600">{error}</p>;
    }
    if (isLoading) {
      return (
        <div className="flex items-center justify-center">
          <div className="mr-2 h-5 w-5 animate-spin rounded-full border-b-2 border-slate-600"></div>
          <span className="text-slate-600">{statusMessage}</span>
        </div>
      );
    }
    return <p className="text-slate-600">{statusMessage}</p>;
  };

  return (
    <>
      <Head>
        <title>SRV Client Portal</title>
        <meta
          name="description"
          content="Access your client portal or log in."
        />
      </Head>
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="mx-auto w-full max-w-md rounded-xl border-t-4 border-blue-600 bg-white p-8 text-center shadow-2xl">
          <h2 className="mb-4 text-2xl font-bold text-blue-600">
            Client Portal
          </h2>

          <div className="mb-6 flex min-h-[4rem] items-center justify-center">
            {renderStatus()}
          </div>

          <div className="space-y-4">
            <button
              onClick={handleAuthAction}
              disabled={isLoading}
              className={`flex w-full transform items-center justify-center rounded-lg bg-blue-600 px-6 py-3 font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-blue-700 hover:shadow-xl ${isLoading ? "cursor-not-allowed opacity-70" : ""}`}
            >
              {isLoading ? (
                "Processing..."
              ) : (
                <>
                  <FingerPrintIcon className="mr-2 h-6 w-6" />
                  Login with Internet Identity
                </>
              )}
            </button>

            <Link href="/create-profile" legacyBehavior>
              <a
                className={`flex w-full transform items-center justify-center rounded-lg bg-yellow-300 px-6 py-3 font-bold text-slate-800 shadow-md transition-all duration-300 hover:scale-105 hover:bg-yellow-400 hover:shadow-lg`}
              >
                <UserPlusIcon className="mr-2 h-6 w-6" />
                Create an Account
              </a>
            </Link>
          </div>

          <Link
            href="/"
            className="mt-6 block text-sm text-blue-500 hover:underline"
          >
            Back to Homepage
          </Link>
        </div>
      </div>
    </>
  );
}
