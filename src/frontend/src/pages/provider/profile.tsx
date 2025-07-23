import React from "react";
import {
  CogIcon,
  UserCircleIcon,
  LockClosedIcon,
  BellIcon,
} from "@heroicons/react/24/solid";

const SettingsPage: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="mx-auto w-full max-w-md rounded-xl border-t-4 border-blue-400 bg-white p-8 shadow-2xl">
        <h2 className="mb-6 flex items-center justify-center gap-2 text-2xl font-bold text-blue-600">
          <CogIcon className="h-7 w-7 text-blue-500" />
          Profile Settings
        </h2>
        <div className="space-y-6">
          <div className="flex items-center gap-3 rounded-lg bg-gray-100 p-4">
            <UserCircleIcon className="h-6 w-6 text-gray-500" />
            <span className="font-medium text-gray-700">Account Info</span>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-gray-100 p-4">
            <LockClosedIcon className="h-6 w-6 text-gray-500" />
            <span className="font-medium text-gray-700">Change Password</span>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-gray-100 p-4">
            <BellIcon className="h-6 w-6 text-gray-500" />
            <span className="font-medium text-gray-700">
              Notification Preferences
            </span>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-gray-100 p-4">
            <CogIcon className="h-6 w-6 text-gray-500" />
            <span className="font-medium text-gray-700">Other Settings</span>
          </div>
        </div>
        <div className="mt-8 text-center text-sm text-gray-400">
          More settings coming soon...
        </div>
      </div>
    </div>
  );
};
