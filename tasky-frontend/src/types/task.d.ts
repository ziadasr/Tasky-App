// Task Statuses
export const TASK_STATUSES = ["To Do", "In Progress", "Completed"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

// Task Interface
export interface Task {
  id: string;
  name: string;
  description: string;
  creationDate: string;
  dueDate: string;
  status: TaskStatus;
  assignedToId: string; // user ID
}

// Task Context State Interface
export interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
}

// Task Context Provider Interface
export interface TaskContextType extends TaskState {
  availableUsers: User[];
  saveTask: (
    task: Partial<Task> & {
      name: string;
      description: string;
      dueDate: string;
      status: TaskStatus;
      assignedToId: string;
    }
  ) => Promise<Task>;
  getTaskById: (id: string) => Task | undefined;
  fetchTasks: () => Promise<void>;
}

export type TaskAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: Task[] }
  | { type: "FETCH_ERROR"; payload: string }
  | { type: "UPDATE_TASK"; payload: Task }
  | { type: "ADD_TASK"; payload: Task };

// Dependency import for User
import { User } from "./user";
