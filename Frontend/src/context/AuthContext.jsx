import { createContext, useContext, useState, useEffect } from "react";
import { loginRequest } from "../services/authService.js";
import toast from "react-hot-toast";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(() => localStorage.getItem("transitopsToken") || "");
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("transitopsUser");
    return raw ? JSON.parse(raw) : null;
  });
  
  // Custom role simulation helper to easily test different dashboard roles (Fleet Manager, Dispatcher, Safety Officer, Financial Analyst)
  const [simulatedRole, setSimulatedRole] = useState(() => localStorage.getItem("transitopsSimulatedRole") || "");

  const activeRole = simulatedRole || user?.role_name || "";

  const login = async (email, password, role) => {
    try {
      // Map "Dispatcher" to "Driver" for backend validation if selected
      const backendRole = role === "Dispatcher" ? "Driver" : role;
      
      const response = await loginRequest({ email, password, role: backendRole });
      
      const token = response.accessToken;
      const userData = response.user;
      
      setAuthToken(token);
      setUser(userData);
      setSimulatedRole(""); // Reset simulated role on fresh login
      
      localStorage.setItem("transitopsToken", token);
      localStorage.setItem("transitopsUser", JSON.stringify(userData));
      localStorage.removeItem("transitopsSimulatedRole");
      
      toast.success("Successfully logged in!");
      return true;
    } catch (error) {
      toast.error(error.message || "Invalid credentials");
      return false;
    }
  };

  const logout = () => {
    setAuthToken("");
    setUser(null);
    setSimulatedRole("");
    localStorage.removeItem("transitopsToken");
    localStorage.removeItem("transitopsUser");
    localStorage.removeItem("transitopsSimulatedRole");
    toast.success("Logged out successfully");
  };

  const changeSimulatedRole = (role) => {
    setSimulatedRole(role);
    if (role) {
      localStorage.setItem("transitopsSimulatedRole", role);
      toast.success(`Switched view role to: ${role}`);
    } else {
      localStorage.removeItem("transitopsSimulatedRole");
      toast.success(`Reset view role to: ${user?.role_name}`);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        authToken,
        user,
        activeRole,
        login,
        logout,
        simulatedRole,
        changeSimulatedRole,
        isAuthenticated: !!authToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
