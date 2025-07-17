import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth, useClient } from "@bundly/ares-react";
import Head from 'next/head';
import Link from 'next/link';
import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory } from '../../declarations/auth/auth.did.js';
import type { Profile } from '../../declarations/auth/auth.did.js';
import { FingerPrintIcon, UserPlusIcon } from '@heroicons/react/24/solid';

type Result<T> = {
  ok?: T;
  err?: string;
};

export default function ClientIndexPage() {
  const router = useRouter();
  const { isAuthenticated, currentIdentity } = useAuth();
  const client = useClient();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('Initializing...');

  useEffect(() => {
    const checkProfile = async () => {
      if (isAuthenticated && currentIdentity) {
        setIsLoading(true);
        setStatusMessage('Authenticated. Verifying your profile...');
        setError('');

        try {
          const host = process.env.NEXT_PUBLIC_IC_HOST_URL || 'http://localhost:4943';
          const agent = new HttpAgent({ identity: currentIdentity, host });
          if (process.env.NODE_ENV === 'development') await agent.fetchRootKey();

          const authCanisterId = process.env.NEXT_PUBLIC_AUTH_CANISTER_ID;
          if (!authCanisterId) throw new Error('Auth canister ID not configured');

          const authActor = Actor.createActor(idlFactory, { agent, canisterId: authCanisterId });
          const profileResult = await authActor.getMyProfile() as Result<Profile>;

          if ('ok' in profileResult && profileResult.ok) {
            if ('Client' in profileResult.ok.role) {
              router.push('/client/home');
            } else {
              setError('Access denied. A Client profile is required to access this section.');
            }
          } else if ('err' in profileResult && profileResult.err?.includes("Profile not found")) {
            router.push('/create-profile');
          } else {
            throw new Error(profileResult.err || 'Failed to retrieve profile.');
          }
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Failed to check profile.');
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
        setStatusMessage('Please log in or create an account to access the client portal.');
      }
    };

    checkProfile();
  }, [isAuthenticated, currentIdentity, router]);

  const handleAuthAction = async () => {
    try {
      setIsLoading(true);
      setError('');
      setStatusMessage('Connecting to Internet Identity...');
      const provider = client.getProvider("internet-identity");
      if (!provider) throw new Error('Internet Identity provider not found');
      await provider.connect();
    } catch (err) {
      console.error('Authentication error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to Internet Identity');
      setIsLoading(false);
    }
  };

  const renderStatus = () => {
    if (error) {
      return <p className="text-red-600 text-sm font-medium">{error}</p>;
    }
    if (isLoading) {
      return (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-600 mr-2"></div>
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
        <meta name="description" content="Access your client portal or log in." />
      </Head>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full mx-auto bg-white rounded-xl shadow-2xl p-8 text-center border-t-4 border-blue-600">
          <h2 className="text-2xl font-bold text-blue-600 mb-4">
            Client Portal
          </h2>
          
          <div className="min-h-[4rem] flex items-center justify-center mb-6">
            {renderStatus()}
          </div>

          <div className="space-y-4">
            <button
              onClick={handleAuthAction}
              disabled={isLoading}
              className={`w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg 
                          transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105
                          ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Processing...' : (
                <>
                  <FingerPrintIcon className="h-6 w-6 mr-2" />
                  Login with Internet Identity
                </>
              )}
            </button>

            <Link href="/create-profile" legacyBehavior>
              <a
                className={`w-full flex items-center justify-center bg-yellow-300 hover:bg-yellow-400 text-slate-800 font-bold py-3 px-6 rounded-lg 
                            transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105`}
              >
                <UserPlusIcon className="h-6 w-6 mr-2" />
                Create an Account
              </a>
            </Link>
          </div>

          <Link href="/" className="mt-6 block text-sm text-blue-500 hover:underline">
            Back to Homepage
          </Link>
        </div>
      </div>
    </>
  );
}