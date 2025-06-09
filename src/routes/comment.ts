import express from "express";
import {
  createComment,
  getComments,
  updateComment,
  deleteComment,
} from "../controllers/commentController";
import { authenticate } from "../middleware/auth";

const router = express.Router();

router.post("/blogs/:blogId/comments", authenticate, createComment);
router.get("/blogs/:blogId/comments", getComments);
router.patch("/comments/:id", authenticate, updateComment);
router.delete("/comments/:id", authenticate, deleteComment);

export default router;
