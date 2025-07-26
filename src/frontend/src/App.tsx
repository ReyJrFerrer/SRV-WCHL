import { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import authCanisterService from "./services/authCanisterService";
import MainPage from "./components/MainPage";
import AboutUs from "./components/About-Us";

type CurrentView = "main" | "about";

// --- Import Page Components for Routing ---
import ClientHomePage from "./pages/client/home";
import ClientChatPage from "./pages/client/chat";
import ConversationPage from "./pages/client/chat/[providerId]";
import CreateProfilePage from "./pages/create-profile";
import ProviderHomePage from "./pages/provider/home";

/**
 * This component renders the main landing page for unauthenticated users.
 * It also contains the logic to check for an existing session and redirect
 * authenticated users to their respective dashboards.
 */
const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, identity, login, isLoading } = useAuth();
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [currentView, setCurrentView] = useState<CurrentView>("main");

  useEffect(() => {
    const checkProfileAndRedirect = async () => {
      if (isAuthenticated && identity) {
        setIsCheckingProfile(true);

        try {
          const profile = await authCanisterService.getMyProfile();
          if (profile) {
            if (profile.role === "Client") navigate("/client/home");
            else if (profile.role === "ServiceProvider")
              navigate("/provider/home");
            else navigate("/create-profile");
          } else {
            navigate("/create-profile");
          }
        } catch (err) {
          console.error("Profile check error:", err);
        } finally {
          setIsCheckingProfile(false);
        }
      } else {
        // If not authenticated, we are done checking.
        setIsCheckingProfile(false);
      }
    };
    checkProfileAndRedirect();
  }, [isAuthenticated, identity, navigate]);

  // Show a loading indicator while checking the user's session.
  if (isCheckingProfile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
        <div className="h-16 w-16 animate-spin rounded-full border-t-4 border-b-4 border-blue-600"></div>
        <p className="mt-4 text-lg text-gray-700">Loading...</p>
      </div>
    );
  }

  const handleNavigateToAbout = () => {
    setCurrentView("about");
  };

  const handleNavigateToMain = () => {
    setCurrentView("main");
  };

  return (
    <main className="bg-gray-50">
      {currentView === "main" && (
        <MainPage
          onLoginClick={login}
          isLoginLoading={isLoading}
          onNavigateToAbout={handleNavigateToAbout}
        />
      )}

      {currentView === "about" && (
        <AboutUs
          onLoginClick={login}
          isLoginLoading={isLoading}
          onNavigateToMain={handleNavigateToMain}
        />
      )}

      {/* {!isAuthenticated && (error || profileError) && (
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
      )} */}
    </main>
  );
};

/**
 * The main App component now serves as the central router for the entire application.
 * It defines all the available routes and the components they render.
 */
export default function App() {
  return (
    <Routes>
      {/* The landing page is the default route for the root path */}
      <Route path="/" element={<LandingPage />} />

      {/* --- Client-side Routes --- */}
      <Route path="/client/home" element={<ClientHomePage />} />
      <Route path="/client/chat" element={<ClientChatPage />} />
      {/* This is the dynamic route for individual chat conversations */}
      <Route path="/client/chat/:providerId" element={<ConversationPage />} />

      {/* --- Provider-side Routes --- */}
      <Route path="/provider/home" element={<ProviderHomePage />} />

      {/* --- Common Routes --- */}
      <Route path="/create-profile" element={<CreateProfilePage />} />
    </Routes>
  );
}
