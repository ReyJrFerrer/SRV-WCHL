import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import authCanisterService from "./services/authCanisterService";
import Hero from "./components/shared/Hero";
import Features from "./components/shared/Features";
import WhyChooseSRV from "./components/shared/WhyChooseSRV";
import AboutUs from "./components/shared/AboutUs";
import SDGSection from "./components/shared/SDGSection";
import Footer from "./components/shared/Footer";

export default function App() {
  const navigate = useNavigate();
  const { isAuthenticated, identity, login, isLoading, error } = useAuth();
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Reset auth actor when identity changes
  // useEffect(() => {
  //   if (identity) {
  //     // Refresh the actor with new identity
  //     refreshAuthActor(identity);
  //   } else {
  //     // Reset actor when no identity is present
  //     resetAuthActor();
  //   }
  // }, [identity]);

  // Check profile and redirect when authenticated
  useEffect(() => {
    const checkProfileAndRedirect = async () => {
      if (isAuthenticated && identity) {
        setIsCheckingProfile(true);
        setProfileError(null);

        try {
          // Pass identity from AuthContext to the service
          const profile = await authCanisterService.getMyProfile(identity);

          if (profile) {
            if (profile.role === "Client") {
              navigate("/client/home");
            } else if (profile.role === "ServiceProvider") {
              navigate("/provider/home");
            } else {
              navigate("/create-profile");
            }
          } else {
            navigate("/create-profile");
          }
        } catch (error) {
          console.error("Profile check error:", error);
          setProfileError(
            error instanceof Error ? error.message : "Error checking profile.",
          );
        } finally {
          setIsCheckingProfile(false);
        }
      }
    };

    checkProfileAndRedirect();
  }, [isAuthenticated, identity, navigate]);

  // Loading state while checking profile
  if (isCheckingProfile && isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
        <div className="h-16 w-16 animate-spin rounded-full border-t-4 border-b-4 border-blue-600"></div>
        <p className="mt-4 text-lg text-gray-700">Checking your profile...</p>
      </div>
    );
  }

  return (
    <main className="bg-gray-50">
      <Hero onLoginClick={login} isLoginLoading={isLoading} />
      <Features />
      <WhyChooseSRV />
      <SDGSection />
      <AboutUs />

      {!isAuthenticated && (error || profileError) && (
        <section className="bg-yellow-100 py-16 lg:py-24">
          <div className="container mx-auto px-6 text-center">
            <h2 className="mb-6 text-3xl font-bold text-slate-800 lg:text-4xl">
              Login to Continue
            </h2>
            <div className="mx-auto mb-6 max-w-md rounded-lg bg-red-100 p-4 text-sm text-red-700">
              Error: {error || profileError}
            </div>
            <button
              onClick={login}
              disabled={isLoading}
              className={`transform rounded-lg bg-blue-600 px-8 py-3 text-lg font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-blue-700 hover:shadow-xl ${
                isLoading ? "cursor-not-allowed opacity-70" : ""
              }`}
            >
              {isLoading ? "Connecting..." : "Retry Login"}
            </button>
          </div>
        </section>
      )}

      <Footer />
    </main>
  );
}
