import express from "express";

import { verifyToken } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/permission.middleware.js";
import { validate } from "../../middlewares/error.middleware.js";
import {
  createCategory,
  updateCategory,
  getOneCategory,
  getAll,
  deleteCategory,
  restoreCategory,
  createTourController,
  getOneTour,
  getAllTour,
  updateTour,
  updateInactive,
  softDeleteTour,
  restoreTour,
  createTourImages,
  updateImgsTour,
  getAllImgSTour,
  deleteImgTour,
  createTourSchedules,
  getAllSchedules,
  updateSchedules,
  updateScheduleStatus,
  getDetailSchedule,
  softDeleteSchedule,
  restoreSchedule,
  getDeletedSchedules,
  getAllItineraries,
  getSchedulesByTour,
} from "./tours.controller.js";
import { upload } from "../../middlewares/upload.middleware.js";
import {
  createCategorySchema,
  createTourSchema,
  updateCategorySchema,
  updateTourSchema,
  createTourSchedulesSchema,
} from "./tours.validation.js";

const router = express.Router();

router.post(
  "/category",
  verifyToken,
  authorize("tour:create"),
  upload("tours/category").single("image"),
  validate(createCategorySchema),
  createCategory,
);
router.patch(
  "/category/:id/updateCatergory",
  verifyToken,
  authorize("tour:update"),
  upload("tours/category").single("image"),
  validate(updateCategorySchema),
  updateCategory,
);
router.get(
  "/category/:id",
  verifyToken,
  authorize("tour:view"),
  getOneCategory,
);
router.get("/category", getAll);
router.patch(
  "/category/:id/deleteCategory",
  verifyToken,
  authorize("tour:update"),
  deleteCategory,
); // xoa mem
router.patch(
  "/category/:id/restore",
  verifyToken,
  authorize("tour:update"),
  restoreCategory,
); // khoi phuc

// tour
router.post(
  "/createTour",
  verifyToken,
  authorize("tour:create"),
  upload("tours").fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "tour_images", maxCount: 10 },
  ]),
  validate(createTourSchema),
  createTourController,
);

router.get("/all", getAllTour);

router.get("/:id/getOneTour", getOneTour);
router.patch(
  "/:id/updateTour",
  verifyToken,
  authorize("tour:update"),
  upload("tours/thumbnail").single("thumbnail"),
  validate(updateTourSchema),
  updateTour,
);
router.patch(
  "/:id/updateActive",
  verifyToken,
  authorize("tour:update"),
  updateInactive,
);
router.delete(
  "/:id/softDelete",
  verifyToken,
  authorize("tour:delete"),
  softDeleteTour,
);
router.patch(
  "/:id/restoreTour",
  verifyToken,
  authorize("tour:update"),
  restoreTour,
);

// img tour
router.post(
  "/createImg",
  verifyToken,
  authorize("tour:create"),
  upload("tours/image-tour").array("image_url", 10),
  createTourImages,
);
router.patch(
  "/image/:id/update",
  verifyToken,
  authorize("tour:update"),
  upload("tours/image-tour").single("image_url"),
  updateImgsTour,
);
router.get("/:id/images", verifyToken, authorize("tour:view"), getAllImgSTour);
router.delete(
  "/:id/deleteImg",
  verifyToken,
  authorize("tour:delete"),
  deleteImgTour,
);

// tour_schedules --> lich trinh khoi hanh

router.post(
  "/createTourSchedules",
  verifyToken,
  authorize("tour:create"),
  validate(createTourSchedulesSchema),
  createTourSchedules,
);
router.get(
  "/:id/getAllSchedules",
  verifyToken,
  authorize("tour:view"),
  getAllSchedules,
);
router.patch(
  "/:id/updateSchedules",
  verifyToken,
  authorize("tour:update"),
  updateSchedules,
);
router.get("/:id/schedules", getSchedulesByTour);
router.patch(
  "/:id/updateScheduleStatus",
  verifyToken,
  authorize("tour:update"),
  updateScheduleStatus,
);
router.get("/:id/detailSchedule", getDetailSchedule);
router.delete(
  "/:id/softDeleteSchedule",
  verifyToken,
  authorize("tour:delete"),
  softDeleteSchedule,
);
router.patch(
  "/:id/restoreSchedule",
  verifyToken,
  authorize("tour:update"),
  restoreSchedule,
);
router.get(
  "/deletedSchedules",
  verifyToken,
  authorize("tour:view"),
  getDeletedSchedules,
);

router.get(
  "/:tourId/itinerary",
  verifyToken,
  authorize("tour:view"),
  getAllItineraries,
);
export default router;
