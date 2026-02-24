import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  login: (token: string, user: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const checkAuth = async () => {
    const token = localStorage.getItem("fortress_token");
    if (!token) {
      if (location.pathname !== "/login" && !location.pathname.startsWith("/setup")) {
        // If no token and not on login/setup pages, redirect to login
        setIsAuthenticated(false);
        setIsLoading(false);
        navigate("/login"); 
      }
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setIsAuthenticated(true);
        setUser(userData);
      } else {
        // Token invalid or expired
        console.warn("Token validation failed, logging out.");
        logout();
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      // Don't auto-logout on network error immediately, maybe retry or just warn?
      // For now, if fetch fails completely (network down), we might want to keep the session alive locally
      // but maybe invalidating is safer if it's a 401. 
      // If it's network error, response is undefined.
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial check
    checkAuth();

    // Periodic check (every 10 seconds)
    const interval = setInterval(checkAuth, 10000);

    return () => clearInterval(interval);
  }, [navigate, location.pathname]);

  const login = (token: string, userData: any) => {
    localStorage.setItem("fortress_token", token);
    setIsAuthenticated(true);
    setUser(userData);
    navigate("/dashboard");
  };

  const logout = () => {
    localStorage.removeItem("fortress_token");
    setIsAuthenticated(false);
    setUser(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
