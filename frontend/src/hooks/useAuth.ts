import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/api/auth";
import { useNavigate } from "react-router-dom";
import { useCallback } from "react";

export function useAuth() {
  const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await authApi.login({ email, password });
      const { access_token, refresh_token, user: userData } = response.data;
      setAuth(userData, access_token, refresh_token);

      // Redirect based on role
      switch (userData.role) {
        case "ADMIN":
          navigate("/admin/dashboard");
          break;
        case "STAFF":
          navigate("/staff/dashboard");
          break;
        default:
          navigate("/student/dashboard");
      }
    },
    [setAuth, navigate]
  );

  const logout = useCallback(async () => {
    try {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch {
      // ignore logout API errors
    }
    clearAuth();
    navigate("/login");
  }, [clearAuth, navigate]);

  return { user, isAuthenticated, login, logout };
}
