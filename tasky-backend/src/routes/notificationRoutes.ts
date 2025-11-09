import {
  getNotificationCount,
  getNotifications,
  markAllAsReadController,
} from "../controllers/notficationCont.js";
import { Router } from "express";
import { authenticateUser } from "../midlerwares/authMiddleware.js";

const router = Router();

router.get("/unread-count", authenticateUser, getNotificationCount);
router.post("/mark-all-read", authenticateUser, markAllAsReadController);
router.get("/get-all", authenticateUser, getNotifications);

export default router;
