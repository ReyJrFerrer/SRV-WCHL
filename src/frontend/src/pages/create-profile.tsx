import React, { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth, useClient } from "@bundly/ares-react"; // Import useClient
import Head from 'next/head';
import Image from 'next/image';
import { UserIcon, WrenchScrewdriverIcon, UserPlusIcon, EnvelopeIcon, PhoneIcon, ExclamationTriangleIcon, FingerPrintIcon } from '@heroicons/react/24/outline';
import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory } from '../declarations/auth/auth.did.js';
import type { Profile, Result } from '../declarations/auth/auth.did.js';

export default function CreateProfilePage() {
  const router = useRouter();
  const { isAuthenticated, currentIdentity } = useAuth();
  const client = useClient(); // Initialize the bundly client
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'Client' | 'ServiceProvider' | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    // email: '',
    phone: '',
  });
  const [reauthRequired, setReauthRequired] = useState(false);

  
  useEffect(() => {
    const timer = setTimeout(() => {
        if (!isAuthenticated) {
            console.warn("Not authenticated, redirecting to login...");
            router.push('/client');
        } else {
            setReauthRequired(false);
            setError(null);
        }
    }, 1500);

    return () => clearTimeout(timer);
  }, [isAuthenticated, router]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handler for our custom re-authentication button
  const handleReAuth = async () => {
    try {
      setIsLoading(true);
      setError('');
      const provider = client.getProvider("internet-identity");
      if (!provider) throw new Error('Internet Identity provider not found');
      await provider.connect();
      // On success, clear the error and hide the re-auth prompt
      setReauthRequired(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setReauthRequired(false);

    if (!selectedRole) {
      setError('Please select a role.');
      return;
    }
    // Removed email from all fields are required - rey
    if (!formData.name.trim()|| !formData.phone.trim()) {
        setError('All fields are required.'); return;
    }
    // const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.com$/i;
    // if (!emailRegex.test(formData.email.trim())) {
    //   setError('Please enter a valid email address ending in .com.'); return;
    // }
    const phoneRegex = /^09\d{9}$/;
    if (!phoneRegex.test(formData.phone.trim())) {
      setError('Please enter a valid 11-digit phone number starting with 09.'); return;
    }

    setIsLoading(true);
    setSuccess(false);

    if (!isAuthenticated || !currentIdentity) {
      setError('Authentication session not found.');
      setReauthRequired(true);
      setIsLoading(false);
      return;
    }

    try {
      const host = process.env.NEXT_PUBLIC_IC_HOST_URL || 'http://localhost:4943';
      const agent = new HttpAgent({ identity: currentIdentity, host });
      
      if (process.env.NODE_ENV === 'development') await agent.fetchRootKey();

      const authCanisterId = process.env.NEXT_PUBLIC_AUTH_CANISTER_ID;
      if (!authCanisterId) throw new Error('Auth canister ID not found');

      const authActor = Actor.createActor(idlFactory, { agent, canisterId: authCanisterId });

      const result = await authActor.createProfile(
        formData.name.trim(),
        // formData.email.trim(),
        formData.phone.trim(),
        selectedRole === 'Client' ? { Client: null } : { ServiceProvider: null }
      ) as Result;

      if ('err' in result) {
        throw new Error(result.err || 'Failed to create profile');
      }
      
      setSuccess(true);
      setTimeout(() => {
        router.push(selectedRole === 'Client' ? '/client/home' : '/provider/home');
      }, 2000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      if (errorMessage.includes("Invalid delegation expiry")) {
        setError("Your secure session has expired for security. Please re-authenticate to continue.");
        setReauthRequired(true);
      } else {
        setError(errorMessage);
      }
      console.error('Profile creation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated && !router.isReady) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-slate-700">Waiting for authentication...</p>
        </div>
    );
  }

  return (
    <>
      <Head>
        <title>Create Your SRV Profile</title>
        <meta name="description" content="Complete your sign up by creating your SRV profile." />
      </Head>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden md:flex">
          <div className="hidden md:flex md:w-1/2 bg-blue-600 p-10 flex-col justify-center items-center text-white text-center">
            <Image
              src="/logo.svg"
              alt="SRV Logo"
              width={180}
              height={Math.round(180 * (760/1000))}
            />
            <h1 className="text-3xl font-bold mt-4 text-yellow-300">Welcome to SRV!</h1>
            <p className="mt-2 text-blue-100 max-w-xs">
              Just a few more details to get you started on your journey.
            </p>
          </div>

          <div className="w-full md:w-1/2 p-8 lg:p-12">
            {success ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="p-4 bg-green-100 rounded-full mb-4">
                    <UserPlusIcon className="h-12 w-12 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-green-700">Profile Created!</h2>
                  <p className="text-slate-600 mt-2">Redirecting you to your dashboard...</p>
              </div>
            ) : (
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="text-center md:hidden mb-6">
                    <h1 className="text-3xl font-bold text-blue-600">Create Profile</h1>
                    <p className="mt-2 text-slate-500 text-sm">Let's get you started.</p>
                </div>
                
                {error && (
                  <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700 text-left">{error}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {reauthRequired ? (
                  <div className="text-center space-y-4 pt-4">
                     <p className="text-slate-700 font-medium">Please re-authenticate to continue.</p>
                     <button
                        type="button" // Important to prevent form submission
                        onClick={handleReAuth}
                        disabled={isLoading}
                        className={`w-full max-w-xs mx-auto mt-2 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg 
                                    transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105
                                    ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        {isLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                              <span>Connecting...</span>
                            </>
                        ) : (
                            <>
                              <FingerPrintIcon className="h-6 w-6 mr-2" />
                              Login Again with Internet Identity
                            </>
                        )}
                      </button>
                  </div>
                ) : (
                  <>
                    {/* Role Selection */}
                    <div>
                      <h3 className="text-lg font-medium text-slate-800 mb-3">First, choose your role:</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setSelectedRole('Client')}
                          className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${selectedRole === 'Client' ? 'border-blue-600 bg-blue-50 shadow-md' : 'border-gray-200 hover:border-blue-400'}`}
                        >
                          <UserIcon className={`h-8 w-8 mb-2 ${selectedRole === 'Client' ? 'text-blue-600' : 'text-gray-400'}`} />
                          <span className={`font-semibold ${selectedRole === 'Client' ? 'text-blue-700' : 'text-slate-700'}`}>Client</span>
                          <span className="text-xs text-gray-500">I need services</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedRole('ServiceProvider')}
                          className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${selectedRole === 'ServiceProvider' ? 'border-yellow-400 bg-yellow-50 shadow-md' : 'border-gray-200 hover:border-yellow-300'}`}
                        >
                          <WrenchScrewdriverIcon className={`h-8 w-8 mb-2 ${selectedRole === 'ServiceProvider' ? 'text-yellow-600' : 'text-gray-400'}`} />
                          <span className={`font-semibold ${selectedRole === 'ServiceProvider' ? 'text-yellow-700' : 'text-slate-700'}`}>Service Provider</span>
                          <span className="text-xs text-gray-500">I offer services</span>
                        </button>
                      </div>
                    </div>

                    {/* Form Inputs */}
                    {selectedRole && (
                        <div className="space-y-4 border-t pt-6">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <UserIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleInputChange} required className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            {/* <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleInputChange} required className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div> */}
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input type="tel" name="phone" placeholder="Phone Number (e.g., 0917...)" value={formData.phone} onChange={handleInputChange} required className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                        </div>
                    )}
                    
                    {/* Submit Button */}
                    {selectedRole && (
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg 
                                      transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105
                                      disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                          {isLoading && !reauthRequired ? (
                              <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                              <span>Creating Profile...</span>
                              </>
                          ) : (
                              <>
                              <UserPlusIcon className="h-6 w-6 mr-2" />
                              Create Profile
                              </>
                          )}
                        </button>
                    )}
                  </>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}