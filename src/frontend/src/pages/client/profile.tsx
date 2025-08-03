import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  PencilIcon,
  CameraIcon,
  BriefcaseIcon,
  CheckBadgeIcon,
  CurrencyEuroIcon,
  CalendarIcon,
  ArrowPathRoundedSquareIcon,
  ChevronRightIcon, // Added for the switch button
  InformationCircleIcon,
} from "@heroicons/react/24/solid";
import BottomNavigation from "../../components/client/BottomNavigation"; // Adjust path as needed
import { useClientProfile } from "../../hooks/useClientProfile"; // Adjust path as needed
import { useLogout } from "../../hooks/logout";
import { useReputation } from "../../hooks/useReputation"; // Import the reputation hook
import { useClientAnalytics } from "../../hooks/useClientAnalytics"; // Import the client analytics hook

// --- Provider's advanced TrustLevelBadge ---
interface TrustLevelBadgeProps {
  trustLevel: string;
  onInfoClick?: () => void;
  infoOpen?: boolean;
}
const TrustLevelBadge: React.FC<TrustLevelBadgeProps> = ({
  trustLevel,
  onInfoClick,
  infoOpen,
}) => {
  const getTrustLevelConfig = (level: string) => {
    switch (level) {
      case "New":
        return {
          color: "bg-blue-50 text-blue-900 border-blue-200",
          icon: "🆕",
          description: (
            <>
              <span className="mb-1 flex items-center justify-center gap-2 text-lg font-bold text-blue-700">
                <span className="inline-block text-2xl">🎉</span> Welcome to
                SRV!
                {onInfoClick && (
                  <button
                    type="button"
                    aria-label="Show info about reputation score"
                    className="ml-2 rounded-full p-1 hover:bg-gray-200 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    onClick={onInfoClick}
                  >
                    <InformationCircleIcon
                      className={`h-5 w-5 text-blue-500 transition-transform ${infoOpen ? "rotate-90" : ""}`}
                    />
                  </button>
                )}
              </span>
              <span className="block text-gray-700">
                Complete your first booking to start building your reputation.
              </span>
            </>
          ),
        };
      case "Low":
        return {
          color: "bg-red-100 text-red-800 border-red-300",
          icon: "⚠️",
          description:
            "Building trust - Focus on completing bookings and maintaining good conduct to improve your client rating.",
        };
      case "Medium":
        return {
          color: "bg-yellow-100 text-yellow-800 border-yellow-300",
          icon: "⭐",
          description:
            "Reliable client - You're building a good reputation! Keep up the excellent conduct.",
        };
      case "High":
        return {
          color: "bg-blue-100 text-blue-800 border-blue-300",
          icon: "🏆",
          description:
            "Trusted client - Excellent reputation! Service providers trust you as a reliable client.",
        };
      case "VeryHigh":
        return {
          color: "bg-green-100 text-green-800 border-green-300",
          icon: "💎",
          description:
            "Elite client - Outstanding reputation! You're among the top-rated clients on our platform.",
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800 border-gray-300",
          icon: "❓",
          description: "Trust level not available.",
        };
    }
  };
  const config = getTrustLevelConfig(trustLevel);
  return (
    <div className="mt-4 flex flex-col items-center">
      <div
        className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold ${config.color}`}
      >
        <span className="mr-2">{config.icon}</span>
        {trustLevel} User
      </div>
      <div className="mt-3 flex w-full max-w-md flex-col items-center">
        {trustLevel === "New" ? (
          <div className="w-full rounded-lg border border-blue-100 bg-blue-50 p-4 text-center shadow-sm">
            {config.description}
          </div>
        ) : (
          <p className="max-w-sm text-center text-xs leading-relaxed text-gray-600">
            {config.description}
          </p>
        )}
      </div>
    </div>
  );
};

// Collapsible About Reputation Info Section
interface AboutReputationInfoProps {
  show: boolean;
  reputationDisplay: any;
}
const AboutReputationInfo: React.FC<AboutReputationInfoProps> = ({
  show,
  reputationDisplay,
}) => {
  if (!show) return null;
  return (
    <div className="mx-auto mt-2 max-w-md">
      <div className="animate-fade-in rounded-lg border border-gray-200 bg-gray-50 p-4 text-center shadow-sm">
        <span className="mb-1 block text-sm text-gray-600">
          Your reputation reflects your reliability and conduct on the platform.
          Higher scores and trust levels build stronger relationships with
          service providers.
        </span>
        {reputationDisplay && reputationDisplay.bookings > 0 && (
          <span className="mt-1 block text-xs text-gray-500">
            Based on {reputationDisplay.bookings} completed booking
            {reputationDisplay.bookings !== 1 ? "s" : ""}
            {reputationDisplay.rating &&
              ` with ${reputationDisplay.rating.toFixed(1)}★ average rating`}
          </span>
        )}
      </div>
    </div>
  );
};

// Component for displaying client statistics
const ClientStats: React.FC = () => {
  const {
    loading: analyticsLoading,
    error: analyticsError,
    getFormattedStats,
  } = useClientAnalytics();

  const formattedStats = getFormattedStats();

  const stats = [
    {
      name: "Total Bookings",
      value: formattedStats.totalBookings,
      icon: BriefcaseIcon,
      bg: "bg-blue-100 text-blue-700",
    },
    {
      name: "Services Completed",
      value: formattedStats.servicesCompleted,
      icon: CheckBadgeIcon,
      bg: "bg-blue-100 text-blue-700",
    },
    {
      name: "Total Spent",
      value: formattedStats.totalSpent,
      icon: CurrencyEuroIcon,
      bg: "bg-blue-100 text-blue-700",
    },
    {
      name: "Member Since",
      value: formattedStats.memberSince,
      icon: CalendarIcon,
      bg: "bg-blue-100 text-blue-700",
    },
  ];

  if (analyticsLoading) {
    return (
      <div className="mt-8">
        <h3 className="mb-4 text-center text-lg font-semibold text-gray-800">
          Your Statistics
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className="flex animate-pulse flex-col items-center justify-center rounded-2xl bg-white p-6 shadow"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-200" />
              <div className="mb-2 h-6 w-16 rounded bg-gray-200" />
              <div className="h-3 w-20 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (analyticsError) {
    return (
      <div className="mt-8">
        <h3 className="mb-4 text-center text-lg font-semibold text-gray-800">
          Your Statistics
        </h3>
        <div className="flex justify-center">
          <p className="text-sm text-red-500">
            Failed to load statistics: {analyticsError}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h3 className="mb-4 text-center text-xl font-bold tracking-tight text-black">
        Your Booking & Activity Summary
      </h3>
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {stats.map((stat) => {
          const isMemberSince = stat.name === "Member Since";
          return (
            <div
              key={stat.name}
              className={`flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-6 shadow-md transition-shadow hover:shadow-lg duration-200${isMemberSince ? "w-full text-center" : ""}`}
            >
              <div
                className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full ${stat.bg} shadow-inner`}
              >
                <stat.icon className="h-7 w-7" />
              </div>
              <p
                className={`text-2xl font-extrabold text-gray-900 mb-1${isMemberSince ? "w-full text-center" : ""}`}
              >
                {stat.value}
              </p>
              <p
                className={`text-xs font-medium text-gray-500 tracking-wide${isMemberSince || stat.name === "Services Completed" ? "w-full text-center" : "text-center"}`}
              >
                {stat.name}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ClientProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, loading, error, updateProfile, switchRole } =
    useClientProfile();
  const { logout } = useLogout();
  const {
    loading: reputationLoading,
    error: reputationError,
    getReputationDisplay,
  } = useReputation();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);

  // Get reputation score with fallback for display
  const [showAboutInfo, setShowAboutInfo] = useState(false);
  const reputationDisplay = getReputationDisplay();
  const reputationScore = reputationDisplay?.score ?? 0;

  useEffect(() => {
    document.title = "My Profile | SRV";
  }, []);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setPhone(profile.phone || "");
      setPreviewImage(
        profile.profilePicture?.imageUrl || "/default-client.svg",
      );
    }
  }, [profile]);

  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSaveChanges = async () => {
    const success = await updateProfile({ name, phone, imageFile });
    if (success) {
      setIsEditing(false);
      setImageFile(null); // Clear the file after saving
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setImageFile(null);
    // Reset fields to original profile data
    if (profile) {
      setName(profile.name);
      setPhone(profile.phone || "");
      setPreviewImage(profile.profilePicture?.imageUrl || "/don.jpg");
    }
  };

  const handleSwitchToProvider = async () => {
    setIsSwitchingRole(true);
    try {
      const success = await switchRole();
      if (success) {
        // Navigate to provider dashboard after successful role switch
        navigate("/provider");
      }
    } catch (error) {
      console.error("Failed to switch role:", error);
      // Error is already handled in the hook and displayed in the UI
    } finally {
      setIsSwitchingRole(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-100 pb-24">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="rounded-full p-2 hover:bg-gray-100"
          >
            <ArrowLeftIcon className="h-6 w-6 text-gray-700" />
          </button>
          <h1 className="ml-4 text-xl font-bold text-gray-900">My Profile</h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8">
          {/* Left Column: Profile Info, Switch Button, Logout */}
          <div className="flex flex-col space-y-4 lg:col-span-1">
            <div className="rounded-xl bg-white p-6 shadow-md">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <img
                    src={previewImage || "/default-client.svg"}
                    alt="Profile Picture"
                    className="h-32 w-32 rounded-full border-4 border-white object-cover shadow-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "/default-client.svg";
                    }}
                  />
                  {isEditing && (
                    <>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*"
                      />
                      <button
                        onClick={handleImageUploadClick}
                        className="absolute right-1 bottom-1 rounded-full bg-blue-600 p-2 text-white transition-colors hover:bg-blue-700"
                      >
                        <CameraIcon className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>

                {!isEditing ? (
                  <>
                    <h2 className="text-2xl font-bold text-gray-800">
                      {profile?.name || "Client Name"}
                    </h2>
                    <p className="text-md text-gray-500">
                      {profile?.phone || "No phone number"}
                    </p>
                  </>
                ) : (
                  <div className="mt-4 w-full max-w-sm space-y-4">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-left text-sm font-medium text-gray-700"
                      >
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-left text-sm font-medium text-gray-700"
                      >
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <div className="mt-6">
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center rounded-lg bg-blue-50 px-6 py-2 font-semibold text-blue-700 transition-colors hover:bg-blue-100"
                    >
                      <PencilIcon className="mr-2 h-4 w-4" />
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex space-x-3">
                      <button
                        onClick={handleCancelEdit}
                        className="rounded-lg bg-gray-200 px-6 py-2 font-semibold text-gray-800 transition-colors hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveChanges}
                        disabled={loading}
                        className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400"
                      >
                        {loading ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* --- Switch to SRVice Provider Button --- */}
            <div className="rounded-lg bg-yellow-300 shadow-sm">
              <button
                onClick={handleSwitchToProvider}
                disabled={isSwitchingRole}
                className={`group flex w-full items-center justify-between rounded-lg p-4 text-left transition-colors ${
                  isSwitchingRole
                    ? "cursor-not-allowed opacity-50"
                    : "hover:bg-blue-600"
                }`}
              >
                <div className="flex items-center">
                  <ArrowPathRoundedSquareIcon
                    className={`mr-4 h-6 w-6 ${
                      isSwitchingRole
                        ? "animate-spin text-blue-600"
                        : "text-black group-hover:text-white"
                    }`}
                  />
                  <span className="text-md font-medium text-gray-800 group-hover:text-white">
                    {isSwitchingRole
                      ? "Switching Role..."
                      : "Switch into SRVice Provider"}
                  </span>
                </div>
                {!isSwitchingRole && (
                  <ChevronRightIcon className="h-5 w-5 text-black group-hover:text-white" />
                )}
              </button>
            </div>
            {/* Logout button for desktop (left column) */}
            <div className="hidden lg:block">
              <button
                onClick={logout}
                className="mt-2 flex w-full items-center justify-center rounded-lg border border-gray-200 bg-white px-6 py-3 text-lg font-semibold text-red-600 shadow transition-colors hover:bg-red-50"
              >
                Log Out
              </button>
            </div>
          </div>

          {/* Right Column: Reputation and Stats */}
          <div className="mt-8 lg:col-span-2 lg:mt-0">
            <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-blue-100 p-8 shadow-xl">
              <h3 className="mb-6 text-center text-2xl font-bold tracking-tight text-black drop-shadow-sm">
                Your Reputation Score
              </h3>
              {/* Reputation Loading State */}
              {reputationLoading ? (
                <div className="flex justify-center">
                  <div className="flex h-48 w-48 items-center justify-center">
                    <div className="text-center">
                      <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
                      <p className="text-sm text-gray-500">
                        Loading reputation score...
                      </p>
                    </div>
                  </div>
                </div>
              ) : reputationError ? (
                <div className="flex justify-center">
                  <div className="flex h-48 w-48 items-center justify-center">
                    <div className="text-center">
                      <div className="mb-4 text-red-500">
                        <svg
                          className="mx-auto h-16 w-16"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"
                          />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-red-600">
                        {reputationError}
                      </p>
                      <p className="mt-2 text-xs text-gray-500">
                        Please check your connection and try again
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6">
                  <div className="mb-2 flex justify-center">
                    <ReputationScore score={reputationScore} />
                  </div>
                  {/* Trust Level Badge */}
                  {reputationDisplay && (
                    <>
                      <div className="flex w-full justify-center">
                        <TrustLevelBadge
                          trustLevel={reputationDisplay.level}
                          onInfoClick={
                            reputationDisplay.level === "New"
                              ? () => setShowAboutInfo((v) => !v)
                              : undefined
                          }
                          infoOpen={
                            reputationDisplay.level === "New"
                              ? showAboutInfo
                              : undefined
                          }
                        />
                      </div>
                      {reputationDisplay.level === "New" && (
                        <div className="flex w-full justify-center">
                          <AboutReputationInfo
                            show={showAboutInfo}
                            reputationDisplay={reputationDisplay}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
              {/* AboutReputationInfo is now shown only for New trust level above */}
              <div className="mt-8 border-t border-gray-200 pt-8">
                <ClientStats />
              </div>
            </div>
          </div>
        </div>
        {error && <p className="mt-4 text-center text-red-500">{error}</p>}
        {reputationError && !error && (
          <p className="mt-4 text-center text-red-500">
            Reputation: {reputationError}
          </p>
        )}
      </main>
      {/* Logout button for mobile (bottom, not sticky) */}
      <div className="mt-8 block w-full px-4 lg:hidden">
        <button
          onClick={logout}
          className="flex w-full items-center justify-center rounded-lg border border-gray-200 bg-white px-6 py-3 text-lg font-semibold text-red-600 shadow transition-colors hover:bg-red-50"
        >
          Log Out
        </button>
      </div>
      <BottomNavigation />
    </div>
  );
};

// Reusable component for the reputation score visualization (restored advanced version)
const ReputationScore: React.FC<{ score: number }> = ({ score }) => {
  const getScoreColor = (value: number) => {
    if (value >= 80) return "#2563eb"; // blue-600
    if (value >= 60) return "#60a5fa"; // blue-300
    if (value >= 40) return "#facc15"; // yellow-400
    return "#fef08a"; // yellow-200
  };

  const color = getScoreColor(score);
  const circumference = 2 * Math.PI * 45; // 45 is the radius
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex h-48 w-48 items-center justify-center">
      <svg className="absolute h-full w-full" viewBox="0 0 100 100">
        <circle
          className="text-gray-200"
          strokeWidth="10"
          stroke="currentColor"
          fill="transparent"
          r="45"
          cx="50"
          cy="50"
        />
        <circle
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          fill="transparent"
          r="45"
          cx="50"
          cy="50"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
            transform: "rotate(-90deg)",
            transformOrigin: "50% 50%",
            transition: "stroke-dashoffset 0.5s ease-in-out",
          }}
        />
      </svg>
      <div className="text-center">
        <span className="text-5xl font-bold text-gray-800">{score}</span>
      </div>
    </div>
  );
};

export default ClientProfilePage;
