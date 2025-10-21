import { body, validationResult } from "express-validator";
import type { ValidationChain } from "express-validator";
import type { Request, Response, NextFunction } from "express";
import { Errors } from "../models/Errors.js";

// 1. Define the validation rules as a reusable middleware chain
export const validateRegistration: ValidationChain[] = [
  // Check required fields and sanitization
  body("name")
    .trim()
    .notEmpty()
    .isLength({ min: 5, max: 30 })
    .withMessage("Name is required."),
  //.trim protects against names with only spaces

  body("email")
    .isEmail()
    .withMessage("Please enter a valid email address.")
    .normalizeEmail(),

  body("dateOfBirth")
    .isDate()
    .withMessage("Date of birth must be a valid date (YYYY-MM-DD format)."),

  body("phoneNumber")
    .isMobilePhone("any")
    .withMessage("Invalid phone number format."),

  body("city").trim().notEmpty().withMessage("City is required."),

  body("department").trim().notEmpty().withMessage("Department is required."),

  body("role").trim().notEmpty().withMessage("Role is required."),

  body("directManagerId")
    .isInt({ min: 1 })
    .withMessage("Direct Manager ID must be a positive integer."),
];

// --- Password Complexity Rules ---
export const validateNewPassword: ValidationChain[] = [
  // 1. New Password Presence and Length
  body("newPassword")
    .exists()
    .withMessage("New password is required.")
    .isLength({ min: 10 }) // Enforce a good minimum length
    .withMessage("Password must be at least 10 characters long."),

  // 2. Character Requirements (Complexity)
  body("newPassword")
    .matches(/[A-Z]/) // Must contain at least one uppercase letter
    .withMessage("Password must contain at least one uppercase letter.")
    .matches(/[a-z]/) // Must contain at least one lowercase letter
    .withMessage("Password must contain at least one lowercase letter.")
    .matches(/[0-9]/) // Must contain at least one number
    .withMessage("Password must contain at least one number.")
    .matches(/[!@#$%^&*(),.?":{}|<>]/) // Must contain at least one special character
    .withMessage(
      "Password must contain at least one special character (!@#$%...)."
    ),

  // 3. Password Confirmation Match
  body("confirmPassword")
    .exists()
    .withMessage("Password confirmation is required.")
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error(
          "Password confirmation does not match the new password."
        );
      }
      return true;
    }),
];

// 2. Middleware to check results and send errors
export const validationHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // If validation fails, return a 400 Bad Request immediately
    return res.status(Errors.BAD_REQUEST.status).json({
      error: Errors.BAD_REQUEST.error,
      code: Errors.BAD_REQUEST.code,
      details: errors.array(),
    });
  }
  next(); // Proceed to the controller if validation passed
};
