import express from "express";
import {
  getUserProfile,
  followUser,
  unfollowUser,
  getFollowStatus,
  updateUser,
} from "../controllers/userController";
import { authenticate } from "../middleware/auth";
import { uploadAvatar } from "../middleware/upload";

const router = express.Router();

router.get("/:userId", getUserProfile);
router.post("/:userId/follow", authenticate, followUser);
router.delete("/:userId/unfollow", authenticate, unfollowUser);
router.get("/:userId/follow-status", authenticate, getFollowStatus);
router.put("/profile", authenticate, uploadAvatar, updateUser);

export default router;
