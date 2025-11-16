import { Router } from "express";
import { authenticateUser } from "../midlerwares/authMiddleware.js";
import { getAllEmployees } from "../controllers/adminCont.js";

const router = Router();
router.get("/emp-details", authenticateUser, getAllEmployees);
export default router;
