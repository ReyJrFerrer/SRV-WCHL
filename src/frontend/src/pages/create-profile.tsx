import React, { useState, FormEvent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authCanisterService } from "../services/authCanisterService";
import {
  UserIcon,
  WrenchScrewdriverIcon,
  UserPlusIcon,
  PhoneIcon,
  ExclamationTriangleIcon,
  FingerPrintIcon,
} from "@heroicons/react/24/outline";

export default function CreateProfilePage() {
  const navigate = useNavigate();
  const { isAuthenticated, identity, login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedRole, setSelectedRole] = useState<
    "Client" | "ServiceProvider" | null
  >(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });
  const [reauthRequired, setReauthRequired] = useState(false);

  // Setting document title
  // Set document title using React 19 approach
  useEffect(() => {
    document.title = "description";
    // You could add a meta description here too if needed
    // const metaDescription = document.querySelector('meta[name="description"]');
    // if (metaDescription) {
    //   metaDescription.setAttribute('content', 'Find the best service providers near you');
    // }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        console.warn("Not authenticated, redirecting to login...");
        navigate("/client");
      } else {
        setReauthRequired(false);
        setError(null);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [isAuthenticated, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handler for our custom re-authentication button
  const handleReAuth = async () => {
    try {
      setIsLoading(true);
      setError("");
      await login();
      // On success, clear the error and hide the re-auth prompt
      setReauthRequired(false);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to connect. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setReauthRequired(false);

    if (!selectedRole) {
      setError("Please select a role.");
      return;
    }

    if (!formData.name.trim() || !formData.phone.trim()) {
      setError("All fields are required.");
      return;
    }

    const phoneRegex = /^09\d{9}$/;
    if (!phoneRegex.test(formData.phone.trim())) {
      setError("Please enter a valid 11-digit phone number starting with 09.");
      return;
    }

    setIsLoading(true);
    setSuccess(false);

    if (!isAuthenticated || !identity) {
      setError("Authentication session not found.");
      setReauthRequired(true);
      setIsLoading(false);
      return;
    }

    try {
      const result = await authCanisterService.createProfile(
        formData.name.trim(),
        formData.phone.trim(),
        selectedRole,
        identity,
      );

      if (!result) {
        throw new Error("Failed to create profile");
      }

      setSuccess(true);
      setTimeout(() => {
        navigate(selectedRole === "Client" ? "/client/home" : "/provider/home");
      }, 2000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred.";
      if (
        errorMessage.includes("Invalid delegation expiry") ||
        errorMessage.includes("Authentication required")
      ) {
        setError(
          "Your secure session has expired for security. Please re-authenticate to continue.",
        );
        setReauthRequired(true);
      } else {
        setError(errorMessage);
      }
      console.error("Profile creation error:", err);
    } finally {
      setIsLoading(false);
    }
  };
  //TODO: Fix the isReady
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 text-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
        <p className="text-slate-700">Waiting for authentication...</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl md:flex">
          <div className="hidden flex-col items-center justify-center bg-blue-600 p-10 text-center text-white md:flex md:w-1/2">
            <img
              src="/logo.svg"
              alt="SRV Logo"
              width={180}
              height={Math.round(180 * (760 / 1000))}
            />
            <h1 className="mt-4 text-3xl font-bold text-yellow-300">
              Welcome to SRV!
            </h1>
            <p className="mt-2 max-w-xs text-blue-100">
              Just a few more details to get you started on your journey.
            </p>
          </div>

          <div className="w-full p-8 md:w-1/2 lg:p-12">
            {success ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-4 rounded-full bg-green-100 p-4">
                  <UserPlusIcon className="h-12 w-12 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-green-700">
                  Profile Created!
                </h2>
                <p className="mt-2 text-slate-600">
                  Redirecting you to your dashboard...
                </p>
              </div>
            ) : (
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="mb-6 text-center md:hidden">
                  <h1 className="text-3xl font-bold text-blue-600">
                    Create Profile
                  </h1>
                  <p className="mt-2 text-sm text-slate-500">
                    Let's get you started.
                  </p>
                </div>

                {error && (
                  <div className="rounded-r-lg border-l-4 border-red-400 bg-red-50 p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <ExclamationTriangleIcon
                          className="h-5 w-5 text-red-500"
                          aria-hidden="true"
                        />
                      </div>
                      <div className="ml-3">
                        <p className="text-left text-sm text-red-700">
                          {error}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {reauthRequired ? (
                  <div className="space-y-4 pt-4 text-center">
                    <p className="font-medium text-slate-700">
                      Please re-authenticate to continue.
                    </p>
                    <button
                      type="button" // Important to prevent form submission
                      onClick={handleReAuth}
                      disabled={isLoading}
                      className={`mx-auto mt-2 flex w-full max-w-xs transform items-center justify-center rounded-lg bg-blue-600 px-6 py-3 font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-blue-700 hover:shadow-xl ${isLoading ? "cursor-not-allowed opacity-70" : ""}`}
                    >
                      {isLoading ? (
                        <>
                          <div className="mr-3 h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
                          <span>Connecting...</span>
                        </>
                      ) : (
                        <>
                          <FingerPrintIcon className="mr-2 h-6 w-6" />
                          Login Again with Internet Identity
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Role Selection */}
                    <div>
                      <h3 className="mb-3 text-lg font-medium text-slate-800">
                        First, choose your role:
                      </h3>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => setSelectedRole("Client")}
                          className={`flex cursor-pointer flex-col items-center rounded-lg border-2 p-4 transition-all duration-200 ${selectedRole === "Client" ? "border-blue-600 bg-blue-50 shadow-md" : "border-gray-200 hover:border-blue-400"}`}
                        >
                          <UserIcon
                            className={`mb-2 h-8 w-8 ${selectedRole === "Client" ? "text-blue-600" : "text-gray-400"}`}
                          />
                          <span
                            className={`font-semibold ${selectedRole === "Client" ? "text-blue-700" : "text-slate-700"}`}
                          >
                            Client
                          </span>
                          <span className="text-xs text-gray-500">
                            I need services
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedRole("ServiceProvider")}
                          className={`flex cursor-pointer flex-col items-center rounded-lg border-2 p-4 transition-all duration-200 ${selectedRole === "ServiceProvider" ? "border-yellow-400 bg-yellow-50 shadow-md" : "border-gray-200 hover:border-yellow-300"}`}
                        >
                          <WrenchScrewdriverIcon
                            className={`mb-2 h-8 w-8 ${selectedRole === "ServiceProvider" ? "text-yellow-600" : "text-gray-400"}`}
                          />
                          <span
                            className={`font-semibold ${selectedRole === "ServiceProvider" ? "text-yellow-700" : "text-slate-700"}`}
                          >
                            Service Provider
                          </span>
                          <span className="text-xs text-gray-500">
                            I offer services
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Form Inputs */}
                    {selectedRole && (
                      <div className="space-y-4 border-t pt-6">
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <UserIcon className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            name="name"
                            placeholder="Full Name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                            className="w-full rounded-lg border border-gray-300 py-2 pr-3 pl-10 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>
                        {/* <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleInputChange} required className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div> */}
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <PhoneIcon className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="tel"
                            name="phone"
                            placeholder="Phone Number (e.g., 0917...)"
                            value={formData.phone}
                            onChange={handleInputChange}
                            required
                            className="w-full rounded-lg border border-gray-300 py-2 pr-3 pl-10 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* Submit Button */}
                    {selectedRole && (
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex w-full transform items-center justify-center rounded-lg bg-blue-600 px-6 py-3 font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-blue-700 hover:shadow-xl disabled:cursor-not-allowed disabled:bg-gray-400 disabled:hover:scale-100"
                      >
                        {isLoading && !reauthRequired ? (
                          <>
                            <div className="mr-3 h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
                            <span>Creating Profile...</span>
                          </>
                        ) : (
                          <>
                            <UserPlusIcon className="mr-2 h-6 w-6" />
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
