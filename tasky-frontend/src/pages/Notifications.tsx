import React, { useEffect, useState } from "react";
import { Card, Button } from "../components/common/UIComponents";
import { NavigateFunction } from "../app";
import { apiService } from "../api/api";
import { useTaskDetail } from "../context/TaskDetailContext";
import { Notification } from "../types/user";

interface NotificationsProps {
  onNavigate: NavigateFunction;
}

export const NotificationsPage: React.FC<NotificationsProps> = ({
  onNavigate,
}) => {
  const { setSelectedTask } = useTaskDetail();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAsRead, setMarkingAsRead] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(totalNotifications / itemsPerPage);

  // Fetch notifications on mount and when page changes
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        console.log(
          `📄 [Notifications] Fetching page ${currentPage} (limit: ${itemsPerPage})`
        );
        const offset = (currentPage - 1) * itemsPerPage;
        const response = await apiService.getNotifications(
          itemsPerPage,
          offset
        );
        setNotifications(response.notifications);

        // For total count, we fetch with a large limit to estimate total
        // In production, the backend should return total count
        setTotalNotifications(response.notifications.length + offset);
        setError(null);
        console.log(
          `✅ [Notifications] Fetched ${response.notifications.length} items`
        );
      } catch (err: any) {
        setError(err.message);
        console.error("❌ [Notifications] Error fetching notifications:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [currentPage]);

  const handleMarkAllAsRead = async () => {
    try {
      setMarkingAsRead(true);
      setError(null);

      // Call API to mark all as read
      const response = await apiService.markAllNotificationsAsRead();

      // Update UI: Mark all notifications as read
      setNotifications((prevNotifications) =>
        prevNotifications.map((n) => ({ ...n, isRead: true }))
      );

      // Update unread count to 0
      setUnreadCount(0);
      console.log(`📊 [Notifications] All notifications marked as read`);

      // Dispatch event with unread count so Sidebar updates immediately without API call
      window.dispatchEvent(
        new CustomEvent("notificationCountChanged", {
          detail: { unreadsCount: 0 },
        })
      );

      console.log(
        `✅ Successfully marked ${response.rowsMarked} notifications as read`
      );
    } catch (err: any) {
      const errorMessage =
        err.message || "Failed to mark notifications as read";
      setError(errorMessage);
      console.error("Error marking notifications as read:", err);
    } finally {
      setMarkingAsRead(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "task_assigned":
        return "📋";
      case "task_due":
        return "📌";
      case "task_started":
        return "▶️";
      case "task_completed":
        return "✅";
      case "task_updated":
        return "✏️";
      case "report_created":
        return "📄";
      case "report_resolved":
        return "✓";
      case "welcome_message":
        return "👋";
      case "system":
        return "⚙️";
      default:
        return "•";
    }
  };

  const getNotificationColor = (type: string, isRead: boolean) => {
    const baseColor =
      type === "task_due"
        ? "border-red-500 bg-red-50"
        : type === "task_assigned"
        ? "border-orange-500 bg-orange-50"
        : type === "task_started"
        ? "border-blue-500 bg-blue-50"
        : type === "task_completed"
        ? "border-green-500 bg-green-50"
        : type === "task_updated"
        ? "border-yellow-500 bg-yellow-50"
        : type === "report_created"
        ? "border-purple-500 bg-purple-50"
        : type === "report_resolved"
        ? "border-emerald-500 bg-emerald-50"
        : type === "welcome_message"
        ? "border-pink-500 bg-pink-50"
        : type === "system"
        ? "border-gray-500 bg-gray-50"
        : "border-gray-500 bg-gray-50";

    return isRead ? `${baseColor} opacity-60` : baseColor;
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Notifications</h1>
        <Card className="p-8 text-center">
          <p className="text-gray-500">Loading notifications...</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Notifications</h1>
        <Card className="p-8 text-center border-red-500 bg-red-50">
          <p className="text-red-500">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-600 mt-2">
              📊 <span className="font-semibold">{unreadCount} unread</span>
            </p>
          )}
        </div>
        {notifications.some((n) => !n.isRead) && (
          <Button
            variant="outline"
            className="text-sm px-4 py-2 hover:bg-indigo-600 hover:text-white transition-colors"
            onClick={handleMarkAllAsRead}
            disabled={markingAsRead}
          >
            {markingAsRead ? "Marking..." : "Mark All as Read"}
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500 text-lg">No notifications yet</p>
          <p className="text-gray-400 text-sm mt-2">
            Notifications will appear when there are task updates.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notif) => (
            <Card
              key={notif.id}
              className={`p-4 border-l-4 ${getNotificationColor(
                notif.type,
                notif.isRead
              )} cursor-pointer hover:shadow-lg transition-shadow`}
            >
              <div
                className="flex items-start justify-between"
                onClick={() => onNavigate("TaskList")}
              >
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl mt-1">
                      {getNotificationIcon(notif.type)}
                    </span>
                    <div>
                      <p className="text-sm text-gray-700 font-medium">
                        {notif.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(notif.createdAt).toLocaleString()}
                      </p>
                      {!notif.isRead && (
                        <span className="inline-block mt-2 px-2 py-1 bg-indigo-600 text-white text-xs rounded">
                          New
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="text-sm py-1 px-3"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Extract task ID from linkTo (e.g., "/tasks/123" -> "123")
                    if (notif.linkTo && notif.Task) {
                      const taskId = notif.linkTo.split("/").pop();
                      if (taskId) {
                        // Pass task data through context
                        console.log(
                          `� [Notifications] Setting selected task from context:`,
                          notif.Task
                        );
                        setSelectedTask(notif.Task);
                        onNavigate("TaskDetail", taskId);
                      }
                    } else if (notif.linkTo) {
                      const taskId = notif.linkTo.split("/").pop();
                      console.warn(
                        `⚠️ [Notifications] No Task object for notification ${notif.id}`
                      );
                      if (taskId) {
                        onNavigate("TaskDetail", taskId);
                      }
                    } else {
                      // Fallback to TaskList if no linkTo
                      onNavigate("TaskList");
                    }
                  }}
                >
                  View
                </Button>
              </div>
            </Card>
          ))}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8 pt-6 border-t border-gray-200">
              <Button
                variant="outline"
                className="px-4 py-2"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || loading}
              >
                ← Previous
              </Button>

              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded transition-colors ${
                        currentPage === page
                          ? "bg-indigo-600 text-white font-semibold"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                      disabled={loading}
                    >
                      {page}
                    </button>
                  )
                )}
              </div>

              <Button
                variant="outline"
                className="px-4 py-2"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages || loading}
              >
                Next →
              </Button>

              <span className="text-sm text-gray-600 ml-4">
                Page {currentPage} of {totalPages}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
