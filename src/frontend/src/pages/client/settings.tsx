import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext"; // Adjust path as needed
import {
  UserCircleIcon,
  BellIcon,
  ShieldCheckIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import BottomNavigation from "../../components/client/BottomNavigation"; // Adjust path as needed
import { useLogout } from "../../hooks/logout"; // Adjust path as needed

const SettingsPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { logout } = useLogout();
  const navigate = useNavigate();

  // Set the document title when the component mounts
  useEffect(() => {
    document.title = "Settings | SRV";
  }, []);

  const menuItems = [
    { name: "Profile", icon: UserCircleIcon, href: "/client/profile" },
    { name: "Notifications", icon: BellIcon, href: "/client/notifications" },
    { name: "Security", icon: ShieldCheckIcon, href: "/client/security" },
    {
      name: "Help & Support",
      icon: QuestionMarkCircleIcon,
      href: "/client/help",
    },
  ];

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
