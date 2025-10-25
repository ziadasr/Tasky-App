import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Card,
  Input,
  Button,
  Spinner,
} from "../components/common/UIComponents";
import { AppPath, OnNavigateType } from "../app";

interface ChangePasswordProps {
  onNavigate: OnNavigateType;
}

export const ChangePassword: React.FC<ChangePasswordProps> = ({
  onNavigate,
}) => {
  const {
    user,
    changePassword,
    logout,
    loading,
    actionRequired,
    error: contextError,
  } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  if (!user || actionRequired !== "PASSWORD_CHANGE_REQUIRED") {
    // Should be protected by App.tsx router, but redirect for safety
    onNavigate("Dashboard" as AppPath);
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      console.log("🔄 Calling changePassword...");
      const response = await changePassword(
        user.email,
        newPassword,
        confirmPassword
      );

      // Show the backend response message
      const successMsg =
        response?.message ||
        "Success! Your password has been updated. Redirecting to Dashboard...";
      setMessage(successMsg);
      console.log("✅ Change password response:", response);

      // Give the user a moment to see the success message
      setTimeout(() => {
        console.log("➡️ Reloading page...");
        window.location.reload();
      }, 2000);
    } catch (err) {
      console.error("❌ Password change error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update password. Please try logging in again."
      );
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <Card className="max-w-md w-full">
        {/* Tasky Logo and Heading */}
        <div className="flex flex-col items-center justify-center space-y-1 mb-10">
          <h2 className="text-5xl font-extrabold text-indigo-600 tracking-tighter">
            Tasky.
          </h2>
        </div>

        {/* Page Title */}
        <h3 className="text-2xl font-bold text-center text-gray-800 mb-2">
          Set Your Password
        </h3>
        <p className="text-center text-sm text-gray-500 mb-6">
          This is your first login. Please create a strong password.
        </p>

        <form onSubmit={handleSubmit}>
          <Input
            label="New Password"
            id="newPassword"
            type="password"
            placeholder="Enter strong password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            autoFocus
          />

          <Input
            label="Confirm Password"
            id="confirmPassword"
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          {(error || contextError) && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {error || contextError}
            </div>
          )}

          {message && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm">
              {message}
            </div>
          )}

          <Button type="submit" className="w-full mt-4" disabled={loading}>
            {loading ? <Spinner /> : "Set New Password"}
          </Button>

          <Button
            type="button"
            onClick={logout}
            className="w-full mt-3"
            variant="outline"
          >
            Sign Out
          </Button>

          <p className="mt-6 text-center text-xs text-gray-500">
            Password requirements: Minimum 8 characters, mix of uppercase &
            lowercase, and include numbers or symbols.
          </p>
        </form>
      </Card>
    </div>
  );
};
