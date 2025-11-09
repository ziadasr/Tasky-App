import React, { useMemo } from "react";
import { Task, TaskStatus } from "../types/task";
import { Button, Card } from "./common/UIComponents";
import { useAuth } from "../context/AuthContext";
import { useTasks } from "../context/TaskContext";
import { useTaskDetail } from "../context/TaskDetailContext";
import { NavigateFunction } from "../app";

interface TaskCardProps {
  task: Task;
  onNavigate: NavigateFunction;
}

// Helper to determine base color class for the left status bar
const getStatusColor = (status: TaskStatus): string => {
  switch (status) {
    case "completed":
      return "border-green-500";
    case "in_progress":
      return "border-blue-500";
    case "pending":
    case "due":
      return "border-orange-500"; // Use orange/red for urgency
    case "scheduled":
      return "border-yellow-500";
    case "archived":
    default:
      return "border-gray-300";
  }
};

// Helper for status text color (for the badge)
const getStatusBadgeColor = (status: TaskStatus): string => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800";
    case "in_progress":
      return "bg-blue-100 text-blue-800";
    case "pending":
    case "due":
      return "bg-red-100 text-red-800";
    case "scheduled":
      return "bg-yellow-100 text-yellow-800";
    case "archived":
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onNavigate }) => {
  const { isAdmin, user } = useAuth();
  const { startTask, completeTask } = useTasks();
  const { setSelectedTask } = useTaskDetail();
  const isManagerOrAdmin =
    user?.role === "Manager" || user?.role === "Admin" || isAdmin;

  const assigneeName = useMemo(
    () => task.Assignee?.name || "N/A",
    [task.Assignee]
  );
  const creatorName = useMemo(
    () => task.Creator?.name || "N/A",
    [task.Creator]
  );

  const statusBorderColor = getStatusColor(task.status);
  const statusBadgeColor = getStatusBadgeColor(task.status);
  const formattedDueDate = new Date(task.dueDate).toLocaleDateString();
  const formattedCompletedDate = task.completedAt
    ? new Date(task.completedAt).toLocaleDateString()
    : null;

  return (
    // Wrapper div to make the entire card clickable
    <div
      className="cursor-pointer transition-transform hover:scale-105"
      onClick={() => {
        // Pass task data through context
        console.log("📋 [TaskCard] Setting selected task from context:", task);
        setSelectedTask(task);
        onNavigate("TaskDetail", task.id);
      }}
    >
      <Card
        className={`flex flex-col mb-4 p-5 border border-gray-200 shadow-md transition-shadow hover:shadow-lg ${statusBorderColor} border-l-8`}
      >
        {/* 1. Main Content Area */}
        <div className="flex justify-between items-start pb-3">
          <div className="flex-1 min-w-0 pr-4">
            <h3 className="text-xl font-bold text-gray-900 leading-snug">
              {task.title}
            </h3>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {task.description}
            </p>
          </div>

          {/* Status Badge (Top Right) */}
          <span
            className={`px-3 py-1 text-xs font-semibold rounded-full uppercase flex-shrink-0 ${statusBadgeColor}`}
          >
            {task.status.split("_").join(" ")}
          </span>
        </div>

        {/* Divider Line */}
        <hr className="my-3 border-gray-100" />

        {/* 2. Footer: Metadata and Actions */}
        <div className="flex justify-between items-center mt-1">
          {/* Metadata (Left Side Footer) */}
          <div className="flex flex-wrap items-center text-sm space-x-4 text-gray-500">
            <span className="text-sm text-gray-700">
              {isManagerOrAdmin ? "Created by:" : "Assigned by:"}{" "}
              <span className="font-semibold text-gray-800">
                {isManagerOrAdmin ? creatorName : assigneeName}
              </span>
            </span>
            <span className="flex items-center space-x-1">
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                ></path>
              </svg>
              <span className="font-semibold text-gray-700">
                {task.status === "completed" && formattedCompletedDate
                  ? `Completed: ${formattedCompletedDate}`
                  : `Due: ${formattedDueDate}`}
              </span>
            </span>
          </div>

          {/* Action Buttons (Right Side Footer) */}
          <div className="flex space-x-2 flex-shrink-0">
            {/* Manager/Admin Edit Button - NOT for completed tasks */}
            {isManagerOrAdmin && task.status !== "completed" && (
              <Button
                variant="outline"
                className="py-2 px-4 text-sm"
                onClick={(e: any) => {
                  e.stopPropagation();
                  onNavigate("EditTask", task.id);
                }}
              >
                Edit
              </Button>
            )}

            {/* Standard User Actions (for 'pending' tasks) */}
            {!isManagerOrAdmin && task.status === "pending" && (
              <>
                <Button
                  variant="secondary"
                  className="py-2 px-4 text-sm"
                  onClick={(e: any) => {
                    e.stopPropagation();
                    console.log("Report issue:", task.id);
                  }}
                >
                  Report Issue
                </Button>
                <Button
                  variant="primary"
                  className="py-2 px-4 text-sm"
                  onClick={(e: any) => {
                    e.stopPropagation();
                    startTask(task.id);
                  }}
                >
                  Start Task Now
                </Button>
              </>
            )}

            {/* Standard User Actions (for 'in_progress' tasks) */}
            {!isManagerOrAdmin && task.status === "in_progress" && (
              <>
                <Button
                  variant="secondary"
                  className="py-2 px-4 text-sm"
                  onClick={(e: any) => {
                    e.stopPropagation();
                    console.log("Report issue:", task.id);
                  }}
                >
                  Report Issue
                </Button>
                <Button
                  variant="danger"
                  className="py-2 px-4 text-sm"
                  onClick={(e: any) => {
                    e.stopPropagation();
                    completeTask(task.id);
                  }}
                >
                  End Task
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
