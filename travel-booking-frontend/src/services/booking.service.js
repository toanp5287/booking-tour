import api from "./api";

const bookingService = {
  // COD
  createBooking(data) {
    return api.post("/booking", data);
  },

  // VNPAY
  createPaymentHold(data) {
    return api.post("/booking/hold", data);
  },

  latestBookings(tourId) {
    return api.get(`/booking/tour/${tourId}/latest-bookings`);
  },

  getAll() {
    return api.get("/booking/all");
  },

  getDetail(id) {
    return api.get(`/booking/${id}`);
  },
  bookingUser() {
    return api.get(`/booking/myBooking`);
  },
  duyetDon(id, data) {
    return api.patch(`/booking/${id}/duyet`, data);
  },
  refund_pending(idBooking) {
    return api.patch(`/booking/${idBooking}/refund_pending`);
  },
};

export default bookingService;
