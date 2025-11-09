/**
 * Tasky Backend Server
 * Express.js + TypeScript + ES Modules
 */
import User from "./src/models/UsersModel.js";
import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import sequelize from "./src/utils/sequelize.js";
import { initializeAssociations } from "./src/models/associations.js";
import taskRoutes from "./src/routes/taskRoutes.js";

// Import routes
import authRoutes from "./src/routes/authRoutes.js";
import notificationRoutes from "./src/routes/notificationRoutes.js";

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

const app = express();
// Middleware
app.use(
  cors({
    origin: "http://localhost:5173", // Frontend URL (Vite default)
    credentials: true, // Allow credentials (cookies, auth headers)
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(cookieParser()); // Add cookie parser middleware
app.use(express.static(join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/notifications", notificationRoutes);
// Basic route
app.get("/", (req, res) => {
  res.json({ message: "Tasky Backend API is running!" });
});

app.listen(PORT, async () => {
  try {
    // Initialize model associations (must be done before sync)
    initializeAssociations();
    console.log("✅ Model associations initialized.");

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
