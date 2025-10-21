import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Card,
  Input,
  Button,
  Spinner,
} from "../components/common/UIComponents";
import { AppPath, OnNavigateType } from "../app";

interface VerifyCodeProps {
  onNavigate: OnNavigateType;
}

export const VerifyCode: React.FC<VerifyCodeProps> = ({ onNavigate }) => {
  const { user, verifyCode, logout, loading, actionRequired } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState(false);

  // Guard: This check is mainly for safety; the router guard in App.tsx handles the primary redirect.
  if (!user || actionRequired !== "PASSWORD_CHANGE_REQUIRED") {
    // If user somehow lands here without the actionRequired flag, send them to dashboard.
    // NOTE: If the user refreshes, they must be sent to the VerifyCode page by the App.tsx guard.
    // onNavigate("Dashboard" as AppPath);
    // return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsVerifying(true);

    // --- CRITICAL FIX: NULL CHECK FOR USER (Resolves TS error 18047) ---
    if (!user) {
      setError("Session expired or user data missing. Please log in again.");
      setIsVerifying(false);
      return;
    }
    // --- END FIX ---

    if (!code || code.trim().length === 0) {
      setError("Please enter the verification code.");
      setIsVerifying(false);
      return;
    }

    try {
      // Call API to verify code. This throws on error.
      const result = await verifyCode(user.email, code);

      // If the promise resolves successfully, the context has updated the isVerified state.
      // Show success message:
      setMessage(result.message || "✓ Verification successful! Redirecting...");
      setCode("");

      // CRITICAL FIX: Navigate to ChangePassword after delay to display success message
      // This manual navigation is now PERMITTED by the App.tsx guard because isVerified=true.
      setTimeout(() => {
        onNavigate("ChangePassword" as AppPath);
      }, 1000);
    } catch (err) {
      // Error is caught and message is set
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Invalid code or connection error. Please try again.";

      setError(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  const userEmail = user?.email || "your registered email";

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
          Verify Your Account
        </h3>
        <p className="text-center text-sm text-gray-500 mb-6">
          We've sent a verification code to <br />
          <span className="font-semibold text-indigo-700">{userEmail}</span>
        </p>

        <form onSubmit={handleSubmit}>
          <Input
            label="Verification Code"
            id="verificationCode"
            type="text"
            placeholder="Enter 6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            autoFocus
          />

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm">
              {message}
            </div>
          )}

          <Button
            type="submit"
            className="w-full mt-4"
            disabled={isVerifying || loading}
          >
            {isVerifying || loading ? <Spinner /> : "Verify & Continue"}
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
            Check your inbox and spam folder. The code expires in 10 minutes.
          </p>
        </form>
      </Card>
    </div>
  );
};
