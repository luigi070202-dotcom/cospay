import express from "express";
import {
  createBookingRequest,
  getMyBookings,
  getBookingById, // <-- 1. Import
  updateBookingStatus,
} from "../controllers/bookingController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.route("/").post(createBookingRequest);
router.route("/my").get(getMyBookings);
router.route("/:id").get(getBookingById); // <-- 2. Mount
router.route("/:id/status").patch(updateBookingStatus);

export default router;