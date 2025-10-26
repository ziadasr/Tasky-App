// User Role Literal Type
export type UserRole = "Admin" | "User" | "Employee" | "Manager";

// User Interface (matches backend return)
export interface User {
  id: number | string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  phoneNumber: string;
  city: string;
  dateOfBirth: string;
  salary: number;
  directManagerId: number;
}

// Auth Context Provider Interface
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  verifyCode: (
    email: string,
    code: string
  ) => Promise<VerificationSuccessPayload>;
  changePassword: (
    email: string,
    newPassword: string,
    confirmPassword: string,
    phoneNumber: string,
    city: string,
    dateOfBirth: string
  ) => Promise<StandardSuccessPayload>;
  isAdmin: boolean;
  isUser: boolean;
  userId: string | undefined;
  isVerified: boolean;
  actionRequired: string | null;
}
// Standard error payload from backend
//since all errors from the backend mostly return the same structure, we can use a standard interface
export interface StandardErrorPayload {
  error: string;
  code: string;
}
export interface StandardSuccessPayload {
  message: string;
  code: string;
}

//login payload
export interface LoginSuccessPayload {
  message: string;
  user: User;
  code: string;
  nextStep?: string;
}

//payload for verification success response
export interface VerificationSuccessPayload {
  message: string;
  nextStep: "CHANGE_PASSWORD";
  code: string;
}
