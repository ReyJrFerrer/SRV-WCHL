import React from "react";
import { CogIcon, UserCircleIcon, LockClosedIcon, BellIcon } from "@heroicons/react/24/solid";

const SettingsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full mx-auto bg-white rounded-xl shadow-2xl p-8 border-t-4 border-blue-400">
        <h2 className="text-2xl font-bold text-blue-600 mb-6 flex items-center justify-center gap-2">
          <CogIcon className="h-7 w-7 text-blue-500" />
          Profile Settings
        </h2>
        <div className="space-y-6">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-100">
            <UserCircleIcon className="h-6 w-6 text-gray-500" />
            <span className="font-medium text-gray-700">Account Info</span>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-100">
            <LockClosedIcon className="h-6 w-6 text-gray-500" />
            <span className="font-medium text-gray-700">Change Password</span>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-100">
            <BellIcon className="h-6 w-6 text-gray-500" />
            <span className="font-medium text-gray-700">Notification Preferences</span>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-100">
            <CogIcon className="h-6 w-6 text-gray-500" />
            <span className="font-medium text-gray-700">Other Settings</span>
          </div>
        </div>
        <div className="mt-8 text-center text-gray-400 text-sm">
          More settings coming soon...
        </div>
      </div>
    </div>
  );
};