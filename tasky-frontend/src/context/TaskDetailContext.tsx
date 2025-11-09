import React, { createContext, useContext, useState, ReactNode } from "react";

interface TaskDetailContextType {
  selectedTask: any | null;
  setSelectedTask: (task: any | null) => void;
}

const TaskDetailContext = createContext<TaskDetailContextType | undefined>(
  undefined
);

export const TaskDetailProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [selectedTask, setSelectedTask] = useState<any | null>(null);

  return (
    <TaskDetailContext.Provider value={{ selectedTask, setSelectedTask }}>
      {children}
    </TaskDetailContext.Provider>
  );
};

export const useTaskDetail = () => {
  const context = useContext(TaskDetailContext);
  if (!context) {
    throw new Error("useTaskDetail must be used within TaskDetailProvider");
  }
  return context;
};
