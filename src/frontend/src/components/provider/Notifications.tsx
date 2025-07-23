import React, { useState } from "react";
import {
  ChevronLeftIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/solid";
import {
  ExclamationCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  TruckIcon,
  CalendarDaysIcon,
  BellIcon,
} from "@heroicons/react/24/outline";

// Defines the structure for a notification object
interface Notification {
  id: string;
  type:
    | "work_complete"
    | "work_started"
    | "on_the_way"
    | "appointment_confirmed";
  title: string;
  message: string;
  timeAgo: string;
  read: boolean;
}

// Initial hardcoded data to populate the notifications list
const initialNotifications: Notification[] = [
  {
    id: "1",
    type: "work_complete",
    title: "Work complete",
    message: "Rate your service provider.",
    timeAgo: "25 mins ago",
    read: false,
  },
  {
    id: "2",
    type: "work_started",
    title: "Work has started",
    message: "Your provider is now working on your request.",
    timeAgo: "2 hours ago",
    read: false,
  },
  {
    id: "3",
    type: "on_the_way",
    title: "Your service provider is on the way!",
    message:
      "Heads up! Juan, your appliance technician is on the way. Get ready for your scheduled appointment.",
    timeAgo: "2 hours ago",
    read: true,
  },
  {
    id: "4",
    type: "appointment_confirmed",
    title: "Appointment confirmed!",
    message:
      "Your Appliance Technician service for July 06, 2026 at 3:00 PM has been approved.",
    timeAgo: "2 days ago",
    read: true,
  },
];

const NotificationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"All" | "Read" | "Unread">("All");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [notificationList, setNotificationList] =
    useState<Notification[]>(initialNotifications);

  // Function to get the correct icon based on notification type
  const getIconForType = (type: Notification["type"]) => {
    switch (type) {
      case "work_complete":
        return <CheckCircleIcon className="h-6 w-6 text-yellow-600" />;
      case "work_started":
        return <ClockIcon className="h-6 w-6 text-gray-500" />;
      case "on_the_way":
        return <TruckIcon className="h-6 w-6 text-blue-600" />;
      case "appointment_confirmed":
        return <CalendarDaysIcon className="h-6 w-6 text-green-600" />;
      default:
        return <ExclamationCircleIcon className="h-6 w-6 text-gray-500" />;
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  // Mark all as read
  const handleMarkAllAsRead = () => {
    setNotificationList((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Toggle read/unread for a notification (for demo, on click of card)
  const handleToggleRead = (id: string) => {
    setNotificationList((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n)),
    );
  };

  // Filter notifications by tab and search
  const filteredNotifications = notificationList.filter((notification) => {
    const matchesSearch =
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    if (activeTab === "All") return matchesSearch;
    if (activeTab === "Read") return notification.read && matchesSearch;
    if (activeTab === "Unread") return !notification.read && matchesSearch;
    return matchesSearch;
  });

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-900 dark:bg-black dark:text-white">
      <div className="mx-auto flex w-full max-w-md flex-col bg-white shadow-lg dark:bg-gray-900">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <ChevronLeftIcon className="h-6 w-6 cursor-pointer text-gray-600 dark:text-gray-400" />
          <div className="flex flex-grow -translate-x-3 justify-center">
            {/* Using a placeholder for the SRV logo */}
            <div className="relative h-12 w-12">
              <BellIcon className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 space-y-6 overflow-y-auto p-4">
          <h1 className="text-2xl font-bold">Notifications</h1>

          {/* Search Bar */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search for notification"
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full rounded-lg bg-gray-100 py-2 pr-4 pl-10 transition-all focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-800"
            />
          </div>

          {/* Tabs */}
          <div className="flex items-center rounded-full bg-gray-200 p-1 text-sm font-medium dark:bg-gray-800">
            <button
              onClick={() => setActiveTab("All")}
              className={`flex-1 rounded-full py-2 transition-all ${
                activeTab === "All"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab("Read")}
              className={`flex-1 rounded-full py-2 transition-all ${
                activeTab === "Read"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              Read
            </button>
            <button
              onClick={() => setActiveTab("Unread")}
              className={`flex-1 rounded-full py-2 transition-all ${
                activeTab === "Unread"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              Unread
            </button>
          </div>

          {/* Notifications List */}
          <div className="space-y-4">
            <div className="flex items-baseline justify-between text-sm font-semibold">
              <span className="text-gray-500">Recent</span>
              <button
                className="font-medium text-blue-600"
                onClick={handleMarkAllAsRead}
              >
                Mark all as read
              </button>
            </div>

            {/* Notification Cards */}
            {filteredNotifications.length === 0 ? (
              <div className="py-8 text-center text-gray-400">
                No notifications found.
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`cursor-pointer rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all dark:border-gray-700 dark:bg-gray-800 ${notification.read ? "opacity-60" : "opacity-100"} hover:shadow-md`}
                  onClick={() => handleToggleRead(notification.id)}
                  title={notification.read ? "Mark as unread" : "Mark as read"}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                      {getIconForType(notification.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between">
                        <h3 className="text-base font-semibold">
                          {notification.title}
                        </h3>
                        <span className="ml-2 flex-shrink-0 text-xs text-gray-500">
                          {notification.timeAgo}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {notification.message}
                      </p>

                      {/* Action buttons based on notification type */}
                      {notification.type === "work_complete" ? (
                        <div className="mt-3 flex space-x-2">
                          <button className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                            View details
                          </button>
                          <button className="flex-1 rounded-lg bg-yellow-400 px-4 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-yellow-500">
                            Rate service
                          </button>
                        </div>
                      ) : (
                        <div className="mt-3">
                          <button className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                            View details
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default NotificationsPage;
