import express from "express";
import { createReview, getAllReviewsTour } from "./tourReviews.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";
const router = express.Router();
router.post("/createReview", verifyToken, createReview);
router.get("/:idTour/all", getAllReviewsTour);
export default router;
