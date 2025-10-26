// backend/routes/authRoutes.js
import { Router } from "express";
import auth from "../controllers/auth.js";
import {
  validateNewPassword,
  validateRegistration,
  validationHandler,
} from "../midlerwares/authValidation.js";
import {
  authenticateUser,
  authorizePasswordChange,
} from "../midlerwares/authMiddleware.js";
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

export default router;
