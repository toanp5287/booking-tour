import api from "./api";

const rolesService = {
  getAll() {
    return api.get("/roles/all");
  },
  viewPermissionsRole() {
    return api.get("/roles/role_permission");
  },
  permissions(data) {
    // cập nhật phân quyền
    return api.patch("/roles/permissions", data);
  },
};

export default rolesService;
