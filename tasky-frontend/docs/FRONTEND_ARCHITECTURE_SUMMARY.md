# Frontend Architecture Summary

## 📌 Quick Overview

Your frontend uses a **React Context-based architecture** with custom state management and routing. Here's what you have:

```
┌─────────────────────────────────────────────────────────────┐
│                    React Application                         │
├─────────────────────────────────────────────────────────────┤
│  main.tsx                                                    │
│  └─> ReactDOM.createRoot()                                  │
│      └─> AuthProvider (Global Auth State)                   │
│          └─> App Component (Routing Logic)                  │
│              ├─> LoginPage (if not logged in)               │
│              └─> TaskManagerApp (if logged in)              │
│                  ├─> Layout (Main Container)                │
│                  │   ├─> Sidebar (Navigation)               │
│                  │   └─> Page Content                       │
│                  └─> Pages:                                 │
│                      ├─> Dashboard                          │
│                      ├─> TaskList                           │
│                      ├─> TaskForm (Add/Edit)                │
│                      ├─> Register (Admin)                   │
│                      ├─> VerifyCode (First Login)           │
│                      └─> ChangePassword (First Login)       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 Core Components

### **1. AuthContext** (`src/context/AuthContext.tsx`)

Manages global authentication state:

```typescript
// State
user: User | null           // Currently logged-in user
loading: boolean            // API call in progress
error: string | null        // Error messages

// Methods
login(email, password)          → Authenticate user
logout()                        → Clear session
verifyCode(email, code)         → Verify 6-digit code
changePassword(email, password) → Set new password

// Computed
isAdmin: boolean            // Is current user an admin?
isUser: boolean             // Is current user a regular user?
userId: string | undefined  // Current user's ID
```

**How It Works:**

- Every page gets these methods via `useAuth()` hook
- State is synced to localStorage (persistence across page refreshes)
- Updates to state trigger re-renders in all consuming components

### **2. App Routing** (`src/app.tsx`)

Custom state-based routing (NOT React Router):

```typescript
// Instead of: <Route path="/dashboard" component={Dashboard} />
// You have: if (currentPath === "Dashboard") render Dashboard

ProtectedRoute Component:
  - Checks if user is logged in
  - Checks if user has required role (Admin/User)
  - Redirects if not authorized
```

**Auto-Redirect Logic:**

```typescript
useEffect(() => {
  if (user?.isFirstLogin && !user?.hasVerifiedCode) {
    setCurrentPath("VerifyCode"); // First step: verify code
  } else if (user?.isFirstLogin && user?.hasVerifiedCode) {
    setCurrentPath("ChangePassword"); // Second step: change password
  }
}, [user]);
```

---

## 🎨 UI Component Hierarchy

```
UIComponents.tsx (Reusable Components)
├─> Card          (Container with padding & shadow)
├─> Input         (Text input with label & error)
├─> Button        (With variant support: primary/secondary/danger)
└─> Spinner       (Loading indicator)

Layout.tsx (Page Structure)
├─> Sidebar       (Navigation + user info)
└─> Main Content  (Current page)
```

---

## 🔄 Authentication Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                     USER VISITS APP                          │
└────────────────────────────┬─────────────────────────────────┘
                             │
                    Is user in localStorage?
                      /              \
                    NO               YES
                    │                │
         ┌──────────▼────────┐  ┌────▼──────────────┐
         │   Show LoginPage  │  │ Is firstLogin?    │
         └──────────┬────────┘  └────┬───────────┬──┘
                    │               /             \
          User enters credentials  YES           NO
                    │               │             │
            ┌───────▼────────┐  ┌────▼───────────────────┐
            │ Call login()   │  │ Show Dashboard or Page │
            │ in AuthContext │  │ (Normal login flow)    │
            └───────┬────────┘  └────────────────────────┘
                    │
      Backend returns isFirstLogin: true
                    │
          ┌─────────▼──────────────────┐
          │ Auto-redirect to VerifyCode │
          └─────────┬──────────────────┘
                    │
            User enters 6-digit code
                    │
          ┌─────────▼──────────────────┐
          │ Call verifyCode()           │
          │ Sets hasVerifiedCode: true  │
          └─────────┬──────────────────┘
                    │
          ┌─────────▼──────────────────┐
          │ Auto-redirect to ChangePassword
          └─────────┬──────────────────┘
                    │
        User enters new password (8+ chars)
                    │
          ┌─────────▼──────────────────┐
          │ Call changePassword()       │
          │ Sets isFirstLogin: false    │
          └─────────┬──────────────────┘
                    │
          ┌─────────▼──────────────────┐
          │ Auto-redirect to Dashboard  │
          │ (Normal login complete)     │
          └────────────────────────────┘
```

---

## 📁 File Responsibilities

| File                          | Responsibility                               |
| ----------------------------- | -------------------------------------------- |
| `main.tsx`                    | Entry point, wraps app in AuthProvider       |
| `app.tsx`                     | Routing logic, ProtectedRoute, auto-redirect |
| `AuthContext.tsx`             | Global auth state & methods                  |
| `TaskContext.tsx`             | Global task state & methods                  |
| `pages/Login.tsx`             | Email/password login form                    |
| `pages/VerifyCode.tsx`        | 6-digit code verification                    |
| `pages/ChangePassword.tsx`    | New password setup (first login only)        |
| `pages/Dashboard.tsx`         | Main app home page                           |
| `pages/TaskList.tsx`          | View all tasks                               |
| `pages/TaskForm.tsx`          | Create/edit task form                        |
| `pages/Register.tsx`          | Admin register new user                      |
| `components/Layout.tsx`       | Main page container                          |
| `components/Sidebar.tsx`      | Navigation menu                              |
| `components/UIComponents.tsx` | Reusable UI components                       |
| `api/mockApi.ts`              | Mock API responses (for development)         |
| `api/api.ts`                  | Real backend API (to be implemented)         |
| `types/user.d.ts`             | User & AuthContext interfaces                |
| `types/task.d.ts`             | Task interface                               |

---

## 🎯 Integration Strategy (Step-by-Step)

### **Phase 1: Replace Mock API** (Current)

✅ Already done - MockAPI functions exist with proper signatures

### **Phase 2: Create Real API Module**

```typescript
// src/api/api.ts
const API_URL = "http://localhost:5000/api";

export const api = {
  login: async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return res.json();
  },

  verifyCode: async (email, code) => {
    const res = await fetch(`${API_URL}/auth/verify-code`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    return res.json();
  },

  // ... more functions
};
```

### **Phase 3: Switch AuthContext to Real API**

```typescript
// In AuthContext.tsx, change:
import { mockAPI } from "../api/mockApi"; // ← OLD
// TO:
import { api } from "../api/api"; // ← NEW

// Then all function calls already work:
const loggedInUser = await api.login(email, password); // Same signature!
```

### **Phase 4: Handle Status Codes**

```typescript
// Update login() to handle 202 (first login) vs 200 (normal login):
try {
  const loggedInUser = await api.login(email, password);
  setUser(loggedInUser);
} catch (err) {
  // Handle different error codes
  if (err.response?.status === 401) {
    setError("Invalid credentials");
  }
}
```

### **Phase 5: Test & Debug**

- [ ] Test login with real backend
- [ ] Test verification code flow
- [ ] Test password change flow
- [ ] Test normal login (non-first-login)
- [ ] Test error handling
- [ ] Test cookie persistence

---

## ✅ Bug Fixes Applied

I've fixed the following issues in your frontend:

### **1. AuthContext Function Signatures** ✅

**Problem:** Functions had wrong parameters

```typescript
// BEFORE (WRONG):
changePassword = async (_newPassword: string) => {}; // Only 1 param!
verifyCode = async (_email: string, _code: string) => {}; // Unused params!

// AFTER (CORRECT):
changePassword = async (email: string, newPassword: string) => {}; // 2 params!
verifyCode = async (email: string, code: string) => {}; // Using params!
```

**Pages call with 2 parameters:**

```typescript
await changePassword(user.email, newPassword);
await verifyCode(user.email, code);
```

### **2. Missing Mock API Functions** ✅

**Problem:** `mockAPI` was missing `verifyCode` and `changePassword`
**Solution:** Added both functions with proper implementations

---

## 🚀 Next Steps

1. **Test current flow:** Login → Verify Code → Change Password → Dashboard
   - Use mock data (already working)
2. **Create real API module** (`api/api.ts`)
   - Replace mock calls with actual backend endpoints
   - Add error handling
3. **Switch AuthContext** to use real API
   - Change import from `mockAPI` to real `api`
   - Test with backend
4. **Handle edge cases:**
   - Network errors
   - Token expiration
   - Auto-logout on 401
   - Retry logic

---

## 📊 Data Flow Example

When user logs in:

```
User enters email + password in LoginPage
    ↓
Calls: await verifyCode(email, password)  [from AuthContext]
    ↓
AuthContext.login() called
    ↓
Calls: await mockAPI.login(email, password)  [from mockApi.ts]
    ↓
Returns: { id, email, name, role, isFirstLogin: true, hasVerifiedCode: false }
    ↓
AuthContext updates:
  - Sets user state
  - Saves to localStorage
    ↓
useEffect in app.tsx detects isFirstLogin change
    ↓
Auto-redirects to VerifyCode page
    ↓
Page renders with user.email displayed
    ↓
User enters 6-digit code
    ↓
Calls: await verifyCode(user.email, code)  [from VerifyCode.tsx]
    ↓
AuthContext.verifyCode() called
    ↓
Calls: await mockAPI.verifyCode(email, code)
    ↓
Returns success
    ↓
AuthContext updates user.hasVerifiedCode = true
    ↓
useEffect detects change
    ↓
Auto-redirects to ChangePassword page
    ↓
... and so on
```

---

## 🔐 Security Considerations

✅ **Currently Implemented:**

- Auth state stored in localStorage (persists across sessions)
- Context wraps entire app (centralized auth)
- ProtectedRoute checks user role
- Errors are caught and displayed

⚠️ **To Add Later:**

- Token refresh mechanism
- Auto-logout on token expiration
- CSRF protection
- Rate limiting
- Session timeout warning
