import { Response } from "express";
import slugify from "slugify";
import { prisma } from "../index";
import { AuthRequest } from "../types";
import {
  handleCategories,
  handleTags,
  formatBlogData,
  getBlogIncludeOptions,
  parseArrayField,
} from "../utils/blogHelpers";

/**
 * MUTATION CONTROLLERS
 * These controllers handle data modification operations (Create, Update, Delete)
 */

/**
 * Create a new blog post
 */
export const createBlog = async (req: AuthRequest, res: Response) => {
  try {
    // Parse categories and tags from string or array
    const categories = parseArrayField(req.body.categories);
    const tags = parseArrayField(req.body.tags);

    const {
      title,
      description,
      content,
      readingTime,
      featured = false,
    } = req.body;

    // Generate a slug from the title
    const slug = slugify(title, { lower: true, strict: true });

    // Check if slug already exists
    const existingBlog = await prisma.blog.findUnique({
      where: { slug },
    });

    if (existingBlog) {
      return res
        .status(400)
        .json({ message: "A blog with this title already exists" });
    }

    // Get the image URL from the upload middleware
    const imageUrl = req.file?.path || req.body.image;

    if (!imageUrl) {
      return res.status(400).json({ message: "Blog image is required" });
    }

    // Get the authenticated user ID
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Create the blog post
    const blog = await prisma.blog.create({
      data: {
        title,
        slug,
        description,
        content,
        image: imageUrl,
        date: new Date(),
        readingTime: Number(readingTime),
        featured: Boolean(featured),
        authorId: userId,
      },
    });

    // Handle categories
    if (categories && Array.isArray(categories) && categories.length > 0) {
      await handleCategories(blog.id, categories);
    }

    // Handle tags
    if (tags && Array.isArray(tags) && tags.length > 0) {
      await handleTags(blog.id, tags);
    }

    // Fetch the complete blog with relations
    const completeBlog = await prisma.blog.findUnique({
      where: { id: blog.id },
      include: getBlogIncludeOptions(),
    });

    // Format the response
    const formattedBlog = await formatBlogData(completeBlog, userId);

    return res.status(201).json({
      message: "Blog created successfully",
      blog: formattedBlog,
    });
  } catch (error) {
    console.error("Create blog error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Update an existing blog post
 */
export const updateBlog = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // Check if blog exists and belongs to user
    const blog = await prisma.blog.findFirst({
      where: {
        id,
        authorId: userId,
      },
    });

    if (!blog) {
      return res
        .status(404)
        .json({ message: "Blog not found or unauthorized" });
    }

    // Parse categories and tags only if they are provided
    let categories, tags;

    if (req.body.categories !== undefined) {
      categories = parseArrayField(req.body.categories);
    }

    if (req.body.tags !== undefined) {
      tags = parseArrayField(req.body.tags);
    }

    // Prepare update data with only provided fields
    const updateData: any = {};

    // Only include fields that are explicitly provided (including empty values)
    if (req.body.title !== undefined) {
      updateData.title = req.body.title;
      // Update slug if title changes
      updateData.slug = slugify(req.body.title, { lower: true, strict: true });
    }
    if (req.body.description !== undefined)
      updateData.description = req.body.description;
    if (req.body.content !== undefined) updateData.content = req.body.content;
    if (req.body.readingTime !== undefined)
      updateData.readingTime = Number(req.body.readingTime);
    if (req.body.featured !== undefined)
      updateData.featured = Boolean(req.body.featured);

    // Handle image update
    if (req.file?.path) {
      updateData.image = req.file.path;
    } else if (req.body.image !== undefined) {
      updateData.image = req.body.image;
    }

    // Check for slug conflicts if title is being updated
    if (updateData.slug && updateData.slug !== blog.slug) {
      const slugConflict = await prisma.blog.findFirst({
        where: {
          slug: updateData.slug,
          id: { not: id },
        },
      });

      if (slugConflict) {
        return res.status(400).json({
          message: "A blog with this title already exists",
        });
      }
    }

    // Update the blog with provided fields
    await prisma.blog.update({
      where: { id },
      data: updateData,
    });

    // Update categories only if provided
    if (categories !== undefined) {
      await prisma.categoryOnBlog.deleteMany({
        where: { blogId: id },
      });
      if (categories.length > 0) {
        await handleCategories(id, categories);
      }
    }

    // Update tags only if provided
    if (tags !== undefined) {
      await prisma.tagOnBlog.deleteMany({
        where: { blogId: id },
      });
      if (tags.length > 0) {
        await handleTags(id, tags);
      }
    }

    // Fetch updated blog with relations
    const completeBlog = await prisma.blog.findUnique({
      where: { id },
      include: getBlogIncludeOptions(),
    });

    // Format the response
    const formattedBlog = await formatBlogData(completeBlog, userId);

    return res.status(200).json({
      message: "Blog updated successfully",
      blog: formattedBlog,
    });
  } catch (error) {
    console.error("Update blog error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Delete a blog post
 */
export const deleteBlog = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // Check if blog exists and belongs to user
    const blog = await prisma.blog.findFirst({
      where: {
        id,
        authorId: userId,
      },
    });

    if (!blog) {
      return res
        .status(404)
        .json({ message: "Blog not found or unauthorized" });
    }

    // Delete blog and all related records using transaction for data integrity
    await prisma.$transaction([
      prisma.categoryOnBlog.deleteMany({ where: { blogId: id } }),
      prisma.tagOnBlog.deleteMany({ where: { blogId: id } }),
      prisma.comment.deleteMany({ where: { blogId: id } }),
      prisma.blogView.deleteMany({ where: { blogId: id } }),
      prisma.blogLike.deleteMany({ where: { blogId: id } }),
      prisma.blogBookmark.deleteMany({ where: { blogId: id } }),
      prisma.blog.delete({ where: { id } }),
    ]);

    return res.status(200).json({
      message: "Blog deleted successfully",
      deletedBlogId: id,
    });
  } catch (error) {
    console.error("Delete blog error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Record a blog view
 */
export const recordBlogView = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // Check if blog exists
    const blog = await prisma.blog.findUnique({
      where: { id },
    });

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Check if user already viewed this blog (prevent duplicate views)
    const existingView = await prisma.blogView.findFirst({
      where: {
        blogId: id,
        userId,
      },
    });

    if (existingView) {
      return res.status(200).json({
        message: "View already recorded",
        viewCount: await prisma.blogView.count({ where: { blogId: id } }),
      });
    }

    // Record view
    await prisma.blogView.create({
      data: {
        blogId: id,
        userId,
      },
    });

    // Get updated view count
    const viewCount = await prisma.blogView.count({
      where: { blogId: id },
    });

    return res.status(200).json({
      message: "View recorded",
      viewCount,
    });
  } catch (error) {
    console.error("Record blog view error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Like/Unlike a blog
 */
export const toggleBlogLike = async (req: AuthRequest, res: Response) => {
  try {
    const { id: blogId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // Check if blog exists
    const blog = await prisma.blog.findUnique({
      where: { id: blogId },
    });

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Check if user already liked the blog
    const existingLike = await prisma.blogLike.findFirst({
      where: {
        blogId,
        userId,
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.blogLike.delete({
        where: {
          id: existingLike.id,
        },
      });

      // Get updated like count
      const likeCount = await prisma.blogLike.count({
        where: { blogId },
      });

      return res.status(200).json({
        message: "Blog unliked successfully",
        liked: false,
        likeCount,
      });
    }

    // Like
    await prisma.blogLike.create({
      data: {
        id: `${blogId}-${userId}`, // Create a composite ID
        blogId,
        userId,
      },
    });

    // Get updated like count
    const likeCount = await prisma.blogLike.count({
      where: { blogId },
    });

    return res.status(200).json({
      message: "Blog liked successfully",
      liked: true,
      likeCount,
    });
  } catch (error) {
    console.error("Toggle blog like error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Bookmark/Unbookmark a blog
 */
export const toggleBlogBookmark = async (req: AuthRequest, res: Response) => {
  try {
    const { id: blogId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // Check if blog exists
    const blog = await prisma.blog.findUnique({
      where: { id: blogId },
    });

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Check if user already bookmarked the blog
    const existingBookmark = await prisma.blogBookmark.findFirst({
      where: {
        blogId,
        userId,
      },
    });

    if (existingBookmark) {
      // Remove bookmark
      await prisma.blogBookmark.delete({
        where: {
          id: existingBookmark.id,
        },
      });

      // Get updated bookmark count
      const bookmarkCount = await prisma.blogBookmark.count({
        where: { blogId },
      });

      return res.status(200).json({
        message: "Blog bookmark removed successfully",
        bookmarked: false,
        bookmarkCount,
      });
    }

    // Add bookmark
    await prisma.blogBookmark.create({
      data: {
        id: `${blogId}-${userId}`, // Create a composite ID
        blogId,
        userId,
      },
    });

    // Get updated bookmark count
    const bookmarkCount = await prisma.blogBookmark.count({
      where: { blogId },
    });

    return res.status(200).json({
      message: "Blog bookmarked successfully",
      bookmarked: true,
      bookmarkCount,
    });
  } catch (error) {
    console.error("Toggle blog bookmark error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
