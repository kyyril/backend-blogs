import { Request, Response } from "express";
import { prisma } from "../index";
import { AuthRequest } from "../types";
import { formatBlogData, getBlogIncludeOptions } from "../utils/blogHelpers";

/**
 * QUERY CONTROLLERS
 * These controllers handle data retrieval operations
 */

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
      include: getBlogIncludeOptions(),
    });

    // Format the response - batch process for better performance
    const formattedBlogs = await Promise.all(
      blogs.map((blog) => formatBlogData(blog))
    );

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
      include: getBlogIncludeOptions(),
    });

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Format the response
    const formattedBlog = await formatBlogData(blog);

    return res.status(200).json(formattedBlog);
  } catch (error) {
    console.error("Get blog by slug error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get a blog by ID
 */
export const getBlogById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log("1. Incoming request for blog ID:", id);

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      console.log("2. Invalid UUID format");
      return res.status(400).json({
        message: "Invalid blog ID format - must be a valid UUID",
        providedId: id,
      });
    }

    // Use Prisma's findUnique with complete blog data
    const blog = await prisma.blog.findUnique({
      where: { id },
      include: getBlogIncludeOptions(),
    });

    console.log("3. Prisma query result:", blog ? "Found" : "Not found");

    if (!blog) {
      return res.status(404).json({
        message: "Blog not found",
        requestedId: id,
        tip: "Please verify that the blog ID exists in the database",
      });
    }

    // Format the response data
    const formattedBlog = await formatBlogData(blog);

    console.log("4. Successfully formatted blog data");
    return res.status(200).json(formattedBlog);
  } catch (error) {
    console.error("Error in getBlogById:", {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      params: req.params,
    });

    return res.status(500).json({
      message: "Internal server error while fetching blog",
      error: error instanceof Error ? error.message : "Unknown error",
      requestedId: req.params.id,
    });
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
      include: getBlogIncludeOptions(),
    });

    // Format the response
    const formattedBlogs = await Promise.all(
      blogs.map((blog) => formatBlogData(blog))
    );

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
      include: getBlogIncludeOptions(),
    });

    // Format the response
    const formattedBlogs = await Promise.all(
      blogs.map((blog) => formatBlogData(blog))
    );

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

/**
 * Get blog interaction status for current user
 */
export const getBlogInteractionStatus = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { id: blogId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // Get all counts and user interactions in parallel
    const [
      liked,
      bookmarked,
      likeCount,
      bookmarkCount,
      commentCount,
      viewCount,
    ] = await Promise.all([
      prisma.blogLike.findFirst({
        where: { blogId, userId },
      }),
      prisma.blogBookmark.findFirst({
        where: { blogId, userId },
      }),
      prisma.blogLike.count({
        where: { blogId },
      }),
      prisma.blogBookmark.count({
        where: { blogId },
      }),
      prisma.comment.count({
        where: { blogId },
      }),
      prisma.blogView.count({
        where: { blogId },
      }),
    ]);

    return res.status(200).json({
      liked: !!liked,
      bookmarked: !!bookmarked,
      likeCount,
      bookmarkCount,
      commentCount,
      viewCount,
    });
  } catch (error) {
    console.error("Get blog interaction status error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get user's bookmarked blogs
 */
export const getUserBookmarks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!userId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // Count total bookmarked blogs for pagination
    const totalCount = await prisma.blogBookmark.count({
      where: { userId },
    });

    // Get user's bookmarked blogs with pagination
    const bookmarkedBlogs = await prisma.blogBookmark.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc", // Assuming there's a createdAt field for bookmarks
      },
      include: {
        Blog: {
          include: getBlogIncludeOptions(),
        },
      },
    });

    // Extract and format blog data
    const blogs = bookmarkedBlogs.map((bookmark) => bookmark.Blog);
    const formattedBlogs = await Promise.all(
      blogs.map((blog) => formatBlogData(blog, userId))
    );

    return res.status(200).json({
      bookmarks: formattedBlogs,
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.error("Get user bookmarks error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get user's own blogs (authored blogs)
 */
export const getUserBlogs = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!userId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // Count total blogs authored by user
    const totalCount = await prisma.blog.count({
      where: { authorId: userId },
    });

    // Get user's blogs with pagination
    const blogs = await prisma.blog.findMany({
      where: { authorId: userId },
      skip,
      take: limit,
      orderBy: {
        date: "desc",
      },
      include: getBlogIncludeOptions(),
    });

    // Format the response
    const formattedBlogs = await Promise.all(
      blogs.map((blog) => formatBlogData(blog, userId))
    );

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
    console.error("Get user blogs error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get featured blogs
 */
export const getFeaturedBlogs = async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 5;

    // Get featured blogs
    const blogs = await prisma.blog.findMany({
      where: { featured: true },
      take: limit,
      orderBy: {
        date: "desc",
      },
      include: getBlogIncludeOptions(),
    });

    // Format the response
    const formattedBlogs = await Promise.all(
      blogs.map((blog) => formatBlogData(blog))
    );

    return res.status(200).json({
      featuredBlogs: formattedBlogs,
    });
  } catch (error) {
    console.error("Get featured blogs error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get blogs by tags
 */
export const getBlogByTags = async (req: Request, res: Response) => {
  try {
    const { tags } = req.params;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!tags) {
      return res.status(400).json({ message: "Tags are required" });
    }

    const tagList = tags.split(",").map((tag) => tag.trim());

    // Find the tags
    const tagEntities = await prisma.tag.findMany({
      where: { name: { in: tagList } },
    });

    if (tagEntities.length === 0) {
      return res.status(404).json({ message: "Tags not found" });
    }

    const tagIds = tagEntities.map((tag) => tag.id);

    // Find all TagOnBlog records that match the tagIds
    const tagOnBlogRecords = await prisma.tagOnBlog.findMany({
      where: {
        tagId: {
          in: tagIds,
        },
      },
      select: {
        blogId: true,
      },
    });

    // Extract the blogIds from the TagOnBlog records
    const blogIds = tagOnBlogRecords.map((record) => record.blogId);

    // Count total blogs with these tags
    const totalCount = await prisma.blog.count({
      where: {
        id: {
          in: blogIds,
        },
      },
    });

    // Get blogs by tags
    const blogs = await prisma.blog.findMany({
      where: {
        id: {
          in: blogIds,
        },
      },
      skip,
      take: limit,
      orderBy: {
        date: "desc",
      },
      include: getBlogIncludeOptions(),
    });

    // Format the response
    const formattedBlogs = await Promise.all(
      blogs.map((blog) => formatBlogData(blog))
    );

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
    console.error("Get blogs by tags error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
