import jwt from "jsonwebtoken";
import crypto from "crypto";

const {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  ACCESS_TOKEN_EXPIRES = "15m",
  REFRESH_TOKEN_EXPIRES = "7d",
} = process.env;

if (!JWT_ACCESS_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error("JWT secrets are not configured.");
}

const JWT_OPTIONS = {
  issuer: "TransitOps",
  audience: "TransitOps-App",
};

/**
 * Generate unique JWT ID.
 */
export const generateJti = () => {
  return crypto.randomUUID();
};

/**
 * Generate Access Token
 */
export const generateAccessToken = ({ userId, email, role }) => {
  return jwt.sign(
    {
      sub: userId,
      email,
      role,
    },
    JWT_ACCESS_SECRET,
    {
      expiresIn: ACCESS_TOKEN_EXPIRES,
      ...JWT_OPTIONS,
    },
  );
};

/**
 * Generate Refresh Token
 */
export const generateRefreshToken = ({ userId, jti }) => {
  return jwt.sign(
    {
      sub: userId,
      jti,
    },
    JWT_REFRESH_SECRET,
    {
      expiresIn: REFRESH_TOKEN_EXPIRES,
      ...JWT_OPTIONS,
    },
  );
};

/**
 * Verify Access Token
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, JWT_ACCESS_SECRET, JWT_OPTIONS);
};

/**
 * Verify Refresh Token
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, JWT_REFRESH_SECRET, JWT_OPTIONS);
};

/**
 * Decode without verification.
 */
export const decodeToken = (token) => {
  return jwt.decode(token);
};
