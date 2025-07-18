import { useRouter } from "next/router";
import { useAuth } from "@bundly/ares-react";
import { useState, useCallback } from "react";
import { clearAuthState } from "../utils/icpClient";

export const useLogout = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = useCallback(async () => {
    try {
      setIsLoggingOut(true);

      // Clear local authentication state
      clearAuthState();

      // Clear any local storage that might persist auth state
      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
      }

      // Force a hard redirect to clear any cached state
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      // Even if there's an error, force redirect
      window.location.href = "/";
    } finally {
      setIsLoggingOut(false);
    }
  }, []);

  return {
    logout,
    isLoggingOut,
  };
};
