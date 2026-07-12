import "dotenv/config";
import { login } from "./modules/auth/auth.service.js";

const testFullLogin = async () => {
  try {
    const result = await login({
      email: "admin@gmail.com",
      password: "Password@123",
      role: "Admin"
    });
    console.log("Login Success:", result);
  } catch (err) {
    console.error("Login Failed:", err);
  } finally {
    process.exit(0);
  }
};

testFullLogin();
