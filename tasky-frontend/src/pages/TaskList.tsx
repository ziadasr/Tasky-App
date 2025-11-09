import React, { useState, useMemo, useEffect } from "react";
import { useTasks } from "../context/TaskContext";
import { useAuth } from "../context/AuthContext";
import {
  Card,
  Input,
  Select,
  Button,
  Spinner,
} from "../components/common/UIComponents";
import { TaskCard } from "../components/TaskCard";
import { NavigateFunction } from "../app";

interface TaskListProps {
  onNavigate: NavigateFunction;
  initialFilter?: string | null;
}

export const TaskList: React.FC<TaskListProps> = ({
  onNavigate,
  initialFilter,
}) => {
  const { tasks, loading, error, fetchTasks } = useTasks();
  const { user } = useAuth();
  const [filterStatus, setFilterStatus] = useState<string>(initialFilter || "");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Determine available statuses based on user role
  const availableStatuses = useMemo(() => {
    if (user?.role === "Manager" || user?.role === "Admin") {
      // Managers/Admins see: pending, in_progress, scheduled, completed
      return ["pending", "in_progress", "scheduled", "completed"];
    } else {
      // Normal users (Employee/User) see: pending, in_progress, completed
      return ["pending", "in_progress", "completed"];
    }
  }, [user?.role]);

  // Fetch tasks with the initial filter when component mounts or initialFilter changes
  useEffect(() => {
    if (initialFilter) {
      setFilterStatus(initialFilter);
      fetchTasks(initialFilter as any);
    } else {
      fetchTasks();
    }
  }, [initialFilter, fetchTasks]);

  const filteredTasks = useMemo(() => {
    let result = tasks;

    if (filterStatus) {
      result = result.filter((t) => t.status === filterStatus);
    }

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(lowerSearch) ||
          t.description.toLowerCase().includes(lowerSearch) ||
          t.Assignee?.name?.toLowerCase().includes(lowerSearch)
      );
    }

    // Sort by available statuses
    const statusOrder = availableStatuses.reduce((acc, status, index) => {
      acc[status] = index;
      return acc;
    }, {} as { [key: string]: number });

    return result.sort((a, b) => {
      return (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3);
    });
  }, [tasks, filterStatus, searchTerm, availableStatuses]);

  // Generate status options based on available statuses
  const statusOptions = [...availableStatuses, "All Statuses"].map((s) => ({
    value: s === "All Statuses" ? "" : s,
    label:
      s === "All Statuses"
        ? "All Statuses"
        : s
            .replace(/_/g, " ")
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" "),
  }));

  if (loading) return <Spinner />;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Task List</h1>
        {(user?.role === "Manager" || user?.role === "Admin") && (
          <Button onClick={() => onNavigate("AddTask")}>+ New Task</Button>
        )}
      </div>

      <Card className="mb-6 p-4 flex flex-col sm:flex-row gap-4">
        <Input
          label="Search"
          id="search"
          placeholder="Search tasks, descriptions, or users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow w-full sm:w-auto"
        />
        <Select
          label="" // Hidden label, contextually clear
          id="filterStatus"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          options={statusOptions}
          className="w-full sm:w-48"
        />
        <Button
          variant="secondary"
          onClick={() => fetchTasks(filterStatus as any)}
        >
          Refresh
        </Button>
      </Card>

      <div className="mt-8 space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-10 text-gray-500 bg-white rounded-xl shadow-md">
            <p className="text-lg">No tasks found matching your criteria.</p>
            {(user?.role === "Manager" || user?.role === "Admin") && (
              <p className="text-sm mt-2">Try adding a new task!</p>
            )}
          </div>
        ) : (
          filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} onNavigate={onNavigate} />
          ))
        )}
      </div>
    </div>
  );
};
