import { prisma } from "../index";

/**
 * Handle categories for a blog post
 */
export const handleCategories = async (
  blogId: string,
  categories: string[]
) => {
  // Process each category
  for (const categoryName of categories) {
    // Find or create the category
    let category = await prisma.category.findUnique({
      where: { name: categoryName },
    });

    if (!category) {
      category = await prisma.category.create({
        data: { name: categoryName },
      });
    }

    // Create the relation
    await prisma.categoryOnBlog.create({
      data: {
        blogId,
        categoryId: category.id,
      },
    });
  }
};

/**
 * Handle tags for a blog post
 */
export const handleTags = async (blogId: string, tags: string[]) => {
  // Process each tag
  for (const tagName of tags) {
    // Find or create the tag
    let tag = await prisma.tag.findUnique({
      where: { name: tagName },
    });

    if (!tag) {
      tag = await prisma.tag.create({
        data: { name: tagName },
      });
    }

    // Create the relation
    await prisma.tagOnBlog.create({
      data: {
        blogId,
        tagId: tag.id,
      },
    });
  }
};

/**
 * Helper function to format blog data consistently
 */
export const formatBlogData = async (blog: any, userId?: string) => {
  // Get counts in parallel for better performance
  const [likeCount, bookmarkCount, commentCount, viewCount] = await Promise.all(
    [
      prisma.blogLike.count({ where: { blogId: blog.id } }),
      prisma.blogBookmark.count({ where: { blogId: blog.id } }),
      prisma.comment.count({ where: { blogId: blog.id } }),
      prisma.blogView.count({ where: { blogId: blog.id } }),
    ]
  );

  // Get user interaction status if userId is provided
  let userInteractions = {
    liked: false,
    bookmarked: false,
  };

  if (userId) {
    const [liked, bookmarked] = await Promise.all([
      prisma.blogLike.findFirst({ where: { blogId: blog.id, userId } }),
      prisma.blogBookmark.findFirst({ where: { blogId: blog.id, userId } }),
    ]);

    userInteractions = {
      liked: !!liked,
      bookmarked: !!bookmarked,
    };
  }

  return {
    ...blog,
    categories: blog.categories?.map((c: any) => c.category.name) || [],
    tags: blog.tags?.map((t: any) => t.tag.name) || [],
    viewCount,
    likeCount,
    bookmarkCount,
    commentCount,
    ...userInteractions,
  };
};

/**
 * Helper function to get blog include options for Prisma queries
 */
export const getBlogIncludeOptions = () => ({
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
});

/**
 * Parse array field from request body (handles both string and array inputs)
 */
export const parseArrayField = (field: any): string[] => {
  if (typeof field === "string") {
    try {
      // Try parsing as JSON first
      return JSON.parse(field);
    } catch (error) {
      // If not JSON, split comma-separated string
      return field
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  return Array.isArray(field) ? field.filter(Boolean) : [];
};

/**
 * Validate blog ownership
 */
export const validateBlogOwnership = async (blogId: string, userId: string) => {
  const blog = await prisma.blog.findFirst({
    where: {
      id: blogId,
      authorId: userId,
    },
  });

  return !!blog;
};

/**
 * Check if blog exists
 */
export const checkBlogExists = async (blogId: string) => {
  const blog = await prisma.blog.findUnique({
    where: { id: blogId },
  });

  return !!blog;
};

/**
 * Generate unique slug
 */
export const generateUniqueSlug = async (title: string, excludeId?: string) => {
  const slugify = require("slugify");
  let baseSlug = slugify(title, { lower: true, strict: true });
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existingBlog = await prisma.blog.findFirst({
      where: {
        slug,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });

    if (!existingBlog) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

/**
 * Get blog statistics
 */
export const getBlogStats = async (blogId: string) => {
  const [likeCount, bookmarkCount, commentCount, viewCount] = await Promise.all(
    [
      prisma.blogLike.count({ where: { blogId } }),
      prisma.blogBookmark.count({ where: { blogId } }),
      prisma.comment.count({ where: { blogId } }),
      prisma.blogView.count({ where: { blogId } }),
    ]
  );

  return {
    likeCount,
    bookmarkCount,
    commentCount,
    viewCount,
  };
};

/**
 * Get user's interaction status with a blog
 */
export const getUserInteractionStatus = async (
  blogId: string,
  userId: string
) => {
  const [liked, bookmarked, viewed] = await Promise.all([
    prisma.blogLike.findFirst({ where: { blogId, userId } }),
    prisma.blogBookmark.findFirst({ where: { blogId, userId } }),
    prisma.blogView.findFirst({ where: { blogId, userId } }),
  ]);

  return {
    liked: !!liked,
    bookmarked: !!bookmarked,
    viewed: !!viewed,
  };
};
