import React, { useState, useCallback, useMemo, ReactNode } from "react";
import { LoginPage } from "./pages/Login";
import { useAuth } from "./context/AuthContext";
import { Dashboard } from "./pages//Dashboard";
import { TaskList } from "./pages/TaskList";
import { RegisterPage } from "./pages/Register";
import { TaskFormPage } from "./pages/TaskForm";
import { Layout } from "./components/layout/Layout";
import { TaskProvider } from "./context/TaskContext";
import { Spinner, Button } from "./components/common/UIComponents";
import { UserRole } from "./types/user";

// Simple state-based routing simulation
export type AppPath =
  | "Dashboard"
  | "TaskList"
  | "AddTask"
  | "EditTask"
  | "Register";

// Navigation function type that all components should use
export type NavigateFunction = (
  path: AppPath,
  taskId?: string | null,
  filterStatus?: string | null
) => void;

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: UserRole[];
}

// Custom component to handle routing protection
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, loading } = useAuth();

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner />
      </div>
    );
  if (!user) return <LoginPage />; // Should not happen if AuthProvider is set up correctly, but serves as safety

  const isAuthorized = allowedRoles.includes(user.role);

  if (isAuthorized) {
    return <>{children}</>;
  }

  // Fallback if user is logged in but tries to access an unauthorized page
  return (
    <div className="text-center p-10 bg-red-50 rounded-lg shadow-md max-w-lg mx-auto mt-20">
      <h2 className="text-2xl font-bold text-red-700">Access Denied</h2>
      <p className="mt-4 text-gray-600">
        You do not have permission to view this page. Please navigate back to
        your dashboard.
      </p>
      <Button
        className="mt-6"
        onClick={() => {
          window.location.reload();
        }}
      >
        Go Home
      </Button>
    </div>
  );
};

const TaskManagerApp: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<AppPath>("Dashboard");
  const [routeParams, setRouteParams] = useState<{
    taskId?: string | null;
    filterStatus?: string | null;
  }>({});

  const handleNavigate = useCallback(
    (
      path: AppPath,
      taskId: string | null = null,
      filterStatus: string | null = null
    ) => {
      setCurrentPath(path);
      setRouteParams({ taskId, filterStatus });
    },
    []
  );

  const renderPage = useMemo(() => {
    switch (currentPath) {
      case "Dashboard":
        return (
          <ProtectedRoute allowedRoles={["Admin", "User"]}>
            <Dashboard onNavigate={handleNavigate} />
          </ProtectedRoute>
        );
      case "TaskList":
        return (
          <ProtectedRoute allowedRoles={["Admin", "User"]}>
            <TaskList onNavigate={handleNavigate} />
          </ProtectedRoute>
        );
      case "AddTask":
        return (
          <ProtectedRoute allowedRoles={["Admin"]}>
            <TaskFormPage onNavigate={handleNavigate} />
          </ProtectedRoute>
        );
      case "EditTask":
        // Renders AddTask page but with an ID
        return (
          <ProtectedRoute allowedRoles={["Admin"]}>
            <TaskFormPage
              onNavigate={handleNavigate}
              taskId={routeParams.taskId}
            />
          </ProtectedRoute>
        );
      case "Register":
        return (
          <ProtectedRoute allowedRoles={["Admin"]}>
            <RegisterPage />
          </ProtectedRoute>
        );
      default:
        // Default to dashboard if path is unknown
        return (
          <ProtectedRoute allowedRoles={["Admin", "User"]}>
            <Dashboard onNavigate={handleNavigate} />
          </ProtectedRoute>
        );
    }
  }, [currentPath, handleNavigate, routeParams.taskId]);

  return (
    <TaskProvider>
      <Layout onNavigate={handleNavigate}>{renderPage}</Layout>
    </TaskProvider>
  );
};

// Main App Component determines if user is logged in or needs to see login page
export const App: React.FC = () => {
  const { user, loading } = useAuth();

  // Show loading state while checking local storage
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Spinner />
      </div>
    );
  }

  // If no user is logged in, show the Login Page
  if (!user) {
    return <LoginPage />;
  }

  // If user is logged in, render the main protected application wrapper
  return <TaskManagerApp />;
};
