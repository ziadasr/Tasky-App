import { User, UserRole } from "../types/user";
import { Task } from "../types/task";

// --- MOCK DATA ---
export const MOCK_USERS: User[] = [
  {
    id: "admin-001",
    name: "Alice Admin",
    email: "admin@tasky.com",
    role: "Admin",
    department: "Management",
    phoneNumber: "01001234567",
    city: "Cairo",
    dateOfBirth: "1990-05-15",
    salary: 50000,
    directManagerId: 0,
  },
  {
    id: "user-001",
    name: "Bob User",
    email: "user1@tasky.com",
    role: "User",
    department: "Development",
    phoneNumber: "01001234568",
    city: "Cairo",
    dateOfBirth: "1995-08-20",
    salary: 30000,
    directManagerId: 1,
  },
  {
    id: "user-002",
    name: "Charlie User",
    email: "user2@tasky.com",
    role: "User",
    department: "Design",
    phoneNumber: "01001234569",
    city: "Alex",
    dateOfBirth: "1992-03-10",
    salary: 28000,
    directManagerId: 1,
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
  registerUser: async (name: string, email: string): Promise<User> => {
    await delay(300);
    const existingUser = MOCK_USERS.find((u) => u.email === email);
    if (existingUser) {
      throw new Error("Email already exists.");
    }
    const newUser: User = {
      id: crypto.randomUUID() as any,
      name,
      email,
      role: "User" as UserRole,
      department: "",
      phoneNumber: "",
      city: "",
      dateOfBirth: "",
      salary: 0,
      directManagerId: 0,
    };
    MOCK_USERS.push(newUser);
    return newUser;
  },

  // Simulates user login
  login: async (email: string, password: string): Promise<User> => {
    await delay(300);
    const user = MOCK_USERS.find((u) => u.email === email);
    if (user && password === "password") {
      // Mock password check
      // Return user with tempPassword flag (true = first login)
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

  // Simulates verifying the code sent to user's email
  verifyCode: async (email: string, code: string): Promise<void> => {
    await delay(300);
    const user = MOCK_USERS.find((u) => u.email === email);
    if (!user) {
      throw new Error("User not found");
    }
    // In mock, any non-empty code is accepted
    if (!code || code.length === 0) {
      throw new Error("Invalid verification code");
    }
    // Code verified - no need to update state here (backend handles it)
  },

  // Simulates changing password on first login
  changePassword: async (email: string, newPassword: string): Promise<void> => {
    await delay(300);
    const user = MOCK_USERS.find((u) => u.email === email);
    if (!user) {
      throw new Error("User not found");
    }
    if (newPassword.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }
    // In real backend, this would update the user's password
    // and the backend would no longer return PASSWORD_CHANGE_REQUIRED on next login
  },
};
