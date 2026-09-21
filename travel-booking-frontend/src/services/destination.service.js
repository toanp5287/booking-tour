import api from "./api";
const destinationService = {
  getDetailActivities(id) {
    return api.get(`/destination/${id}/getActivities`);
  },
  getAll() {
    return api.get("/destination/all");
  },
  getOne(id) {
    return api.get(`/destination/${id}`);
  },
  getDetail(id) {
    return api.get(`/destination/${id}/detail`);
  },
  createDestination(data) {
    return api.post("/destination", data);
  },
  updateDestination(id, data) {
    return api.patch(`/destination/${id}`, data);
  },
  sofleDelete(id) {
    return api.delete(`/destination/${id}`);
  },
  getActivities(id) {
    return api.get(`/destination/${id}/getActivities`);
  },
  createActivities(data) {
    return api.post(`/destination/itinerary-activities`, data);
  },
  deleteActivities(id) {
    return api.delete(`/destination/${id}/tour-itineraries-delete`);
  },
};
export default destinationService;
