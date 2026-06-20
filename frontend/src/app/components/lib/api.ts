import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api", // آدرس پایه جنگو
});

// ۱. قبل از هر درخواست: توکن را از LocalStorage بگیر و به هدر اضافه کن
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ۲. بعد از پاسخ: اگر خطای 401 (انقضا) گرفتیم، تلاش کن توکن را رفرش کنی
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // اگر خطا 401 بود و قبلاً یک بار تلاش نکرده بودیم (برای جلوگیری از لوپ)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");

        // درخواست به جنگو برای گرفتن توکن جدید
        // این URL باید با ساختار SimpleJWT جنگو ست باشد
        const res = await axios.post(
          "http://127.0.0.1:8000/api/token/refresh/",
          {
            refresh: refreshToken,
          },
        );

        if (res.status === 200) {
          const newAccessToken = res.data.access;

          // ذخیره توکن جدید
          localStorage.setItem("access_token", newAccessToken);

          // آپدیت هدر درخواست فعلی و ارسال مجدد آن
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // اگر رفرش توکن هم اکسپایر شده بود، کاربر را به لاگین بفرست
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

export default api;
