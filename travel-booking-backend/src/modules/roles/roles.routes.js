import express from "express";
import { verifyToken } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/permission.middleware.js";
import { validate } from "../../middlewares/error.middleware.js";
import {
  getAllRoles,
  getOne,
  ControllerCreateRole,
  softDeleteRole,
  restoreRole,
  updateRole,
  assignPermissionsController,
  viewPermissionsRole,
  getUserRole,
} from "./roles.controller.js";
import { validateRole } from "./roles.validation.js";
const router = express.Router();
router.get(
  "/role_permission",
  verifyToken,
  authorize("role:view"),
  viewPermissionsRole,
); // xem chi tuet quyen cua role
router.get("/all", verifyToken, authorize("role:view"), getAllRoles);
router.get("/user-role", verifyToken, getUserRole);
router.get("/:id", verifyToken, authorize("role:view"), getOne);
router.post(
  "/",
  verifyToken,
  authorize("role:create"),
  validate(validateRole),
  ControllerCreateRole,
);

router.patch(
  "/permissions",
  verifyToken,
  authorize("role:update"),
  assignPermissionsController,
); // gán quyền cho
router.patch("/:id", verifyToken, authorize("role:update"), softDeleteRole); // xoa meem -> an
router.patch(
  "/:id/restore",
  verifyToken,
  authorize("role:update"),
  restoreRole,
); // khoi phuc
router.patch("/:id/update", verifyToken, authorize("role:update"), updateRole);

export default router;
