import express from "express";
import {
  createBookingRequest,
  getMyBookings,
  updateBookingStatus,
} from "../controllers/bookingController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.route("/").post(createBookingRequest);
router.route("/my").get(getMyBookings);
router.route("/:id/status").patch(updateBookingStatus);

export default router;