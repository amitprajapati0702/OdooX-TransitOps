import { findUserByEmailAndRole } from "./auth.repository.js";
import { ApiError } from "../../errors/ApiError.js";

import { comparePassword } from "../../utils/password.js";
import { createSession } from "./session.service.js";
import { generateAccessToken, generateRefreshToken } from "./token.service.js";
import crypto from "crypto"

export const login = async ({ email, password, role }) => {
    const sessionId = crypto.randomUUID()
  const user = await findUserByEmailAndRole(email, role);

  if (!user) {
    throw new ApiError(401, "Invalid email or password.");
  }

  if (!user.is_active) {
    throw new ApiError(403, "Account disabled.");
  }

  let matched = false;

  if (user.password_hash && String(user.password_hash).startsWith("$2")) {
    matched = await comparePassword(password, user.password_hash);
  } else {
    matched = password === String(user.password_hash ?? user.password ?? "");
  }

  if (!matched) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const payload = {
    userId: user.user_id,

    email: user.email,

    role: user.role_name,

    sessionId:sessionId

  };

  const accessToken = generateAccessToken(payload);

  const refreshToken = generateRefreshToken(payload);

  await createSession({
    userId: user.user_id,
    sessionId,
    refreshToken,
  });

  const { password_hash, ...safeUser } = user;
  return {
    user: safeUser,

    accessToken,

    refreshToken,
  };
};
