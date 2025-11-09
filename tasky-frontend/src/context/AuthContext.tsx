import React, {
  useState,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { apiService } from "../api/api";
import {
  AuthContextType,
  User,
  VerificationSuccessPayload,
  StandardSuccessPayload,
} from "../types/user";

// Initialize context with a safe, typed default value (casting to ensure TS acceptance)
const defaultContextValue: AuthContextType = {
  user: null,
  loading: false,
  error: null,
  login: async () => false,
  logout: () => {},
  verifyCode: async () =>
    ({
      message: "",
      code: "",
      nextStep: "CHANGE_PASSWORD",
    } as VerificationSuccessPayload),
  changePassword: async () =>
    ({
      message: "",
      code: "",
    } as StandardSuccessPayload),
  isAdmin: false,
  isUser: false,
  userId: undefined,
  actionRequired: null,
  isVerified: false, // <-- NEW FLAG
};

export const AuthContext =
  React.createContext<AuthContextType>(defaultContextValue);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [actionRequired, setActionRequired] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState<boolean>(false); // <-- NEW STATE

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      console.log("🔐 Attempting login for email:", email);
      const response = await apiService.login(email, password);

      // Backend returns user object in both cases (200 and 202)
      console.log("✅ Login response received:", response);
      setUser(response.user);

      // Store user data in localStorage
      console.log("💾 Storing user in localStorage:", response.user);
      localStorage.setItem("currentUser", JSON.stringify(response.user));

      // Check if password change is required
      if (response.code === "PASSWORD_CHANGE_REQUIRED") {
        console.log("⚠️ Password change required");
        setActionRequired("PASSWORD_CHANGE_REQUIRED");
        setIsVerified(false); // Reset verification state on new login
        localStorage.setItem("actionRequired", "PASSWORD_CHANGE_REQUIRED");
        localStorage.setItem("isVerified", "false"); // Persist verification state
      } else {
        console.log("✅ Login successful, no password change required");
        setActionRequired(null);
        setIsVerified(false);
        localStorage.removeItem("actionRequired");
        localStorage.removeItem("isVerified");
      }

      return true;
    } catch (err) {
      console.error("❌ Login failed:", err);
      setError(err instanceof Error ? err.message : "Login failed");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setActionRequired(null);
    setIsVerified(false); // Clear verified status on logout
    localStorage.removeItem("currentUser");
    localStorage.removeItem("actionRequired");
    localStorage.removeItem("isVerified"); // Clear persisted verification state
  }, []);

  const changePassword = useCallback(
    async (
      email: string,
      newPassword: string,
      confirmPassword: string,
      phoneNumber: string,
      city: string,
      dateOfBirth: string
    ) => {
      setLoading(true);
      setError(null);
      try {
        // Call API to change password
        console.log("🔄 Calling changePassword API...");
        const response = await apiService.changePassword(
          email,
          newPassword,
          confirmPassword,
          phoneNumber,
          city,
          dateOfBirth
        );

        // On success, clear the action required flags
        console.log("✅ Password changed successfully:", response);
        setActionRequired(null);
        setIsVerified(false); // Clear verified status after successful password change
        localStorage.removeItem("actionRequired");
        localStorage.removeItem("isVerified"); // Clear persisted verification state

        // Return the response so the caller can access the message
        return response;

        // Final step: Force a re-login to get a proper session token with tempPassword: false
        // In production, we would call apiService.login again here.
        // window.location.reload();
      } catch (err) {
        console.error("❌ Password change failed:", err);
        setError(
          err instanceof Error ? err.message : "Failed to change password"
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const verifyCode = useCallback(async (email: string, code: string) => {
    setLoading(true);
    setError(null);
    try {
      // Call API to verify code
      const response = await apiService.verifyCode(email, code);

      // --- CRITICAL FIX: Update state for the next step ---
      if (response.nextStep === "CHANGE_PASSWORD") {
        // Verification successful - set flag to allow router navigation
        console.log("✅ Verification successful, setting isVerified=true");
        setIsVerified(true);
        localStorage.setItem("isVerified", "true"); // Persist verification state
      }

      return response;
    } catch (err) {
      console.error("❌ Verification failed:", err);
      setError(err instanceof Error ? err.message : "Failed to verify code");
      // Ensure isVerified stays false on error
      setIsVerified(false);
      localStorage.setItem("isVerified", "false");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Restore user data from localStorage on component mount
    const storedUser = localStorage.getItem("currentUser");
    const storedActionRequired = localStorage.getItem("actionRequired");
    const storedIsVerified = localStorage.getItem("isVerified");

    console.log("🔄 AuthContext useEffect: Restoring from localStorage");
    console.log("📦 storedUser:", storedUser);
    console.log("📦 storedActionRequired:", storedActionRequired);
    console.log("📦 storedIsVerified:", storedIsVerified);

    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        console.log("✅ User restored from localStorage:", parsedUser);
        setUser(parsedUser);
      } catch (e) {
        console.error("❌ Failed to parse user from localStorage", e);
        localStorage.removeItem("currentUser");
      }
    } else {
      console.log("⚠️ No stored user found in localStorage");
    }

    if (storedActionRequired) {
      console.log("✅ Action required restored:", storedActionRequired);
      setActionRequired(storedActionRequired);
    }

    // Restore verification state from localStorage
    if (storedIsVerified === "true") {
      setIsVerified(true);
      console.log("✅ Restored isVerified=true from localStorage");
    } else {
      setIsVerified(false);
    }
  }, []);

  const isAdmin = useMemo(() => user?.role === "Admin", [user]);
  const isUser = useMemo(() => user?.role === "User", [user]);

  const value: AuthContextType = useMemo(
    () => ({
      user,
      loading,
      error,
      login,
      logout,
      verifyCode,
      changePassword,
      isAdmin,
      isUser,
      userId: user?.id ? String(user.id) : undefined,
      actionRequired,
      isVerified, // <-- EXPOSED FLAG
    }),
    [
      user,
      loading,
      error,
      login,
      logout,
      verifyCode,
      changePassword,
      isAdmin,
      isUser,
      actionRequired,
      isVerified,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
