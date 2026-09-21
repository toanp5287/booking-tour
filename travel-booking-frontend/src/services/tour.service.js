import api from "./api";

const tourService = {
  getAll() {
    return api.get("/tour/all");
  },

  getOne(id) {
    return api.get(`/tour/${id}/getOneTour`);
  },

  create(data) {
    return api.post("/tour/createTour", data);
  },

  update(id, data) {
    return api.patch(`/tour/${id}/updateTour`, data);
  },

  delete(id) {
    return api.delete(`/tour/${id}`);
  },
  detailSchedule(scheduleId) {
    return api.get(`tour/${scheduleId}/detailSchedule`);
  }, // lịch khởi hành
  getSchedulesByTour(idTour) {
    return api.get(`/tour/${idTour}/schedules`);
  },
  getTourItinerary(tourId) {
    return api.get(`/tour/${tourId}/itinerary`);
  },
};

export default tourService;
