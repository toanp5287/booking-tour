import express from "express";

import { verifyToken } from "../../middlewares/auth.middleware.js";
import { optionalToken } from "../../middlewares/auth.optionalToken.js";
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
  getAllTourPublic,
  reqTourDoan,
  allYeuCauTourDoan,
  phanHoi,
  layRaLichSuPhanHoi
} from "./tours.controller.js";
import { upload } from "../../middlewares/upload.middleware.js";
import {
  createCategorySchema,
  createTourSchema,
  updateCategorySchema,
  updateTourSchema,
  createTourSchedulesSchema,
} from "./tours.validation.js";
import {
  createQuotation,
  getQuotationsByRequest,
  getQuotation,
  updateQuotation,
  sendQuotation,
  getMyGroupRequests,
  getMyQuotation,
  respondQuotation,
} from "./tourQuotations.controller.js";
import {
  createQuotationSchema,
  updateQuotationSchema,
  respondQuotationSchema,
} from "./tourQuotations.validation.js";

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

router.get("/all", optionalToken, getAllTour);
router.get("/pulic", getAllTourPublic);

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



router.post("/tour-doan", verifyToken, reqTourDoan);

router.post("/phan-hoi", verifyToken, authorize("tour:view"), phanHoi);
router.get("/all-yeu-cau-tour", verifyToken, authorize('tour:view'), allYeuCauTourDoan);
router.get(
  "/lich-su-phan-hoi/:request_id",
  verifyToken,
  authorize("tour:view"),
  layRaLichSuPhanHoi
);

// =================================================================
// BÁO GIÁ TOUR ĐOÀN
// =================================================================

// Khách hàng (kiểm tra chủ sở hữu trong controller)
router.get("/yeu-cau-cua-toi", verifyToken, getMyGroupRequests);
router.get("/bao-gia-cua-toi/:id", verifyToken, getMyQuotation);
router.post(
  "/bao-gia/:id/phan-hoi",
  verifyToken,
  validate(respondQuotationSchema),
  respondQuotation,
);

// Quản trị / nhân viên
router.post(
  "/bao-gia",
  verifyToken,
  validate(createQuotationSchema),
  authorize("tour:create"),
  createQuotation,
);
router.get(
  "/bao-gia/theo-yeu-cau/:request_id",
  verifyToken,
  authorize("tour:view"),
  getQuotationsByRequest,
);
router.get(
  "/bao-gia/:id",
  verifyToken,
  authorize("tour:view"),
  getQuotation,
);
router.patch(
  "/bao-gia/:id",
  verifyToken,
  validate(updateQuotationSchema),
  authorize("tour:update"),
  updateQuotation,
);
router.post(
  "/bao-gia/:id/gui",
  verifyToken,
  authorize("tour:update"),
  sendQuotation,
);

export default router;
