// User Role Literal Type
export type UserRole = "Admin" | "User";

// User Interface
export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
}

// Auth Context Provider Interface
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
  isUser: boolean;
  userId: string | undefined;
}
