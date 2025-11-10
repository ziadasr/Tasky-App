import React, {
  useState,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
  useRef,
} from "react";
import { apiService } from "../api/api";
import {
  Task,
  TaskContextType,
  TaskAction,
  TaskState,
  CreateTaskPayload,
} from "../types/task";
import { User } from "../types/user";
import { useAuth } from "./AuthContext";

const taskReducer = (state: TaskState, action: TaskAction): TaskState => {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true, error: null };
    case "FETCH_SUCCESS":
      return {
        ...state,
        loading: false,
        tasks: action.payload,
        taskCount: action.count,
        statusCounts: action.statusCounts,
      };
    case "FETCH_ERROR":
      return { ...state, loading: false, error: action.payload };
    case "UPDATE_TASK":
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.payload.id ? action.payload : t
        ),
      };
    case "ADD_TASK":
      return {
        ...state,
        tasks: [...state.tasks, action.payload],
        taskCount: state.taskCount + 1,
      };
    default:
      return state;
  }
};

const initialTaskState: TaskState = {
  // Start with empty array - will fetch from API
  tasks: [],
  loading: false,
  error: null,
  taskCount: 0,
  statusCounts: {},
};

// Default value must conform to TaskContextType
const defaultContextValue: TaskContextType = {
  ...initialTaskState,
  availableUsers: [],
  saveTask: async () => {
    throw new Error("Not initialized");
  },
  getTaskById: () => undefined,
  fetchTasks: async () => {},
  startTask: async () => {
    throw new Error("Not initialized");
  },
  completeTask: async () => {
    throw new Error("Not initialized");
  },
  updateTask: async () => {
    throw new Error("Not initialized");
  },
};

export const TaskContext =
  React.createContext<TaskContextType>(defaultContextValue);

interface TaskProviderProps {
  children: ReactNode;
}

export const TaskProvider: React.FC<TaskProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(taskReducer, initialTaskState);
  const { user } = useAuth();
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const hasInitialFetch = useRef(false);

  // Fetch users for assignment dropdown (Manager only)
  const fetchAvailableUsers = useCallback(async () => {
    if (!user) return;

    // Only managers/admins can assign tasks
    if (user.role === "Manager" || user.role === "Admin") {
      try {
        const response = await apiService.getDirectEmployees();
        setAvailableUsers(response.employees);
      } catch (error) {
        console.error("Failed to fetch available users:", error);
        // Silently fail - users will see empty dropdown but can still create tasks
      }
    }
  }, [user]);

  // Fetch tasks based on role
  const fetchTasks = useCallback(
    async (
      status?:
        | string
        | {
            status?: string;
            scope?: "assignedToMe" | "assignedByMe" | "assignedToTeam";
          }
    ) => {
      if (!user) return;

      dispatch({ type: "FETCH_START" });
      try {
        // Support both old (string) and new (object) API signatures for backward compatibility
        let filters;
        if (typeof status === "string") {
          filters = { status };
        } else {
          filters = status;
        }

        const response = await apiService.getTasks(filters);
        dispatch({
          type: "FETCH_SUCCESS",
          payload: response.tasks,
          count: response.count,
          statusCounts: response.statusCounts || {},
        });
      } catch (error) {
        dispatch({
          type: "FETCH_ERROR",
          payload:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
        });
      }
    },
    [user]
  );

  // Add/Create Task
  const saveTask = useCallback(
    async (taskData: CreateTaskPayload): Promise<Task> => {
      try {
        const response = await apiService.createTask(taskData);
        dispatch({
          type: "ADD_TASK",
          payload: response.task,
        });
        return response.task;
      } catch (error) {
        console.error("Failed to create task:", error);
        throw error;
      }
    },
    []
  );

  // Start Task
  const startTask = useCallback(
    async (taskId: string | number): Promise<void> => {
      try {
        await apiService.startTask(taskId);
        // Refresh tasks after starting
        await fetchTasks();
      } catch (error) {
        console.error("Failed to start task:", error);
        throw error;
      }
    },
    [fetchTasks]
  );

  // Complete Task
  const completeTask = useCallback(
    async (taskId: string | number): Promise<void> => {
      try {
        await apiService.completeTask(taskId);
        // Refresh tasks after completing
        await fetchTasks();
      } catch (error) {
        console.error("Failed to complete task:", error);
        throw error;
      }
    },
    [fetchTasks]
  );

  // Update Task
  const updateTask = useCallback(
    async (
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
    ): Promise<void> => {
      try {
        await apiService.updateTask(taskId, updates);
        // Refresh tasks after updating
        await fetchTasks();
      } catch (error) {
        console.error("Failed to update task:", error);
        throw error;
      }
    },
    [fetchTasks]
  );

  const getTaskById = useCallback(
    (id: string) => state.tasks.find((t) => t.id === id),
    [state.tasks]
  );

  useEffect(() => {
    if (hasInitialFetch.current) return; // Skip if already fetched (prevents StrictMode double-call)

    // Skip automatic fetch for managers/admins (they use ManagerTaskView instead)
    if (user?.role === "Manager" || user?.role === "Admin") {
      console.log(
        "⏭️  [TaskContext] Skipping auto-fetch for",
        user.role,
        "- they use ManagerTaskView"
      );
      hasInitialFetch.current = true;
      fetchAvailableUsers();
      return;
    }

    hasInitialFetch.current = true;
    console.log("📋 [TaskContext] Fetching tasks on mount for", user?.role);
    fetchTasks();
    fetchAvailableUsers();
  }, [user?.role, fetchTasks]);

  const value: TaskContextType = useMemo(
    () => ({
      ...state,
      availableUsers,
      saveTask,
      getTaskById,
      fetchTasks,
      startTask,
      completeTask,
      updateTask,
    }),
    [
      state,
      availableUsers,
      saveTask,
      getTaskById,
      fetchTasks,
      startTask,
      completeTask,
      updateTask,
    ]
  );

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};

export const useTasks = () => useContext(TaskContext);
