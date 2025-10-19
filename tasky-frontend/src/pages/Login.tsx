import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Card,
  Input,
  Button,
  Spinner,
} from "../components/common/UIComponents";

export const LoginPage: React.FC = () => {
  const { login, loading, error } = useAuth();
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("password");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      // Use a custom message box instead of alert in production, but keeping the simple check here
      console.warn("Please enter both username and password.");
      return;
    }
    // login function handles state change and routing via AuthProvider/App.tsx
    await login(username, password);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <Card className="max-w-md w-full">
        {/* Tasky Logo and Heading: Larger text, icon removed */}
        <div className="flex flex-col items-center justify-center space-y-1 mb-10">
          {/* Text styled to match the Sidebar's font-extrabold and tracking-tighter, size increased to 5xl */}
          <h2 className="text-5xl font-extrabold text-indigo-600 tracking-tighter">
            Tasky.
          </h2>
        </div>

        <p className="text-center text-sm text-gray-500 mb-6">
          Use mock user: `admin@tasky.com` or `user1@tasky.com`. Password:
          `password`.
        </p>
        <form onSubmit={handleSubmit}>
          <Input
            label="Email Address"
            id="username"
            type="email"
            placeholder="e.g., admin@tasky.com"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <Input
            label="Password"
            id="password"
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full mt-4" disabled={loading}>
            {loading ? <Spinner /> : "Log In"}
          </Button>

          <p className="mt-6 text-center text-sm text-gray-600">
            Admin? Please log in as admin to register new users.
          </p>
        </form>
      </Card>
    </div>
  );
};
