import React, { useMemo, useState, useEffect } from "react";
import { useTasks } from "../context/TaskContext";
import { useAuth } from "../context/AuthContext";
import { Card, Button, Spinner } from "../components/common/UIComponents";
import { ManagerTaskView } from "../components/ManagerTaskView";
import { AdminOrganizationView } from "../components/AdminOrganizationView";
import { ManagerOrganizationView } from "../components/ManagerOrganizationView";
import { NavigateFunction } from "../app";

interface DashboardProps {
  onNavigate: NavigateFunction;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [managerTab, setManagerTab] = useState<
    "assignedToMe" | "assignedByMe" | "employees"
  >("assignedToMe");
  const [adminTab, setAdminTab] = useState<"tasks" | "organization">("tasks");

  // Only use TaskContext for employees (managers/admins use ManagerTaskView)
  const { taskCount, statusCounts, loading, error } = useTasks();

  // Skip TaskContext fetching for managers and admins
  useEffect(() => {
    if (user?.role === "Manager" || user?.role === "Admin") {
      console.log("⏭️  [Dashboard] Skipping TaskContext fetch for", user.role);
    }
  }, [user?.role]);

  const stats = useMemo(() => {
    // Use counts directly from API response (statusCounts)
    const total = taskCount;
    const scheduled = statusCounts.scheduled || 0;
    const completed = statusCounts.completed || 0;
    const progress = statusCounts.in_progress || 0;
    const pending = statusCounts.pending || 0;

    const completionRate =
      total > 0 ? ((completed / total) * 100).toFixed(0) : 0;

    return { total, scheduled, completed, progress, pending, completionRate };
  }, [taskCount, statusCounts]);

  // TaskCard component defined locally for rendering dashboard stats
  interface TaskCardProps {
    title: string;
    count: number | string;
    bgColor: string;
    onClick: () => void;
  }

  const TaskCard: React.FC<TaskCardProps> = ({
    title,
    count,
    bgColor,
    onClick,
  }) => (
    <div
      className={`cursor-pointer hover:opacity-90 transition-opacity`}
      onClick={onClick}
    >
      <Card className={`p-5 text-white shadow-lg ${bgColor}`}>
        <h3 className="text-sm font-medium opacity-80">{title}</h3>
        <p className="text-4xl font-extrabold mt-1">{count}</p>
      </Card>
    </div>
  );

  if (!user) return null; // Should be protected by App.tsx, but good practice
  if (loading) return <Spinner />;
  if (error)
    return (
      <p className="text-red-600">Error loading dashboard data: {error}</p>
    );

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Welcome, {user.name}
      </h1>
      <p className="text-gray-500 mb-8">
        {user.role === "Manager"
          ? "Manager Dashboard: Manage your team's tasks."
          : user.role === "Admin"
          ? "Admin Dashboard: Manage all tasks and users."
          : "Employee Dashboard: View your assigned tasks."}
      </p>

      {/* Admin View */}
      {user.role === "Admin" && (
        <>
          <div className="mb-6 flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setAdminTab("tasks")}
              className={`px-4 py-3 font-medium transition-colors ${
                adminTab === "tasks"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              📋 All Tasks
            </button>
            <button
              onClick={() => setAdminTab("organization")}
              className={`px-4 py-3 font-medium transition-colors ${
                adminTab === "organization"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              👥 Organization
            </button>
          </div>
          <div className="mb-8">
            {adminTab === "tasks" ? (
              <ManagerTaskView scope="all" onNavigate={onNavigate} />
            ) : (
              <AdminOrganizationView />
            )}
          </div>
        </>
      )}

      {/* Manager Tabs */}
      {user.role === "Manager" && (
        <div className="mb-6 flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setManagerTab("assignedToMe")}
            className={`px-4 py-3 font-medium transition-colors ${
              managerTab === "assignedToMe"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            📥 Tasks Assigned to Me
          </button>
          <button
            onClick={() => setManagerTab("assignedByMe")}
            className={`px-4 py-3 font-medium transition-colors ${
              managerTab === "assignedByMe"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            📤 Tasks Assigned by Me
          </button>
          <button
            onClick={() => setManagerTab("employees")}
            className={`px-4 py-3 font-medium transition-colors ${
              managerTab === "employees"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            👥 Employees
          </button>
        </div>
      )}

      {/* Manager Task View or Employee View */}
      {user.role === "Manager" ? (
        <div className="mb-8">
          {managerTab === "employees" ? (
            <ManagerOrganizationView />
          ) : (
            <ManagerTaskView scope={managerTab} onNavigate={onNavigate} />
          )}
        </div>
      ) : user.role === "Admin" ? null : (
        <>
          {/* Stats Cards for Non-Managers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <TaskCard
              title="Total Tasks"
              count={stats.total}
              bgColor="bg-yellow-600"
              onClick={() => onNavigate("TaskList")}
            />
            <TaskCard
              title="In Progress"
              count={stats.progress}
              bgColor="bg-blue-600"
              onClick={() => onNavigate("TaskList", null, "in_progress")}
            />
            <TaskCard
              title="Pending"
              count={stats.pending}
              bgColor="bg-red-600"
              onClick={() => onNavigate("TaskList", null, "pending")}
            />
            <TaskCard
              title="Completed Tasks"
              count={stats.completed}
              bgColor="bg-green-600"
              onClick={() => onNavigate("TaskList", null, "completed")}
            />
          </div>

          {/* Completion Rate */}
          <Card className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Completion Rate</h2>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-indigo-500 h-4 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${stats.completionRate}%` }}
              ></div>
            </div>
            <p className="text-3xl font-bold text-indigo-600 mt-3">
              {stats.completionRate}%
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {stats.completed} out of {stats.total} tasks completed.
            </p>
          </Card>
        </>
      )}

      {/* Quick Actions */}
      <Card className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          {(user.role === "Manager" || user.role === "Admin") && (
            <>
              <Button variant="primary" onClick={() => onNavigate("AddTask")}>
                Create New Task
              </Button>
              <Button variant="outline" onClick={() => onNavigate("Register")}>
                Register New User
              </Button>
            </>
          )}
          <Button variant="secondary" onClick={() => onNavigate("TaskList")}>
            View All Tasks
          </Button>
        </div>
      </Card>
    </div>
  );
};
