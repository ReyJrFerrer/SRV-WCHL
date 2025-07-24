import React, { useMemo, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Notification } from "../../hooks/useNotifications"; // Import the interface
import { useProviderBookingManagement } from "../../hooks/useProviderBookingManagement";
import BottomNavigation from "../../components/provider/BottomNavigation";
import {
  BellAlertIcon,
  CheckCircleIcon,
  XCircleIcon,
  StarIcon,
  EnvelopeOpenIcon,
  InboxIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
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
    case "new_booking_request":
      return <UserIcon className="h-8 w-8 text-blue-500" />;
    case "booking_confirmation":
      return <CheckCircleIcon className="h-8 w-8 text-green-500" />;
    case "payment_completed":
      return <CurrencyDollarIcon className="h-8 w-8 text-green-600" />;
    case "service_completion_reminder":
      return <ClockIcon className="h-8 w-8 text-orange-500" />;
    case "review_request":
      return <StarIcon className="h-8 w-8 text-purple-500" />;
    case "chat_message":
      return <ChatBubbleLeftRightIcon className="h-8 w-8 text-blue-600" />;
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
          {notification.clientName && (
            <span className="font-bold">{notification.clientName}</span>
          )}
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

const NotificationsPageSP = () => {
  const {
    bookings,
    loading: bookingLoading,
    error: bookingError,
  } = useProviderBookingManagement();

  const navigate = useNavigate();
  console.log(bookings);

  // Custom provider notification hook logic
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // localStorage Helper Functions for provider notifications
  const READ_NOTIFICATIONS_KEY = "providerReadNotificationIds";

  const getReadIds = useCallback((): string[] => {
    try {
      const item = window.localStorage.getItem(READ_NOTIFICATIONS_KEY);
      return item ? JSON.parse(item) : [];
    } catch (error) {
      console.error("Error reading from localStorage", error);
      return [];
    }
  }, [READ_NOTIFICATIONS_KEY]);

  const setReadIds = useCallback(
    (ids: string[]) => {
      try {
        window.localStorage.setItem(
          READ_NOTIFICATIONS_KEY,
          JSON.stringify(ids),
        );
      } catch (error) {
        console.error("Error writing to localStorage", error);
      }
    },
    [READ_NOTIFICATIONS_KEY],
  );

  // Generate provider-specific notifications
  const fetchProviderNotifications = useCallback(() => {
    setLoading(true);
    setError(null);

    try {
      // 1. New booking requests
      const newBookingRequests = bookings
        .filter((booking) => booking.status === "Requested")
        .map((booking) => ({
          id: `new-booking-${booking.id}`,
          message: `New booking request for ${booking.serviceDetails?.title} from`,
          type: "new_booking_request" as const,
          timestamp: booking.createdAt,
          read: false,
          href: `/provider/booking/${booking.id}`,
          clientName: booking.clientName,
          bookingId: booking.id,
        }));

      // 2. Booking confirmations (when provider accepts)
      const bookingConfirmations = bookings
        .filter((booking) => booking.status === "Accepted")
        .map((booking) => ({
          id: `confirmation-${booking.id}`,
          message: `Booking confirmed for ${booking.serviceDetails?.title} with`,
          type: "booking_confirmation" as const,
          timestamp: booking.updatedAt,
          read: false,
          href: `/provider/booking/${booking.id}`,
          clientName: booking.clientName,
          bookingId: booking.id,
        }));

      // 3. Payment completed notifications
      const paymentCompletions = bookings
        .filter((booking) => booking.status === "Completed")
        .map((booking) => ({
          id: `payment-${booking.id}`,
          message: `Payment of ₱${booking.price.toFixed(2)} received for service completed with`,
          type: "payment_completed" as const,
          timestamp: booking.completedDate || booking.updatedAt,
          read: false,
          href: `/provider/receipt/${booking.id}`,
          clientName: booking.clientName,
          bookingId: booking.id,
        }));

      // 4. Service completion reminders (for InProgress bookings)
      const serviceReminders = bookings
        .filter((booking) => booking.status === "InProgress")
        .map((booking) => ({
          id: `reminder-${booking.id}`,
          message: `Don't forget to complete the service for`,
          type: "service_completion_reminder" as const,
          timestamp: new Date().toISOString(),
          read: false,
          href: `/provider/active-service/${booking.id}`,
          clientName: booking.clientName,
          bookingId: booking.id,
        }));

      // 5. Review requests (for completed but unreviewed bookings)
      const reviewRequests = bookings
        .filter((booking) => booking.status === "Completed")
        .map((booking) => ({
          id: `review-request-${booking.id}`,
          message: `Please ask for a review from`,
          type: "review_request" as const,
          timestamp: booking.completedDate || booking.updatedAt,
          read: false,
          href: `/provider/booking/${booking.id}`,
          clientName: booking.clientName,
          bookingId: booking.id,
        }));

      // Combine all notifications
      const allNotifications = [
        ...newBookingRequests,
        ...bookingConfirmations,
        ...paymentCompletions,
        ...serviceReminders,
        ...reviewRequests,
      ];

      // Apply read status from localStorage
      const readIds = getReadIds();
      const notificationsWithReadStatus = allNotifications
        .map((notif) => ({
          ...notif,
          read: readIds.includes(notif.id),
        }))
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );

      setNotifications(notificationsWithReadStatus);
      setUnreadCount(notificationsWithReadStatus.filter((n) => !n.read).length);
    } catch (error) {
      console.error("Error generating provider notifications:", error);
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [bookings, getReadIds]);

  // Mark notification as read
  const markAsRead = useCallback(
    (notificationId: string) => {
      const readIds = getReadIds();
      if (!readIds.includes(notificationId)) {
        const newReadIds = [...readIds, notificationId];
        setReadIds(newReadIds);
      }

      setNotifications((prev) => {
        const newNotifications = prev.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n,
        );
        setUnreadCount(newNotifications.filter((n) => !n.read).length);
        return newNotifications;
      });
    },
    [getReadIds, setReadIds],
  );

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    const currentIds = notifications.map((n) => n.id);
    const readIds = getReadIds();
    const newReadIds = Array.from(new Set([...readIds, ...currentIds]));
    setReadIds(newReadIds);

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, [notifications, getReadIds, setReadIds]);

  // Fetch notifications when bookings change
  useEffect(() => {
    if (!bookingLoading) {
      fetchProviderNotifications();
    }
  }, [bookingLoading, fetchProviderNotifications]);

  // Set the document title
  useEffect(() => {
    document.title = "Notifications | SRV";
  }, []);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case "new_booking_request":
      case "booking_confirmation":
      case "service_completion_reminder":
      case "review_request":
        navigate(
          notification.href || `/provider/booking/${notification.bookingId}`,
        );
        break;
      case "payment_completed":
        navigate(
          notification.href || `/provider/receipt/${notification.bookingId}`,
        );
        break;
      case "chat_message":
        navigate(`/provider/chat/${notification.clientName}`);
        break;
      default:
        navigate(notification.href || "/provider/bookings");
        break;
    }
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
        {loading || bookingLoading ? (
          <div className="p-10 text-center text-gray-500">Loading...</div>
        ) : error || bookingError ? (
          <div className="p-10 text-center text-red-500">
            {String(error || bookingError)}
          </div>
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

export default NotificationsPageSP;
