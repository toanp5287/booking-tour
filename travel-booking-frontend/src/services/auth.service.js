import api from "./api";

const authService = {
  // auth.service.js
  login(data) {
    return api.post("/auth/login", data);
  },
  register(data) {
    return api.post("/auth/register", data);
  },
  update(data) {
    return api.patch(`/tours/change-password`, data);
  },

  getMe() {
    return api.get("/auth/me");
  },
  userRole() {
    return api.get("/roles/user-role");
  },
  register(data) {
    return api.post("/auth/register", data);
  },
  changePassword(data) {
    return api.patch("/auth/change-password", data);
  },
};

export default authService;
