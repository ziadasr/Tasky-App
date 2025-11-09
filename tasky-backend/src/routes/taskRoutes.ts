import { Router } from "express";
import Task from "../controllers/taskCont";
import router from "./authRoutes";
import { authenticateUser } from "../midlerwares/authMiddleware.js";
import {
  validateTaskCreation,
  validateTaskUpdate,
  validationHandler,
} from "../midlerwares/authValidation.js";

router.post(
  "/create-task",
  authenticateUser,
  validateTaskCreation,
  validationHandler,
  Task.CreateTaskCont
);
router.get("/tasks", authenticateUser, Task.getUserTasks);
router.get("/direct-employees", authenticateUser, Task.getDirectEmployeesCont);
router.post("/start-task/:id", authenticateUser, Task.startTask);
router.post("/complete-task/:id", authenticateUser, Task.completeTask);

router.put(
  "/update-task/:id",
  authenticateUser,
  validateTaskUpdate,
  validationHandler,
  Task.updateTaskCont
);
export default router;
