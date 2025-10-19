import React, {
  useState,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { mockAPI } from "../api/mockApi";
import { AuthContextType, User } from "../types/user";

// Initialize context with a safe, typed default value (casting to ensure TS acceptance)
const defaultContextValue: AuthContextType = {
  user: null,
  loading: false,
  error: null,
  login: async () => false,
  logout: () => {},
  isAdmin: false,
  isUser: false,
  userId: undefined,
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

  const login = useCallback(async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const loggedInUser = await mockAPI.login(username, password);
      setUser(loggedInUser);
      localStorage.setItem("currentUser", JSON.stringify(loggedInUser));
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
    localStorage.removeItem("currentUser");
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
        localStorage.removeItem("currentUser");
      }
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
      isAdmin,
      isUser,
      userId: user?.id,
    }),
    [user, loading, error, login, logout, isAdmin, isUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
