import api from "./axios";

export const authApi = {
  register: (data: { full_name: string; email: string; password: string; role: string }) =>
    api.post("/auth/register", data),

  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),

  logout: (refresh_token: string) =>
    api.post("/auth/logout", { refresh_token }),

  refresh: (refresh_token: string) =>
    api.post("/auth/refresh", { refresh_token }),

  verifyEmail: (token: string) =>
    api.get(`/auth/verify-email/${token}`),

  forgotPassword: (email: string) =>
    api.post("/auth/forgot-password", { email }),

  resetPassword: (token: string, new_password: string) =>
    api.post("/auth/reset-password", { token, new_password }),

  getMe: () =>
    api.get("/auth/me"),
};
