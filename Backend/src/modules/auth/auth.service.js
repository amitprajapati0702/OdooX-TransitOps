import crypto from "crypto";
import { 
  findUserByEmailAndRole, 
  updateLastLogin, 
  incrementFailedLoginAttempts, 
  resetFailedLoginAttempts, 
  lockUserAccount 
} from "./auth.repository.js";
import { ApiError } from "../../errors/ApiError.js";
import { comparePassword } from "../../utils/password.js";
import { createSession } from "./session.service.js";
import { generateAccessToken, generateRefreshToken } from "./token.service.js";

const MAX_LOGIN_ATTEMPTS = 5;

export const login = async ({ email, password, role }) => {
  const sessionId = crypto.randomUUID();
  const user = await findUserByEmailAndRole(email, role);

  if (!user) {
    throw new ApiError(401, "Invalid email or password.");
  }

  if (!user.is_active) {
    throw new ApiError(403, "Account disabled or locked due to too many failed attempts.");
  }

  let matched = false;

  if (user.password_hash && String(user.password_hash).startsWith("$2")) {
    matched = await comparePassword(password, user.password_hash);
  } else {
    // Fallback for simple hashing/plaintext during development
    matched = password === String(user.password_hash ?? user.password ?? "");
  }

  if (!matched) {
    await incrementFailedLoginAttempts(user.user_id);
    
    // Check if they have reached the maximum allowed attempts
    if (user.failed_login_attempts + 1 >= MAX_LOGIN_ATTEMPTS) {
      await lockUserAccount(user.user_id);
      throw new ApiError(403, "Account locked due to too many failed login attempts. Please contact support.");
    }
    
    throw new ApiError(401, "Invalid email or password.");
  }

  // Success login: reset attempts and update last login
  await resetFailedLoginAttempts(user.user_id);
  await updateLastLogin(user.user_id);

  const payload = {
    userId: user.user_id,
    email: user.email,
    role: user.role_name,
    sessionId: sessionId
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await createSession({
    userId: user.user_id,
    sessionId,
    refreshToken,
  });

  const { password_hash, failed_login_attempts, ...safeUser } = user;
  
  return {
    user: safeUser,
    accessToken,
    refreshToken,
  };
};
