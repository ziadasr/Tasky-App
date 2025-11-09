import axios from "axios";
import {
  LoginSuccessPayload,
  StandardErrorPayload,
  StandardSuccessPayload,
  VerificationSuccessPayload,
  TasksSuccessPayload,
  TaskCreatedPayload,
  User,
  NotificationsPayload,
  NotificationCountPayload,
  NotificationMarkReadPayload,
} from "../types/user";
import { CreateTaskPayload } from "../types/task";
const API_URL = "http://localhost:5000";

// Create axios instance with credentials
export const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important: sends cookies with requests
  headers: {
    "Content-Type": "application/json",
  },
});

export const apiService = {
  /**
   * Handles user login and initiation of the first-time password change flow.
   * Throws an error if authentication fails (4xx/5xx status code).
   */

  //login apiend-point -- works well
  login: async (
    email: string,
    password: string
  ): Promise<LoginSuccessPayload> => {
    try {
      // Note: Axios automatically throws an error on non-2xx status codes
      const response = await axiosInstance.post<LoginSuccessPayload>(
        "/api/auth/login",
        {
          email,
          password,
        }
      );

      // If the request succeeds (Status 200), return the data.
      return response.data;
    } catch (error: any) {
      // --- Error Handling using the LoginErrorPayload ---

      // Check if this is an Axios error with a response payload
      if (axios.isAxiosError(error) && error.response) {
        // Assert the error response data to our StandardErrorPayload type
        const errorData = error.response.data as StandardErrorPayload;

        // Priority 1: Use the explicit error message from the backend
        if (errorData.error) {
          // This error message will be caught and displayed by AuthContext
          throw new Error(errorData.error);
        }

        // Priority 2: Use a generic message based on HTTP status
        throw new Error(`Login failed. Status: ${error.response.status}.`);
      }
      // Fallback for network or unknown errors
      throw new Error("Network error or server connection failed.");
    }
  },

  // Verify code endpoint (for first login)
  verifyCode: async (
    email: string,
    code: string
  ): Promise<VerificationSuccessPayload> => {
    try {
      const response = await axiosInstance.post("/api/auth/verify-code", {
        email,
        code,
      });
      return response.data;
    } catch (error: any) {
      // Check if this is an Axios error with a response payload
      if (axios.isAxiosError(error) && error.response) {
        // Assert the error response data to our StandardErrorPayload type
        const errorData = error.response.data as StandardErrorPayload;

        // Priority 1: Use the explicit error message from the backend
        if (errorData.error) {
          // This error message will be caught and displayed by AuthContext
          throw new Error(errorData.error);
        }

        // Priority 2: Use a generic message based on HTTP status
        throw new Error(
          `Verification failed. Status: ${error.response.status}.`
        );
      }
      // Fallback for network or unknown errors
      throw new Error("Network error or server connection failed.");
    }
  },

  // Change password endpoint
  changePassword: async (
    email: string,
    newPassword: string,
    confirmPassword: string,
    phoneNumber: string,
    city: string,
    dateOfBirth: string
  ): Promise<StandardSuccessPayload> => {
    try {
      const response = await axiosInstance.post("/api/auth/Complete-Profile", {
        email,
        newPassword,
        confirmPassword,
        phoneNumber,
        city,
        dateOfBirth,
      });
      return response.data;
    } catch (error: any) {
      // Check if this is an Axios error with a response payload
      if (axios.isAxiosError(error) && error.response) {
        // Assert the error response data to our StandardErrorPayload type
        const errorData = error.response.data as StandardErrorPayload;

        // Priority 1: Use the explicit error message from the backend
        if (errorData.error) {
          // This error message will be caught and displayed by AuthContext
          throw new Error(errorData.error);
        }

        // Priority 2: Use a generic message based on HTTP status
        throw new Error(`Login failed. Status: ${error.response.status}.`);
      }
      // Fallback for network or unknown errors
      throw new Error("Network error or server connection failed.");
    }
  },

  registerUser: async (
    name: string,
    email: string,
    salary: number,
    managerId: number,
    role: string,
    department: string
  ): Promise<StandardSuccessPayload> => {
    try {
      const response = await axiosInstance.post("/api/auth/register-by-admin", {
        name,
        email,
        salary,
        directManagerId: managerId,
        role,
        department,
      });
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data as StandardErrorPayload;
        if (errorData.error) {
          throw new Error(errorData.error);
        }

        throw new Error(
          `Registration failed. Status: ${error.response.status}.`
        );
      }
      throw new Error("Network error or server connection failed.");
    }
  },

  // Create a new task
  createTask: async (
    taskData: CreateTaskPayload
  ): Promise<TaskCreatedPayload> => {
    try {
      const response = await axiosInstance.post<TaskCreatedPayload>(
        "/api/auth/create-task",
        taskData
      );
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data as StandardErrorPayload;
        if (errorData.error) {
          throw new Error(errorData.error);
        }
        throw new Error(
          `Task creation failed. Status: ${error.response.status}.`
        );
      }
      throw new Error("Network error or server connection failed.");
    }
  },

  // Get user tasks (with optional status filter)
  getTasks: async (status?: string): Promise<TasksSuccessPayload> => {
    try {
      const url = status
        ? `/api/auth/tasks?status=${status}`
        : "/api/auth/tasks";
      const response = await axiosInstance.get<TasksSuccessPayload>(url);
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data as StandardErrorPayload;
        if (errorData.error) {
          throw new Error(errorData.error);
        }
        throw new Error(
          `Failed to fetch tasks. Status: ${error.response.status}.`
        );
      }
      throw new Error("Network error or server connection failed.");
    }
  },

  // Get a single task by ID
  getTaskById: async (taskId: string | number): Promise<{ task: any }> => {
    try {
      const response = await axiosInstance.get<{ task: any }>(
        `/api/auth/tasks/${taskId}`
      );
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data as StandardErrorPayload;
        if (errorData.error) {
          throw new Error(errorData.error);
        }
        throw new Error(
          `Failed to fetch task. Status: ${error.response.status}.`
        );
      }
      throw new Error("Network error or server connection failed.");
    }
  },

  // Get direct employees for manager (to assign tasks)
  getDirectEmployees: async (): Promise<{
    message: string;
    employees: User[];
  }> => {
    try {
      const response = await axiosInstance.get<{
        message: string;
        employees: User[];
      }>("/api/auth/direct-employees");
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data as StandardErrorPayload;
        if (errorData.error) {
          throw new Error(errorData.error);
        }
        throw new Error(
          `Failed to fetch employees. Status: ${error.response.status}.`
        );
      }
      throw new Error("Network error or server connection failed.");
    }
  },

  // Start task endpoint
  startTask: async (
    taskId: string | number
  ): Promise<StandardSuccessPayload> => {
    try {
      const response = await axiosInstance.post<StandardSuccessPayload>(
        `/api/auth/start-task/${taskId}`,
        {}
      );
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data as StandardErrorPayload;
        if (errorData.error) {
          throw new Error(errorData.error);
        }
        throw new Error(
          `Failed to start task. Status: ${error.response.status}.`
        );
      }
      throw new Error("Network error or server connection failed.");
    }
  },

  // Complete task endpoint
  completeTask: async (
    taskId: string | number
  ): Promise<StandardSuccessPayload> => {
    try {
      const response = await axiosInstance.post<StandardSuccessPayload>(
        `/api/auth/complete-task/${taskId}`,
        {}
      );
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data as StandardErrorPayload;
        if (errorData.error) {
          throw new Error(errorData.error);
        }
        throw new Error(
          `Failed to complete task. Status: ${error.response.status}.`
        );
      }
      throw new Error("Network error or server connection failed.");
    }
  },

  // Update task endpoint
  updateTask: async (
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
  ): Promise<StandardSuccessPayload> => {
    try {
      const response = await axiosInstance.put<StandardSuccessPayload>(
        `/api/auth/update-task/${taskId}`,
        updates
      );
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data as StandardErrorPayload;
        if (errorData.error) {
          throw new Error(errorData.error);
        }
        throw new Error(
          `Failed to update task. Status: ${error.response.status}.`
        );
      }
      throw new Error("Network error or server connection failed.");
    }
  },

  // Report task endpoint
  reportTask: async (
    taskId: string | number,
    message: string
  ): Promise<StandardSuccessPayload> => {
    try {
      const response = await axiosInstance.post<StandardSuccessPayload>(
        `/api/auth/report-task/${taskId}`,
        { message }
      );
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data as StandardErrorPayload;
        if (errorData.error) {
          throw new Error(errorData.error);
        }
        throw new Error(
          `Failed to report task. Status: ${error.response.status}.`
        );
      }
      throw new Error("Network error or server connection failed.");
    }
  },

  // Get all notifications
  getNotifications: async (
    limit: number = 15,
    offset: number = 0
  ): Promise<NotificationsPayload> => {
    try {
      const response = await axiosInstance.get<NotificationsPayload>(
        `/api/notifications/get-all?limit=${limit}&offset=${offset}`
      );
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data as StandardErrorPayload;
        if (errorData.error) {
          throw new Error(errorData.error);
        }
        throw new Error(
          `Failed to fetch notifications. Status: ${error.response.status}.`
        );
      }
      throw new Error("Network error or server connection failed.");
    }
  },

  // Get unread notification count
  getNotificationCount: async (): Promise<NotificationCountPayload> => {
    try {
      const response = await axiosInstance.get<NotificationCountPayload>(
        `/api/notifications/unread-count`
      );
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data as StandardErrorPayload;
        if (errorData.error) {
          throw new Error(errorData.error);
        }
        throw new Error(
          `Failed to fetch notification count. Status: ${error.response.status}.`
        );
      }
      throw new Error("Network error or server connection failed.");
    }
  },

  // Mark all notifications as read
  markAllNotificationsAsRead:
    async (): Promise<NotificationMarkReadPayload> => {
      try {
        const response = await axiosInstance.post<NotificationMarkReadPayload>(
          `/api/notifications/mark-all-read`,
          {}
        );
        return response.data;
      } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
          const errorData = error.response.data as StandardErrorPayload;
          if (errorData.error) {
            throw new Error(errorData.error);
          }
          throw new Error(
            `Failed to mark notifications as read. Status: ${error.response.status}.`
          );
        }
        throw new Error("Network error or server connection failed.");
      }
    },
};

//   // Get current user info
//   getCurrentUser: async (): Promise<User> => {
//     try {
//       const response = await api.get("/auth/me");
//       return response.data;
//     } catch (error: any) {
//       throw new Error(
//         error.response?.data?.error || "Failed to fetch user info."
//       );
//     }
//   },

//   // Logout endpoint
//   logout: async (): Promise<void> => {
//     try {
//       await api.post("/auth/logout");
//     } catch (error) {
//       console.error("Logout error:", error);
//     }
//   },
// };
