import express from "express";
import {
  getUserProfile,
  getUserProfileByUsername,
  followUser,
  unfollowUser,
  getFollowStatus,
  updateUser,
  getUserFollowers,
  getUserFollowing,
} from "../controllers/userController";
import { getUserBookmarks } from "../controllers/blogQueryController";
import { authenticate } from "../middleware/auth";
import { uploadAvatar } from "../middleware/upload";

const router = express.Router();

// Get user's bookmarked blogs - must be defined before /:userId routes to avoid path conflicts
router.get("/bookmarks", authenticate, getUserBookmarks);

// Get user profile by username - must be defined before /:userId to avoid conflicts
router.get("/username/:username", getUserProfileByUsername);

router.get("/:userId", getUserProfile);
router.post("/:userId/follow", authenticate, followUser);
router.delete("/:userId/unfollow", authenticate, unfollowUser);
router.get("/:userId/follow-status", authenticate, getFollowStatus);
router.get("/:userId/followers", getUserFollowers);
router.get("/:userId/following", getUserFollowing);
router.put("/profile", authenticate, uploadAvatar, updateUser);

export default router;
