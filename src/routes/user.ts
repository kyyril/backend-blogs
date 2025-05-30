import express from "express";
import {
  getUserProfile,
  followUser,
  unfollowUser,
  getFollowStatus,
} from "../controllers/userController";
import { authenticate } from "../middleware/auth";

const router = express.Router();

router.get("/:userId", getUserProfile);
router.post("/:userId/follow", authenticate, followUser);
router.delete("/:userId/unfollow", authenticate, unfollowUser);
router.get("/:userId/follow-status", authenticate, getFollowStatus);

export default router;
