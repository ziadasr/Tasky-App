// userModel.ts
import { DataTypes, Model } from "sequelize";
import sequelize from "../utils/sequelize";
import Task from "./tasksModel";

class User extends Model {
  declare id: number;
  declare directManagerId: number;
  declare role: string;
  declare name: string;
  declare dateOfBirth: Date;
  declare email: string;
  declare phoneNumber: string;
  declare encryptedVerificationCode: string;
  declare password: string;
  declare lastLogin: Date | null;
  declare department: string;
  declare city: string;
  declare tempPassword: boolean;
  declare salary: number;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    directManagerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    department: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dateOfBirth: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    encryptedVerificationCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    tempPassword: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    salary: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
  },

  {
    sequelize,
    modelName: "User",
    tableName: "Users",
    timestamps: true,
    underscored: true,
  }
);

export default User;
