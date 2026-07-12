import {
 
  findSessionByJti,
  revokeSession,
  revokeAllSessions,
  deleteExpiredSessions,
} from "./session.repository.js";

export const createSession = async (userId, sessionId, refreshToken) => {
  await saveRefreshToken(userId, sessionId, refreshToken);
};

export const getSession = async (userId, sessionId) => {
  return await getRefreshToken(userId, sessionId);
};

export const removeSession = async (userId, sessionId) => {
  await deleteRefreshToken(userId, sessionId);
};

export const rotateSession = async (userId, sessionId, refreshToken) => {
  await updateRefreshToken(userId, sessionId, refreshToken);
};
