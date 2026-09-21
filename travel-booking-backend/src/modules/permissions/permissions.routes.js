import express from "express";
import { verifyToken } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/permission.middleware.js"
import { validate } from "../../middlewares/error.middleware.js";
import { getAllPermissions, getOne, ControllerCreatePermission, softDeletePermission, restorePermission, updatePermission } from "./permissions.controller.js";
import { validateCreatePermission } from "./permissions.validation.js";
const router = express.Router();
router.get("/all", verifyToken, authorize("permission:view"), getAllPermissions);
router.get("/:id", verifyToken, authorize("permission:view"), getOne);
router.post("/", verifyToken, authorize("permission:create"), validate(validateCreatePermission), ControllerCreatePermission);
router.patch("/:id", verifyToken, authorize("permission:update"), softDeletePermission);
router.patch("/:id/restore", verifyToken, authorize("permission:update"), restorePermission);
router.patch("/:id/update", verifyToken, authorize("permission:update"), updatePermission)
export default router;