import axios from "axios";

const api = axios.create({
  baseURL: "/api/v1",
  headers: { "Content-Type": "application/json" },
});

// Request interceptor — attach access token
api.interceptors.request.use(
  (config) => {
    const stored = localStorage.getItem("ccms-auth");
    if (stored) {
      try {
        const { state } = JSON.parse(stored);
        if (state?.accessToken) {
          config.headers.Authorization = `Bearer ${state.accessToken}`;
        }
      } catch {
        // ignore parse errors
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 / refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const stored = localStorage.getItem("ccms-auth");
        if (stored) {
          const { state } = JSON.parse(stored);
          if (state?.refreshToken) {
            const response = await axios.post("/api/v1/auth/refresh", {
              refresh_token: state.refreshToken,
            });
            const newToken = response.data.access_token;

            // Update store
            const newState = { ...state, accessToken: newToken };
            localStorage.setItem(
              "ccms-auth",
              JSON.stringify({ state: newState })
            );

            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          }
        }
      } catch {
        // Refresh failed — logout
        localStorage.removeItem("ccms-auth");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
