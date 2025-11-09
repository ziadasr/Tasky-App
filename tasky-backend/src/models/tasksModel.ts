// Task.ts
import { DataTypes, Model } from "sequelize";
import sequelize from "../utils/sequelize";
import User from "./UsersModel.js";

class Task extends Model {
  declare id: number; //the primary key
  declare title: string;
  declare description: string;
  declare status: string;
  declare priority: string; //high, medium, low
  declare dueDate: string;
  declare scheduledRunTime: Date;
  declare assigneeId: number;
  declare createdBy: number;
  declare department: string;
  declare isNotified: boolean; //not sure if needed but js incase
  declare jobId: number; //will be used for cron jobs
  declare isRecurring: boolean; //does it have recurrence or will be extended
  declare startedAt: Date | null;
  declare completedAt: Date | null;
}
Task.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      defaultValue: "scheduled",
      type: DataTypes.STRING,
      allowNull: false,
    },
    priority: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    scheduledRunTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    assigneeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    department: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isNotified: {
      defaultValue: false,
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    jobId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    isRecurring: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Tasks",
    tableName: "Tasks",
    timestamps: true,
    underscored: false,
  }
);
export default Task;
