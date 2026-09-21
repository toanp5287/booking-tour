import api from "./api";

const permissionsService = {
  getAll() {
    return api.get("/permissions/all");
  },
};

export default permissionsService;
