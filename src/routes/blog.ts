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
import { uploadImage } from "../middleware/upload";

const router = express.Router();

router.post("/", authenticate, uploadImage, validateBlogCreation, createBlog);
router.get("/", getAllBlogs);
router.get("/search", searchBlogs);
router.get("/category/:category", getBlogsByCategory);
router.get("/:slug", getBlogBySlug);
router.get("/:id", getBlogById);
router.put("/:id", authenticate, uploadImage, validateBlogCreation, updateBlog);
router.delete("/:id", authenticate, deleteBlog);
router.post("/:id/view", authenticate, recordBlogView);

export default router;
