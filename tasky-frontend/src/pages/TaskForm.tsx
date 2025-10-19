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
import { Task, TASK_STATUSES, TaskStatus } from "../types/task.d";
import { NavigateFunction } from "../app";

interface TaskFormProps {
  onNavigate: NavigateFunction;
  taskId?: string | null;
}

interface TaskFormData {
  name: string;
  description: string;
  dueDate: string;
  status: TaskStatus;
  assignedToId: string;
}

const initialFormData: TaskFormData = {
  name: "",
  description: "",
  dueDate: "",
  status: TASK_STATUSES[0],
  assignedToId: "",
};

export const TaskFormPage: React.FC<TaskFormProps> = ({
  onNavigate,
  taskId,
}) => {
  const { saveTask, getTaskById, availableUsers, fetchTasks } = useTasks();
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
        setFormData(taskToEdit as TaskFormData);
      }
    } else {
      // Set default assignment to self for Admin when adding, if no other users are available
      setFormData((prev) => ({
        ...prev,
        assignedToId: availableUsers[0]?.id || user?.id || "",
        status: TASK_STATUSES[0],
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
      const taskToSave: Partial<Task> & TaskFormData = {
        ...formData,
        id: taskId || undefined, // Add ID for update
        status: formData.status as TaskStatus, // Ensure status is correctly typed
      };

      await saveTask(taskToSave);
      await fetchTasks(); // Refresh list immediately
      onNavigate("TaskList");
    } catch (err) {
      setError("Failed to save task. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const userOptions = availableUsers.map((u) => ({
    value: u.id,
    label: `${u.name} (${u.username})`,
  }));

  const statusOptions = TASK_STATUSES.map((s) => ({ value: s, label: s }));

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        {isEdit ? "Edit Task" : "Create New Task"}
      </h1>
      <Card className="max-w-3xl">
        <form onSubmit={handleSubmit}>
          <Input
            label="Task Name"
            id="name"
            value={formData.name}
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
            <Input
              label="Due Date"
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={handleChange}
              required
            />
            <Select
              label="Status"
              id="status"
              value={formData.status}
              onChange={handleChange}
              options={statusOptions}
              required
            />
          </div>
          <Select
            label="Assigned To"
            id="assignedToId"
            value={formData.assignedToId}
            onChange={handleChange}
            options={userOptions}
            required
          />

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
