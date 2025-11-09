import { DataTypes, Model } from "sequelize";
import sequelize from "../utils/sequelize";
import User from "./UsersModel.js";
import Task from "./tasksModel.js";

class Notification extends Model {
  declare id: number;
  declare recipientId: number;
  declare senderId: number | null;
  declare taskId: number | null;
  declare type:
    | "task_assigned"
    | "task_due"
    | "report_created"
    | "report_resolved"
    | "system";
  declare message: string;
  declare linkTo: string | null;
  declare isRead: boolean;
  declare createdAt: Date;
  declare updatedAt: Date;
}
export default Notification;

Notification.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    recipientId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
      onDelete: "CASCADE", // If the recipient is deleted, delete the notification
    },
    senderId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true, // Reports have a sender; system messages might not
      references: {
        model: User,
        key: "id",
      },
      onDelete: "SET NULL", // If the sender is deleted, don't delete the notification
    },
    type: {
      type: DataTypes.ENUM(
        "task_assigned",
        "task_due",
        "report_created",
        "report_resolved",
        "task_started",
        "task_completed",
        "welcome_message",
        "system"
      ),
      allowNull: false,
    },
    taskId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: Task,
        key: "id",
      },
      onDelete: "SET NULL",
    },
    message: {
      type: DataTypes.STRING(1000),
      allowNull: false,
    },
    linkTo: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "Notification",
    tableName: "notifications", // Explicit table name is good practice
    timestamps: true, // Ensure timestamps are active
  }
);
