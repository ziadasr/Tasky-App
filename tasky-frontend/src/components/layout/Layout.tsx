import React, { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { NavigateFunction, AppPath } from "../../app";

interface LayoutProps {
  children: ReactNode;
  onNavigate: NavigateFunction;
}

export const Layout: React.FC<LayoutProps> = ({ children, onNavigate }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen flex bg-gray-50 font-sans">
      {/* Sidebar Desktop */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <Sidebar onNavigate={onNavigate} />
      </div>

      {/* Sidebar Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
      <div
        className={`fixed inset-y-0 left-0 w-64 z-50 transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out lg:hidden`}
      >
        <Sidebar
          onNavigate={(
            path: AppPath,
            taskId?: string | null,
            filterStatus?: string | null
          ) => {
            onNavigate(path, taskId, filterStatus);
            setIsSidebarOpen(false);
          }}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm lg:hidden p-4 flex justify-between items-center">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-gray-600 focus:outline-none"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h7"
              />
            </svg>
          </button>
          <h2 className="text-xl font-bold text-gray-800">Tasky.</h2>
          <div className="w-6"></div> {/* Placeholder for centering title */}
        </header>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
