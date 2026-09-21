import {
  createDestination,
  updateDestination,
  getAllDestination,
  getOne,
  softDestination,
  restoreDestination,
  hardDeleteDestination,
  createTourDestinations,
  getAllDestiations,
  updateTourDestination,
  getDetail,
  xoaMem,
  khoiPhuc,
  xoaCung,
  createTourItinerary,
  getAllTourItineraries,
  getTourItineraryDetail,
  updateTourItinerary,
  deleteTourItinerary,
  restoreTourItinerary,
  hardDeleteTourItinerary,
  createItineraryActivities,
  getActivities,
  updateItineraryActivitie,
  reorder,
  destinationDetail,
  deleteSoftAtvici,
} from "./destinations.controller.js";
import express from "express";

import { verifyToken } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/permission.middleware.js";
import { validate } from "../../middlewares/error.middleware.js";

import { upload } from "../../middlewares/upload.middleware.js";

import {
  createDestinationSchema,
  updateDestinationSchema,
} from "./destinations.validation.js";
const router = express.Router();
router.post(
  "/",
  verifyToken,
  authorize("destination:create"),
  upload("destination/images").single("image"),
  validate(createDestinationSchema),
  createDestination,
);

router.patch(
  "/:id",
  verifyToken,
  authorize("destination:update"),
  upload("destination/images").single("image"),
  validate(updateDestinationSchema),
  updateDestination,
);
router.get("/all", getAllDestination);
router.get("/:id", getOne);
router.get("/:id/detail", destinationDetail);
router.delete(
  "/:id",
  verifyToken,
  authorize("destination:delete"),
  softDestination,
); // xoa mem

router.delete(
  "/:id/hardDeleteDestination",
  verifyToken,
  authorize("destination:delete"),
  hardDeleteDestination,
);

router.patch(
  "/:id/restore",
  verifyToken,
  authorize("destination:update"),
  restoreDestination,
);

router.post(
  "/tour-destinations",
  verifyToken,
  authorize("destination:create"),
  createTourDestinations,
);
router.get("/:id/getAlltour-destinations", getAllDestiations); // lay toan bo diemden cua 1 tour
router.patch(
  "/:id/tour-destinations",
  verifyToken,
  authorize("destination:update"),
  updateTourDestination,
);
router.get("/:id/getDetail", getDetail);
router.patch(
  "/:id/restore",
  verifyToken,
  authorize("destination:update"),
  khoiPhuc,
);

// Xóa cứng
router.delete(
  "/:id/hard-delete",
  verifyToken,
  authorize("destination:delete"),
  xoaMem,
);
router.delete("/:id", verifyToken, authorize("destination:delete"), xoaCung);

/// tour-itineraries

router.post(
  "/tour-itineraries",
  verifyToken,
  authorize("destination:create"),
  createTourItinerary,
);
router.get("/:id/tour-itineraries", getAllTourItineraries);
router.get("/:id/tour-itineraries-detail", getTourItineraryDetail);

router.patch(
  "/:id/tour-itineraries-update",
  verifyToken,
  authorize("destination:update"),
  updateTourItinerary,
);
router.delete(
  "/:id/tour-itineraries-delete",
  verifyToken,
  authorize("destination:update"),
  deleteSoftAtvici,
);

//hoat dong trong lich trinh

router.post(
  "/itinerary-activities",
  verifyToken,
  authorize("destination:create"),
  createItineraryActivities,
);
router.get("/:id/getActivities", getActivities);
router.patch(
  "/:id/updateItineraryActivitie",
  verifyToken,
  authorize("destination:update"),
  updateItineraryActivitie,
);
router.patch(
  "/:id/itinerary-activities/reorder",
  verifyToken,
  authorize("destination:update"),
  reorder,
);
export default router;
