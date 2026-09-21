import express from "express";

import { verifyToken } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/permission.middleware.js";
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
} from "./bookings.controller.js";

const router = express.Router();

router.get("/all", verifyToken, authorize("booking:view"), getAll);
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
router.get("/:id", getDetailBooking);

router.get("/", verifyToken, authorize("booking:view"), getBookingAdmin);
router.patch("/:id/duyet", verifyToken, duyetDon);

router.patch("/:id/refund_pending", verifyToken, refund_pending);
// router.patch("/:id/hoanTien", verifyToken, hoanTien);
export default router;
