import React, { useEffect, useState, useMemo } from "react";
import { Task } from "../types/task.d";
import { apiService } from "../api/api";
import { TaskCard } from "./TaskCard";
import { Spinner, Card } from "./common/UIComponents";
import { NavigateFunction } from "../app";

interface ManagerTaskViewProps {
  scope: "assignedToMe" | "assignedByMe" | "all";
  onNavigate: NavigateFunction;
}

export const ManagerTaskView: React.FC<ManagerTaskViewProps> = ({
  scope,
  onNavigate,
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all"); // all, pending, in_progress, completed

  // Calculate task counts by status
  const stats = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter((t) => t.status === "pending").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    const scheduled = tasks.filter((t) => t.status === "scheduled").length;

    return { total, pending, inProgress, completed, scheduled };
  }, [tasks]);

  // Filter tasks based on selected status
  const filteredTasks = useMemo(() => {
    if (statusFilter === "all") return tasks;
    return tasks.filter((task) => task.status === statusFilter);
  }, [tasks, statusFilter]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiService.getTasks({ scope });
        setTasks(response.tasks || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tasks");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [scope]);

  if (loading) return <Spinner />;
  if (error)
    return (
      <Card className="bg-red-50 border border-red-200">
        <p className="text-red-800">{error}</p>
      </Card>
    );

  // Stat card component
  interface StatCardProps {
    title: string;
    count: number;
    bgColor: string;
  }

  const StatCard: React.FC<StatCardProps> = ({ title, count, bgColor }) => {
    // Map bgColor to ensure Tailwind recognizes the classes
    const colorMap: Record<string, string> = {
      "bg-yellow-600": "bg-yellow-600",
      "bg-red-600": "bg-red-600",
      "bg-blue-600": "bg-blue-600",
      "bg-green-600": "bg-green-600",
      "bg-purple-600": "bg-purple-600",
    };

    return (
      <div
        className={`p-4 text-white shadow-lg rounded-lg ${
          colorMap[bgColor] || bgColor
        }`}
        style={{
          minHeight: "120px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <h3 className="text-sm font-medium opacity-80">{title}</h3>
        <p className="text-3xl font-extrabold mt-2">{count}</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div
        className={`grid gap-4 ${
          scope === "assignedByMe"
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        }`}
      >
        <StatCard
          title="Total Tasks"
          count={stats.total}
          bgColor="bg-yellow-600"
        />
        {scope === "assignedByMe" && (
          <StatCard
            title="Scheduled"
            count={stats.scheduled}
            bgColor="bg-purple-600"
          />
        )}
        <StatCard title="Pending" count={stats.pending} bgColor="bg-red-600" />
        <StatCard
          title="In Progress"
          count={stats.inProgress}
          bgColor="bg-blue-600"
        />
        <StatCard
          title="Completed"
          count={stats.completed}
          bgColor="bg-green-600"
        />
      </div>

      {/* Filter Dropdown */}
      <div className="flex items-center gap-4">
        <label htmlFor="status-filter" className="font-medium text-gray-700">
          Filter by Status:
        </label>
        <select
          id="status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Tasks</option>
          {scope === "assignedByMe" && (
            <option value="scheduled">Scheduled</option>
          )}
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <span className="text-sm text-gray-600">
          Showing {filteredTasks.length} of {tasks.length} tasks
        </span>
      </div>
      {tasks.length === 0 ? (
        <Card className="bg-gray-50 border border-gray-200">
          <p className="text-gray-600 text-center py-8">
            {scope === "assignedToMe"
              ? "No tasks assigned to you yet."
              : "You haven't created any tasks yet."}
          </p>
        </Card>
      ) : filteredTasks.length === 0 ? (
        <Card className="bg-gray-50 border border-gray-200">
          <p className="text-gray-600 text-center py-8">
            No tasks found with the selected filter.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Task list */}
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onNavigate={onNavigate}
              showAssignedTo={scope === "assignedByMe"}
              treatAsEmployee={scope === "assignedToMe"}
            />
          ))}
        </div>
      )}
    </div>
  );
};
