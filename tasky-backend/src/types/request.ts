import type { Request } from "express";
import type { TokenPayload } from "../utils/jwtService.js";

/**
 * Global module augmentation for Express Request
 * This adds tokenUser property to all Express Request objects globally
 * No need to import AuthenticatedRequest - works everywhere!
 */
declare global {
  namespace Express {
    interface Request {
      tokenUser?: TokenPayload;
    }
  }
}
