import React, {
  useState,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { mockAPI, MOCK_TASKS, MOCK_USERS } from "../api/mockApi";
import { Task, TaskContextType, TaskAction, TaskState } from "../types/task";
import { User } from "../types/user";
import { useAuth } from "./AuthContext";

const taskReducer = (state: TaskState, action: TaskAction): TaskState => {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true, error: null };
    case "FETCH_SUCCESS":
      return { ...state, loading: false, tasks: action.payload };
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
      return { ...state, tasks: [...state.tasks, action.payload] };
    default:
      return state;
  }
};

const initialTaskState: TaskState = {
  // Initial state setup to match mock data structure for a clean start
  tasks: MOCK_TASKS,
  loading: false,
  error: null,
};

// Default value must conform to TaskContextType
const defaultContextValue: TaskContextType = {
  ...initialTaskState,
  availableUsers: [],
  saveTask: async () => MOCK_TASKS[0], // Mock return
  getTaskById: () => undefined, // Mock return
  fetchTasks: async () => {}, // Mock return
};

export const TaskContext =
  React.createContext<TaskContextType>(defaultContextValue);

interface TaskProviderProps {
  children: ReactNode;
}

export const TaskProvider: React.FC<TaskProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(taskReducer, initialTaskState);
  const { user, userId, isAdmin, isUser } = useAuth();
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);

  // Fetch users for assignment dropdown (Admin only)
  const fetchAvailableUsers = useCallback(async () => {
    if (isAdmin) {
      try {
        const users = await mockAPI.fetchAllUsers();
        setAvailableUsers(users);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    }
  }, [isAdmin]);

  // Fetch tasks based on role
  const fetchTasks = useCallback(async () => {
    if (!user) return;

    dispatch({ type: "FETCH_START" });
    try {
      let fetchedTasks: Task[];
      if (isAdmin) {
        fetchedTasks = await mockAPI.fetchTasks();
      } else if (isUser) {
        fetchedTasks = await mockAPI.fetchTasksByUserId(userId as string);
      } else {
        fetchedTasks = [];
      }
      dispatch({ type: "FETCH_SUCCESS", payload: fetchedTasks });
    } catch (error) {
      dispatch({
        type: "FETCH_ERROR",
        payload:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  }, [user, isAdmin, isUser, userId]);

  // Add/Edit Task
  const saveTask = useCallback(
    async (
      taskData: Partial<Task> & {
        name: string;
        description: string;
        dueDate: string;
        status: Task["status"];
        assignedToId: string;
      }
    ) => {
      try {
        // Ensure the task object being passed to API is fully typed for creation/update
        const taskToSave: Partial<Task> = {
          ...taskData,
          id: taskData.id, // ID will be present for edits, undefined for new tasks
        };

        const savedTask = await mockAPI.saveTask(taskToSave);
        dispatch({
          type: taskData.id ? "UPDATE_TASK" : "ADD_TASK",
          payload: savedTask,
        });
        return savedTask;
      } catch (error) {
        console.error("Failed to save task:", error);
        throw error;
      }
    },
    []
  );

  const getTaskById = useCallback(
    (id: string) => state.tasks.find((t) => t.id === id),
    [state.tasks]
  );

  useEffect(() => {
    fetchTasks();
    fetchAvailableUsers();
  }, [fetchTasks, fetchAvailableUsers]);

  const value: TaskContextType = useMemo(
    () => ({
      ...state,
      availableUsers,
      saveTask,
      getTaskById,
      fetchTasks,
    }),
    [state, availableUsers, saveTask, getTaskById, fetchTasks]
  );

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};

export const useTasks = () => useContext(TaskContext);
