import express from "express";
import {
  getAllUser,
  getOne,
  controllerCreateUser,
  deleteUser,
  softDeleteUser,
  restoreUser,
  updateUser,
  inactiveUser,
} from "./users.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/permission.middleware.js";
import { validateCreateUser } from "./users.validation.js";
import { validate } from "../../middlewares/error.middleware.js";
const router = express.Router();

router.get("/all", verifyToken, authorize("user:view"), getAllUser);

router.get("/:id", verifyToken, authorize("user:view"), getOne);
router.patch(
  "/:id/inactiveUser",
  verifyToken,
  authorize("user:update"),
  inactiveUser,
);
router.post(
  "/",
  verifyToken,
  authorize("user:create"),
  validate(validateCreateUser),
  controllerCreateUser,
);
router.delete(
  "/:id",
  verifyToken,
  authorize("user:delete"), // xoa mem
  softDeleteUser,
);

router.delete(
  "/:id/hard",
  verifyToken,
  authorize("user:delete"), // xoa cung
  deleteUser,
);

router.patch(
  "/:id/restore",
  verifyToken,
  authorize("user:update"), //  khoi phuc
  restoreUser,
);

router.patch("/:id/update", verifyToken, authorize("user:update"), updateUser);

export default router;
