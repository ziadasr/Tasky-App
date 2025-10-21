import axios from "axios";
import {
  LoginSuccessPayload,
  StandardErrorPayload,
  VerificationSuccessPayload,
} from "../types/user";
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
};

//   // Change password endpoint
//   changePassword: async (
//     email: string,
//     newPassword: string,
//     verificationCode?: string
//   ): Promise<any> => {
//     try {
//       const response = await api.post("/auth/change-password", {
//         email,
//         newPassword,
//         verificationCode,
//       });
//       return response.data;
//     } catch (error: any) {
//       throw new Error(
//         error.response?.data?.error ||
//           "Password change failed. Please try again."
//       );
//     }
//   },
// };

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
