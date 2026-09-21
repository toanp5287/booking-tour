import express from "express";
import {
  getAllPermissions,
  getAll,
  controllerLogin,
  registerController,
  updaePassworld,
  getMe,
  googleAuth,
  googleCallback,
} from "./auth.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/permission.middleware.js";
import { roleMiddleware } from "../../middlewares/role.middleware.js";
import { upload } from "../../middlewares/upload.middleware.js";
import { validate } from "../../middlewares/error.middleware.js";
import {
  loginSchema,
  registerValidate,
  validateUpdatePassword,
} from "./auth.validation.js";
const router = express.Router();

router.get("/", getAll);
router.post("/login", validate(loginSchema), controllerLogin);
router.post("/register", validate(registerValidate), registerController);

router.patch(
  "/change-password",
  verifyToken,
  validate(validateUpdatePassword),
  updaePassworld,
);
router.get("/me", verifyToken, getMe);

router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);
export default router;
