import express from "express";
import {
  createCommunity,
  toggleLike,
  createComment,
  deleteComment,
  getAllCommunity,
  getCommentPost,
} from "./community.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";
import { upload } from "../../middlewares/upload.middleware.js";
const router = express.Router();
router.get("/all", getAllCommunity);
router.get("/:id/getAllComment", getCommentPost);
router.post(
  "/",
  verifyToken,
  upload("community").single("image"),
  createCommunity,
);
router.patch(
  "/:id/like",

  verifyToken,
  toggleLike,
);
router.post("/comment", verifyToken, createComment);
router.delete("/:id/deleteComment", verifyToken, deleteComment);

export default router;
