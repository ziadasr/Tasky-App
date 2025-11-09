// backend/routes/authRoutes.js
import { Router } from "express";
import auth from "../controllers/auth.js";
import Task from "../controllers/taskCont.js";
import {
  validateNewPassword,
  validateRegistration,
  validationHandler,
} from "../midlerwares/authValidation.js";
import {
  authenticateUser,
  authorizePasswordChange,
} from "../midlerwares/authMiddleware.js";
import { setServers } from "dns";
const router = Router();

// Registration route with validation
router.post(
  "/register-by-admin",
  authenticateUser,
  validateRegistration,
  validationHandler,
  auth.registrationContbyAdmin
);
router.post(
  "/Complete-Profile",
  authorizePasswordChange,
  validateNewPassword,
  validationHandler,
  auth.completeProfileCont
);
router.post("/login", auth.loginCont);
//verify users acc in the first login
router.post("/verify-code", auth.verifyCont);

//Add task routes
router.post("/create-task", authenticateUser, Task.CreateTaskCont);
router.get("/tasks", authenticateUser, Task.getUserTasks);
export default router;
