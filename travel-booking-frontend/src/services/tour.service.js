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
  getTourPulic() {
    return api.get("/tour/pulic");
  },
  tourDoan(data) {
    return api.post("/tour/tour-doan", data);
  },
  getAllYeuCau() {
    return api.get("/tour/all-yeu-cau-tour");
  },
  phanHoi(data) {
    return api.post("/tour/phan-hoi", data);
  },
  getAllLichSuPhanHoi(requestId) {
    return api.get(`/tour/lich-su-phan-hoi/${requestId}`);
  },

  // =========================
  // BÁO GIÁ TOUR ĐOÀN (QUẢN TRỊ)
  // =========================
  createQuotation(data) {
    return api.post("/tour/bao-gia", data);
  },
  getQuotationsByRequest(requestId) {
    return api.get(`/tour/bao-gia/theo-yeu-cau/${requestId}`);
  },
  getQuotation(id) {
    return api.get(`/tour/bao-gia/${id}`);
  },
  updateQuotation(id, data) {
    return api.patch(`/tour/bao-gia/${id}`, data);
  },
  sendQuotation(id) {
    return api.post(`/tour/bao-gia/${id}/gui`);
  },

  // =========================
  // BÁO GIÁ TOUR ĐOÀN (KHÁCH HÀNG)
  // =========================
  getMyRequests() {
    return api.get("/tour/yeu-cau-cua-toi");
  },
  getMyQuotation(id) {
    return api.get(`/tour/bao-gia-cua-toi/${id}`);
  },
  respondQuotation(id, data) {
    return api.post(`/tour/bao-gia/${id}/phan-hoi`, data);
  },
};

export default tourService;
