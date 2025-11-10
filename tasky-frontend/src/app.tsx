import React, {
  useState,
  useCallback,
  useMemo,
  ReactNode,
  useEffect,
} from "react";
import { LoginPage } from "./pages/Login";
import { useAuth } from "./context/AuthContext";
import { Dashboard } from "./pages/Dashboard";
import { TaskList } from "./pages/TaskList";
import { RegisterPage } from "./pages/Register";
import { TaskFormPage } from "./pages/TaskForm";
import { TaskDetailPage } from "./pages/TaskDetail";
import { ChangePassword } from "./pages/ChangePassword";
import { VerifyCode } from "./pages/VerifyCode";
import { NotificationsPage } from "./pages/Notifications";
import { Layout } from "./components/layout/Layout";
import { TaskProvider } from "./context/TaskContext";
import { TaskDetailProvider } from "./context/TaskDetailContext";
import { Spinner, Button } from "./components/common/UIComponents";
import { UserRole } from "./types/user";

// Simple state-based routing simulation
export type AppPath =
  | "Dashboard"
  | "TaskList"
  | "AddTask"
  | "EditTask"
  | "TaskDetail"
  | "Register"
  | "ChangePassword"
  | "VerifyCode"
  | "Notifications";

// Navigation function type that all components should use
export type NavigateFunction = (
  path: AppPath,
  taskId?: string | null,
  filterStatus?: string | null,
  action?: string | null
) => void;

// Alias for backward compatibility
export type OnNavigateType = NavigateFunction;

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
  if (!user) return <LoginPage />;

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
    action?: string | null;
    task?: any; // Store task data for temporary access
  }>({});
  const { actionRequired, isVerified } = useAuth(); // <-- Added isVerified

  const handleNavigate = useCallback(
    (
      path: AppPath,
      taskId: string | null = null,
      filterStatus: string | null = null,
      action: string | null = null
    ) => {
      setCurrentPath(path);
      setRouteParams({ taskId, filterStatus, action });
    },
    []
  );

  // Auto-redirect based on actionRequired flag - only on initial mount
  useEffect(() => {
    if (
      actionRequired === "PASSWORD_CHANGE_REQUIRED" &&
      currentPath === "Dashboard"
    ) {
      // Force initial redirect to VerifyCode
      setCurrentPath("VerifyCode");
    }
  }, [actionRequired, currentPath]);

  // Auto-navigate to ChangePassword when verified
  useEffect(() => {
    if (
      actionRequired === "PASSWORD_CHANGE_REQUIRED" &&
      isVerified &&
      currentPath === "VerifyCode"
    ) {
      setCurrentPath("ChangePassword");
    }
  }, [isVerified, actionRequired, currentPath]);

  const renderPage = useMemo(() => {
    // --- CRITICAL ROUTER GUARD FIX: Force user to the required action page ---
    // BUT: Only force navigation if isVerified changes, don't remount VerifyCode unnecessarily
    if (actionRequired === "PASSWORD_CHANGE_REQUIRED") {
      // 1. If verified, force to ChangePassword page
      if (isVerified) {
        return (
          <ProtectedRoute
            allowedRoles={["Admin", "User", "Employee", "Manager"]}
          >
            <ChangePassword onNavigate={handleNavigate} />
          </ProtectedRoute>
        );
      }

      // 2. If action is required but NOT verified, show VerifyCode page
      return (
        <ProtectedRoute allowedRoles={["Admin", "User", "Employee", "Manager"]}>
          <VerifyCode onNavigate={handleNavigate} />
        </ProtectedRoute>
      );
    }
    // End Router Guard

    switch (currentPath) {
      case "Dashboard":
        return (
          <ProtectedRoute
            allowedRoles={["Admin", "User", "Employee", "Manager"]}
          >
            <Dashboard onNavigate={handleNavigate} />
          </ProtectedRoute>
        );
      case "TaskList":
        return (
          <ProtectedRoute
            allowedRoles={["Admin", "User", "Employee", "Manager"]}
          >
            <TaskList
              onNavigate={handleNavigate}
              initialFilter={routeParams.filterStatus}
            />
          </ProtectedRoute>
        );
      case "AddTask":
        return (
          <ProtectedRoute allowedRoles={["Manager", "Admin"]}>
            <TaskFormPage onNavigate={handleNavigate} />
          </ProtectedRoute>
        );
      case "EditTask":
        // Renders AddTask page but with an ID
        return (
          <ProtectedRoute allowedRoles={["Manager", "Admin"]}>
            <TaskFormPage
              onNavigate={handleNavigate}
              taskId={routeParams.taskId}
            />
          </ProtectedRoute>
        );
      case "TaskDetail":
        // View task details with permission checks
        return (
          <ProtectedRoute allowedRoles={["Employee", "Manager", "Admin"]}>
            <TaskDetailPage
              onNavigate={handleNavigate}
              taskId={routeParams.taskId}
              action={routeParams.action}
            />
          </ProtectedRoute>
        );
      case "Register":
        return (
          <ProtectedRoute allowedRoles={["Manager", "Admin"]}>
            <RegisterPage />
          </ProtectedRoute>
        );

      case "VerifyCode":
        return (
          <ProtectedRoute
            allowedRoles={["Admin", "User", "Employee", "Manager"]}
          >
            <VerifyCode onNavigate={handleNavigate} />
          </ProtectedRoute>
        );
      case "ChangePassword":
        return (
          <ProtectedRoute
            allowedRoles={["Admin", "User", "Employee", "Manager"]}
          >
            <ChangePassword onNavigate={handleNavigate} />
          </ProtectedRoute>
        );
      case "Notifications":
        return (
          <ProtectedRoute
            allowedRoles={["Admin", "User", "Employee", "Manager"]}
          >
            <NotificationsPage onNavigate={handleNavigate} />
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
  }, [
    currentPath,
    handleNavigate,
    routeParams.taskId,
    actionRequired,
    isVerified,
  ]);

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
  return (
    <TaskDetailProvider>
      <TaskManagerApp />
    </TaskDetailProvider>
  );
};
