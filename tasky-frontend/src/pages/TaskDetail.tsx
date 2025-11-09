import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useTaskDetail } from "../context/TaskDetailContext";
import { Card, Button } from "../components/common/UIComponents";
import { apiService } from "../api/api";
import { Task } from "../types/task";

type AppPath =
  | "Dashboard"
  | "TaskList"
  | "AddTask"
  | "EditTask"
  | "TaskDetail"
  | "Register"
  | "ChangePassword"
  | "VerifyCode"
  | "Notifications";

type NavigateFunction = (
  path: AppPath,
  taskId?: string | null,
  filterStatus?: string | null
) => void;

interface TaskDetailProps {
  onNavigate: NavigateFunction;
  taskId?: string | null;
}

export const TaskDetailPage: React.FC<TaskDetailProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { selectedTask } = useTaskDetail();
  const [task, setTask] = useState<Task | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportMessage, setReportMessage] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  useEffect(() => {
    console.log(
      "📋 [TaskDetail] useEffect triggered - selectedTask:",
      selectedTask
    );

    if (selectedTask) {
      console.log("✅ [TaskDetail] Task loaded from context:", selectedTask);
      setTask(selectedTask);
      setError(null);
    } else {
      console.log("❌ [TaskDetail] No task found in context");
      setError("Task not found. Please go back to the task list.");
    }
  }, [selectedTask]);

  if (error) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Task Details</h1>
        <Card className="p-8 text-center border-red-500 bg-red-50">
          <p className="text-red-500 text-lg">{error}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => onNavigate("TaskList")}
          >
            Back to Tasks
          </Button>
        </Card>
      </div>
    );
  }

  if (!task) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Task Details</h1>
        <Card className="p-8 text-center border-red-500 bg-red-50">
          <p className="text-red-500 text-lg">Task not found</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => onNavigate("TaskList")}
          >
            Back to Tasks
          </Button>
        </Card>
      </div>
    );
  }

  // Check permissions - can view if: creator, assignee, manager/admin
  const canView =
    user?.id === task.createdBy ||
    user?.id === task.assigneeId ||
    user?.role === "Manager" ||
    user?.role === "Admin";

  if (!canView) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Task Details</h1>
        <Card className="p-8 text-center border-red-500 bg-red-50">
          <p className="text-red-500 text-lg">
            You don't have permission to view this task
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => onNavigate("TaskList")}
          >
            Back to Tasks
          </Button>
        </Card>
      </div>
    );
  }

  // Determine if user can edit (only creator/manager)
  const canEdit =
    user?.id === task.createdBy ||
    user?.role === "Manager" ||
    user?.role === "Admin";

  // Only employees (not managers/admins) can report tasks
  const canReport =
    user?.role !== "Manager" &&
    user?.role !== "Admin" &&
    task.assigneeId === user?.id;

  const handleReportTask = async () => {
    if (!reportMessage.trim()) {
      setReportError("Please enter a message");
      return;
    }

    setReportLoading(true);
    setReportError(null);

    try {
      console.log(`📝 [TaskDetail] Reporting task ${task.id}:`, reportMessage);
      const response = await apiService.reportTask(task.id, reportMessage);
      console.log("✅ [TaskDetail] Task reported successfully:", response);
      setShowReportModal(false);
      setReportMessage("");
      // Show success message
      alert("Task reported successfully!");
    } catch (err: any) {
      console.error("❌ [TaskDetail] Failed to report task:", err);
      setReportError(err.message || "Failed to report task");
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Task Details</h1>
        <Button
          variant="outline"
          onClick={() => onNavigate("TaskList")}
          className="text-sm px-4 py-2"
        >
          ← Back to Tasks
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Task Info */}
        <div className="lg:col-span-2">
          <Card className="p-6 mb-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {task.title}
              </h2>
              <div className="flex gap-3 flex-wrap">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    task.status === "completed"
                      ? "bg-green-100 text-green-800"
                      : task.status === "in_progress"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {task.status?.charAt(0).toUpperCase() +
                    task.status?.slice(1).replace("_", " ")}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    task.priority === "high"
                      ? "bg-red-100 text-red-800"
                      : task.priority === "medium"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {task.priority?.charAt(0).toUpperCase() +
                    task.priority?.slice(1)}
                  {" Priority"}
                </span>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Description
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">
                {task.description || "No description provided"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-600 mb-1">
                  Due Date
                </h4>
                <p className="text-gray-900">
                  {new Date(task.dueDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-600 mb-1">
                  Scheduled Run Time
                </h4>
                <p className="text-gray-900">
                  {new Date(task.scheduledRunTime).toLocaleString()}
                </p>
              </div>
              {task.startedAt && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-600 mb-1">
                    Started
                  </h4>
                  <p className="text-gray-900">
                    {new Date(task.startedAt).toLocaleString()}
                  </p>
                </div>
              )}
              {task.completedAt && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-600 mb-1">
                    Completed
                  </h4>
                  <p className="text-gray-900">
                    {new Date(task.completedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            {task.isRecurring && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded mb-6">
                <p className="text-sm text-blue-800">
                  ⏱️ This is a recurring task
                </p>
              </div>
            )}
          </Card>

          {/* Edit Button - Only for managers and creators */}
          {canEdit && (
            <Card className="p-6">
              <Button
                variant="outline"
                disabled={task.status === "completed"}
                className={`w-full py-2 transition-colors ${
                  task.status === "completed"
                    ? "opacity-50 cursor-not-allowed bg-gray-100 text-gray-400"
                    : "hover:bg-indigo-600 hover:text-white"
                }`}
                onClick={() => onNavigate("EditTask", task.id?.toString())}
                title={
                  task.status === "completed"
                    ? "Cannot edit completed tasks"
                    : ""
                }
              >
                {task.status === "completed" ? "Task Completed" : "Edit Task"}
              </Button>
            </Card>
          )}

          {/* Report Button - Only for assigned employees */}
          {canReport && (
            <Card className="p-6 border-orange-200 bg-orange-50">
              <Button
                variant="outline"
                className="w-full py-2 text-orange-600 hover:bg-orange-600 hover:text-white transition-colors border-orange-400"
                onClick={() => setShowReportModal(true)}
              >
                📢 Report Issue
              </Button>
            </Card>
          )}
        </div>

        {/* Side Panel - Task Metadata */}
        <div className="lg:col-span-1">
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Task Info
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase">
                  Department
                </p>
                <p className="text-gray-900">{task.department || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase">
                  Task ID
                </p>
                <p className="text-gray-900 font-mono text-sm">{task.id}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase">
                  Created
                </p>
                <p className="text-gray-900">
                  {task.createdAt
                    ? new Date(task.createdAt).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase">
                  Last Updated
                </p>
                <p className="text-gray-900">
                  {task.updatedAt
                    ? new Date(task.updatedAt).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-sm text-gray-700">Created By</span>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {task.Creator?.name || "N/A"}
                  </p>
                  <p className="text-xs text-gray-500">ID: {task.createdBy}</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-sm text-gray-700">Assigned To</span>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {task.Assignee?.name || "N/A"}
                  </p>
                  <p className="text-xs text-gray-500">ID: {task.assigneeId}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Report Task Issue
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Please describe the issue or problem you're experiencing with this
              task.
            </p>

            {reportError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-sm text-red-600">{reportError}</p>
              </div>
            )}

            <textarea
              value={reportMessage}
              onChange={(e) => {
                setReportMessage(e.target.value);
                setReportError(null);
              }}
              placeholder="Describe the issue..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 mb-4 font-sans"
              rows={5}
            />

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 py-2 text-gray-600 hover:bg-gray-100"
                onClick={() => {
                  setShowReportModal(false);
                  setReportMessage("");
                  setReportError(null);
                }}
                disabled={reportLoading}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 py-2 bg-orange-600 text-white hover:bg-orange-700 transition-colors disabled:opacity-50"
                onClick={handleReportTask}
                disabled={reportLoading || !reportMessage.trim()}
              >
                {reportLoading ? "Sending..." : "Send Report"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
