import React, { useState } from "react";
import {
  Card,
  Input,
  Button,
  Spinner,
} from "../components/common/UIComponents";
import { mockAPI } from "../api/mockApi";

interface Message {
  type: "success" | "error";
  text: string;
}

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<Message | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      setMessage({ type: "error", text: "Please fill in all fields." });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const newUser = await mockAPI.registerUser(name, email);
      setMessage({
        type: "success",
        text: `User "${newUser.name}" created successfully with email: ${newUser.email}`,
      });
      setName("");
      setEmail("");
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to create user. Try a different username.",
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
      <Card className="max-w-xl">
        <form onSubmit={handleSubmit}>
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
          <p className="text-sm text-gray-500 mb-4 italic">
            Note: Mock users are created with the default password "password".
          </p>

          {message && (
            <div
              className={`mb-4 p-3 rounded-lg text-sm ${
                message.type === "success"
                  ? "bg-green-100 border-green-400 text-green-700"
                  : "bg-red-100 border-red-400 text-red-700"
              }`}
            >
              {message.text}
            </div>
          )}

          <Button type="submit" disabled={loading}>
            {loading ? <Spinner /> : "Add User"}
          </Button>
        </form>
      </Card>
    </div>
  );
};
