# Quick Reference: Frontend Architecture

## 🎯 File Map (What Each File Does)

```
tasky-frontend/src/
│
├─ main.tsx                      ← Entry point (creates React app)
├─ app.tsx                       ← Routing & auto-redirect logic
│
├─ context/
│  ├─ AuthContext.tsx            ← User login/logout/verify/changePassword
│  └─ TaskContext.tsx            ← Task CRUD operations
│
├─ pages/                        ← Full page components
│  ├─ Login.tsx                  ← Email + password form
│  ├─ VerifyCode.tsx             ← 6-digit code verification
│  ├─ ChangePassword.tsx         ← New password setup (first login)
│  ├─ Dashboard.tsx              ← Main page (after login)
│  ├─ TaskList.tsx               ← View all tasks
│  ├─ TaskForm.tsx               ← Create/edit task
│  ├─ Register.tsx               ← Admin register user
│  └─ ... other pages
│
├─ components/
│  ├─ layout/
│  │  ├─ Layout.tsx              ← Main container
│  │  └─ Sidebar.tsx             ← Navigation + user info
│  ├─ common/
│  │  └─ UIComponents.tsx        ← Reusable: Card, Input, Button, Spinner
│  └─ TaskCard.tsx               ← Single task display
│
├─ api/
│  ├─ mockApi.ts                 ← Mock API (for development)
│  └─ api.ts                     ← Real API (for production)
│
├─ types/
│  ├─ user.d.ts                  ← User & AuthContextType interfaces
│  └─ task.d.ts                  ← Task interface
│
└─ ... other files
```

---

## 🔑 Key Concepts

### **AuthContext (State Management)**

```
User logged in? → Show specific page based on flags

Flags:
├─ user.isFirstLogin: true      → Needs to verify code + change password
├─ user.hasVerifiedCode: true   → Verified code, now change password
└─ user.isFirstLogin: false     → Fully logged in, show normal app

Flow: Login → isFirstLogin=true → Verify → hasVerifiedCode=true → ChangePassword → isFirstLogin=false
```

### **ProtectedRoute**

```
Every page wrapped with ProtectedRoute checks:
1. Is user logged in?
   NO  → Show LoginPage
   YES → Continue
2. Does user have required role?
   NO  → Redirect to Dashboard
   YES → Show page
```

### **localStorage**

```
After login, user object is saved to localStorage:
  localStorage.setItem("currentUser", JSON.stringify(user))

On app refresh, retrieved from localStorage:
  const user = localStorage.getItem("currentUser")

This keeps user logged in across page refreshes
```

---

## 🔄 How Pages Connect

```
App.tsx
  │
  ├─> Not logged in?
  │   └─> LoginPage
  │       └─> calls: useAuth().login(email, password)
  │           └─> AuthContext.login()
  │               └─> calls: mockAPI/api.login()
  │
  ├─> Logged in + isFirstLogin=true + !hasVerifiedCode?
  │   └─> VerifyCode
  │       └─> calls: useAuth().verifyCode(email, code)
  │           └─> AuthContext.verifyCode()
  │               └─> calls: mockAPI/api.verifyCode()
  │
  ├─> Logged in + isFirstLogin=true + hasVerifiedCode?
  │   └─> ChangePassword
  │       └─> calls: useAuth().changePassword(email, newPassword)
  │           └─> AuthContext.changePassword()
  │               └─> calls: mockAPI/api.changePassword()
  │
  ├─> Logged in + isFirstLogin=false?
  │   └─> TaskManagerApp (shows Dashboard, TaskList, etc.)
  │       └─> Layout
  │           ├─> Sidebar (navigation)
  │           └─> [Current Page Content]
  │
  └─> Error or unauthorized?
      └─> Redirect to Dashboard
```

---

## 💾 State Variables in AuthContext

```typescript
user: User | null
├─ null                           → User not logged in
└─ { id, email, name, role, isFirstLogin?, hasVerifiedCode? }

loading: boolean
├─ true                           → API call in progress (show spinner)
└─ false                          → API call finished or idle

error: string | null
├─ null                           → No error
└─ "Error message"               → Show error to user

isAdmin: boolean                  → Computed: user?.role === "Admin"
isUser: boolean                   → Computed: user?.role === "User"
userId: string | undefined        → Computed: user?.id as string
```

---

## 🔌 API Methods

### **From AuthContext:**

```typescript
import { useAuth } from "../context/AuthContext";

const { user, loading, error, login, logout, verifyCode, changePassword } =
  useAuth();

// login(email, password)
await login("user@example.com", "password123");
// Returns: boolean (success or failure)

// logout()
logout();
// Returns: void

// verifyCode(email, code)
await verifyCode("user@example.com", "123456");
// Returns: void

// changePassword(email, newPassword)
await changePassword("user@example.com", "NewPassword123");
// Returns: void
```

### **From TaskContext:**

```typescript
import { useTask } from "../context/TaskContext";

const { tasks, loading, saveTask, deleteTask, fetchTasks } = useTask();

// fetchTasks()
await fetchTasks();
// Returns: Task[]

// saveTask(task)
await saveTask({ name: "New Task", ... });
// Returns: Task

// deleteTask(taskId)
await deleteTask("task-123");
// Returns: void
```

---

## 🎨 UI Components Available

```typescript
import { Card, Input, Button, Spinner } from "../components/common/UIComponents";

// <Card>
<Card className="max-w-md">Content</Card>
// Props: className

// <Input>
<Input
  label="Email"
  id="email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={error}
/>
// Props: label, id, type, value, onChange, error, placeholder

// <Button>
<Button
  type="submit"
  variant="primary"
  isLoading={loading}
>
  Log In
</Button>
// Props: type, variant ("primary"|"secondary"|"danger"), isLoading, className, children, onClick

// <Spinner>
{loading && <Spinner />}
// No props needed
```

---

## 🛠️ Common Tasks

### **Add a New Page**

```typescript
// 1. Create pages/MyNewPage.tsx
export const MyNewPage: React.FC<PageProps> = ({ onNavigate }) => {
  // Use any context:
  const { user } = useAuth();
  const { tasks } = useTask();

  // Render UI
  return <div>...</div>;
};

// 2. Add route in app.tsx
export type AppPath = "Dashboard" | "MyNewPage" | ...;

// 3. Add to ProtectedRoute
<ProtectedRoute requiredRole={["Admin", "User"]}>
  <MyNewPage onNavigate={onNavigate} />
</ProtectedRoute>
```

### **Call an API Function**

```typescript
// In a page or component:
const { login } = useAuth();

const handleLogin = async () => {
  try {
    const success = await login(email, password);
    if (success) {
      // Auto-redirect happens via useEffect in app.tsx
    }
  } catch (err) {
    // Error is shown to user
    console.error(err);
  }
};
```

### **Show Loading State**

```typescript
const { loading } = useAuth();

return (
  <>
    <Button disabled={loading}>{loading ? "Loading..." : "Submit"}</Button>
    {loading && <Spinner />}
  </>
);
```

### **Show Error Message**

```typescript
const { error } = useAuth();

return (
  <>
    {error && <div className="text-red-500">{error}</div>}
    <form onSubmit={handleSubmit}>...</form>
  </>
);
```

---

## ⚙️ Environment Setup

### **Frontend Ports**

```
Development: http://localhost:5173 (Vite default)
```

### **Backend Ports**

```
Development: http://localhost:5000 (Express default)
```

### **Required Env Variables** (if any)

```
VITE_API_URL=http://localhost:5000/api
```

---

## 📊 Type Definitions

```typescript
// User
interface User {
  id: string | number;
  email: string;
  username: string;
  name: string;
  role: "Admin" | "User";
  isFirstLogin?: boolean; // true = needs verify + change password
  hasVerifiedCode?: boolean; // true = verified code, ready for password change
}

// AuthContextType
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

// Task
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

## 🚀 Quick Start for Developers

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Frontend runs at http://localhost:5173
# 4. Backend runs at http://localhost:5000

# 5. Test login
Email: admin@tasky.com
Password: password

# 6. For first-login test
Email: user1@tasky.com
Password: password
Code: 123456 (any 6 digits)
New Password: NewPassword123
```

---

## 🐛 Debugging Checklist

```
❓ User not staying logged in after refresh?
   → Check: localStorage has "currentUser"
   → Check: AuthContext useEffect loads it on mount

❓ Redirect not happening after login?
   → Check: useEffect in app.tsx is watching user state
   → Check: isFirstLogin flag is being set correctly
   → Check: currentPath state is updating

❓ API calls failing?
   → Check: Backend is running on http://localhost:5000
   → Check: Network tab shows 200 or 202 response
   → Check: Error message is descriptive

❓ Page shows but looks broken?
   → Check: Tailwind CSS is loading
   → Check: UIComponents have required props
   → Check: Browser console for TypeScript errors

❓ Can't login?
   → Check: User exists in backend (admin@tasky.com)
   → Check: Password matches (password)
   → Check: Email field has correct value
   → Check: Network tab shows 200/202 response
```

---

## 📚 Related Files

- Frontend Flow Guide: `FRONTEND_FLOW_GUIDE.md`
- Architecture Summary: `FRONTEND_ARCHITECTURE_SUMMARY.md`
- Integration Guide: `INTEGRATION_GUIDE.md` (THIS FILE)
- Backend Setup: (in tasky-backend folder)
