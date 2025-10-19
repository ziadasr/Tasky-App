// userModel.ts
import { DataTypes, Model } from "sequelize";
import sequelize from "../utils/sequelize";

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
  declare firstLogin: boolean;
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
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dateOfBirth: {
      type: DataTypes.DATE,
      allowNull: false,
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
      allowNull: false,
    },
    firstLogin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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
