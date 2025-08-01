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
  ChevronRightIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/solid";
import BottomNavigation from "../../components/provider/BottomNavigation"; // Adjust path as needed
import { useClientProfile } from "../../hooks/useClientProfile"; // Adjust path as needed
import { useReputation } from "../../hooks/useReputation"; // Import the reputation hook
import { useClientAnalytics } from "../../hooks/useClientAnalytics"; // Import the client analytics hook
import { useProviderBookingManagement } from "../../hooks/useProviderBookingManagement";

// Reusable component for the reputation score visualization
const ReputationScore: React.FC<{ score: number }> = ({ score }) => {
  const getScoreColor = (value: number) => {
    if (value >= 80) return "#22c55e"; // green-500
    if (value >= 60) return "#facc15"; // yellow-400
    if (value >= 40) return "#f97316"; // orange-500
    return "#ef4444"; // red-500
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
        <p className="text-sm text-gray-500">Reputation</p>
      </div>
    </div>
  );
};

// Trust Level Badge Component
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
              <span className="mb-1 block text-sm font-medium text-blue-800">
                New provider
              </span>
              <span className="block text-gray-700">
                Complete your first service booking to start building your
                professional reputation.
              </span>
            </>
          ),
        };
      case "Low":
        return {
          color: "bg-red-100 text-red-800 border-red-300",
          icon: "⚠️",
          description:
            "Building trust - Focus on delivering quality service and maintaining good client relationships to improve your provider rating.",
        };
      case "Medium":
        return {
          color: "bg-yellow-100 text-yellow-800 border-yellow-300",
          icon: "⭐",
          description:
            "Reliable provider - You're establishing a good track record! Continue providing excellent service to reach higher trust levels.",
        };
      case "High":
        return {
          color: "bg-blue-100 text-blue-800 border-blue-300",
          icon: "🏆",
          description:
            "Trusted professional - Excellent reputation! Clients trust your expertise and reliability. You're a valued service provider.",
        };
      case "VeryHigh":
        return {
          color: "bg-green-100 text-green-800 border-green-300",
          icon: "💎",
          description:
            "Elite provider - Outstanding professional reputation! You're among the top-rated service providers on our platform.",
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
        {trustLevel} Trust
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
          Your reputation reflects your professionalism and service quality on
          the platform. Higher scores and trust levels attract more clients and
          build stronger business relationships.
        </span>
        {reputationDisplay && reputationDisplay.bookings > 0 && (
          <span className="mt-1 block text-xs text-gray-500">
            Based on {reputationDisplay.bookings} completed service
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
  const { analytics } = useProviderBookingManagement();
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
    },
    {
      name: "Services Completed",
      value: formattedStats.servicesCompleted,
      icon: CheckBadgeIcon,
    },
    {
      name: "Total earnings",
      value: `₱${(analytics?.totalRevenue || 0).toFixed(2)}`,
      icon: CurrencyEuroIcon,
    },
    {
      name: "Member Since",
      value: formattedStats.memberSince,
      icon: CalendarIcon,
    },
  ];

  if (analyticsLoading) {
    return (
      <div className="mt-8">
        <h3 className="mb-4 text-center text-lg font-semibold text-gray-800">
          Your Statistics
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className="flex flex-col items-center justify-center rounded-lg bg-gray-50 p-4 text-center"
            >
              <div className="mb-2 h-8 w-8 animate-pulse rounded bg-gray-300" />
              <div className="mb-1 h-6 w-12 animate-pulse rounded bg-gray-300" />
              <div className="h-3 w-20 animate-pulse rounded bg-gray-300" />
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
      <h3 className="mb-4 text-center text-lg font-semibold text-gray-800">
        Your Statistics
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="flex flex-col items-center justify-center rounded-lg bg-gray-50 p-4 text-center"
          >
            <stat.icon className="mb-2 h-8 w-8 text-blue-600" />
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const SPProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, loading, error, updateProfile } = useClientProfile();
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
  const [showAboutInfo, setShowAboutInfo] = useState(false);

  // Get reputation score with fallback for display
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
        profile.profilePicture?.imageUrl || "/default-provider.svg",
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

  const handleSwitchToClient = () => {
    // Placeholder function for future implementation
    console.log("Attempting to switch to Client mode...");
    alert("Feature coming soon!");
  };

  if (loading && !profile) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
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

      <main className="mx-auto max-w-6xl p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8">
          {/* Left Column: Profile Info & Switch Button */}
          <div className="space-y-4 lg:col-span-1">
            <div className="rounded-xl bg-white p-6 shadow-md">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <img
                    src={previewImage || "/default.svg"}
                    alt="Profile Picture"
                    className="h-32 w-32 rounded-full border-4 border-white object-cover shadow-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/default.svg";
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
                      {name || "Client Name"}
                    </h2>
                    <p className="text-md text-gray-500">
                      {phone || "No phone number"}
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
            <div className="rounded-lg bg-blue-600 text-white shadow-sm">
              <button
                onClick={handleSwitchToClient}
                className="group flex w-full items-center justify-between rounded-lg p-4 text-left text-black transition-colors hover:bg-yellow-300"
              >
                <div className="flex items-center">
                  <ArrowPathRoundedSquareIcon className="mr-4 h-6 w-6 text-white group-hover:text-black" />
                  <span className="text-md font-medium text-white group-hover:text-black">
                    Switch into Client Mode
                  </span>
                </div>
                <ChevronRightIcon className="h-5 w-5 text-white group-hover:text-black" />
              </button>
            </div>
          </div>

          {/* Right Column: Reputation and Stats */}
          <div className="mt-8 lg:col-span-2 lg:mt-0">
            <div className="rounded-xl bg-white p-6 shadow-md">
              <h3 className="mb-4 text-center text-lg font-semibold text-gray-800">
                Your Reputation
              </h3>

              {/* Reputation Loading State */}
              {reputationLoading ? (
                <div className="flex justify-center">
                  <div className="flex h-48 w-48 items-center justify-center">
                    <div className="text-center">
                      <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
                      <p className="text-sm text-gray-500">
                        Loading reputation...
                      </p>
                    </div>
                  </div>
                </div>
              ) : reputationError ? (
                /* Reputation Error State - Display network error as requested */
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
                /* Normal Reputation Display */
                <div className="flex flex-col items-center">
                  <div className="flex justify-center">
                    <ReputationScore score={reputationScore} />
                  </div>
                  {/* Trust Level Badge */}
                  {reputationDisplay && (
                    <>
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
                      {reputationDisplay.level === "New" && (
                        <AboutReputationInfo
                          show={showAboutInfo}
                          reputationDisplay={reputationDisplay}
                        />
                      )}
                    </>
                  )}
                </div>
              )}

              {/* AboutReputationInfo is now shown only for New trust level above */}
              <div className="mt-6 border-t border-gray-200 pt-6">
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
      <BottomNavigation />
    </div>
  );
};

export default SPProfilePage;
