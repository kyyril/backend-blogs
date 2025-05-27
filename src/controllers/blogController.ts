import { Request, Response } from "express";
import slugify from "slugify";
import { prisma } from "../index";
import { AuthRequest } from "../types";
import { handleCategories, handleTags } from "../utils/blogHelpers";

/**
 * Create a new blog post
 */
export const createBlog = async (req: AuthRequest, res: Response) => {
  try {
    // Parse categories and tags from string or array
    const parseArrayField = (field: any) => {
      if (typeof field === "string") {
        try {
          // Try parsing as JSON first
          return JSON.parse(field);
        } catch (error) {
          // If not JSON, split comma-separated string
          return field.split(",").map((item) => item.trim());
        }
      }
      return Array.isArray(field) ? field : [];
    };

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
    if (categories && Array.isArray(categories)) {
      await handleCategories(blog.id, categories);
    }

    // Handle tags
    if (tags && Array.isArray(tags)) {
      await handleTags(blog.id, tags);
    }

    // Fetch the complete blog with relations
    const completeBlog = await prisma.blog.findUnique({
      where: { id: blog.id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            bio: true,
            avatar: true,
          },
        },
        categories: {
          include: {
            category: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    // Format the response
    const formattedBlog = {
      ...completeBlog,
      categories: completeBlog?.categories.map((c) => c.category.name) || [],
      tags: completeBlog?.tags.map((t) => t.tag.name) || [],
    };

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
 * Get all blogs with pagination
 */
export const getAllBlogs = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalCount = await prisma.blog.count();

    // Fetch blogs with pagination
    const blogs = await prisma.blog.findMany({
      skip,
      take: limit,
      orderBy: {
        date: "desc",
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            bio: true,
            avatar: true,
          },
        },
        categories: {
          include: {
            category: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    // Format the response
    const formattedBlogs = blogs.map((blog) => ({
      ...blog,
      categories: blog.categories.map((c) => c.category.name),
      tags: blog.tags.map((t) => t.tag.name),
    }));

    return res.status(200).json({
      blogs: formattedBlogs,
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.error("Get all blogs error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get a blog by slug
 */
export const getBlogBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    // Find the blog
    const blog = await prisma.blog.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            bio: true,
            avatar: true,
          },
        },
        categories: {
          include: {
            category: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Format the response
    const formattedBlog = {
      ...blog,
      categories: blog.categories.map((c) => c.category.name),
      tags: blog.tags.map((t) => t.tag.name),
    };

    return res.status(200).json(formattedBlog);
  } catch (error) {
    console.error("Get blog by slug error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Search blogs
 */
export const searchBlogs = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const searchString = String(query);

    // Count total results
    const totalCount = await prisma.blog.count({
      where: {
        OR: [
          { title: { contains: searchString, mode: "insensitive" } },
          { description: { contains: searchString, mode: "insensitive" } },
          { content: { contains: searchString, mode: "insensitive" } },
        ],
      },
    });

    // Search blogs
    const blogs = await prisma.blog.findMany({
      where: {
        OR: [
          { title: { contains: searchString, mode: "insensitive" } },
          { description: { contains: searchString, mode: "insensitive" } },
          { content: { contains: searchString, mode: "insensitive" } },
        ],
      },
      skip,
      take: limit,
      orderBy: {
        date: "desc",
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            bio: true,
            avatar: true,
          },
        },
        categories: {
          include: {
            category: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    // Format the response
    const formattedBlogs = blogs.map((blog) => ({
      ...blog,
      categories: blog.categories.map((c) => c.category.name),
      tags: blog.tags.map((t) => t.tag.name),
    }));

    return res.status(200).json({
      blogs: formattedBlogs,
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.error("Search blogs error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get blogs by category
 */
export const getBlogsByCategory = async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!category) {
      return res.status(400).json({ message: "Category name is required" });
    }

    // Find the category
    const categoryEntity = await prisma.category.findFirst({
      where: { name: { equals: category, mode: "insensitive" } },
    });

    if (!categoryEntity) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Count total blogs in this category
    const totalCount = await prisma.blog.count({
      where: {
        categories: {
          some: {
            categoryId: categoryEntity.id,
          },
        },
      },
    });

    // Get blogs by category
    const blogs = await prisma.blog.findMany({
      where: {
        categories: {
          some: {
            categoryId: categoryEntity.id,
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        date: "desc",
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            bio: true,
            avatar: true,
          },
        },
        categories: {
          include: {
            category: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    // Format the response
    const formattedBlogs = blogs.map((blog) => ({
      ...blog,
      categories: blog.categories.map((c) => c.category.name),
      tags: blog.tags.map((t) => t.tag.name),
    }));

    return res.status(200).json({
      category: categoryEntity.name,
      blogs: formattedBlogs,
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.error("Get blogs by category error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateBlog = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const {
      title,
      description,
      content,
      categories,
      tags,
      readingTime,
      featured = false,
    } = req.body;

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

    // Get the image URL from the upload middleware or keep existing
    const imageUrl = req.file?.path || req.body.image || blog.image;

    // Update the blog
    const updatedBlog = await prisma.blog.update({
      where: { id },
      data: {
        title,
        description,
        content,
        image: imageUrl,
        readingTime: Number(readingTime),
        featured: Boolean(featured),
      },
    });

    // Update categories if provided
    if (categories && Array.isArray(categories)) {
      // Remove existing categories
      await prisma.categoryOnBlog.deleteMany({
        where: { blogId: id },
      });
      await handleCategories(id, categories);
    }

    // Update tags if provided
    if (tags && Array.isArray(tags)) {
      // Remove existing tags
      await prisma.tagOnBlog.deleteMany({
        where: { blogId: id },
      });
      await handleTags(id, tags);
    }

    // Fetch updated blog with relations
    const completeBlog = await prisma.blog.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            bio: true,
            avatar: true,
          },
        },
        categories: {
          include: {
            category: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return res.status(200).json({
      message: "Blog updated successfully",
      blog: completeBlog,
    });
  } catch (error) {
    console.error("Update blog error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

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

    // Delete blog and all related records
    await prisma.$transaction([
      prisma.categoryOnBlog.deleteMany({ where: { blogId: id } }),
      prisma.tagOnBlog.deleteMany({ where: { blogId: id } }),
      prisma.comment.deleteMany({ where: { blogId: id } }),
      prisma.blogView.deleteMany({ where: { blogId: id } }),
      prisma.blog.delete({ where: { id } }),
    ]);

    return res.status(200).json({ message: "Blog deleted successfully" });
  } catch (error) {
    console.error("Delete blog error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const recordBlogView = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // Record view
    await prisma.blogView.create({
      data: {
        blogId: id,
        userId,
      },
    });

    // Increment view count
    await prisma.blog.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return res.status(200).json({ message: "View recorded" });
  } catch (error) {
    console.error("Record blog view error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
