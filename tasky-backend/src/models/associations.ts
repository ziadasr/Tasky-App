// Model Associations
// Defined separately to avoid circular import issues
import Notification from "./Notification.js";
import Task from "./tasksModel.js";
import User from "./UsersModel.js";

export const initializeAssociations = () => {
  // --- TASK BELONGS TO USER (Foreign Key side) ---

  // Task belongs to User (Assignee)
  Task.belongsTo(User, {
    foreignKey: "assigneeId",
    as: "Assignee",
    targetKey: "id",
  });

  // Task belongs to User (Creator)
  Task.belongsTo(User, {
    foreignKey: "createdBy", // Use correct column name
    as: "Creator",
    targetKey: "id",
  });

  // --- USER HAS MANY TASKS (Inverse side - Required for Sequelize methods) ---

  // User Has Many Tasks (Assigned to them)
  User.hasMany(Task, {
    foreignKey: "assigneeId",
    as: "AssignedTasks",
  });

  // User Has Many Tasks (Created by them)
  User.hasMany(Task, {
    foreignKey: "createdBy", // Use correct column name
    as: "CreatedTasks",
  });

  // User owns the notifications they receive
  User.hasMany(Notification, {
    foreignKey: "recipientId",
    as: "ReceivedNotifications",
  });
  Notification.belongsTo(User, { foreignKey: "recipientId", as: "Recipient" });

  // User can be the sender of a notification (e.g., filing a report)
  User.hasMany(Notification, {
    foreignKey: "senderId",
    as: "SentNotifications",
  });
  Notification.belongsTo(User, { foreignKey: "senderId", as: "Sender" });
};
Notification.belongsTo(Task, {
  foreignKey: "taskId",
  as: "Task", // <-- Use 'Task' as the alias
});
// A Task can have many Notifications (for reporting, assignment, etc.)
Task.hasMany(Notification, {
  foreignKey: "taskId",
  as: "Notifications",
});
