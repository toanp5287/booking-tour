import api from "./api";

export const cattegoryService = {
  getAll() {
    return api.get("/tour/category");
  },
  getOne() {
    return api.get("/tour/category/:id");
  },
  create() {
    return api.post("/tour/category");
  },
  update() {
    return api.patch("tour/category/:id/updateCatergory");
  },
  deleteSofe() {
    return api.patch("tour/category/:id/deleteCategory");
  },
  restore() {
    return api.patch("tour/category/:id/restore");
  },
};

export default cattegoryService;
