import api from "./api";

const userService = {
  getAll() {
    return api.get("/user/all");
  },
  getDetail(id) {
    return api.get(`/user/${id}`);
  },
  inactiveUser(id) {
    return api.patch(`/user/${id}/inactiveUser`);
  },
};

export default userService;
