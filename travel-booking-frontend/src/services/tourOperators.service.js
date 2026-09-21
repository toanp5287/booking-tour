import api from "./api";

const operatorsService = {
  getAll() {
    return api.get("/tourOperator/all");
  },
};

export default operatorsService;
