# Frontend Architecture Diagrams

## 📐 Complete Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────────┐
│                         React Application                           │
│                         (main.tsx)                                  │
└────────────────────────────────┬──────────────────────────────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │   AuthProvider          │
                    │   (Context wrapper)     │
                    └────────────┬─────────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │   App Component         │
                    │   (Routing logic)       │
                    └────┬────────────────┬───┘
                         │                │
              ┌──────────▼─┐      ┌──────▼──────────┐
              │  LoginPage │      │ TaskManagerApp  │
              │            │      │                 │
              └────────────┘      └──────┬──────────┘
                                         │
                              ┌──────────▼──────────┐
                              │      Layout        │
                              │   (Main shell)     │
                              └─────┬───────────┬──┘
                                    │           │
                         ┌──────────▼─┐      ┌─▼─────────────┐
                         │  Sidebar   │      │ Page Content  │
                         │            │      │               │
                         └────────────┘      │  One of:      │
                                             │  - Dashboard  │
                                             │  - TaskList   │
                                             │  - TaskForm   │
                                             │  - Register   │
                                             │  - VerifyCode │
                                             │  - ChangePass │
                                             └───────────────┘
```

---

## 🔄 Authentication State Flow

```
START
  │
  └─→ Load App (main.tsx)
      │
      └─→ AuthProvider initializes
          ├─→ Check localStorage for "currentUser"
          ├─→ YES: Load user
          └─→ NO: user = null
              │
              └─→ render App.tsx
                  │
                  ├─→ Is user logged in?
                  │   │
                  │   ├─→ NO: Render LoginPage
                  │   │       │
                  │   │       └─→ User enters credentials
                  │   │           │
                  │   │           └─→ Click "Log In"
                  │   │               │
                  │   │               └─→ Call AuthContext.login()
                  │   │                   │
                  │   │                   └─→ Call API: mockAPI.login()
                  │   │                       │
                  │   │                       └─→ Backend returns:
                  │   │                           ├─→ 202: First login
                  │   │                           │    user.isFirstLogin = true
                  │   │                           │
                  │   │                           └─→ 200: Normal login
                  │   │                                user.isFirstLogin = false
                  │   │
                  │   └─→ YES: Continue
                  │
                  └─→ Check isFirstLogin + hasVerifiedCode
                      │
                      ├─→ isFirstLogin=true, hasVerifiedCode=false?
                      │   │
                      │   └─→ Render VerifyCode Page
                      │       │
                      │       └─→ User enters 6-digit code
                      │           │
                      │           └─→ Call AuthContext.verifyCode()
                      │               │
                      │               └─→ Call API: mockAPI.verifyCode()
                      │                   │
                      │                   └─→ Updates: hasVerifiedCode = true
                      │                       │
                      │                       └─→ useEffect detects change
                      │                           │
                      │                           └─→ Auto-redirect to ChangePassword
                      │
                      ├─→ isFirstLogin=true, hasVerifiedCode=true?
                      │   │
                      │   └─→ Render ChangePassword Page
                      │       │
                      │       └─→ User enters new password
                      │           │
                      │           └─→ Call AuthContext.changePassword()
                      │               │
                      │               └─→ Call API: mockAPI.changePassword()
                      │                   │
                      │                   └─→ Updates: isFirstLogin = false
                      │                       │
                      │                       └─→ useEffect detects change
                      │                           │
                      │                           └─→ Auto-redirect to Dashboard
                      │
                      └─→ isFirstLogin=false?
                          │
                          └─→ Render Dashboard Page
                              │
                              └─→ Normal app flow (can navigate to other pages)
```

---

## 🏗️ Data Flow: Login to Dashboard

```
User Interface          │ AuthContext          │ API                │ State
────────────────────────────────────────────────────────────────────────────
                        │                      │                    │
User types email        │                      │                    │
User types password     │                      │                    │
User clicks "Log In"    │                      │                    │
                        │                      │                    │
                    login()                   │                    │
                        │                      │                    │
                        │ setLoading(true)    │                    │ loading=true
                        │                      │                    │
                        │ mockAPI.login()     │                    │
                        │ ─────────────────────→ Check credentials  │
                        │                      │                    │
                        │ ←───────────────────── Return user obj    │
                        │      with flags     │                    │
                        │                      │                    │
                        │ setUser(loggedInUser)│                    │ user = { ... }
                        │ localStorage.setItem │                    │
                        │ setLoading(false)   │                    │ loading=false
                        │                      │                    │
App.tsx watches user    │                      │                    │
detects change          │                      │                    │
                        │                      │                    │
Checks: isFirstLogin?   │                      │                    │
                        │                      │                    │
YES: setCurrentPath    │                      │                    │
("VerifyCode")         │                      │                    │
                        │                      │                    │
Render VerifyCode      │                      │                    │
with onNavigate func   │                      │                    │
────────────────────────────────────────────────────────────────────────────

... similar flow for Verify Code and Change Password ...

Eventually:
────────────────────────────────────────────────────────────────────────────
                        │                      │                    │
isFirstLogin = false    │                      │                    │
                        │                      │                    │
setCurrentPath         │                      │                    │
("Dashboard")          │                      │                    │
                        │                      │                    │
Render Dashboard       │                      │                    │
                        │                      │                    │
User navigates to      │                      │                    │
other pages            │                      │                    │
────────────────────────────────────────────────────────────────────────────
```

---

## 🎯 Component Interaction Map

```
┌──────────────────────────────────────────────────────────────┐
│ Sidebar                                                      │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Displays logged-in user info                          │  │
│ │ Navigation menu with links to pages                   │  │
│ │ Logout button                                         │  │
│ │                                                        │  │
│ │ Uses: AuthContext (user, logout)                      │  │
│ │        Page props (onNavigate)                        │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌──────────────────────────────────────────────────────┐    │
│ │ Current Page (Dashboard, TaskList, etc.)             │    │
│ │ ┌────────────────────────────────────────────────┐   │    │
│ │ │ Layout component renders page                 │   │    │
│ │ │ Page receives onNavigate to change pages      │   │    │
│ │ │                                                │   │    │
│ │ │ Example: TaskList                             │   │    │
│ │ │ ├─ Loads tasks from TaskContext               │   │    │
│ │ │ ├─ Displays TaskCard for each task            │   │    │
│ │ │ ├─ Can delete task                            │   │    │
│ │ │ ├─ Can click to edit (calls onNavigate)       │   │    │
│ │ │ └─ Can create new (calls onNavigate)          │   │    │
│ │ │                                                │   │    │
│ │ │ Uses: TaskContext (tasks, deleteTask)         │   │    │
│ │ │        Page props (onNavigate)                │   │    │
│ │ │        UIComponents (Card, Button, etc.)      │   │    │
│ │ └────────────────────────────────────────────────┘   │    │
│ └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘

Sidebar & Current Page both use:
├─ AuthContext.user       (to show logged-in user)
├─ AuthContext.logout     (for logout button)
├─ TaskContext.tasks      (for task data)
└─ UIComponents           (Card, Button, Input, etc.)
```

---

## 📊 State Management Hierarchy

```
App Level State
│
├─ AuthContext (Global)
│  │
│  ├─ user: User | null
│  │   ├─ id: string
│  │   ├─ email: string
│  │   ├─ name: string
│  │   ├─ role: "Admin" | "User"
│  │   ├─ isFirstLogin?: boolean
│  │   └─ hasVerifiedCode?: boolean
│  │
│  ├─ loading: boolean (any API call)
│  ├─ error: string | null
│  │
│  └─ Methods:
│     ├─ login(email, password)
│     ├─ logout()
│     ├─ verifyCode(email, code)
│     └─ changePassword(email, newPassword)
│
├─ TaskContext (Global)
│  │
│  ├─ tasks: Task[]
│  ├─ loading: boolean
│  ├─ error: string | null
│  │
│  └─ Methods:
│     ├─ fetchTasks()
│     ├─ saveTask(task)
│     └─ deleteTask(taskId)
│
└─ Local State (Per Component)
   │
   ├─ LoginPage
   │  ├─ email: string
   │  └─ password: string
   │
   ├─ VerifyCode Page
   │  ├─ code: string
   │  ├─ error: string
   │  └─ message: string
   │
   ├─ ChangePassword Page
   │  ├─ newPassword: string
   │  ├─ confirmPassword: string
   │  ├─ error: string
   │  └─ message: string
   │
   └─ App.tsx
      └─ currentPath: AppPath
```

---

## 🔌 API Integration Points

```
Frontend Request      →  API Layer           →  Backend
───────────────────────────────────────────────────────────

LoginPage.handleSubmit
    ↓
useAuth().login()
    ↓
AuthContext.login()
    ↓
mockAPI.login()  ─→  Call to backend ─→  POST /api/auth/login
                      Get response          (returns 202 or 200)
    ↓
Parse response
    ↓
Update user state
    ↓
Save to localStorage


VerifyCodePage.handleSubmit
    ↓
useAuth().verifyCode()
    ↓
AuthContext.verifyCode()
    ↓
mockAPI.verifyCode()  ─→  Call to backend ─→  POST /api/auth/verify-code
                      Get response          (returns 200 or 400)
    ↓
Parse response
    ↓
Update user state
    ↓
Auto-redirect via useEffect


ChangePasswordPage.handleSubmit
    ↓
useAuth().changePassword()
    ↓
AuthContext.changePassword()
    ↓
mockAPI.changePassword()  ─→  Call to backend ─→  POST /api/auth/change-password
                      Get response          (returns 200 or 400)
    ↓
Parse response
    ↓
Update user state
    ↓
Auto-redirect via useEffect
```

---

## 🎨 Page Visibility Logic

```
                        ┌─────────────────────────────────────────┐
                        │ Is user logged in?                      │
                        │ (user !== null)                         │
                        └──────┬──────────────────────────┬────────┘
                               │                          │
                             NO                         YES
                               │                          │
                        ┌──────▼─────┐          ┌─────────▼──────┐
                        │  LoginPage  │          │ Is first login? │
                        │  VISIBLE    │          │ (isFirstLogin)  │
                        └─────────────┘          └─────┬──┬───┬──┘
                                                    YES │  NO  │ (shouldn't happen)
                                                       │      │
                                         ┌─────────────┘      └──────┐
                                         │                           │
                                    ┌────▼────────────────┐    ┌────▼────────┐
                                    │ Code verified?      │    │ Dashboard   │
                                    │ (hasVerifiedCode)   │    │ TaskList    │
                                    │                     │    │ Register    │
                                    └─────┬───────┬───────┘    │ etc.        │
                                        YES      NO           │ VISIBLE     │
                                         │        │            └─────────────┘
                            ┌────────────┘        │
                            │                     │
                    ┌───────▼──────┐      ┌───────▼──────────────┐
                    │ChangePassword│      │ VerifyCode          │
                    │ VISIBLE       │      │ VISIBLE             │
                    └───────────────┘      └─────────────────────┘
```

---

## 🔐 Route Protection Logic

```
ProtectedRoute Component
│
├─ Check 1: Is user logged in?
│   ├─ NO → Redirect to LoginPage
│   └─ YES → Continue
│
├─ Check 2: Does user have required role?
│   │
│   ├─ RequiredRole: ["Admin", "User"]
│   │   ├─ User role is Admin → Allow (continue)
│   │   ├─ User role is User → Allow (continue)
│   │   └─ User role is neither → Deny (redirect to Dashboard)
│   │
│   └─ RequiredRole: ["Admin"]
│       ├─ User role is Admin → Allow (continue)
│       └─ User role is User → Deny (redirect to Dashboard)
│
└─ All checks passed
   └─ Render page
```

Example usage in app.tsx:

```typescript
<ProtectedRoute requiredRole={["Admin"]}>
  <Register onNavigate={onNavigate} />
</ProtectedRoute>
// Only Admin users can see Register page
// Users redirected to Dashboard if they try to access
```

---

## 📱 User Interactions & State Changes

```
Interaction              State Change                    Page Effect
────────────────────────────────────────────────────────────────────

1. Click "Log In"       user = logged-in user           Navigate to Verify/Dashboard
                        isFirstLogin = true/false       based on isFirstLogin

2. Enter code, click    hasVerifiedCode = true          Navigate to ChangePassword
   "Verify"

3. Enter password,      isFirstLogin = false            Navigate to Dashboard
   click "Set Password"

4. On Dashboard,        currentPath = "TaskList"        Show TaskList page
   click "Tasks"

5. Click "Create Task"  currentPath = "AddTask"         Show TaskForm in add mode

6. Click "Logout"       user = null                     Navigate to LoginPage
                        localStorage cleared

7. Refresh page         user = from localStorage        Stay logged in (if user exists)

8. Close app, reopen    localStorage persisted          Still logged in (next session)
   browser
```

---

## 🔍 Error Handling Flow

```
API Call
│
├─ Success (200/202)
│   │
│   └─ Update state
│       └─ Show success message (if needed)
│
└─ Error (400/401/500)
    │
    ├─ Catch error
    │   │
    │   └─ Extract error message
    │       │
    │       ├─ AuthContext.error = message
    │       │
    │       └─ Page displays:
    │           <div className="text-red-500">{error}</div>
    │
    └─ User sees:
        └─ Error message on page (e.g., "Invalid credentials")
```
