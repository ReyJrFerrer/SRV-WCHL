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

// Helper to get the right icon for each notification type, with colored backgrounds
const NotificationIcon: React.FC<{ type: Notification["type"] }> = ({
  type,
}) => {
  let icon, bg;
  switch (type) {
    case "booking_accepted":
      icon = <CheckCircleIcon className="h-6 w-6 text-green-600" />;
      bg = "bg-green-100";
      break;
    case "booking_declined":
      icon = <XCircleIcon className="h-6 w-6 text-red-600" />;
      bg = "bg-red-100";
      break;
    case "booking_cancelled":
      icon = <XCircleIcon className="h-6 w-6 text-orange-500" />;
      bg = "bg-orange-100";
      break;
    case "booking_completed":
      icon = <CheckCircleIcon className="h-6 w-6 text-blue-600" />;
      bg = "bg-blue-100";
      break;
    case "payment_received":
      icon = <CheckCircleIcon className="h-6 w-6 text-green-700" />;
      bg = "bg-green-200";
      break;
    case "payment_failed":
      icon = <XCircleIcon className="h-6 w-6 text-red-700" />;
      bg = "bg-red-200";
      break;
    case "provider_message":
      icon = <EnvelopeOpenIcon className="h-6 w-6 text-purple-600" />;
      bg = "bg-purple-100";
      break;
    case "system_announcement":
      icon = <BellAlertIcon className="h-6 w-6 text-gray-700" />;
      bg = "bg-gray-200";
      break;
    case "service_rescheduled":
      icon = <BellAlertIcon className="h-6 w-6 text-yellow-700" />;
      bg = "bg-yellow-200";
      break;
    case "service_reminder":
      icon = <StarIcon className="h-6 w-6 text-blue-500" />;
      bg = "bg-blue-100";
      break;
    case "promo_offer":
      icon = <StarIcon className="h-6 w-6 text-pink-500" />;
      bg = "bg-pink-100";
      break;
    case "provider_on_the_way":
      icon = <BellAlertIcon className="h-6 w-6 text-teal-600" />;
      bg = "bg-teal-100";
      break;
    case "review_reminder":
      icon = <StarIcon className="h-6 w-6 text-yellow-500" />;
      bg = "bg-yellow-100";
      break;
    default:
      icon = <BellAlertIcon className="h-6 w-6 text-blue-600" />;
      bg = "bg-blue-100";
  }
  return (
    <span
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${bg}`}
    >
      {icon}
    </span>
  );
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
      className={`flex cursor-pointer items-start gap-4 rounded-xl border border-transparent p-4 shadow-sm transition-all duration-200 hover:border-blue-200 ${
        !notification.read
          ? "bg-blue-50 hover:bg-blue-100"
          : "bg-white hover:bg-gray-50"
      }`}
    >
      <div className="mt-1 flex-shrink-0">
        <NotificationIcon type={notification.type} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-blue-900">
          {notification.message}{" "}
          {notification.providerName && (
            <span className="font-bold text-blue-700">
              {notification.providerName}
            </span>
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-100 pb-20">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white shadow-sm">
        <div
          className={`mx-auto flex max-w-3xl items-center px-4 py-4 ${unreadCount > 0 ? "justify-between" : "justify-center"}`}
        >
          <h1 className="text-2xl font-extrabold tracking-tight text-black">
            Notifications
          </h1>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center rounded-lg bg-blue-100 px-3 py-2 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-200 hover:text-blue-900"
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
          <div className="mx-auto mt-6 max-w-2xl px-2 md:px-0">
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md">
              {unread.length > 0 && (
                <section>
                  <h2 className="border-b bg-gradient-to-r from-blue-500 to-blue-400 px-4 py-2 text-sm font-semibold tracking-wide text-white shadow-sm">
                    New
                  </h2>
                  <div className="divide-y divide-blue-100">
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
                  <h2 className="bg-gradient-to-r from-gray-200 to-gray-100 px-4 py-2 text-sm font-semibold tracking-wide text-gray-700 shadow-sm">
                    Earlier
                  </h2>
                  <div className="divide-y divide-gray-100">
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
