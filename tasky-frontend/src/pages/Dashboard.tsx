import React, { useMemo } from "react";
import { useTasks } from "../context/TaskContext";
import { useAuth } from "../context/AuthContext";
import { Card, Button, Spinner } from "../components/common/UIComponents";
import { Task } from "../types/task.d";
import { NavigateFunction } from "../app";

interface DashboardProps {
  onNavigate: NavigateFunction;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { tasks, loading, error } = useTasks();
  const { user, isAdmin } = useAuth();

  const userTasks: Task[] = useMemo(
    () => tasks.filter((t) => t.assignedToId === user?.id),
    [tasks, user?.id]
  );

  const stats = useMemo(() => {
    const allTasks = isAdmin ? tasks : userTasks;

    const total = allTasks.length;
    const completed = allTasks.filter((t) => t.status === "Completed").length;
    const progress = allTasks.filter((t) => t.status === "In Progress").length;
    const todo = allTasks.filter((t) => t.status === "To Do").length;

    const completionRate =
      total > 0 ? ((completed / total) * 100).toFixed(0) : 0;

    return { total, completed, progress, todo, completionRate };
  }, [tasks, userTasks, isAdmin]);

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
        {isAdmin
          ? "Admin Dashboard: Overview of all tasks."
          : "Your Dashboard: Quick view of your assigned tasks."}
      </p>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <TaskCard
          title="Total Tasks"
          count={stats.total}
          bgColor="bg-yellow-600"
          onClick={() => onNavigate("TaskList")}
        />
        <TaskCard
          title="Completed Tasks"
          count={stats.completed}
          bgColor="bg-green-600"
          onClick={() => onNavigate("TaskList", null, "Completed")}
        />
        <TaskCard
          title="In Progress"
          count={stats.progress}
          bgColor="bg-blue-600"
          onClick={() => onNavigate("TaskList", null, "In Progress")}
        />
        <TaskCard
          title="To Do"
          count={stats.todo}
          bgColor="bg-red-600"
          onClick={() => onNavigate("TaskList", null, "To Do")}
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

      {/* Quick Actions */}
      <Card className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          {isAdmin && (
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
