import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet"; // 1. Import helmet
import rateLimit from "express-rate-limit"; // 2. Import rateLimit
import { connectDB } from "./src/config/db.js";
import authRoutes from "./src/routes/authRoutes.js";
import listingRoutes from "./src/routes/listingRoutes.js";
import bookingRoutes from "./src/routes/bookingRoutes.js";

dotenv.config();
connectDB();

const app = express();

// Set defensive HTTP headers & hide the 'X-Powered-By: Express' signature
app.use(helmet());

// Restrict CORS to your local frontend client
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

// Prevent credential brute-forcing (max 20 attempts per 15 minutes per IP)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please try again after 15 minutes." },
});

// Routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/bookings", bookingRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "CosPay API is running" });
});

// 404 Fallback
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