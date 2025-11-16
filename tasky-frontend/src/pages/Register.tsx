import React, { useState } from "react";
import {
  Card,
  Input,
  Button,
  Spinner,
} from "../components/common/UIComponents";
import { apiService } from "../api/api";
import { useAuth } from "../context/AuthContext";

interface Message {
  type: "success" | "error";
  text: string;
}

export const RegisterPage: React.FC = () => {
  const { user } = useAuth();
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [salary, setSalary] = useState<string>("");
  const [role, setRole] = useState<string>("Employee");
  const [department, setDepartment] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<Message | null>(null);

  // Determine if user is manager or admin
  const isManager = user?.role === "Manager";

  // For managers: use their department; for admins: use input value
  const finalDepartment = isManager ? user?.department || "" : department;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !salary || !role || !finalDepartment) {
      setMessage({ type: "error", text: "Please fill in all fields." });
      return;
    }

    const salaryNum = parseFloat(salary);
    if (salaryNum <= 0) {
      setMessage({ type: "error", text: "Salary must be greater than 0." });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const response = await apiService.registerUser(
        name,
        email,
        parseFloat(salary),
        user?.id ? parseInt(user.id as string) : 0,
        role,
        finalDepartment
      );
      setMessage({
        type: "success",
        text:
          response.message ||
          `User "${name}" created successfully with email: ${email}`,
      });
      setName("");
      setEmail("");
      setSalary("");
      setRole("Employee");
      if (!isManager) {
        setDepartment("");
      }
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to create user. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Register New User
      </h1>
      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-700">
          <strong>Manager ID:</strong> {user?.id || "N/A"}
        </p>
      </div>
      <Card className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Full Name"
              id="name"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Email Address"
              id="regEmail"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Salary"
              id="salary"
              type="number"
              placeholder="50000"
              value={salary}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "" || parseFloat(value) >= 0) {
                  setSalary(value);
                }
              }}
              min="0"
              required
            />
            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Role *
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="Employee">Employee</option>
                <option value="Manager">Manager</option>
                <option value="Admin">Admin</option>
                <option value="User">User</option>
              </select>
            </div>
          </div>

          {isManager ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department (Your Department)
              </label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 font-medium">
                {user?.department || "Not assigned"}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Managers can only add employees to their own department
              </p>
            </div>
          ) : (
            <Input
              label="Department"
              id="department"
              placeholder="Engineering"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              required
            />
          )}

          <p className="text-sm text-gray-500 italic">
            Note: Users are created with the default password "TempPassword"
            which must be changed on first login.
          </p>

          {message && (
            <div
              className={`p-3 rounded-lg text-sm ${
                message.type === "success"
                  ? "bg-green-100 border-green-400 text-green-700"
                  : "bg-red-100 border-red-400 text-red-700"
              }`}
            >
              {message.text}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Spinner /> : "Add User"}
          </Button>
        </form>
      </Card>
    </div>
  );
};
