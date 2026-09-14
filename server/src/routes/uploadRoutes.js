import express from "express";
import { upload } from "../config/cloudinary.js";
import cloudinary from "../config/cloudinary.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Helper: Upload a buffered file to Cloudinary and return { url, public_id }
const uploadStream = (fileBuffer, folder = "cospay_listings") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (result) {
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
          });
        } else {
          reject(error);
        }
      }
    );
    stream.end(fileBuffer);
  });
};

// @desc    Upload multiple listing images
// @route   POST /api/upload
// @access  Private
router.post("/", protect, upload.array("images", 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No image files provided." });
    }

    const uploadedImages = await Promise.all(
      req.files.map((file) => uploadStream(file.buffer))
    );

    // Returns array of objects: [{ url, public_id }, ...]
    res.status(200).json({ images: uploadedImages });
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    res.status(500).json({ message: error.message || "Image upload failed." });
  }
});

// @desc    Delete an image from Cloudinary
// @route   DELETE /api/upload
// @access  Private
router.delete("/", protect, async (req, res) => {
  try {
    const { public_id } = req.body;

    if (!public_id) {
      return res.status(400).json({ message: "public_id is required to delete an image." });
    }

    // Destroy the image on Cloudinary
    const result = await cloudinary.uploader.destroy(public_id);

    if (result.result !== "ok" && result.result !== "not found") {
      return res.status(400).json({ message: "Cloudinary deletion failed.", result });
    }

    res.status(200).json({ message: "Image removed from Cloudinary successfully." });
  } catch (error) {
    console.error("Cloudinary Delete Error:", error);
    res.status(500).json({ message: error.message || "Failed to delete image." });
  }
});

export default router;