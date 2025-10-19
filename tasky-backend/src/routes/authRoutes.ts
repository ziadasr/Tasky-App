// backend/routes/authRoutes.js
import { Router } from "express";
import auth from "../controllers/auth.js";
import {
  validateRegistration,
  validationHandler,
} from "../midlerwares/authValidation.js";

const router = Router();

// Registration route with validation
router.post(
  "/register-by-admin",
  validateRegistration,
  validationHandler,
  auth.registrationContbyAdmin
);

export default router;
