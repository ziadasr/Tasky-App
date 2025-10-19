import React, { useState, useMemo } from "react";
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
import { TASK_STATUSES } from "../types/task.d";
import { MOCK_USERS } from "../api/mockApi";
import { NavigateFunction } from "../app";

interface TaskListProps {
  onNavigate: NavigateFunction;
}

export const TaskList: React.FC<TaskListProps> = ({ onNavigate }) => {
  const { tasks, loading, error, availableUsers, fetchTasks } = useTasks();
  const { isAdmin } = useAuth();
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const userMap = useMemo(() => {
    // Combine mock users and dynamically fetched users for mapping
    const allUsers = [...MOCK_USERS, ...availableUsers];
    return allUsers.reduce((acc, user) => {
      acc[user.id] = user.name;
      return acc;
    }, {} as { [key: string]: string });
  }, [availableUsers]);

  const filteredTasks = useMemo(() => {
    let result = tasks;

    if (filterStatus) {
      result = result.filter((t) => t.status === filterStatus);
    }

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(lowerSearch) ||
          t.description.toLowerCase().includes(lowerSearch) ||
          userMap[t.assignedToId]?.toLowerCase().includes(lowerSearch)
      );
    }

    // Simple sorting: To Do first, then In Progress, then Completed
    const statusOrder = TASK_STATUSES.reduce((acc, status, index) => {
      acc[status] = index;
      return acc;
    }, {} as { [key: string]: number });

    return result.sort((a, b) => {
      return (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3);
    });
  }, [tasks, filterStatus, searchTerm, userMap]);

  const statusOptions = [...TASK_STATUSES, "All Statuses"].map((s) => ({
    value: s === "All Statuses" ? "" : s,
    label: s,
  }));

  if (loading) return <Spinner />;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Task List</h1>
        {isAdmin && (
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
        <Button variant="secondary" onClick={fetchTasks}>
          Refresh
        </Button>
      </Card>

      <div className="mt-8 space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-10 text-gray-500 bg-white rounded-xl shadow-md">
            <p className="text-lg">No tasks found matching your criteria.</p>
            {isAdmin && <p className="text-sm mt-2">Try adding a new task!</p>}
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
