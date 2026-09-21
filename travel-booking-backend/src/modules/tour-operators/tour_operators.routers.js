import {
  tourOperator,
  getPendingOperators,
  duyetOperator,
  getAllOperators,
} from "./tour_operators.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/permission.middleware.js";
import express from "express";
const router = express.Router();
router.post("/", verifyToken, tourOperator);
router.get(
  "/pending",
  verifyToken,
  authorize("role:view"),
  getPendingOperators,
); // xem cac don yeu cau lam cung cap tour

router.patch("/:id", verifyToken, authorize("role:update"), duyetOperator); // duet don yeu cau hoac tu choi

router.get("/all", verifyToken, authorize("role:view"), getAllOperators);
export default router;
