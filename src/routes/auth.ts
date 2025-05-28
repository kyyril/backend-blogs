import express from "express";
import {
  googleAuth,
  logout,
  getMe,
  refreshToken,
} from "../controllers/authController";
import { authenticate } from "../middleware/auth";

const router = express.Router();

// Google authentication
router.post("/google", googleAuth);

// Logout endpoint
router.post("/logout", logout);
router.post("/refresh", refreshToken);
// Get current user (protected)
router.get("/me", authenticate, getMe);

export default router;
