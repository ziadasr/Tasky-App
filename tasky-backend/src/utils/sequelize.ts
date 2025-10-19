import { Sequelize } from "sequelize";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME as string,
  process.env.DB_USER as string,
  process.env.DB_PASSWORD as string,
  {
    host: process.env.DB_HOST as string,
    dialect: "postgres",
    dialectModule: pg,
    logging: false,
  }
);

export default sequelize;
