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
  // body("dateOfBirth")
  //   .isDate()
  //   .withMessage("Date of birth must be a valid date (YYYY-MM-DD format)."),
  // body("phoneNumber")
  //   .isMobilePhone("any")
  //   .withMessage("Invalid phone number format."),
  // body("city").trim().notEmpty().withMessage("City is required."),
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

export const validateTaskCreation: ValidationChain[] = [
  // Core Data Fields
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required.")
    .isLength({ min: 5, max: 255 })
    .withMessage("Title must be between 5 and 255 characters.")
    .escape(), // Prevents XSS

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required.")
    .isString()
    .withMessage("Description must be a string.")
    .escape(),

  // Priority & Status (Must match DB ENUMs)
  body("priority")
    .isIn(["low", "medium", "high"])
    .withMessage("Priority must be 'low', 'medium', or 'high'."),

  // Dates & Scheduling Fields
  body("dueDate")
    .isISO8601() // ISO format date
    .toDate()
    .withMessage("Due Date must be a valid date format (YYYY-MM-DD)."),

  body("scheduledRunTime")
    .isISO8601()
    .toDate()
    .withMessage(
      "Scheduled Run Time must be a valid date/time format (ISO 8601)."
    ),

  // Foreign Key / Assignee Check
  body("assigneeId")
    .isInt({ min: 1 })
    .withMessage("Assignee ID must be a positive integer."),

  // Recurring Flag
  body("isRecurring")
    .isBoolean()
    .withMessage("isRecurring must be a boolean (true/false).")
    .toBoolean(), // Converts input string "true"/"false" to boolean type

  // --- 2. Logic Validation (Critical) ---
  // Ensure scheduledRunTime is NOT in the past (prevents BullMQ errors)
  body("scheduledRunTime").custom((value) => {
    if (new Date(value).getTime() < Date.now()) {
      throw new Error("Scheduled Run Time cannot be in the past.");
    }
    return true;
  }),

  // Ensure Due Date is after Scheduled Run Time
  body("dueDate").custom((value, { req }) => {
    const scheduledTime = new Date(req.body.scheduledRunTime).getTime();
    const dueDate = new Date(value).getTime();

    if (dueDate < scheduledTime) {
      throw new Error("Due Date must be later than the Scheduled Run Time.");
    }
    return true;
  }),
];

export const validateTaskUpdate: ValidationChain[] = [
  // All fields must be optional for updates

  body("title")
    .optional() // Allow this field to be absent
    .trim()
    .isLength({ min: 5, max: 255 })
    .withMessage("Title must be between 5 and 255 characters.")
    .escape(),

  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string.")
    .escape(),

  body("priority")
    .optional()
    .isIn(["low", "medium", "high"])
    .withMessage("Priority must be 'low', 'medium', or 'high'."),

  body("dueDate")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("Due Date must be a valid date format (YYYY-MM-DD)."),

  body("scheduledRunTime")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage(
      "Scheduled Run Time must be a valid date/time format (ISO 8601)."
    ),

  body("assigneeId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Assignee ID must be a positive integer."),

  body("isRecurring")
    .optional()
    .isBoolean()
    .withMessage("isRecurring must be a boolean (true/false).")
    .toBoolean(),
];

// 2. Middleware to check results and send errors
export const validationHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Extract detailed error messages
    const errorMessages = errors.array().map((err) => ({
      field: err.type === "field" ? err.path : err.type,
      message: err.msg,
    }));

    // For password validation errors, create a short summary message
    const passwordErrors = errorMessages.filter(
      (err) => err.field === "newPassword" || err.field === "confirmPassword"
    );

    let shortMessage = errorMessages.map((err) => err.message).join(" ");

    // If there are password errors, create a concise message
    if (passwordErrors.length > 0) {
      shortMessage = `Password must: ${passwordErrors
        .map((err) =>
          err.message
            .toLowerCase()
            .replace("password must ", "")
            .replace("password confirmation ", "")
        )
        .join(", ")}`;
    }

    // Build error response
    const errorResponse = {
      error: shortMessage,
      code: "VALIDATION_ERROR",
      details: errorMessages,
    };

    // Return validation error response
    return res.status(Errors.BAD_REQUEST.status).json(errorResponse);
  }
  next(); // Proceed to the controller if validation passed
};
