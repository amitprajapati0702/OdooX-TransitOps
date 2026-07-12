import { apiPost } from "./api.js";

export const loginRequest = async ({ email, password, role }) => {
  return apiPost("/auth/login", { email, password, role });
};