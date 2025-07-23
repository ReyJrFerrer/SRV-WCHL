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
} from "@heroicons/react/24/solid";
import BottomNavigation from "../../components/client/BottomNavigation"; // Adjust path as needed
import { useClientProfile } from "../../hooks/useClientProfile"; // Adjust path as needed

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

// Component for displaying client statistics
const ClientStats: React.FC = () => {
  const stats = [
    { name: "Total Bookings", value: "14", icon: BriefcaseIcon },
    { name: "Services Completed", value: "12", icon: CheckBadgeIcon },
    { name: "Total Spent", value: "₱9,750", icon: CurrencyEuroIcon },
    { name: "Member Since", value: "July 2025", icon: CalendarIcon },
  ];

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

const ClientProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, loading, error, updateProfile } = useClientProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const reputationScore = 92; // Dummy score for now

  useEffect(() => {
    document.title = "My Profile | SRV";
  }, []);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setPhone(profile.phone || "");
      setPreviewImage(profile.profilePicture?.imageUrl || "/don.jpg");
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

  const handleSwitchToProvider = () => {
    // Placeholder function for future implementation
    console.log("Attempting to switch to Service Provider mode...");
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
                    src={previewImage || "/don.jpg"}
                    alt="Profile Picture"
                    className="h-32 w-32 rounded-full border-4 border-white object-cover shadow-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/don.jpg";
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
            <div className="rounded-lg bg-yellow-300 shadow-sm">
              <button
                onClick={handleSwitchToProvider}
                className="group flex w-full items-center justify-between rounded-lg p-4 text-left transition-colors hover:bg-blue-600"
              >
                <div className="flex items-center">
                  <ArrowPathRoundedSquareIcon className="mr-4 h-6 w-6 text-black group-hover:text-white" />
                  <span className="text-md font-medium text-gray-800 group-hover:text-white">
                    Switch into SRVice Provider
                  </span>
                </div>
                <ChevronRightIcon className="h-5 w-5 text-black group-hover:text-white" />
              </button>
            </div>
          </div>

          {/* Right Column: Reputation and Stats */}
          <div className="mt-8 lg:col-span-2 lg:mt-0">
            <div className="rounded-xl bg-white p-6 shadow-md">
              <h3 className="mb-4 text-center text-lg font-semibold text-gray-800">
                Your Reputation
              </h3>
              <div className="flex justify-center">
                <ReputationScore score={reputationScore} />
              </div>
              <p className="mx-auto mt-4 max-w-md text-center text-sm text-gray-500">
                Your score reflects your reliability and conduct on the
                platform. A higher score builds trust with service providers.
              </p>
              <div className="mt-6 border-t border-gray-200 pt-6">
                <ClientStats />
              </div>
            </div>
          </div>
        </div>
        {error && <p className="mt-4 text-center text-red-500">{error}</p>}
      </main>
      <BottomNavigation />
    </div>
  );
};

export default ClientProfilePage;
