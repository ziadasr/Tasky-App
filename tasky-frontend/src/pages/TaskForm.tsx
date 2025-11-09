import React, { useState, useEffect, useCallback, ChangeEvent } from "react";
import { useTasks } from "../context/TaskContext";
import { useAuth } from "../context/AuthContext";
import {
  Card,
  Input,
  Select,
  Button,
  Spinner,
} from "../components/common/UIComponents";
import { NavigateFunction } from "../app";

interface TaskFormProps {
  onNavigate: NavigateFunction;
  taskId?: string | null;
}

interface TaskFormData {
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  dueDate: string;
  scheduledRunTime: string;
  assigneeId: string;
  isRecurring: boolean;
}

const initialFormData: TaskFormData = {
  title: "",
  description: "",
  priority: "medium",
  dueDate: "",
  scheduledRunTime: "",
  assigneeId: "",
  isRecurring: false,
};

export const TaskFormPage: React.FC<TaskFormProps> = ({
  onNavigate,
  taskId,
}) => {
  const { saveTask, updateTask, getTaskById, availableUsers, fetchTasks } =
    useTasks();
  const { user } = useAuth();
  const [formData, setFormData] = useState<TaskFormData>(initialFormData);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!taskId;

  // Load task data if editing
  useEffect(() => {
    if (isEdit && taskId) {
      const taskToEdit = getTaskById(taskId);
      if (taskToEdit) {
        setFormData({
          title: taskToEdit.title || "",
          description: taskToEdit.description || "",
          priority:
            (taskToEdit.priority as "low" | "medium" | "high") || "medium",
          dueDate: taskToEdit.dueDate || "",
          scheduledRunTime: taskToEdit.scheduledRunTime || "",
          assigneeId: String(taskToEdit.assigneeId || ""),
          isRecurring: taskToEdit.isRecurring || false,
        });
      }
    } else {
      // Set default assignment to first available user
      setFormData((prev) => ({
        ...prev,
        assigneeId: String(availableUsers[0]?.id || user?.id || ""),
      }));
    }
  }, [taskId, isEdit, getTaskById, user?.id, availableUsers]);

  const handleChange = useCallback(
    (
      e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
      const { id, value } = e.target;
      // Type assertion is safe here as value is always string
      setFormData((prev) => ({ ...prev, [id]: value as string }));
    },
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (
        !formData.title ||
        !formData.description ||
        !formData.priority ||
        !formData.dueDate ||
        !formData.scheduledRunTime ||
        !formData.assigneeId
      ) {
        setError("Please fill in all required fields.");
        setLoading(false);
        return;
      }

      // Validate that scheduledRunTime is not in the past (skip for editing)
      if (!isEdit && new Date(formData.scheduledRunTime) < new Date()) {
        setError("Scheduled run time cannot be in the past.");
        setLoading(false);
        return;
      }

      // Validate that dueDate is after scheduledRunTime (skip for editing)
      if (
        !isEdit &&
        new Date(formData.dueDate) <= new Date(formData.scheduledRunTime)
      ) {
        setError("Due date must be after the scheduled run time.");
        setLoading(false);
        return;
      }

      // Create payload matching backend expectations
      const taskPayload = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        dueDate: formData.dueDate,
        scheduledRunTime: formData.scheduledRunTime,
        assigneeId: formData.assigneeId,
        isRecurring: formData.isRecurring,
      };

      if (isEdit && taskId) {
        // Update existing task
        await updateTask(taskId, taskPayload);
      } else {
        // Create new task
        await saveTask(taskPayload);
      }
      await fetchTasks(); // Refresh list immediately
      onNavigate("TaskList");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save task. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const userOptions = availableUsers.map((u) => ({
    value: String(u.id),
    label: `${u.name} (${u.email})`,
  }));

  const priorityOptions = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        {isEdit ? "Edit Task" : "Create New Task"}
      </h1>
      <Card className="max-w-3xl">
        <form onSubmit={handleSubmit}>
          <Input
            label="Task Title"
            id="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Finalize Q4 Budget"
            required
          />
          <div className="mb-4">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
              placeholder="Detailed description of the task."
              required
            ></textarea>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Select
              label="Priority"
              id="priority"
              value={formData.priority}
              onChange={handleChange}
              options={priorityOptions}
              required
            />
            <Input
              label="Scheduled Run Time"
              id="scheduledRunTime"
              type="datetime-local"
              value={formData.scheduledRunTime}
              onChange={handleChange}
              required
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Due Date"
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={handleChange}
              required
            />
            <Select
              label="Assigned To"
              id="assigneeId"
              value={formData.assigneeId}
              onChange={handleChange}
              options={userOptions}
              required
            />
          </div>
          <div className="mb-4 flex items-center">
            <input
              type="checkbox"
              id="isRecurring"
              checked={formData.isRecurring}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  isRecurring: e.target.checked,
                }))
              }
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label
              htmlFor="isRecurring"
              className="ml-2 text-sm font-medium text-gray-700"
            >
              Recurring Task
            </label>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-between items-center mt-6">
            <Button type="submit" disabled={loading}>
              {loading ? <Spinner /> : isEdit ? "Update Task" : "Create Task"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onNavigate("TaskList")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
