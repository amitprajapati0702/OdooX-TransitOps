import "dotenv/config";
import { generateAccessToken, generateRefreshToken } from "./modules/auth/token.service.js";

const payload = {
  userId: "bbda66de-fccd-4267-b118-358b00cbd4a5",
  email: "admin@gmail.com",
  role: "Admin",
  sessionId: "test-session-id"
};

try {
  const accessToken = generateAccessToken(payload);
  console.log("Access Token:", typeof accessToken === 'string' ? accessToken.substring(0, 15) + "..." : typeof accessToken);
  
  const refreshToken = generateRefreshToken(payload);
  console.log("Refresh Token:", typeof refreshToken === 'string' ? refreshToken.substring(0, 15) + "..." : typeof refreshToken);
} catch (error) {
  console.error("Token Generation Error:", error.message);
}
