import jwt, { type JwtPayload, type Secret } from "jsonwebtoken";

// Use environment variable, fallback to default secret
const JWT_SECRET: Secret =
  process.env.JWT_SECRET || "default_secret_fallback_must_be_strong";

// Define shared JWT Payload structure
export interface TokenPayload extends JwtPayload {
  userId: number;
  role: string;
  directManagerId?: number;
  purpose?: "auth" | "reset" | "change_password";
}

/**
 * Creates a JWT.
 */
export const issueToken = (
  payload: TokenPayload,
  options?: jwt.SignOptions
): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "8h",
    ...options,
  });
};

export const issueResetToken = (payload: {
  userId: number;
  email: string;
}): string => {
  return jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
      purpose: "change_password", // CRITICAL: Defines what this token can do
    },
    JWT_SECRET,
    { expiresIn: "10m" } // Very short expiration time
  );
};

/**
 * Synchronously verifies the token and returns the payload.
 * Used primarily in the authentication middleware.
 */
export const verifyToken = (token: string): TokenPayload => {
  // Throws an error if verification fails (expired, invalid signature)
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};
