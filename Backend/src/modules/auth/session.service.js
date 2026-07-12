import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  createSession as createSessionRecord,
  findSessionByJti,
  revokeSession,
  revokeAllSessions,
  deleteExpiredSessions,
} from "./session.repository.js";

const getRefreshTokenExpiryDate = (refreshToken) => {
  const decoded = jwt.decode(refreshToken);

  if (decoded?.exp) {
    return new Date(decoded.exp * 1000);
  }

  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
};

export const createSession = async ({
  userId,
  sessionId,
  refreshToken,
  ipAddress = null,
  userAgent = null,
}) => {
  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  const expiresAt = getRefreshTokenExpiryDate(refreshToken);

  await createSessionRecord({
    userId,
    jti: sessionId,
    refreshTokenHash,
    ipAddress,
    userAgent,
    expiresAt,
  });
};

export const getSession = async (sessionId) => {
  return await findSessionByJti(sessionId);
};

export const removeSession = async (sessionId) => {
  await revokeSession(sessionId);
};

export const rotateSession = async ({
  userId,
  sessionId,
  refreshToken,
  ipAddress = null,
  userAgent = null,
}) => {
  await revokeSession(sessionId);

  await createSession({
    userId,
    sessionId,
    refreshToken,
    ipAddress,
    userAgent,
  });
};

export const revokeAllUserSessions = async (userId) => {
  await revokeAllSessions(userId);
};

export const cleanExpiredSessions = async () => {
  await deleteExpiredSessions();
};
