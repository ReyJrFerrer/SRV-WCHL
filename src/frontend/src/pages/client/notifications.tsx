import React, { useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications, Notification } from "../../hooks/useNotifications"; // Adjust path as needed
import BottomNavigation from "../../components/client/BottomNavigation"; // Adjust path as needed
import {
  BellAlertIcon,
  CheckCircleIcon,
  XCircleIcon,
  StarIcon,
  EnvelopeOpenIcon,
  InboxIcon,
} from "@heroicons/react/24/solid";

// Helper to get the right icon for each notification type
const NotificationIcon: React.FC<{ type: Notification["type"] }> = ({
  type,
}) => {
  switch (type) {
    case "booking_accepted":
      return <CheckCircleIcon className="h-8 w-8 text-green-500" />;
    case "booking_declined":
      return <XCircleIcon className="h-8 w-8 text-red-500" />;
    case "review_reminder":
      return <StarIcon className="h-8 w-8 text-yellow-500" />;
    default:
      return <BellAlertIcon className="h-8 w-8 text-blue-500" />;
  }
};

// Reusable component for a single notification item
const NotificationItem: React.FC<{
  notification: Notification;
  onClick: () => void;
}> = ({ notification, onClick }) => {
  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return Math.floor(seconds) + "s ago";
  };

  return (
    <div
      onClick={onClick}
      className={`flex cursor-pointer items-start space-x-4 p-4 transition-colors duration-200 ${
        !notification.read
          ? "bg-blue-50 hover:bg-blue-100"
          : "bg-white hover:bg-gray-50"
      }`}
    >
      <div className="mt-1 flex-shrink-0">
        <NotificationIcon type={notification.type} />
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-800">
          {notification.message}{" "}
          {notification.providerName && (
            <span className="font-bold">{notification.providerName}</span>
          )}
          .
        </p>
        <p className="mt-1 text-xs text-gray-500">
          {timeAgo(notification.timestamp)}
        </p>
      </div>
      {!notification.read && (
        <div className="h-2.5 w-2.5 self-center rounded-full bg-blue-500"></div>
      )}
    </div>
  );
};

const NotificationsPage = () => {
  const {
    notifications,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    unreadCount,
  } = useNotifications();
  const navigate = useNavigate();

  // Set the document title
  useEffect(() => {
    document.title = "Notifications | SRV";
  }, []);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    navigate(notification.href || "/client/booking");
  };

  const { unread, read } = useMemo(() => {
    return notifications.reduce<{
      unread: Notification[];
      read: Notification[];
    }>(
      (acc, notif) => {
        if (notif.read) {
          acc.read.push(notif);
        } else {
          acc.unread.push(notif);
        }
        return acc;
      },
      { unread: [], read: [] },
    );
  }, [notifications]);

  return (
    <div className="flex min-h-screen flex-col bg-gray-100">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div
          className={`mx-auto flex max-w-4xl items-center px-4 py-3 ${unreadCount > 0 ? "justify-between" : "justify-center"}`}
        >
          <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              <EnvelopeOpenIcon className="mr-1.5 h-4 w-4" />
              Mark all as read
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 pb-24">
        {loading ? (
          <div className="p-10 text-center text-gray-500">Loading...</div>
        ) : error ? (
          <div className="p-10 text-center text-red-500">{String(error)}</div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center p-10 text-center text-gray-500">
            <InboxIcon className="mb-4 h-16 w-16 text-gray-300" />
            <h3 className="text-lg font-semibold">No Notifications Yet</h3>
            <p className="text-sm">
              We'll let you know when something important happens.
            </p>
          </div>
        ) : (
          <div className="mx-auto mt-4 max-w-4xl">
            <div className="overflow-hidden rounded-lg bg-white shadow-sm">
              {unread.length > 0 && (
                <section>
                  <h2 className="border-b bg-blue-500 px-4 py-2 text-sm font-semibold text-white">
                    New
                  </h2>
                  <div className="divide-y divide-gray-200">
                    {unread.map((notif) => (
                      <NotificationItem
                        key={notif.id}
                        notification={notif}
                        onClick={() => handleNotificationClick(notif)}
                      />
                    ))}
                  </div>
                </section>
              )}
              {unread.length > 0 && read.length > 0 && <div className="my-4" />}
              {read.length > 0 && (
                <section>
                  <h2 className="bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-800">
                    Earlier
                  </h2>
                  <div className="divide-y divide-gray-200">
                    {read.map((notif) => (
                      <NotificationItem
                        key={notif.id}
                        notification={notif}
                        onClick={() => handleNotificationClick(notif)}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        )}
      </main>

      <div className="fixed bottom-0 left-0 z-30 w-full">
        <BottomNavigation />
      </div>
    </div>
  );
};

export default NotificationsPage;
