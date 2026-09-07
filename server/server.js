import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./src/config/db.js";
import authRoutes from "./src/routes/authRoutes.js";
import listingRoutes from "./src/routes/listingRoutes.js";
import bookingRoutes from "./src/routes/bookingRoutes.js"; // 1. Import booking routes

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// --- DEBUG LOGGER ---
app.use((req, res, next) => {
  console.log(`📡 Incoming Request: [${req.method}] ${req.originalUrl}`);
  next();
});

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "CosPay API is healthy" });
});

// Route Mounts
app.use("/api/auth", authRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/bookings", bookingRoutes); // 2. Mount booking routes here

// Catch-all 404 handler (Must stay at the bottom)
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    attemptedMethod: req.method,
    attemptedUrl: req.originalUrl,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`CosPay server running on port ${PORT}`);
});