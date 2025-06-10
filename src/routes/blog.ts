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

// Slug route - keep at the end to avoid conflicts
router.get("/:slug", getBlogBySlug);

export default router;
