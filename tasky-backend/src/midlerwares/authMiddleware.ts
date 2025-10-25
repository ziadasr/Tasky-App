import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwtService.js";
import { Errors } from "../models/Errors.js";
// tokenUser is now globally available via module augmentation in request.ts

// --- GENERAL USER AUTHENTICATION ---
export const authenticateUser = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // NOTE: If using cookies, the name is 'token'. If using headers, it's 'Bearer <token>'.
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(Errors.NOT_LOGGED_IN.status).json(Errors.NOT_LOGGED_IN);
  }

  try {
    // Use synchronous verification
    req.tokenUser = verifyToken(token);
    next();
  } catch (err) {
    return res
      .status(Errors.INVALID_OR_EXPIRED_TOKEN.status)
      .json(Errors.INVALID_OR_EXPIRED_TOKEN);
  }
};

// --- ADMIN AUTHENTICATION (Role Check) ---
// This middleware runs *after* authenticateUser
export const authorizeAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Ensure the token user payload is attached and the role is 'admin'
  if (!req.tokenUser || req.tokenUser.role !== "admin") {
    // Use 403 Forbidden since the user is authenticated but not authorized for this resource
    return res.status(403).json(Errors.NOT_AUTH);
  }
  next();
};

// --- RESET TOKEN AUTHENTICATION (Your authenticateresetJWT logic) ---
export const authenticateResetToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies?.resetToken;

  if (!token) {
    return res.status(Errors.NOT_LOGGED_IN.status).json(Errors.NOT_LOGGED_IN);
  }

  try {
    const decoded = verifyToken(token);
    req.tokenUser = decoded;

    // Custom Check: Email in token vs Email in request body/query
    const tokenEmail = decoded.email;
    const reqEmail = req.body?.email || req.query?.email || req.params?.email;

    if (!tokenEmail || !reqEmail || tokenEmail !== reqEmail) {
      return res.status(403).json({
        error: "Email mismatch in token and request.",
        code: "EMAIL_MISMATCH",
      });
    }

    next();
  } catch (err) {
    return res
      .status(Errors.INVALID_OR_EXPIRED_TOKEN.status)
      .json(Errors.INVALID_OR_EXPIRED_TOKEN);
  }
};

// --- AUTHORIZATION FOR PASSWORD CHANGE (Single-Purpose Token) ---
export const authorizePasswordChange = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // console.log("req.cookies:", req.cookies);
  // 1. Get the token from the *specific* reset cookie name
  const token = req.cookies?.reset_auth_token;
  if (!token) {
    // Token is missing entirely (e.g., user navigated directly)
    return res.status(403).json({
      error: "Password change authorization missing or expired.",
      code: "RESET_TOKEN_MISSING",
    });
  }

  try {
    // 2. Verify the token signature and expiration
    const payload = verifyToken(token);

    // 3. CRITICAL CHECK: Verify the token's purpose field
    if (payload.purpose !== "change_password") {
      // Token is valid but authorized for the wrong purpose
      return res.status(403).json({
        error: "Token is unauthorized for this action.",
        code: "TOKEN_PURPOSE_MISMATCH",
      });
    }

    // 4. Attach user info (ID and Email) and proceed to the changePasswordCont
    req.tokenUser = payload;
    next();
  } catch (err) {
    // Token is invalid, tampered with, or the 10-minute expiry passed
    return res.status(Errors.INVALID_OR_EXPIRED_TOKEN.status).json({
      error: "The password change link is invalid or has expired.",
      code: "RESET_TOKEN_EXPIRED",
    });
  }
};
