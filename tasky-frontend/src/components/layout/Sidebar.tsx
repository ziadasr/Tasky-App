import React, { useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../common/UIComponents";
import { NavigateFunction, AppPath } from "../../app";

interface SidebarProps {
  onNavigate: NavigateFunction;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNavigate }) => {
  const { user, logout } = useAuth();

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
      <div className="mb-8 p-2">
        <h1 className="text-3xl font-extrabold text-indigo-400 tracking-tighter">
          Tasky.
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          {user.name} ({user.role})
        </p>
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
