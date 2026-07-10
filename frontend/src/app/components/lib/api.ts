import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

const REFRESH_URL = `${API_BASE_URL}/accounts/refresh_token/`;

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const requestUrl = originalRequest?.url ?? "";

    const isLoginRequest =
      requestUrl.includes("/accounts/login/") ||
      requestUrl.includes("/login");

    const isRefreshRequest =
      requestUrl.includes("/accounts/refresh_token/");

    if (status === 401 && !originalRequest?._retry && !isLoginRequest && !isRefreshRequest) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");

        if (!refreshToken) {
          throw new Error("No refresh token found");
        }

        const res = await axios.post(REFRESH_URL, {
          refresh: refreshToken,
        });

        if (res.status === 200) {
          const newAccessToken = res.data.access;
          const newRefreshToken = res.data.refresh;

          localStorage.setItem("access_token", newAccessToken);

          if (newRefreshToken) {
            localStorage.setItem("refresh_token", newRefreshToken);
          }

          originalRequest.headers = originalRequest.headers ?? {};
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");

        const isLoginPage =
          typeof window !== "undefined" &&
          window.location.pathname === "/login";

        if (!isLoginPage) {
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
