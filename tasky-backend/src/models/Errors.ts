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
  FIELD_REQUIRED: {
    status: 400,
    code: "FIELD_REQUIRED",
    error: "A required field is missing or empty.",
  },

  // --- 409 Conflict Errors ---
  EMAIL_EXISTS: {
    status: 409, // Use 409 for resource conflict (unique constraint)
    code: "EMAIL_EXISTS",
    error: "An account with this email already exists.",
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
};
