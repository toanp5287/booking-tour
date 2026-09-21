import express from "express";

import { verifyToken } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/permission.middleware.js";

import { getPaymentByBooking, getWalletUser } from "./payments.controller.js";

const router = express.Router();

// ==========================================
// LẤY PAYMENT THEO BOOKING
// ==========================================
router.get(
  "/booking/:booking_id",
  verifyToken,
  authorize("payment:view"),
  getPaymentByBooking,
);
router.get("/wallet", verifyToken, getWalletUser);
export default router;
