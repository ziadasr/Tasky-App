import React, { useMemo } from "react";
import { Task, TaskStatus } from "../types/task";
import { Button, Card } from "./common/UIComponents";
import { useAuth } from "../context/AuthContext";
import { MOCK_USERS } from "../api/mockApi";
import { useTasks } from "../context/TaskContext";
import { NavigateFunction } from "../app";

interface TaskCardProps {
  task: Task;
  onNavigate: NavigateFunction;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onNavigate }) => {
  const { isAdmin } = useAuth();
  const { availableUsers } = useTasks();

  const userMap = useMemo(() => {
    // Combine mock users and available users for mapping
    const allUsers = [...MOCK_USERS, ...availableUsers];
    return allUsers.reduce((acc, user) => {
      acc[user.id] = user.name;
      return acc;
    }, {} as { [key: string]: string });
  }, [availableUsers]);

  const getStatusColor = (status: TaskStatus): string => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800 border-green-300";
      case "In Progress":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "To Do":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 p-4 border border-gray-100 transition-all duration-200 hover:border-indigo-300 hover:shadow-lg">
      <div className="flex-1 min-w-0 mb-3 sm:mb-0">
        <h3 className="text-xl font-semibold text-gray-900 truncate">
          {task.name}
        </h3>
        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
          {task.description}
        </p>
        <div className="flex flex-wrap items-center text-xs mt-2 space-x-3 text-gray-500">
          <span>
            Assigned to:{" "}
            <span className="font-medium text-gray-700">
              {userMap[task.assignedToId] || "N/A"}
            </span>
          </span>
          <span className="hidden sm:inline-block">|</span>
          <span>Due: {task.dueDate}</span>
        </div>
      </div>
      <div className="flex flex-col items-start sm:items-end space-y-2 sm:space-y-0 sm:space-x-3 sm:flex-row sm:ml-4">
        <span
          className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
            task.status
          )}`}
        >
          {task.status}
        </span>
        {isAdmin && (
          <Button
            variant="outline"
            className="py-1 px-3 text-sm"
            onClick={() => onNavigate("EditTask", task.id)}
          >
            Edit
          </Button>
        )}
      </div>
    </Card>
  );
};
