import express from "express";
import { registerUser, loginUser } from "../controllers/authController.js";

const router = express.Router();

// Public routes for user creation and authentication
router.post("/register", registerUser);
router.post("/login", loginUser);

export default router;