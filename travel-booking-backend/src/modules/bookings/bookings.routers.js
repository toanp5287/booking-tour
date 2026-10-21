import express from "express";

import { verifyToken } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/permission.middleware.js";
import { requireBookingManage } from "./bookings.middleware.js";
import {
  createBooking,
  getBookingCustomer,
  getBookingAdmin,
  getDetailBooking,
  duyetDon,
  getLatestBookingsByTour,
  getAll,
  createPaymentHold,
  vnpayReturn,
  myBooking,
  refund_pending,
  cancelBookingCustomer,
  thanhToanHet,
} from "./bookings.controller.js";

const router = express.Router();

router.get("/all", verifyToken, requireBookingManage, getAll);
router.post("/", verifyToken, authorize("booking:create"), createBooking);
router.post("/hold", verifyToken, createPaymentHold);
router.get("/vnpay-return", vnpayReturn);
router.get(
  "/bookingUser",
  verifyToken,
  authorize("booking:view"),
  getBookingCustomer,
);
router.get("/myBooking", verifyToken, authorize("booking:view"), myBooking);
router.get(
  "/tour/:tour_id/latest-bookings",
  verifyToken,
  getLatestBookingsByTour,
);
router.get("/:id", verifyToken, requireBookingManage, getDetailBooking);

router.get("/", verifyToken, requireBookingManage, getBookingAdmin);
router.patch("/:id/duyet", verifyToken, requireBookingManage, duyetDon);

router.patch("/:id/cancel", verifyToken, cancelBookingCustomer);
router.patch("/:id/refund_pending", verifyToken, refund_pending);
router.post("/:id/pay-full", verifyToken, thanhToanHet);
// router.patch("/:id/hoanTien", verifyToken, hoanTien);
export default router;
