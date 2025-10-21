import React, {
  useState,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { mockAPI } from "../api/mockApi";
import { apiService } from "../api/api";
import {
  AuthContextType,
  User,
  VerificationSuccessPayload,
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
  changePassword: async () => {},
  isAdmin: false,
  isUser: false,
  userId: undefined,
  actionRequired: null,
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

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.login(email, password);

      // Backend returns user object in both cases (200 and 202)
      // Set the actual logged-in user data
      setUser(response.user);

      // Check if password change is required
      if (response.code === "PASSWORD_CHANGE_REQUIRED") {
        setActionRequired("PASSWORD_CHANGE_REQUIRED");
        localStorage.setItem("actionRequired", "PASSWORD_CHANGE_REQUIRED");
      } else {
        setActionRequired(null);
        localStorage.removeItem("actionRequired");
      }

      localStorage.setItem("currentUser", JSON.stringify(response.user));

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setActionRequired(null);
    localStorage.removeItem("currentUser");
    localStorage.removeItem("actionRequired");
  }, []);

  const changePassword = useCallback(
    async (email: string, newPassword: string) => {
      setLoading(true);
      setError(null);
      try {
        // Call API to change password
        await mockAPI.changePassword(email, newPassword);

        // On success, clear the action required flag
        setActionRequired(null);
        localStorage.removeItem("actionRequired");
      } catch (err) {
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

      // Verification successful - check the response to update global state
      if (response.nextStep === "CHANGE_PASSWORD") {
        // Update the global state to indicate we're moving to password change
        setActionRequired("PASSWORD_CHANGE_REQUIRED");
        localStorage.setItem("actionRequired", "PASSWORD_CHANGE_REQUIRED");
      }

      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify code");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    const storedActionRequired = localStorage.getItem("actionRequired");

    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
        localStorage.removeItem("currentUser");
      }
    }

    if (storedActionRequired) {
      setActionRequired(storedActionRequired);
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
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
