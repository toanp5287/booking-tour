import api from "./api";

const paymentService = {
  // COD
  createBooking(data) {
    return api.post("/booking", data);
  },

  // VNPAY
  createPaymentHold(data) {
    return api.post("/booking/hold", data);
  },
  wallet() {
    return api.get("/payment/wallet");
  },
};

export default paymentService;
