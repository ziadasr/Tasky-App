import { User, UserRole } from "../types/user";
import { Task } from "../types/task";

// --- MOCK DATA ---
export const MOCK_USERS: User[] = [
  {
    id: "admin-001",
    username: "admin@tasky.com",
    role: "Admin",
    name: "Alice Admin",
  },
  {
    id: "user-001",
    username: "user1@tasky.com",
    role: "User",
    name: "Bob User",
  },
  {
    id: "user-002",
    username: "user2@tasky.com",
    role: "User",
    name: "Charlie User",
  },
];

export const MOCK_TASKS: Task[] = [
  {
    id: "t1",
    name: "Project Proposal Draft",
    description: "Complete the initial draft for the Q4 marketing plan.",
    creationDate: "2024-10-10",
    dueDate: "2024-10-25",
    status: "In Progress",
    assignedToId: "user-001",
  },
  {
    id: "t2",
    name: "Review Team Metrics",
    description: "Analyze performance metrics from Q3.",
    creationDate: "2024-10-12",
    dueDate: "2024-10-20",
    status: "To Do",
    assignedToId: "user-002",
  },
  {
    id: "t3",
    name: "Update Homepage Copy",
    description: "A/B test new headline variants for the homepage.",
    creationDate: "2024-10-01",
    dueDate: "2024-10-30",
    status: "Completed",
    assignedToId: "user-001",
  },
  {
    id: "t4",
    name: "Admin Onboarding Setup",
    description: "Set up new admin accounts and permissions.",
    creationDate: "2024-10-15",
    dueDate: "2024-10-18",
    status: "To Do",
    assignedToId: "admin-001",
  },
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockAPI = {
  // Simulates fetching all tasks
  fetchTasks: async (): Promise<Task[]> => {
    await delay(500);
    return [...MOCK_TASKS];
  },

  // Simulates fetching tasks for a specific user
  fetchTasksByUserId: async (userId: string): Promise<Task[]> => {
    await delay(500);
    return MOCK_TASKS.filter((t) => t.assignedToId === userId);
  },

  // Simulates user registration (Admin only)
  registerUser: async (name: string, username: string): Promise<User> => {
    await delay(300);
    const existingUser = MOCK_USERS.find((u) => u.username === username);
    if (existingUser) {
      throw new Error("Username already exists.");
    }
    const newUser: User = {
      id: crypto.randomUUID(),
      username,
      name,
      role: "User" as UserRole,
    };
    MOCK_USERS.push(newUser);
    return newUser;
  },

  // Simulates user login
  login: async (username: string, password: string): Promise<User> => {
    await delay(300);
    const user = MOCK_USERS.find((u) => u.username === username);
    if (user && password === "password") {
      // Mock password check
      return user;
    }
    throw new Error("Invalid credentials");
  },

  // Simulates saving or updating a task
  saveTask: async (task: Partial<Task>): Promise<Task> => {
    await delay(400);
    if (task.id) {
      const index = MOCK_TASKS.findIndex((t) => t.id === task.id);
      if (index !== -1) {
        Object.assign(MOCK_TASKS[index], task);
        return MOCK_TASKS[index];
      }
      throw new Error("Task not found.");
    } else {
      // Create new task
      const newTask: Task = {
        ...(task as Omit<Task, "id" | "creationDate">), // Safe cast after ensuring required fields are present outside API
        id: crypto.randomUUID(),
        creationDate: new Date().toISOString().split("T")[0],
      };
      MOCK_TASKS.push(newTask);
      return newTask;
    }
  },

  // Simulates fetching all available users
  fetchAllUsers: async (): Promise<User[]> => {
    await delay(200);
    return MOCK_USERS.filter((u) => u.role === "User");
  },
};
