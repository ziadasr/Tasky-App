// Import User type for relationships
import { User, TasksSuccessPayload, TaskCreatedPayload } from "./user";

// Task Statuses (aligned with backend enum)
export const TASK_STATUSES = [
  "scheduled",
  "pending",
  "in_progress",
  "due",
  "completed",
  "archived",
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

// Task Interface (aligned with backend Sequelize model)
export interface Task {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  dueDate: string; // ISO8601 date
  scheduledRunTime: string; // ISO8601 date
  assigneeId: string; // user ID
  createdBy: string; // manager user ID
  department: string;
  status: TaskStatus;
  isRecurring: boolean;
  jobId: string | null; // BullMQ job ID
  startedAt?: string | null; // ISO8601 date
  completedAt?: string | null; // ISO8601 date
  createdAt?: string;
  updatedAt?: string;
  // Relations (when included from API)
  Assignee?: {
    id: string;
    name: string;
    email: string;
  };
  Creator?: {
    id: string;
    name: string;
    email: string;
  };
}

// Task Context State Interface
export interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  taskCount: number;
  statusCounts: Record<string, number>; // e.g., { pending: 12, in_progress: 5, completed: 50 }
}

// Task Context Provider Interface
export interface TaskContextType extends TaskState {
  availableUsers: User[];
  saveTask: (taskData: CreateTaskPayload) => Promise<Task>;
  getTaskById: (id: string) => Task | undefined;
  fetchTasks: (status?: TaskStatus) => Promise<void>;
  startTask: (taskId: string | number) => Promise<void>;
  completeTask: (taskId: string | number) => Promise<void>;
  updateTask: (
    taskId: string | number,
    updates: {
      title?: string;
      description?: string;
      priority?: string;
      dueDate?: string;
      scheduledRunTime?: string;
      assigneeId?: string | number;
      isRecurring?: boolean;
    }
  ) => Promise<void>;
}

// Task creation payload
export interface CreateTaskPayload {
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  dueDate: string; // ISO8601 date
  scheduledRunTime: string; // ISO8601 date
  assigneeId: string;
  isRecurring: boolean;
}

export type TaskAction =
  | { type: "FETCH_START" }
  | {
      type: "FETCH_SUCCESS";
      payload: Task[];
      count: number;
      statusCounts: Record<string, number>;
    }
  | { type: "FETCH_ERROR"; payload: string }
  | { type: "UPDATE_TASK"; payload: Task }
  | { type: "ADD_TASK"; payload: Task };

// Dependency import for User
import { User } from "./user";
