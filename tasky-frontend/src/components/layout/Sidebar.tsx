import React, { useMemo, useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../common/UIComponents";
import { NavigateFunction, AppPath } from "../../app";
import { apiService } from "../../api/api";

interface SidebarProps {
  onNavigate: NavigateFunction;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const [notificationCount, setNotificationCount] = useState(0);

  // Fetch notification count on mount and periodically
  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        const response = await apiService.getNotificationCount();
        setNotificationCount(response.unreadsCount);
      } catch (error) {
        console.error("Error fetching notification count:", error);
      }
    };

    fetchNotificationCount();

    // Refresh count every 30 seconds
    const interval = setInterval(fetchNotificationCount, 30000);

    // Listen for manual refresh event from Notifications page
    const handleRefresh = () => {
      fetchNotificationCount();
      console.log("📢 Notification count refreshed");
    };

    window.addEventListener("refreshNotificationCount", handleRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener("refreshNotificationCount", handleRefresh);
    };
  }, []);

  const navItems = useMemo(
    () => [
      { name: "Dashboard", path: "Dashboard" as AppPath },
      { name: "View Tasks", path: "TaskList" as AppPath },
      ...(user?.role === "Manager"
        ? [{ name: "Add Task", path: "AddTask" as AppPath }]
        : []),
      ...(user?.role === "Manager"
        ? [{ name: "Register User", path: "Register" as AppPath }]
        : []),
    ],
    [user?.role]
  );

  if (!user) return null; // Should not happen in a protected route

  return (
    <nav className="p-4 bg-gray-900 text-white h-full w-full lg:w-64 flex flex-col">
      <div className="mb-8 p-2 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-extrabold text-indigo-400 tracking-tighter">
            Tasky.
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            {user.name} ({user.role})
          </p>
        </div>
        {/* Bell Icon for Notifications */}
        <button
          onClick={() => onNavigate("Notifications")}
          className="p-2 hover:bg-gray-700 rounded-lg transition duration-150 relative"
          title="Notifications"
        >
          <svg
            className="w-6 h-6 text-yellow-400"
            fill="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
          </svg>
          {/* Notification Count Badge */}
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-bold text-white bg-gradient-to-br from-red-500 to-red-600 rounded-full shadow-lg border border-red-700">
              {notificationCount > 99 ? "99+" : notificationCount}
            </span>
          )}
        </button>
      </div>
      <ul className="space-y-2 flex-grow">
        {navItems.map((item) => (
          <li key={item.path}>
            <button
              onClick={() => onNavigate(item.path)}
              className="w-full text-left p-3 rounded-lg hover:bg-gray-700 transition duration-150 flex items-center"
            >
              {item.name}
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-8">
        <Button
          onClick={logout}
          variant="outline"
          className="w-full border-gray-700 text-gray-200 hover:bg-gray-700"
        >
          Sign Out
        </Button>
      </div>
    </nav>
  );
};
