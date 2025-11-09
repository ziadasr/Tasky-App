// backend/config/errorCodes.js (or similar)

import type { error } from "console";

export const Errors = {
  BAD_REQUEST: {
    status: 400,
    code: "BAD_REQUEST",
    error: "Invalid request payload. Please check your data.",
  },
  INVALID_EMAIL: {
    status: 400,
    code: "INVALID_EMAIL",
    error: "The email address provided is not valid.",
  },
  PASSWORD_TOO_WEAK: {
    status: 400,
    code: "PASSWORD_TOO_WEAK",
    error:
      "Password must be at least 8 characters and include a number and symbol.",
  },
  WRONG_PASSWORD: {
    status: 401,
    code: "WRONG_PASSWORD",
    error: "The password you entered is incorrect.",
  },
  INVALID_CREDS: {
    status: 401,
    code: "INVALID_CREDENTIALS",
    error: "Invalid email or password.",
  },
  PASSWORD_MISMATCH: {
    status: 400,
    code: "PASSWORD_MISMATCH",
    error: "The new password and confirmation do not match.",
  },

  // --- 409 Conflict Errors ---
  // Use 409 for resource conflict (unique constraint)
  EMAIL_EXISTS: {
    status: 409,
    code: "EMAIL_EXISTS",
    error: "An account with this email already exists.",
  },
  EMAIL_NOT_REGISTERED: {
    status: 404,
    code: "EMAIL_NOT_REGISTERED",
    error: "The email address is not registered.",
  },

  INTERNAL_ERROR: {
    status: 500,
    code: "INTERNAL_ERROR",
    error: "Internal server error. Please try again later.",
  },
  UNAUTHORIZED: {
    status: 401,
    code: "UNAUTHORIZED",
    error: "You are not authorized to perform this action.",
  },
  NOT_LOGGED_IN: {
    status: 401,
    code: "NOT_LOGGED_IN",
    error: "You must be logged in to access this resource.",
  },
  INVALID_OR_EXPIRED_TOKEN: {
    status: 401,
    code: "INVALID_OR_EXPIRED_TOKEN",
    error: "Your token is invalid or has expired. Please log in again.",
  },
  NOT_AUTH: {
    status: 403,
    code: "NOT_AUTHORIZED",
    error:
      "You do not have permission to access this resource or perform this action.",
  },
  VERIFICATION_FAILED: {
    status: 400,
    code: "VERIFICATION_FAILED",
    error: "Verification failed. The provided code is incorrect or expired.",
  },
  NOT_FOUND: {
    status: 404,
    code: "NOT_FOUND",
    error: "The requested resource was not found.",
  },
  TASK_NOT_STARTED_YET: {
    status: 400,
    code: "TASK_NOT_STARTED_YET",
    error: "The task has not been started yet.",
  },
  TASK_NOT_RERADY_TO_START: {
    status: 400,
    code: "TASK_NOT_READY_TO_START",
    error: "The task is not ready to be started, not in 'pending' status.",
  },
  COMPLETED_TASKS_NON_EDITABLE: {
    status: 400,
    code: "COMPLETED_TASKS_NON_EDITABLE",
    error: "Completed tasks cannot be edited.",
  },
};
