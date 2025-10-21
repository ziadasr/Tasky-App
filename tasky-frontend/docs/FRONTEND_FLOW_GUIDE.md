# Tasky Frontend - Complete Flow Guide

## 📊 Architecture Overview

```
main.tsx (Entry Point)
    ↓
AuthProvider (Context)
    ↓
App.tsx (Routing & State Management)
    ↓
TaskManagerApp OR LoginPage
    ↓
Various Pages (Dashboard, TaskList, VerifyCode, etc.)
```

---

## 🎯 File Structure & Responsibilities

### **1. Entry Point: `main.tsx`**

```
Purpose: Initialize React app and wrap with AuthProvider
Flow:
  - Renders React root
  - Wraps App with AuthProvider (makes auth globally available)
```

### **2. Root Component: `app.tsx`**

```
Purpose: Main routing, state management, navigation control
Key Components:
  - ProtectedRoute: Guards pages based on user role & login status
  - TaskManagerApp: Main app shell (shows after login)
  - App: Wrapper that decides between LoginPage or TaskManagerApp

Routing Types (AppPath):
  - "Dashboard"      → Main home page
  - "TaskList"       → View all tasks
  - "AddTask"        → Create new task (Admin only)
  - "EditTask"       → Modify task (Admin only)
  - "Register"       → Register new user (Admin only)
  - "ChangePassword" → First-login password change
  - "VerifyCode"     → First-login code verification
```

### **3. Context Layer: `context/AuthContext.tsx`**

```
Purpose: Global authentication state management
State Variables:
  - user: Current logged-in user object
  - loading: API call loading state
  - error: Error messages

Key Methods:
  ✅ login(email, password)
     → Calls API → Updates user state → Saves to localStorage

  ✅ logout()
     → Clears user state → Clears localStorage

  ✅ verifyCode(email, code)
     → Calls API → Updates user.hasVerifiedCode = true

  ✅ changePassword(email, newPassword)
     → Calls API → Updates user.isFirstLogin = false

Computed Values (useMemo):
  - isAdmin: user?.role === "Admin"
  - isUser: user?.role === "User"
  - userId: user?.id
```

### **4. API Layer: `api/mockApi.ts`**

```
Purpose: Simulate backend API responses (for development)
Current Status: ✅ MOCK MODE (replace with real API endpoints)

Mock Functions:
  ✅ login(username, password)
     → Returns user with isFirstLogin status

  ✅ verifyCode(email, code)
     → Validates code, returns success

  ✅ changePassword(email, newPassword)
     → Updates password, marks tempPassword = false

  ✅ fetchTasks(), fetchTasksByUserId()
     → Returns mock task data

  ✅ saveTask(task)
     → Creates or updates tasks
```

### **5. Pages: `pages/`**

#### **Login.tsx**

```
Trigger: User not logged in
Flow:
  1. User enters email & password
  2. Calls AuthContext.login()
  3. If success:
     - Backend returns user with isFirstLogin flag
     - If isFirstLogin = true → Auto-redirects to VerifyCode
     - If isFirstLogin = false → Auto-redirects to Dashboard
  4. If failure → Shows error message
```

#### **VerifyCode.tsx**

```
Trigger: First-login user, tempPassword = true, hasVerifiedCode = false
Flow:
  1. Shows email where code was sent
  2. User enters 6-digit code
  3. Calls AuthContext.verifyCode(email, code)
  4. Backend validates code
  5. If success:
     - Sets hasVerifiedCode = true
     - Auto-redirects to ChangePassword
  6. If failure → Shows error, allows retry
```

#### **ChangePassword.tsx**

```
Trigger: First-login user, hasVerifiedCode = true, isFirstLogin = true
Flow:
  1. User enters new password (8+ chars required)
  2. Validates password strength
  3. Calls AuthContext.changePassword(email, newPassword)
  4. Backend validates & updates password
  5. If success:
     - Sets isFirstLogin = false
     - Auto-redirects to Dashboard
  6. If failure → Shows error, allows retry
```

#### **Dashboard.tsx**

```
Trigger: User logged in, isFirstLogin = false
Flow:
  1. Displays user greeting
  2. Shows task overview/statistics
  3. Navigation to other pages via handleNavigate()
```

#### **TaskList.tsx**

```
Trigger: User logged in & navigated to TaskList
Flow:
  1. Fetches tasks (via TaskContext)
  2. Displays list of tasks
  3. Can filter by status
  4. Can navigate to edit/delete tasks
```

#### **TaskForm.tsx**

```
Trigger: User (Admin only) clicks "Add Task" or "Edit Task"
Flow:
  1. Shows form to create/edit task
  2. On submit: Calls saveTask()
  3. On success: Redirects back to TaskList
```

#### **Register.tsx**

```
Trigger: Admin navigates to Register
Flow:
  1. Admin enters new employee details
  2. Calls backend registration endpoint
  3. Backend creates user with tempPassword = true
  4. Sends welcome email to new employee
  5. On success: Shows confirmation message
```

---

## 🔄 Complete Authentication Flow

```
1. User visits app
   ↓
2. App.tsx checks if user logged in (localStorage)
   ↓
   NO → Show LoginPage
   YES → Check first-login status

3. If LOGIN PAGE:
   ✅ Enter email & password
   ✅ Click "Log In"
   ✅ AuthContext.login() called
   ✅ mockAPI.login() returns user with flags
   ✅ If isFirstLogin = true → Auto-redirect to VerifyCode
   ✅ If isFirstLogin = false → Auto-redirect to Dashboard

4. If FIRST-LOGIN (Verify Code):
   ✅ Shows VerifyCode page
   ✅ User enters code from email
   ✅ AuthContext.verifyCode() validates
   ✅ On success: hasVerifiedCode = true
   ✅ Auto-redirect to ChangePassword

5. If VERIFY CODE SUCCESS (Change Password):
   ✅ Shows ChangePassword page
   ✅ User enters new password
   ✅ AuthContext.changePassword() validates & updates
   ✅ On success: isFirstLogin = false
   ✅ Auto-redirect to Dashboard

6. DASHBOARD (Normal Login):
   ✅ User is now fully authenticated
   ✅ Can navigate to Dashboard, TaskList, etc.
   ✅ State is saved to localStorage
   ✅ On page refresh: User stays logged in
```

---

## 🔌 How to Integrate Backend

### **Step 1: Update API Endpoints**

Replace mockAPI calls with real backend URLs in `api/api.ts`:

```typescript
// BEFORE (mock):
const mockUser = mockAPI.login(email, password);

// AFTER (real backend):
const response = await fetch("http://localhost:5000/api/auth/login", {
  method: "POST",
  credentials: "include", // Important for cookies!
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
const user = await response.json();
```

### **Step 2: Update AuthContext Methods**

Replace mockAPI calls with real API calls:

```typescript
// In AuthContext.tsx:

const login = async (email: string, password: string) => {
  const user = await realAPI.login(email, password);
  // Rest remains same
};

const verifyCode = async (email: string, code: string) => {
  await realAPI.verifyCode(email, code);
  // Rest remains same
};

const changePassword = async (email: string, newPassword: string) => {
  await realAPI.changePassword(email, newPassword);
  // Rest remains same
};
```

### **Step 3: Handle Response Codes from Backend**

The backend returns specific status codes:

```typescript
// 200 OK → Normal login success
// 202 ACCEPTED → First-login (PASSWORD_CHANGE_REQUIRED)
// 400 BAD_REQUEST → Validation failed
// 401 UNAUTHORIZED → Invalid credentials
// 500 INTERNAL_ERROR → Server error

// Update frontend to handle these:
const response = await fetch(...);
if (response.status === 202) {
  // First-login flow
  user.isFirstLogin = true;
} else if (response.status === 200) {
  // Normal login
  user.isFirstLogin = false;
}
```

### **Step 4: Handle Cookies**

Backend sets cookies for verification token:

```typescript
// Cookies are automatically sent if:
fetch("http://localhost:5000/...", {
  credentials: "include", // ← Must include this!
});
```

---

## 📋 Data Types

### **User Interface** (`types/user.d.ts`)

```typescript
interface User {
  id: string | number;
  username: string;
  email: string; // Email address
  name: string; // Full name
  role: UserRole; // "Admin" or "User"
  isFirstLogin?: boolean; // true = needs to change password
  hasVerifiedCode?: boolean; // true = verified code, ready for password change
}

type UserRole = "Admin" | "User";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  verifyCode: (email: string, code: string) => Promise<void>;
  changePassword: (email: string, newPassword: string) => Promise<void>;
  isAdmin: boolean;
  isUser: boolean;
  userId: string | number | undefined;
}
```

### **Task Interface** (`types/task.d.ts`)

```typescript
interface Task {
  id: string;
  name: string;
  description: string;
  creationDate: string;
  dueDate: string;
  status: "To Do" | "In Progress" | "Completed";
  assignedToId: string;
}
```

---

## 🚀 Integration Checklist

- [ ] **Step 1**: Update `api/api.ts` with real backend endpoints
- [ ] **Step 2**: Update `AuthContext.tsx` to call real API
- [ ] **Step 3**: Test login with real backend
- [ ] **Step 4**: Test verification code flow
- [ ] **Step 5**: Test password change flow
- [ ] **Step 6**: Test task operations (CRUD)
- [ ] **Step 7**: Test logout
- [ ] **Step 8**: Test localStorage persistence
- [ ] **Step 9**: Test error handling
- [ ] **Step 10**: Test CORS and cookies

---

## 🔐 Security Notes

✅ **Implemented:**

- Authentication context wraps entire app
- ProtectedRoute guards pages by role
- localStorage stores user data (for session persistence)
- Errors are caught and displayed

⚠️ **To Add Later:**

- Token refresh mechanism
- CSRF protection
- Rate limiting on frontend
- Auto-logout on token expiration

---

## 📝 Example: Backend Integration Pattern

**Current (Mock):**

```typescript
// mockApi.ts
export const mockAPI = {
  login: async (email, password) => {
    await delay(300);
    const user = MOCK_USERS.find((u) => u.username === email);
    return user; // ← Returns full user object
  },
};
```

**After Integration (Real):**

```typescript
// api/api.ts
export const API = {
  login: async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (res.status === 202) {
      // First-login response from backend
      const data = await res.json();
      return {
        ...data.user,
        isFirstLogin: true,
      };
    } else if (res.status === 200) {
      const data = await res.json();
      return {
        ...data,
        isFirstLogin: false,
      };
    } else {
      throw new Error(await res.text());
    }
  },
};
```

---

## 🎓 Next Steps

1. **Create real `api/api.ts`** with backend endpoints
2. **Replace all `mockAPI` calls** with real API calls
3. **Test each flow** (login → verify → change password → dashboard)
4. **Add error handling** for network failures
5. **Add loading states** during API calls
6. **Add success messages** for better UX
