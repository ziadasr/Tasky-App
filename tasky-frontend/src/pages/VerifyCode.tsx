import React, { useState, useEffect } from "react";
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
  const {
    user,
    verifyCode,
    logout,
    loading,
    actionRequired,
    isVerified,
    error: contextError,
  } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState(false);

  // --- CRITICAL: On page load, if already verified, redirect immediately ---
  useEffect(() => {
    if (isVerified && actionRequired === "PASSWORD_CHANGE_REQUIRED") {
      console.log(
        "✅ Already verified on mount, redirecting to ChangePassword"
      );
      onNavigate("ChangePassword" as AppPath);
    }
  }, [isVerified, actionRequired, onNavigate]);

  // Guard: This check is mainly for safety; the router guard in App.tsx handles the primary redirect.
  if (!user || actionRequired !== "PASSWORD_CHANGE_REQUIRED") {
    // If user somehow lands here without the actionRequired flag, send them to dashboard.
    // NOTE: If the user refreshes, they must be sent to the VerifyCode page by the App.tsx guard.
    // onNavigate("Dashboard" as AppPath);
    // return null;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("🔍 Form submitted with code:", code);

    // Reset UI before attempting verification
    setMessage("");
    setError("");
    setIsVerifying(true);

    // --- CRITICAL: NULL CHECK FOR USER ---
    if (!user) {
      const errorMsg =
        "Session expired or user data missing. Please log in again.";
      setError(errorMsg);
      setIsVerifying(false);
      console.error("❌", errorMsg);
      return;
    }
    // --- END CHECK ---

    // Validate code input
    if (!code || code.trim().length === 0) {
      const errorMsg = "Please enter the verification code.";
      setError(errorMsg);
      setIsVerifying(false);
      console.warn("⚠️", errorMsg);
      return;
    }

    try {
      // Call API to verify code - this will throw on error
      console.log("📧 Calling verifyCode API with email:", user.email);
      const result = await verifyCode(user.email, code);

      // Backend response received - only show success if response is valid
      if (result && result.nextStep === "CHANGE_PASSWORD") {
        const successMsg =
          result.message || "✓ Verification successful! Redirecting...";
        setMessage(successMsg);
        setCode(""); // Clear the input field
        console.log("✅ Verification successful:", result);

        // Wait a bit to let user see success message, then redirect
        setTimeout(() => {
          console.log("➡️ Navigating to ChangePassword page");
          onNavigate("ChangePassword" as AppPath);
        }, 1500);
      } else {
        // Unexpected response format
        const errorMsg = "Unexpected server response. Please try again.";
        setError(errorMsg);
        console.error("❌ Invalid response format:", result);
      }
    } catch (err) {
      // Error from API or verification logic
      console.error("❌ Verification failed:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Invalid code or connection error. Please try again.";

      setError(errorMessage);
      // Keep code in input so user can retry without retyping
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle Enter key directly on input (backup for form submission)
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isVerifying && code.trim().length > 0) {
      console.log("Enter key pressed");
      e.currentTarget.form?.requestSubmit();
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
            onKeyPress={handleKeyPress}
            required
            autoFocus
          />

          {(error || contextError) && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm flex items-start gap-2">
              <span className="font-bold">✕</span>
              <span>{error || contextError}</span>
            </div>
          )}

          {message && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm flex items-start gap-2">
              <span className="font-bold">✓</span>
              <span>{message}</span>
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
