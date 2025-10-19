import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App.tsx";
import { AuthProvider } from "./context/AuthContext";

// This file is the entry point for the React application.
// It initializes the root and wraps the entire app in necessary contexts.

// The exclamation mark `!` asserts that the 'root' element is present,
// which is standard practice when working with Vite/TS setup.
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* AuthProvider must wrap the App to make user authentication available globally */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
