import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext"; // Adjust path as needed
import {
  BellIcon,
  ShieldCheckIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon,
  ChevronRightIcon,
  ArrowPathRoundedSquareIcon, // Icon for the new switch button
} from "@heroicons/react/24/outline";
import BottomNavigation from "../../components/client/BottomNavigation"; // Adjust path as needed
import { useLogout } from "../../hooks/logout"; // Adjust path as needed
import { useClientProfile } from "../../hooks/useClientProfile"; // Hook to get profile data

const SettingsPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { logout } = useLogout();
  const navigate = useNavigate();
  const { profile, loading: profileLoading } = useClientProfile();

  // Set the document title when the component mounts
  useEffect(() => {
    document.title = "Settings | SRV";
  }, []);

  // Menu items, with "Profile" removed as it now has its own section
  const menuItems = [
    { name: "Notifications", icon: BellIcon, href: "/client/notifications" },
    { name: "Security", icon: ShieldCheckIcon, href: "/client/security" },
    {
      name: "Help & Support",
      icon: QuestionMarkCircleIcon,
      href: "/client/help",
    },
  ];

  const handleSwitchToProvider = () => {
    // Placeholder function for future implementation
    console.log("Attempting to switch to Service Provider mode...");
    alert("Feature coming soon!");
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-3 text-center">
          <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        </div>
      </header>

      <main className="mx-auto max-w-4xl p-4">
        {isAuthenticated ? (
          <div className="space-y-4">
            {/* --- NEW: Enhanced Profile Section --- */}
            <div className="rounded-lg bg-white shadow-sm">
              <button
                onClick={() => navigate("/client/profile")}
                className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center">
                  {profileLoading ? (
                    <div className="mr-4 h-12 w-12 animate-pulse rounded-full bg-gray-200"></div>
                  ) : (
                    <img
                      src={profile?.profilePicture?.imageUrl || "/don.jpg"} // Fallback to a default avatar
                      alt="Profile"
                      className="mr-4 h-12 w-12 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <p className="text-md font-semibold text-gray-800">
                      {profileLoading ? "Loading..." : profile?.name || "User"}
                    </p>
                    <p className="text-sm text-gray-500">View Profile</p>
                  </div>
                </div>
                <ChevronRightIcon className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* --- NEW: Switch to SRVice Provider Button --- */}
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
                <ChevronRightIcon className="h-5 w-5 text-gray-400 group-hover:text-white" />
              </button>
            </div>

            {/* --- Other Menu Items --- */}
            <div className="rounded-lg bg-white shadow-sm">
              <ul className="divide-y divide-gray-200">
                {menuItems.map((item) => (
                  <li key={item.name}>
                    <button
                      onClick={() => navigate(item.href)}
                      className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-gray-50"
                    >
                      <div className="flex items-center">
                        <item.icon className="mr-4 h-6 w-6 text-gray-500" />
                        <span className="text-md font-medium text-gray-800">
                          {item.name}
                        </span>
                      </div>
                      <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg bg-white shadow-sm">
              <button
                onClick={logout}
                className="flex w-full items-center p-4 text-left text-red-600 transition-colors hover:bg-red-50"
              >
                <ArrowRightOnRectangleIcon className="mr-4 h-6 w-6" />
                <span className="text-md font-medium">Log Out</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-white p-6 text-center shadow">
            <p className="mb-4 text-lg text-gray-700">
              Please log in to manage your settings.
            </p>
            <button
              onClick={() => navigate("/login")} // Navigate to a login page
              className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            >
              Log In
            </button>
          </div>
        )}
      </main>
      <BottomNavigation />
    </div>
  );
};

export default SettingsPage;
