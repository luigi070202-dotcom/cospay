import express from "express";
import {
  createListing,
  getListings,
  getListingById,
  updateListing,
  deleteListing,
  toggleSizeAvailability, // <-- Import this function
} from "../controllers/listingController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.route("/")
  .get(getListings)
  .post(protect, createListing);

// Dedicated route for toggling specific sizes
router.patch("/:id/toggle-size-availability", protect, toggleSizeAvailability);

router.route("/:id")
  .get(getListingById)
  .put(protect, updateListing)
  .delete(protect, deleteListing);

export default router;