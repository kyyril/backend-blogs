import express from "express";
import {
  createBlog,
  getAllBlogs,
  getBlogBySlug,
  searchBlogs,
  getBlogsByCategory,
  updateBlog,
  deleteBlog,
  recordBlogView,
  getBlogById,
  toggleBlogLike,
  toggleBlogBookmark,
  getBlogInteractionStatus,
} from "../controllers/blogController";
import { authenticate } from "../middleware/auth";
import { validateBlogCreation } from "../middleware/validate";
import { uploadBlogImage } from "../middleware/upload";

const router = express.Router();

// Collection routes
router.post(
  "/",
  authenticate,
  uploadBlogImage,
  validateBlogCreation,
  createBlog
);
router.get("/", getAllBlogs);
router.get("/search", searchBlogs);
router.get("/category/:category", getBlogsByCategory);

// Document routes
router.get("/blog/:id", getBlogById);
router.put(
  "/blog/:id",
  authenticate,
  uploadBlogImage,
  validateBlogCreation,
  updateBlog
);
router.delete("/blog/:id", authenticate, deleteBlog);
router.post("/blog/:id/view", authenticate, recordBlogView);

// Interaction routes
router.post("/blog/:id/like", authenticate, toggleBlogLike);
router.post("/blog/:id/bookmark", authenticate, toggleBlogBookmark);
router.get("/blog/:id/interaction", authenticate, getBlogInteractionStatus);

// Slug route - keep at the end to avoid conflicts
router.get("/:slug", getBlogBySlug);

export default router;
