import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080",
  // BỎ HOÀN TOÀN headers ở đây, để Axios tự động nhận diện data gửi lên
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default api;
