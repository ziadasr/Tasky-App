# Frontend-Backend Integration Guide

## 📋 Your Current Status

### ✅ What's Ready

**Backend:**

- ✅ Login endpoint: `POST /api/auth/login`
  - Normal user: Returns 200 with user object
  - First-login user: Returns 202 (PASSWORD_CHANGE_REQUIRED) with message only
- ✅ Verify code: `POST /api/auth/verify-code` (validates code, sets reset_auth_token cookie)
- ✅ Change password: `POST /api/auth/change-password` (updates password, sets tempPassword: false)
- ✅ Cookie parser configured (handles reset_auth_token cookie)
- ✅ Hash verification fixed (SHA256 → bcrypt)
- ✅ Authorization middleware updated (accepts email in body for first-login)

**Frontend:**

- ✅ Login page with form
- ✅ VerifyCode page with 6-digit input
- ✅ ChangePassword page with validation
- ✅ AuthContext with all methods
- ✅ Mock API with working signatures
- ✅ Auto-redirect logic
- ✅ localStorage persistence
- ✅ ProtectedRoute component

---

## 🔗 Integration Steps (In Order)

### **Step 1: Create Real API Module**

Edit: `src/api/api.ts`

```typescript
// First, install axios if not already installed
// npm install axios

import axios, { AxiosError } from "axios";
import { User } from "../types/user";

const API_URL = "http://localhost:5000";

// Create axios instance with credentials
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important: sends cookies with requests
  headers: {
    "Content-Type": "application/json",
  },
});

export const api = {
  /**
   * Login with email and password
   * Returns user object with isFirstLogin flag
   * Status 202: First login (PASSWORD_CHANGE_REQUIRED) - no user object in response
   * Status 200: Normal login - user object in response
   */
  login: async (email: string, password: string): Promise<User> => {
    try {
      const { data, status } = await axiosInstance.post("/api/auth/login", {
        email,
        password,
      });

      // Handle first login (202) - backend only returns message, not user object
      if (status === 202) {
        // Return minimal user object for first login flow
        // Frontend will use email to identify user during verification
        return {
          id: "temp",
          email: email,
          username: email,
          name: "User",
          role: "User",
          isFirstLogin: true,
          hasVerifiedCode: false,
        };
      } else {
        // Normal login (200) - backend returns full user object
        return { ...data, isFirstLogin: false };
      }
    } catch (error) {
      const err = error as AxiosError;
      if (err.response?.status === 401) {
        throw new Error("Invalid email or password");
      }
      throw new Error(err.response?.data?.message || "Login failed");
    }
  },

  /**
   * Verify the 6-digit code sent to user's email
   * Backend endpoint: POST /api/auth/verify-code
   */
  verifyCode: async (email: string, code: string): Promise<void> => {
    try {
      await axiosInstance.post("/api/auth/verify-code", {
        email,
        code,
      });
    } catch (error) {
      const err = error as AxiosError;
      if (err.response?.status === 400) {
        throw new Error("Invalid or expired verification code");
      }
      throw new Error(err.response?.data?.message || "Verification failed");
    }
  },

  /**
   * Change password on first login
   * Backend endpoint: POST /api/auth/change-password
   */
  changePassword: async (email: string, newPassword: string): Promise<void> => {
    try {
      await axiosInstance.post("/api/auth/change-password", {
        email,
        newPassword,
      });
    } catch (error) {
      const err = error as AxiosError;
      if (err.response?.status === 400) {
        throw new Error(err.response?.data?.message || "Password is too weak");
      }
      throw new Error(
        err.response?.data?.message || "Failed to change password"
      );
    }
  },

  /**
   * Logout - clear session on backend
   * Note: Backend doesn't have explicit logout endpoint yet
   */
  logout: async (): Promise<void> => {
    try {
      // Optional: clear cookies on backend if logout endpoint exists
      // await axiosInstance.post("/api/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
      // Still clear frontend state even if logout fails
    }
  },

  /**
   * Fetch all tasks
   */
  fetchTasks: async (): Promise<any[]> => {
    try {
      const { data } = await axiosInstance.get("/tasks");
      return data;
    } catch (error) {
      const err = error as AxiosError;
      throw new Error(err.response?.data?.message || "Failed to fetch tasks");
    }
  },

  /**
   * Fetch tasks for a specific user
   */
  fetchTasksByUserId: async (userId: string): Promise<any[]> => {
    try {
      const { data } = await axiosInstance.get(`/tasks/user/${userId}`);
      return data;
    } catch (error) {
      const err = error as AxiosError;
      throw new Error(err.response?.data?.message || "Failed to fetch tasks");
    }
  },

  /**
   * Create or update a task
   */
  saveTask: async (task: any): Promise<any> => {
    try {
      if (task.id) {
        // Update existing task
        const { data } = await axiosInstance.put(`/tasks/${task.id}`, task);
        return data;
      } else {
        // Create new task
        const { data } = await axiosInstance.post("/tasks", task);
        return data;
      }
    } catch (error) {
      const err = error as AxiosError;
      throw new Error(err.response?.data?.message || "Failed to save task");
    }
  },

  /**
   * Delete a task
   */
  deleteTask: async (taskId: string): Promise<void> => {
    try {
      await axiosInstance.delete(`/tasks/${taskId}`);
    } catch (error) {
      const err = error as AxiosError;
      throw new Error(err.response?.data?.message || "Failed to delete task");
    }
  },

  /**
   * Fetch all users (Admin only)
   */
  fetchAllUsers: async (): Promise<User[]> => {
    try {
      const { data } = await axiosInstance.get("/users");
      return data;
    } catch (error) {
      const err = error as AxiosError;
      throw new Error(err.response?.data?.message || "Failed to fetch users");
    }
  },

  /**
   * Register a new user (Admin only)
   */
  registerUser: async (name: string, email: string): Promise<User> => {
    try {
      const { data } = await axiosInstance.post("/auth/register", {
        name,
        email,
      });
      return data;
    } catch (error) {
      const err = error as AxiosError;
      if (err.response?.status === 409) {
        throw new Error("Email already registered");
      }
      throw new Error(err.response?.data?.message || "Registration failed");
    }
  },
};
```

---

### **Step 2: Update AuthContext to Use Real API**

Edit: `src/context/AuthContext.tsx`

**Change this line at the top:**

```typescript
// BEFORE:
import { mockAPI } from "../api/mockApi";

// AFTER:
import { api } from "../api/api";
```

**Then update each method:**

```typescript
// In login() callback:
const login = useCallback(async (email: string, password: string) => {
  setLoading(true);
  setError(null);
  try {
    // Changed from mockAPI to api:
    const loggedInUser = await api.login(email, password); // ← API call

    setUser(loggedInUser);
    localStorage.setItem("currentUser", JSON.stringify(loggedInUser));
    return true;
  } catch (err) {
    setError(err instanceof Error ? err.message : "Login failed");
    return false;
  } finally {
    setLoading(false);
  }
}, []);

// In verifyCode() callback:
const verifyCode = useCallback(
  async (email: string, code: string) => {
    setLoading(true);
    setError(null);
    try {
      // Changed from mockAPI to api:
      await api.verifyCode(email, code); // ← API call

      if (user) {
        const updatedUser: User = { ...user, hasVerifiedCode: true };
        setUser(updatedUser);
        localStorage.setItem("currentUser", JSON.stringify(updatedUser));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify code");
      throw err;
    } finally {
      setLoading(false);
    }
  },
  [user]
);

// In changePassword() callback:
const changePassword = useCallback(
  async (email: string, newPassword: string) => {
    setLoading(true);
    setError(null);
    try {
      // Changed from mockAPI to api:
      await api.changePassword(email, newPassword); // ← API call

      if (user) {
        const updatedUser: User = { ...user, isFirstLogin: false };
        setUser(updatedUser);
        localStorage.setItem("currentUser", JSON.stringify(updatedUser));
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to change password"
      );
      throw err;
    } finally {
      setLoading(false);
    }
  },
  [user]
);

// In logout() callback:
const logout = useCallback(async () => {
  try {
    await api.logout(); // ← API call
  } catch (err) {
    console.error("Logout error:", err);
  } finally {
    setUser(null);
    localStorage.removeItem("currentUser");
  }
}, []);
```

---

### **Step 3: Update TaskContext Similarly**

Follow the same pattern for task-related API calls in `src/context/TaskContext.tsx`:

```typescript
// Replace mockAPI calls with api calls in TaskContext:

// BEFORE:
import { mockAPI } from "../api/mockApi";
const tasks = await mockAPI.fetchTasks();

// AFTER:
import { api } from "../api/api";
const tasks = await api.fetchTasks();
```

---

### **Step 4: Test Each Endpoint**

Test one by one to ensure integration works:

```bash
# Terminal 1: Start backend
cd tasky-backend
npm run dev

# Terminal 2: Start frontend
cd tasky-frontend
npm run dev
```

**Test Checklist:**

```typescript
// ✅ Test 1: Login (non-first-login user)
Navigate to login
Email: admin@tasky.com
Password: password
Expected: Redirects to Dashboard

// ✅ Test 2: Login (first-login user)
Navigate to login
Email: user1@tasky.com (or create new via admin)
Password: password
Expected: Redirects to VerifyCode page

// ✅ Test 3: Verify Code
On VerifyCode page
Code: (any 6 digits for mock, real backend validates)
Expected: Redirects to ChangePassword page

// ✅ Test 4: Change Password
On ChangePassword page
New Password: NewPassword123
Confirm: NewPassword123
Expected: Redirects to Dashboard with isFirstLogin = false

// ✅ Test 5: Normal login with new password
Logout
Login with same email + NewPassword123
Expected: Redirects directly to Dashboard (no verify/change flow)

// ✅ Test 6: Error handling
Try invalid credentials
Expected: Shows error message "Invalid email or password"

// ✅ Test 7: localStorage persistence
Login successfully
Refresh page
Expected: Still logged in (user loaded from localStorage)

// ✅ Test 8: Task operations (after auth works)
Create task
Edit task
Delete task
Expected: All work correctly
```

---

### **Step 5: Handle CORS (If Needed)**

If frontend and backend are on different ports/domains, ensure CORS is configured on backend:

**Backend: `server.ts` should have:**

```typescript
import cors from "cors";

app.use(
  cors({
    origin: "http://localhost:5173", // Your frontend URL
    credentials: true, // Important for cookies!
  })
);
```

---

## 🔍 Debugging Tips

### **Check Network Requests**

Open DevTools (F12) → Network tab

```
1. Click login button
2. Look for POST request to http://localhost:5000/api/auth/login
3. Check:
   - Request payload (email, password)
   - Response status (200, 202, 400, 401)
   - Response body (user object, error message)
   - Cookies set (if any)
```

### **Check Frontend State**

Open DevTools → Application → Local Storage

```
1. Look for "currentUser" key
2. Check if it contains:
   {
     "id": "...",
     "email": "...",
     "role": "Admin" or "User",
     "isFirstLogin": true/false,
     "hasVerifiedCode": true/false
   }
```

### **Common Issues & Fixes**

```
❌ "RESET_TOKEN_MISSING" error
   → Backend cookie not being set
   → Fix: Ensure frontend requests have `credentials: 'include'`
   → Fix: Ensure backend cookie-parser middleware is installed

❌ Login always shows "Invalid credentials"
   → Backend not recognizing email/password
   → Check: Backend has user with that email
   → Check: Password matches backend format (check hash)
   → Test: Try admin@tasky.com / password

❌ Verification always fails
   → Backend expecting specific code format
   → Check: Backend verify endpoint logic
   → Test: Try any 6 digits first

❌ Frontend stays on login after successful response
   → Backend not returning 202 or user.isFirstLogin not set
   → Check: API module checks response status 202
   → Check: User.isFirstLogin flag is being set

❌ Cookies not being set
   → Missing credentials: 'include' in fetch/axios
   → Missing httpOnly flag on backend
   → Check: Browser developer tools → Application → Cookies
```

---

## 📊 Expected Backend Responses

### **Login (First-login user)**

```
Status: 202 ACCEPTED
Code: PASSWORD_CHANGE_REQUIRED
Body: {
  "message": "Login successful. Password change required. Verification code sent.",
  "code": "PASSWORD_CHANGE_REQUIRED",
  "nextStep": "A temporary code has been sent to your email..."
}
Frontend creates: {
  id: "temp",
  email: "user@example.com",
  isFirstLogin: true,
  hasVerifiedCode: false
}
```

### **Login (Normal user)**

```
Status: 200 OK
Body: {
  "message": "Login successful",
  "role": "User" or "Manager",
  "token": "jwt-token-here"
}
Frontend receives: {
  role: "User",
  token: "...",
  isFirstLogin: false
}
```

### **Verify Code**

```
Status: 200 OK
Body: {
  "message": "Verification code accepted successfully",
  "code": "VERIFICATION_SUCCESS"
}
Sets Cookie: reset_auth_token=...
```

### **Change Password**

```
Status: 200 OK
Body: {
  "message": "Password changed successfully",
  "code": "PASSWORD_CHANGED"
}
```

### **Error Response**

```
Status: 400 BAD_REQUEST or 401 UNAUTHORIZED
Body: {
  "error": "Invalid credentials" or "Invalid or expired verification code"
  "code": "INVALID_CREDENTIALS" or "VERIFICATION_FAILED"
}
```

---

## 🚀 Next Phase After Integration

Once frontend-backend integration works:

1. **Add task management UI**

   - Update `pages/TaskForm.tsx` to call real API
   - Update `pages/TaskList.tsx` to call real API

2. **Add user registration**

   - Update `pages/Register.tsx` to call real API
   - Test admin can register new users

3. **Add error boundaries**

   - Handle network failures gracefully
   - Show retry buttons

4. **Add loading states**

   - Show spinners during API calls
   - Disable buttons while loading

5. **Add token refresh**
   - Handle expired tokens
   - Auto-refresh on 401

---

## ✅ Integration Checklist

- [ ] Create `api/api.ts` with all endpoints
- [ ] Update `AuthContext.tsx` to import and use real API
- [ ] Update `TaskContext.tsx` to use real API
- [ ] Ensure backend is running on port 5000
- [ ] Test login flow end-to-end
- [ ] Test first-login flow (verify + change password)
- [ ] Test error handling
- [ ] Test localStorage persistence
- [ ] Test page refresh keeps user logged in
- [ ] Test logout clears session
- [ ] Test CORS works (if needed)
- [ ] Test cookies are being set/sent
- [ ] Deploy and test in production environment
