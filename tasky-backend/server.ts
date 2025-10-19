/**
 * Tasky Backend Server
 * Express.js + TypeScript + ES Modules
 */
import User from "./src/models/UsersModel.js";
import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import cors from "cors";
import dotenv from "dotenv";
import sequelize from "./src/utils/sequelize.js";

// Import routes
import authRoutes from "./src/routes/authRoutes.js";

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);

// Basic route
app.get("/", (req, res) => {
  res.json({ message: "Tasky Backend API is running!" });
});

app.listen(PORT, async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log("✅ Database connection established successfully.");

    // Sync models with database (creates tables if they don't exist)
    await sequelize.sync({ alter: true });
    console.log("✅ Database models synced successfully.");

    console.log(`🚀 Server is running on http://localhost:${PORT}`);
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error);
    process.exit(1);
  }
});
